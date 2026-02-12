# Observability Analysis & Grafana Provisioning Guide

## Purpose
This document explains how to analyze metrics, traces (Jaeger), and logs to design a Grafana dashboard, and how to provision Grafana to load data sources and dashboards automatically. It is written for the Midori project observability stack.

## Table of Contents
1. Data sources overview
2. Metrics analysis (Prometheus)
3. Traces analysis (Jaeger)
4. Logs analysis (Loki)
5. Dashboard design checklist
6. Grafana provisioning guide
7. Validation steps

## 1) Data sources overview
Metrics: Prometheus scrapes application and system metrics exposed by the service.
Traces: Jaeger collects distributed traces from the application.
Logs: Loki stores logs shipped from the application or infrastructure.
Grafana: Visualizes all three and correlates signals.

## 2) Metrics analysis (Prometheus)
Goal: identify service health, latency, throughput, and errors.

Suggested metric categories:
- Service health: up, process_status, container_health
- Latency: request duration (histograms if available)
- Throughput: requests per second, jobs processed, queue depth
- Errors: HTTP 5xx rate, application error counters
- Saturation: CPU, memory, file descriptors, GC time

Analysis workflow:
1. Validate scrape targets are up in Prometheus.
2. Inspect metric labels for service, route, method, status_code, instance.
3. Build a baseline dashboard: 
   - request rate
   - error rate
   - p95/p99 latency
   - saturation indicators
4. Add drill-down panels by route, status code, or instance.
5. Add alert thresholds after baseline is stable.

Example PromQL patterns (adapt to your metric names):
- RPS: sum(rate(http_requests_total[5m]))
- Error rate: sum(rate(http_requests_total{status_code=~"5.."}[5m]))
- p95 latency: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))
- CPU usage: sum(rate(process_cpu_seconds_total[5m]))

## 3) Traces analysis (Jaeger)
Goal: identify slow paths and dependency bottlenecks.

Analysis workflow:
1. Confirm trace export from the service (OTLP or Jaeger exporter).
2. Inspect trace IDs for error requests captured in metrics.
3. Identify top slow spans by duration and service.
4. Map dependency graph to confirm upstream/downstream latency.
5. Use trace exemplars (if enabled) to link metrics to traces.

Dashboard ideas:
- Trace throughput per service
- Error traces count per service
- Top N slow operations
- Dependency latency heatmap

## 4) Logs analysis (Loki)
Goal: correlate logs with spikes in errors or latency.

Analysis workflow:
1. Ensure log labels include service, environment, instance, and level.
2. Build log volume panel by service and level.
3. Add error log count panel to correlate with HTTP error rate.
4. Create log panels with filters for request_id or trace_id.
5. If trace_id is present, enable quick trace lookup.

LogQL patterns (adapt to your labels):
- Error logs: {service="midori"} |= "ERROR"
- Count over time: sum(count_over_time({service="midori"} |= "ERROR" [5m]))
- Logs by level: sum by (level) (count_over_time({service="midori"}[5m]))

## 5) Dashboard design checklist
- Overview row with golden signals (latency, traffic, errors, saturation)
- Service health summary (up, availability)
- Latency percentiles (p50, p95, p99)
- Error rate and top error routes
- Infrastructure metrics (CPU, memory, disk)
- Trace and log correlation panels
- Drill-down links to detail dashboards
- Consistent labels and templating variables (env, service, instance)

## 6) Grafana provisioning guide
Grafana provisioning can be used to auto-load data sources and dashboards. The following files should be present in the repository:

- grafana/provisioning/datasources/datasources.yaml
- grafana/provisioning/dashboards/dashboards.yaml
- grafana/dashboards/ (JSON dashboard files)

### Datasource provisioning

Example structure (verify actual values in your repo):
- Name: Prometheus
  Type: prometheus
  URL: http://prometheus:9090
- Name: Loki
  Type: loki
  URL: http://loki:3100
- Name: Jaeger
  Type: jaeger
  URL: http://jaeger:16686

Checklist:
1. Ensure Grafana container can reach these services by DNS name.
2. Confirm access mode (proxy vs direct) matches your setup.
3. Set isDefault for the primary metrics source.

### Dashboard provisioning

Example structure:
- Provider name: default
- Folder: "Midori"
- Type: file
- Options path: /var/lib/grafana/dashboards

Checklist:
1. Ensure dashboard JSON files are mounted into Grafana container.
2. Validate the dashboard UID and title are unique.
3. Set folders and tags to keep dashboards organized.
4. Use templated variables for data sources to keep dashboards portable.

## 7) Validation steps
1. Start observability stack (Grafana, Prometheus, Loki, Jaeger).
2. Visit Grafana and confirm data sources show as healthy.
3. Open dashboards and verify panels render without errors.
4. Trigger a test request and confirm metrics, logs, and traces appear.
5. Add links between panels to navigate from metrics to logs and traces.

## Notes
- Keep metric, log, and trace labels consistent to improve correlation.
- Prefer standardized labels: service, environment, instance, trace_id.
- Revisit dashboards after deployment changes to keep them current.
