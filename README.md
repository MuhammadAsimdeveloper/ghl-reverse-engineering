# GHL Lite — a CRM workspace you can study and extend

An **original, from-scratch** implementation of an all-in-one agency CRM, built to mirror the
module layout of a typical GoHighLevel-style workspace: dashboard, inbox, calendars, contacts,
pipelines, payments, contracts, campaigns, social planner, prospecting, media, funnels,
websites, forms, automations, memberships, reputation and reporting.

This project contains **no code, assets or data from any commercial product**. Every component,
style and data record here was written for this repository. It exists so you can read a
realistic SaaS front-end end to end, run it locally, and change anything you like.

> Not affiliated with, endorsed by, or derived from GoHighLevel or any other vendor. See
> [Legal](#legal).

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>.

Other scripts:

```bash
npm run build      # type-check + production bundle
npm run preview    # serve the production build
npm run typecheck  # types only
```

## What's inside

| Module | Route | What it demonstrates |
| --- | --- | --- |
| Dashboard | `/` | KPI cards, revenue line chart, pipeline donut, today's agenda |
| Conversations | `/conversations` | Two-pane inbox, channel filters, threads, message composer |
| Calendars | `/calendars` | Month grid, per-calendar visibility, booking modal |
| Contacts | `/contacts` | Searchable/filterable table, tags, bulk tag/status/delete, create + edit |
| Contact detail | `/contacts/:id` | Profile tabs, notes, tasks, deals, invoices, delete flow |
| Tasks | `/tasks` | Overdue/today/upcoming groups, completion toggle, priorities, assignees |
| Opportunities | `/opportunities` | Kanban board with drag-and-drop between stages |
| Reputation | `/reputation` | Review feed, star ratings, inline replies, listing sync |
| Payments | `/payments` | Invoices with inline status, products, totals |
| Products & Price Book | `/products` | One-time/recurring items, inline toggles, add + edit pricing |
| Payment Links | `/payment-links` | Product bundles, copy link, visit/conversion metrics |
| Contracts | `/documents` | Proposals/contracts/estimates, create modal, status pipeline |
| Campaigns | `/campaigns` | Email/SMS metrics, CTR bars, delivery funnel |
| Social Planner | `/social` | Draft → scheduled → published board, post composer |
| Prospecting | `/prospecting` | Scored prospect table, filters, one-click import to contacts |
| Media Library | `/media` | Folder/type filters, asset grid, upload + delete |
| Funnels | `/funnels` | Funnel cards, step paths, publish toggle, builder modal |
| Websites | `/websites` | Site pages, per-page stats, preview modal |
| Forms & Surveys | `/forms` | Type tabs, submission counts, live toggles |
| Workflows | `/workflows` | Automation list + step-by-step flow diagram |
| Memberships | `/memberships` | Course/community offers, enrollment progress, publish toggles |
| Reporting | `/reporting` | Multi-series charts, source breakdown, team table |
| Settings | `/settings` | Business profile, team roles, custom fields, integrations, reset |

## Architecture

```
src/
  lib/
    types.ts     # the domain model — one interface per entity
    seed.ts      # deterministic demo data (dates are relative to today)
    store.tsx    # useReducer store + localStorage persistence + action union
    format.ts    # currency/date/percentage helpers
  components/
    AppShell.tsx # sidebar navigation, top bar, global search, notifications
    Icon.tsx     # single SVG icon set, referenced by name
    ui.tsx       # Avatar, Badge, StatCard, PageHeader, EmptyState, Switch
    Chart.tsx    # SVG line / bar / donut charts, no chart library
    Modal.tsx    # portal-based dialog with escape + backdrop handling
  pages/         # one file per module, each self-contained
  styles/
    tokens.css   # design tokens (color, type, radii, elevation)
    app.css      # layout and component styles
```

### State

There is no backend. `StoreProvider` holds the whole workspace in a `useReducer`, and every
action returns a new immutable state. The state is mirrored into `localStorage` under
`ghl-lite.workspace.v3` after each change, so your edits survive a refresh. **Settings → Workspace
data → Reset** restores the seed.

To add a field or entity:

1. Declare it in `src/lib/types.ts` and add it to `WorkspaceState`.
2. Seed some records in `src/lib/seed.ts`.
3. Add `xxx/add` and `xxx/update` variants to the `Action` union and a case in `reducer`.

### Styling

Plain CSS with custom properties — no Tailwind, no CSS-in-JS, no build plugins. Everything is
driven by the tokens in `styles/tokens.css`, so re-theming is a matter of changing a handful of
values. Layout is flex/grid, with breakpoints at 1080px, 900px and 640px.

### Charts

`Chart.tsx` renders SVG directly: `BarChart`, `LineChart`, `Donut` and `Spark`. No chart library
is installed, which keeps the dependency tree at React + React Router + Vite.

## Deliberate non-features

This is a front-end learning project, so some things are intentionally out of scope:

- **No authentication.** Every route is open; there is no login, session or permissions model.
- **No real data or PII.** All contacts, companies and numbers are invented.
- **No network calls.** Messaging, publishing and payment actions update local state only.
- **No server, database or job queue.** Persistence is browser-local.

Those are the parts you would need to design yourself before this could serve real users.

## Legal

This is an independent educational project. It is not a copy of, and is not affiliated with,
GoHighLevel or any commercial CRM. Names, data and copy inside the demo are fictional. If you are
studying a commercial product, review its terms of service before copying anything from it —
reproducing proprietary source or assets is not permitted by most licences, and this repository
deliberately avoids doing that.

## License

MIT for the code in this repository.
