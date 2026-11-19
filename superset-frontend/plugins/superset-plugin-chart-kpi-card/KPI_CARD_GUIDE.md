<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# KPI Card: Configuration Guide

One KPI Card chart type covers three card styles: an alert summary with a
severity breakdown, a compact card with a dot before the title, and a card with
an icon tile. This guide shows how to set up each one, what changed in the
plugin, and how existing charts are affected.

## How to set up each card

| Control                              | Alert summary (e.g. Thunderstorm) | Compact (e.g. Water Level Alert) | Icon tile (e.g. Rescue Centers) |
| ------------------------------------ | --------------------------------- | -------------------------------- | ------------------------------- |
| Subtitle                             | *(empty)*                         | `{value} live station alerts`    | `Centers matching filters`      |
| Derive subtitle from severity counts | ✅                                | ☐                                | ☐                               |
| Icon                                 | ⚡                                | *(not shown)*                    | `●`                             |
| Icon style                           | Circle                            | Dot before title                 | Rounded square                  |
| Accent color                         | *(theme default)*                 | blue                             | blue                            |
| Value color                          | Default text                      | Default text                     | Accent color                    |
| Background                           | Theme                             | Transparent                      | Transparent                     |
| Show border                          | ✅                                | ☐                                | ☐                               |
| Severe / Warning / Watch columns     | set                               | empty                            | empty                           |
| Time filter column                   | `event_time`                      | as needed                        | can be empty                    |

### Data tab

- **Time filter column** (optional): the temporal column used by the
  dashboard time-range filter. Leave it empty if the dataset has no time
  column. The time range is then not applied.
- **Value column**: the metric shown as the large number.
- **Severe / Warning / Watch count columns** (optional): when any of these is
  set, the card shows a breakdown list on the right. Leave all three empty for
  a single-section card.

### Customize tab

- **Subtitle**: the text below the value. Placeholders:
  - `{value}` is replaced with the KPI value.
  - `{<name>}` is replaced with any queried column or metric label, e.g.
    `{warning_count}`.
  - A placeholder that doesn't match anything is left as typed.
- **Derive subtitle from severity counts**: when the subtitle is empty, shows
  `<value> <highest severity>` (e.g. `3 warning`), colored by the highest
  non-zero count: red for Severe, orange for Warning, yellow for Watch.
- **Icon**: an emoji, a short text symbol, or an image URL.
- **Icon style**:
  - *Circle*: the icon on a neutral circle.
  - *Rounded square*: the icon on a tile tinted with the accent color, drawn in
    the accent color.
  - *Dot before title*: a small accent-colored dot before the title, with no
    icon.
  - *None*: no icon.
- **Accent color**: used for the title dot, the icon tile and, if chosen, the
  value. If not set, the theme primary color is used.
- **Value color**: *Default text* or *Accent color*.
- **Background**: *Theme* uses the card background color. *Transparent* lets the
  dashboard background (e.g. a gradient) show through.
- **Show border**: turns the card outline on or off.

## What changed

### Controls

- **Time filter column** is optional and has no validator. When it's empty,
  the query has no time filter.
- **Supporting text column** and **Status color column** are removed. The query
  never returned them; they were only used as key names. The **Subtitle** and
  **Derive subtitle from severity counts** controls replace them.
- **Row limit** defaults to 1, since the card only reads the first row.
- New Customize controls: Subtitle, Derive subtitle from severity counts, Icon
  style, Accent color, Value color, Background, Show border.

### Behaviour

- `transformProps` works out the final value, subtitle, subtitle color and
  breakdown items. The component only displays them.
- The subtitle color comes only from the severity counts. Words like
  "warning" in the subtitle text no longer change its color.
- The subtitle line is hidden when it's empty.
- Sizing:
  - Cards without a breakdown list scale from a smaller reference width
    (360px instead of 560px).
  - Font size is also capped by the card height, so short, wide cards don't
    overflow.

### Files

| File                                | Change                                                    |
| ----------------------------------- | --------------------------------------------------------- |
| `src/plugin/controlPanel.ts`        | New and removed controls, optional time column             |
| `src/plugin/buildQuery.ts`          | Adds a time filter only when a time column is set          |
| `src/plugin/transformProps.ts`      | Works out the subtitle, severity and appearance props      |
| `src/utils/subtitleTemplate.ts`     | New: fills in `{value}` and `{<name>}` placeholders        |
| `src/SupersetPluginChartKpiCard.tsx` | Icon styles, accent color, background, border, sizing     |
| `src/types.ts`                      | New prop and form-data types                               |
| `test/plugin/*.test.ts`             | Tests for the legacy, compact and template cases           |

## Existing charts

- **Saved charts look the same.** Charts saved before this change don't have
  the new controls, so they get the original appearance: severity subtitle on,
  circle icon, theme background, border shown.
- **New charts start generic.** In a newly created chart, *Derive subtitle from
  severity counts* is off. Turn it on when you build another severity card.
- **Time column fallback removed.** A saved chart with no time column used to
  fall back to `event_time`. It now gets no time filter. Charts made with the
  previous version aren't affected, because that control was required and had a
  default, so the value is saved with the chart.
- **Removed controls are ignored.** Saved `text_column` and `status_column`
  values stay in the chart's form data but are no longer used.
