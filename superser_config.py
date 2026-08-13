# superset_config.py

# Enable development features
DEBUG = True
TEMPLATES_AUTO_RELOAD = True

# CORS settings for development
ENABLE_CORS = True
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "resources": {"*": {"origins": "*"}},
}

# Disable CSRF for development
WTF_CSRF_ENABLED = False

# Enable detailed logging
LOG_LEVEL = "DEBUG"

# Frontend configuration
FEATURE_FLAGS = {
    "ENABLE_TEMPLATE_PROCESSING": True,
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
    # Enable plugin development features
    "ENABLE_ADVANCED_DATA_TYPES": True,
    "ENABLE_EXPLORE_JSON_CSV": True,
}

# Plugin development settings
SUPERSET_WEBSERVER_TIMEOUT = 300

# Plugin configuration
PLUGIN_CONFIG = {
    "superset_plugin_template": {
        "enabled": True,
    }
}
