"""Read-only PostGIS endpoint for the Malaysia Disaster Map plugin."""

import logging
import os
from typing import Any

import psycopg2
from flask import Blueprint, Flask, jsonify, request
from flask_login import login_required

from superset.utils import json

LOGGER = logging.getLogger(__name__)
BLUEPRINT = Blueprint("malaysia_map_api", __name__, url_prefix="/api/osm")
MAX_BODY_BYTES = 150_000
MAX_VERTICES = 500
MAX_LIMIT = 300


def _polygon_geometry(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Request body must be a JSON object")
    value = payload.get("polygon")
    if not isinstance(value, dict):
        raise ValueError("polygon is required")
    geometry = value.get("geometry") if value.get("type") == "Feature" else value
    if not isinstance(geometry, dict) or geometry.get("type") != "Polygon":
        raise ValueError("polygon must be a GeoJSON Polygon or Polygon Feature")
    coordinates = geometry.get("coordinates")
    if not isinstance(coordinates, list) or len(coordinates) != 1:
        raise ValueError("Polygon holes are not supported")
    ring = coordinates[0]
    if not isinstance(ring, list) or not 4 <= len(ring) <= MAX_VERTICES:
        raise ValueError("Polygon must contain 4-500 coordinates including closure")
    cleaned: list[list[float]] = []
    for point in ring:
        if not isinstance(point, list) or len(point) < 2:
            raise ValueError("Invalid polygon coordinate")
        longitude = float(point[0])
        latitude = float(point[1])
        if not -180 <= longitude <= 180 or not -90 <= latitude <= 90:
            raise ValueError("Polygon coordinate is outside valid bounds")
        cleaned.append([longitude, latitude])
    if cleaned[0] != cleaned[-1]:
        cleaned.append(cleaned[0])
    return {"type": "Polygon", "coordinates": [cleaned]}


def _connection() -> Any:
    return psycopg2.connect(
        host=os.environ.get("MALAYSIA_MAP_DB_HOST", "platform-postgis-ro"),
        port=int(os.environ.get("MALAYSIA_MAP_DB_PORT", "5432")),
        dbname=os.environ.get("MALAYSIA_MAP_DB_NAME", "geospatial"),
        user=os.environ["MALAYSIA_MAP_DB_USER"],
        password=os.environ["MALAYSIA_MAP_DB_PASSWORD"],
        connect_timeout=5,
        options="-c statement_timeout=5000",
    )


def _rows(cursor: Any) -> list[dict[str, Any]]:
    columns = [column.name for column in cursor.description]
    output = []
    for row in cursor.fetchall():
        item = dict(zip(columns, row, strict=True))
        if isinstance(item.get("geometry"), str):
            item["geometry"] = json.loads(item["geometry"])
        output.append(item)
    return output


@BLUEPRINT.post("/within")
@login_required
def features_within() -> Any:
    if request.content_length and request.content_length > MAX_BODY_BYTES:
        return jsonify(error="Request body is too large"), 413
    try:
        payload = request.get_json(silent=False)
        geometry = _polygon_geometry(payload)
        limit = max(1, min(int(payload.get("limit", MAX_LIMIT)), MAX_LIMIT))
    except (TypeError, ValueError) as error:
        return jsonify(error=str(error)), 400

    geometry_json = json.dumps(geometry, separators=(",", ":"))
    try:
        with _connection() as connection:
            connection.set_session(readonly=True, autocommit=True)
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT ST_IsValid(area.geom), ST_Area(area.geom::geography)
                    FROM (SELECT ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326) AS geom) area
                    """,
                    (geometry_json,),
                )
                valid, area_square_metres = cursor.fetchone()
                if not valid:
                    return jsonify(error="Polygon geometry is not valid"), 400
                if area_square_metres > 250_000_000_000:
                    return jsonify(error="Polygon area is too large"), 400

                common = (geometry_json, limit)
                cursor.execute(
                    """
                    WITH area AS (SELECT ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326) geom)
                    SELECT osm_type, osm_id, name, category,
                           ARRAY[ST_X(geom), ST_Y(geom)] AS coordinates
                    FROM osm.places, area
                    WHERE geom && area.geom AND ST_Covers(area.geom, geom)
                    ORDER BY name NULLS LAST LIMIT %s
                    """,
                    common,
                )
                places = _rows(cursor)
                cursor.execute(
                    """
                    WITH area AS (SELECT ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326) geom)
                    SELECT osm_type, osm_id, name, category,
                           ARRAY[
                               ST_X(ST_PointOnSurface(geom)),
                               ST_Y(ST_PointOnSurface(geom))
                           ] AS coordinates,
                           ST_AsGeoJSON(geom) AS geometry
                    FROM osm.roads, area
                    WHERE geom && area.geom AND ST_Intersects(geom, area.geom)
                    ORDER BY name NULLS LAST LIMIT %s
                    """,
                    common,
                )
                roads = _rows(cursor)
                cursor.execute(
                    """
                    WITH area AS (SELECT ST_SetSRID(ST_GeomFromGeoJSON(%s), 4326) geom)
                    SELECT osm_type, osm_id, name, category,
                           ARRAY[
                               ST_X(ST_PointOnSurface(geom)),
                               ST_Y(ST_PointOnSurface(geom))
                           ] AS coordinates,
                           ST_AsGeoJSON(geom) AS geometry,
                           round(ST_Area(geom::geography)::numeric, 1)::float AS area_m2
                    FROM osm.buildings, area
                    WHERE geom && area.geom AND ST_CoveredBy(geom, area.geom)
                    ORDER BY name NULLS LAST LIMIT %s
                    """,
                    common,
                )
                buildings = _rows(cursor)
        return jsonify(
            source="postgis-openstreetmap",
            places=places,
            roads=roads,
            buildings=buildings,
            totals={
                "places": len(places),
                "roads": len(roads),
                "buildings": len(buildings),
            },
        )
    except Exception:  # pylint: disable=broad-except
        LOGGER.exception("Malaysia map PostGIS query failed")
        return jsonify(error="Spatial database query is unavailable"), 503


def register_malaysia_map_api(app: Flask) -> None:
    """Register only this blueprint and exempt only it from CSRF checks."""
    from superset.extensions import csrf

    csrf.exempt(BLUEPRINT)
    app.register_blueprint(BLUEPRINT)
