<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

# Priority alert chart

Use the **Query** controls to select the dataset column for each alert field:

| Control | Default | Purpose |
| --- | --- | --- |
| Alert title column | `title_en` | Alert heading |
| Location column | `location` | Affected location |
| Event date column | `event_date` | Superset time filter and displayed time |
| Severity column | `severity` | Severity color and label |
| Alert type column | Optional | Hazard icon; falls back to the title |
| Description column | Optional | Expanded alert details |

The selected columns are included in the query automatically. SQL expressions
use their output labels. Add a count metric to satisfy the query controls.
Use **Additional columns** for extra fields, such as a unique alert identifier
when otherwise identical alerts must remain separate in the grouped query.
Existing charts retain their original column defaults and additional columns.

Alerts whose type or title contains "strong winds" or "rough seas" use a combined
wind-and-waves icon (case-insensitive, including singular forms).

The selected event date column accepts ISO dates/timestamps or numeric Unix
timestamps in milliseconds. Use timestamps with explicit timezone offsets when
the source stores instants. **Today** is selected by default and shows the rows
returned by Superset's active time range, including native dashboard date
filters. **All** and **View all** remove the time range while retaining other
dashboard filters. Missing or invalid dates appear under **All**, with a dash for
the time. Rows are sorted newest first. Row limits apply to both views.

Each row shows the title, location, time, and severity color. Critical/severe/high
(or 3) uses the error color, warning/medium (or 2) uses the warning color, watch/low (or 1) uses a lighter warning color, and other
values use the information color from the dashboard theme. Severity is also
available as text when the row is expanded. Select a row, or focus it and press
Enter, to expand its timestamp, severity, and optional description.

The heading defaults to **Priority alerts** and can be customized in **Alert options**.
