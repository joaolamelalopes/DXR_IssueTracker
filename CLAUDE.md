# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:
```
AIRTABLE_API_KEY=       # Airtable personal access token
AIRTABLE_BASE_ID=       # Airtable base ID (starts with app...)
AIRTABLE_TABLE_NAME=    # Table name (optional, defaults to 'Table 1')
```

## Architecture

This is a **Next.js 14 App Router** application that provides a UI for triaging DXR (Design Experience Report) issues stored in an Airtable base.

### Data Flow

All data lives in Airtable. Three server-side API routes proxy requests to Airtable:

- `GET /api/base` — fetches base metadata (name) via Airtable Meta API
- `GET /api/records` — fetches all records from the configured table; filters out rows where `Dimension` is empty
- `PATCH /api/records/[id]` — updates `Decision`, `Resolution`, and/or `Comments` fields on a single record

The main page (`app/page.tsx`) is a single large client component that fetches from these routes and manages all UI state locally (selected record, sort column/direction, panel open state, lightbox, debounced comment auto-save).

### Airtable Table Schema

The table must have these exact field names:
- `Issue ID` (number) — used as primary sort key
- `Issue` (string)
- `Description` (string)
- `Screenshot` (Airtable attachment array — each item has `.url` and `.filename`)
- `Dimension` (string) — filtered values: Getting Started, Usability, Visuals, Content, Help
- `Theme` (string)
- `Severity` (string) — High, Critical, Medium, Low
- `Decision` (string) — Accepted, Rejected
- `Resolution` (string) — Deferred, Planned, Redirected, Completed
- `Comments` (string)

### Domain Workflow

Issues follow a triage workflow:
1. Set **Decision**: Accept or Reject
2. If Accepted → set **Resolution**: Deferred, Planned, Redirected, or Completed
3. If Rejected → select one or more **Rejection Reasons** (stored as comma-separated string in `Resolution`)

Rejection reason options are hardcoded in `page.tsx`: Out of Scope, By Design, Already Addressed, Duplicate, Not Reproducible, Needs More Info, Low Priority, Not Actionable.

### UI Structure

The entire UI is in `app/page.tsx` (single client component, ~1000+ lines):
- **Top bar**: base name, definitions panel toggle
- **Sortable table**: columns for all fields; clicking a row opens the side panel
- **Side panel** (right slide-out): edit Decision/Resolution/Comments for the selected record; Previous/Next navigation buttons cycle through the filtered+sorted record list
- **Lightbox**: click a screenshot thumbnail to open a full-size modal
- **Comments** auto-save with a 1-second debounce after the user stops typing

### Styling

Tailwind CSS throughout. Color conventions for badges:
- Decision Accepted → green; Rejected → red
- Resolution Completed → blue; Planned → green; Deferred → yellow; Redirected → purple
- Severity High/Critical → red; Medium → yellow; Low → green
