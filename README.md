# Fortify Health Dashboard

Fortify Health Dashboard is a light-mode web dashboard for reviewing regional programme execution risk across multiple regions and workstreams. It helps stakeholders scan risk levels, compare operational performance, inspect monthly trends, and review support reallocation signals without changing the underlying data logic or interaction model.

## What the app shows

- Regional risk overview ranked by highest risk score
- KPI summaries for average risk, high-risk regions, improving regions, and worsening regions
- Filters for region, workstream, review window, and risk level
- Region drilldown with monthly risk and performance trends
- Support reallocation tracker and diagnosis panels for the selected snapshot month

## Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS 4
- shadcn-style UI components
- Recharts
- date-fns

## Local Development

Prerequisites:

- Node.js

Run locally:

1. Install dependencies with `npm install`
2. Start the dev server with `npm run dev`
3. Open the local URL shown in the terminal, usually `http://localhost:3000`

## Available Scripts

- `npm run dev` starts the local development server
- `npm run build` creates a production build
- `npm run preview` previews the production build locally
- `npm run lint` runs TypeScript type-checking with `tsc --noEmit`

## Notes

- The current dashboard data is mock data for prototype and review purposes.
- The application is designed as an internal decision-support dashboard, not a public marketing site.
