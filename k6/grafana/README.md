# k6 + Grafana — Live Performance Dashboard

Run any k6 script and watch metrics stream into Grafana in real time.

## Stack

| Service   | URL                     | Notes                                   |
|-----------|-------------------------|-----------------------------------------|
| Grafana   | http://localhost:3001   | anonymous admin (no login)              |
| InfluxDB  | http://localhost:8086   | database `k6`, auto-created             |
| Renderer  | (internal only)         | `grafana-image-renderer` for PNG export |

Port `3001` is used so it does not clash with the app on `3000`.
The renderer container powers **Share → Export → image** and the Grafana MCP
`get_panel_image` tool.

## Setup

```bash
npm run grafana:up          # = docker compose -f k6/grafana/docker-compose.yml up -d
```

That's it. Both the **datasource** (`k6-influxdb`) and the **dashboard**
(grafana.com ID **2587** — "k6 Load Testing Results") are provisioned automatically
from `./provisioning`. Open http://localhost:3001 → Dashboards → folder **k6**.

The dashboard JSON lives at
`provisioning/dashboards/k6-load-testing-results.json` (pulled from
`https://grafana.com/api/dashboards/2587/revisions/latest/download`, with its
`${DS_K6}` datasource placeholder rewritten to `k6-influxdb`). To swap in a
different grafana.com dashboard, drop its JSON in that folder and re-point the
`datasource` fields to `k6-influxdb`.

## Run a test with the dashboard

```bash
npm run perf:smoke:dash        # smoke
npm run perf:load:dash         # load
npm run perf:stress:dash       # stress
npm run perf:scenario:dash     # scenario-based
npm run perf:transaction:dash  # transaction-based
```

Then open http://localhost:3001, pick the **k6 Load Testing Results** dashboard, set the time range to **Last 5 minutes** and enable auto-refresh (5s). Metrics appear while the test runs.

### Point at a remote environment

```bash
# Windows PowerShell
$env:BASE_URL="https://shoeshub-qa.onrender.com"; npm run perf:load:dash

# bash
BASE_URL=https://shoeshub-qa.onrender.com npm run perf:load:dash
```

## Under the hood

The `:dash` scripts just add `--out influxdb=http://localhost:8086/k6` to the normal
`k6 run` command. The plain `npm run perf:*` scripts still work without Docker and
print the text summary + write the HTML report to `k6/reports/`.

## Stop / clean up

```bash
npm run grafana:down                                      # stop containers, keep data
docker compose -f k6/grafana/docker-compose.yml down -v   # also wipe stored metrics
```

## Grafana MCP server

`.mcp.json` at the repo root registers the official **`mcp/grafana`** server so
Claude Code can talk to this Grafana instance directly (list/create dashboards,
run datasource queries, read alerts, etc.).

- Requires Docker (same as the stack) — the server runs as `docker run --rm -i mcp/grafana`.
- Connects to `http://admin:admin@host.docker.internal:3001` (the container above,
  basic auth `admin` / `admin`).
- Reload MCP servers in Claude Code after `npm run grafana:up`: `/mcp` → reconnect,
  or restart the session. Approve the server when prompted.

**Optional — use a service-account token instead of admin basic auth:**

1. Grafana → Administration → Service accounts → add `mcp`, role `Editor` → add token.
2. Put it in `.mcp.json`: set `GRAFANA_API_KEY` to the token and change
   `GRAFANA_URL` to `http://host.docker.internal:3001` (drop `admin:admin@`).

### Import a dashboard by ID via MCP

Ask Claude, e.g. *"import grafana.com dashboard 2587 into the local Grafana on the
k6-influxdb datasource"*. It will fetch the JSON and call the MCP
`update_dashboard` tool. (The stack already provisions 2587 on startup, so this is
only needed for *additional* dashboards such as **19665** or **18030**.)

## Alternative: Grafana Cloud (no Docker)

```bash
k6 run --out cloud k6/load.js           # needs: k6 cloud login --token <token>
```

Uploads the run to grafana.com and gives you a hosted dashboard URL.
