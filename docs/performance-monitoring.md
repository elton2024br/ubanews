# Performance monitoring

The application captures [Web Vitals](https://web.dev/vitals/) in the browser and persists them to Supabase for analysis.

## Metrics collection

Metrics are collected with the `web-vitals` package and inserted into the `web_vitals` table. A database trigger stores records in `web_vital_alerts` when thresholds are exceeded.

### Alert thresholds

- **LCP** greater than `2500ms`
- **INP** greater than `200ms`

## Viewing metrics

1. Access the admin panel and navigate to **Performance**.
2. The dashboard lists recent metrics and any generated alerts.

## Database setup

The migration `008_create_web_vitals_tables.sql` creates the `web_vitals` and `web_vital_alerts` tables along with the alert trigger.
