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
| Conversations | `/conversations` | Two-pane inbox, channel filters, threads, message composer, snippet picker |
| Snippets | `/snippets` | Saved replies with channel targeting, merge tokens and usage counts |
| Calendars | `/calendars` | Month grid, weekly hours per calendar, round-robin assignees, overlap blocking |
| Contacts | `/contacts` | Searchable/filterable table, tags, bulk tag/status/delete, create + edit |
| Contact detail | `/contacts/:id` | Profile tabs, notes, tasks, deals, invoices, delete flow |
| Tasks | `/tasks` | Overdue/today/upcoming groups, completion toggle, priorities, assignees |
| Opportunities | `/opportunities` | Kanban board with drag-and-drop between stages |
| Reputation | `/reputation` | Review feed, inline replies, listing sync, review-request composer with token preview |
| Payments | `/payments` | Invoices with inline status, products, totals |
| Products & Price Book | `/products` | One-time/recurring items, inline toggles, add + edit pricing |
| Payment Links | `/payment-links` | Product bundles, copy link, visit/conversion metrics |
| Coupons | `/coupons` | Percent/fixed codes, limits, expiry states, pause + edit |
| Custom Values | `/custom-values` | Reusable merge tokens with copy-to-clipboard |
| Audit Log | `/audit-log` | Every workspace mutation, filterable by actor and entity |
| Contracts | `/documents` | Proposals/contracts/estimates, create modal, status pipeline |
| Campaigns | `/campaigns` | Email/SMS metrics, CTR bars, delivery funnel |
| Social Planner | `/social` | Draft → scheduled → published board, post composer |
| Prospecting | `/prospecting` | Scored prospect table, filters, one-click import to contacts |
| Media Library | `/media` | Folder/type filters, asset grid, upload + delete |
| Funnels | `/funnels` | Editable step builder (rename, reorder, per-step opt-in rate), duplicate, publish toggle |
| Websites | `/websites` | Site pages, per-page stats, preview modal |
| Forms & Surveys | `/forms` | Type tabs, submission counts, live toggles |
| Workflows | `/workflows` | Automation list + step-by-step flow diagram |
| Memberships | `/memberships` | Course/community offers, lesson curriculum with per-lesson drip days, unlock counts |
| Reporting | `/reporting` | Multi-series charts, saveable metric reports with prior-period deltas, team table |
| Settings | `/settings` | Business profile, team roles, custom fields, integrations, reset |
| Sub-accounts | `/sub-accounts` | Agency-level client accounts, plan catalog, seat/contact limits, derived MRR |

## Architecture

```
src/
  lib/
    types.ts     # the domain model — one interface per entity
    seed.ts      # deterministic demo data (dates are relative to today)
    store.tsx    # useReducer store + localStorage persistence + action union
    merge.ts     # merge-token resolution for contacts and custom values
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
`ghl-lite.workspace.v7` after each change, so your edits survive a refresh. **Settings → Workspace
data → Reset** restores the seed. A derived audit log records every logged mutation, and
snippets resolve `{{contact.*}}` and `{{custom_values.*}}` tokens when inserted into a reply.

Sub-account MRR is not stored: it is derived from the plan's price whenever the account status is
`active`, so editing a plan in the sidebar immediately reprices every account on it. Drip content
works the same way — a lesson's `dripDays` is compared with the days elapsed since the member
enrolled, so an unlock count is always computed rather than persisted. Saved reports and review
requests follow the same rule: report values are computed from invoice, opportunity and contact
timestamps for the chosen window, and request messages store raw merge tokens that resolve at
render time.

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
