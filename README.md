# MONITOR.SITE

A realtime service and storage observability dashboard built with React, Supabase, and Vercel.

## Features

- Multi-region endpoint health and uptime history
- P50/P95 latency charts with selectable time windows
- Incident timeline and recovery status
- Storage growth, object counts, and category distribution
- Supabase Realtime updates
- Vercel Web Analytics and Speed Insights
- Responsive dark monitoring interface

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Run `supabase/schema.sql` in the Supabase SQL Editor before connecting the app.

## Environment variables

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The frontend uses only a Supabase publishable key. Database access is protected by Row Level Security policies in `supabase/schema.sql`.

## Open-source inspiration

The product concepts draw on established observability patterns from Grafana, Checkmate, Apache Superset, Supabase Realtime, and Vercel Analytics. The implementation and interface in this repository are original.

## License

MIT
