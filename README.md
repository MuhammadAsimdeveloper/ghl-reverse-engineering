# Operza — a CRM workspace you can study and extend

An **original, from-scratch** implementation of an all-in-one agency CRM, built to mirror the
module layout of a typical agency-marketing workspace: dashboard, inbox, calendars, contacts,
pipelines, payments, contracts, campaigns, social planner, prospecting, media, funnels,
websites, forms, automations, memberships, reputation and reporting.

This project contains **no code, assets or data from any commercial product**. Every component,
style and data record here was written for this repository. It exists so you can read a
realistic SaaS front-end end to end, run it locally, and change anything you like.

> Operza is an independent demo. It is not affiliated with, endorsed by, or derived from any
> commercial CRM vendor. See [Legal](#legal).

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually <http://localhost:5173>).

The app has to be served over HTTP. Double-clicking `index.html` will show a blank page because
the source entry point and the production bundle both resolve their assets from the server root,
and client-side routing needs an origin — use the dev server or `npm run preview`.

Other scripts:

```bash
npm run build      # type-check + production bundle
npm run preview    # serve the production build
npm run typecheck  # types only
npm run lint       # ESLint (flat config, TypeScript + React hooks rules)
```

## What's inside

| Module | Route | What it demonstrates |
| --- | --- | --- |
| Dashboard | `/` | KPI cards, revenue line chart, pipeline donut, today's agenda |
| Conversations | `/conversations` | Unified two-pane inbox across SMS, email, Facebook, Instagram, WhatsApp and web chat; channel filter with unread counts; new-conversation composer that reuses the contact + channel thread; email subject, SMS segment and WhatsApp character counters; snippet picker |
| Snippets | `/snippets` | Saved replies with optional email subject, channel targeting, merge tokens and usage counts |
| Calendars | `/calendars` | Month grid, weekly hours per calendar, round-robin assignees, overlap blocking |
| Contacts | `/contacts` | Searchable/filterable table, tags, bulk tag/status/delete, create + edit with contact custom fields |
| Contact detail | `/contacts/:id` | Profile tabs, notes, tasks, deals, invoices, custom fields, delete flow |
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
| Campaigns | `/campaigns` | Email/SMS metrics, CTR bars, delivery funnel, tag/status/age segment builder with live reach |
| Email Templates | `/templates` | Category filters, subject copy, full template editor with token chips and a live merge preview against a sample contact |
| Social Planner | `/social` | Draft → scheduled → published board, post composer |
| Prospecting | `/prospecting` | Scored prospect table, filters, one-click import to contacts |
| Media Library | `/media` | Folder/type filters, asset grid, upload + delete |
| Funnels | `/funnels` | Editable step builder (rename, reorder, per-step opt-in rate), checkout offers with order bumps, simulated funnel checkout, duplicate, publish toggle |
| Websites | `/websites` | Page table with reorder/edit/delete, per-page hero editor (headline, subhead, CTA, theme) and a themed site preview |
| Forms & Surveys | `/forms` | Type tabs, live toggles, field editor with types/options/required flags, conditional logic (`show this when answer equals…`), survey answer points with a live score, pass mark and completion redirect, interactive branching preview |
| Workflows | `/workflows` | Typed triggers (form, tag, appointment, invoice, payment, webhook, schedule), if/else branch rails, configurable webhook/tag/task/condition steps, simulated run history |
| Store | `/store` | Product storefront, cart, coupon redemption, simulated gateways with fee math, atomic checkout |
| Memberships | `/memberships` | Course/community offers, lesson curriculum with per-lesson drip days, unlock counts |
| Reporting | `/reporting` | Custom widget dashboard, multi-series charts, saveable metric reports with prior-period deltas, team table |
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
`operza.workspace.v13` after each change, so your edits survive a refresh. **Settings → Workspace
data → Reset** restores the seed. A derived audit log records every logged mutation, and
snippets resolve `{{contact.*}}` and `{{custom_values.*}}` tokens when inserted into a reply.

Sub-account MRR is not stored: it is derived from the plan's price whenever the account status is
`active`, so editing a plan in the sidebar immediately reprices every account on it. Drip content
works the same way — a lesson's `dripDays` is compared with the days elapsed since the member
enrolled, so an unlock count is always computed rather than persisted. Saved reports, dashboard
widgets and review requests follow the same rule: metric values are computed from invoice,
opportunity and contact timestamps for the chosen window, and request messages store raw merge
tokens that resolve at render time.

The Store follows the same derived-first approach. A coupon's usability (active flag, minimum
spend, expiry, redemption cap) is re-evaluated against the current cart every time the cart
changes, and the gateway's processing fee and the receipt's net amount are computed from the
gateway's `feePct`/`feeFixed` at render. Checkout itself is one atomic store action: it appends
the order and a paid invoice, records the coupon redemption and writes a single audit entry, so
the three records can never drift apart.

Campaign segmentation works the same way. The builder's reach counter re-filters the current
contacts on every tag/status/age change, but the campaign stores only the **segment definition**
and the audience count as a snapshot taken when it was created — later contact edits do not
silently rewrite a campaign that has already been scheduled. Form fields and workflow steps are
plain ordered arrays in state, so reordering is a swap of two indices with bounds checks rather
than a separate order column that can drift out of sync.

Conditional form fields store only the rule (`{ fieldId, equals }`); the preview compares it
against the answers typed into the live preview, so branch visibility is computed on every
keystroke instead of persisted as a visible flag. Email template bodies keep their raw
`{{contact.*}}` / `{{custom_values.*}}` tokens in state and resolve them through the same merge
helper used by snippets whenever a preview or copy action needs rendered text. Website page
content (headline, subhead, CTA, theme) lives on the `SitePage` record, so the page editor drafts
a patch locally and the site preview re-renders straight from state on save.

Funnel order bumps work the same way: the funnel stores the main-offer product and a bump list
(title, copy, discounted price, enabled flag), while the checkout preview recomputes the order
total from the accepted checkboxes on every toggle. Completing the preview reuses the atomic
`store/checkout` action, so the order records the accepted bump titles and the paid invoice,
coupon redemption and audit entry are written in one dispatch.

Workflow runs are simulated rather than stored as contact state. `Run now` walks the saved step
tree against the chosen contact, evaluates each condition rule (`tag`, `status`, `company`,
`email`) live, treats waits as completed, and appends a `WorkflowRun` with per-step results plus a
single audit entry. A webhook step with a missing or non-`http(s)` URL fails the run and marks the
remaining steps skipped, so the failure path stays inspectable without any network access.
Conditions keep their `yes`/`no` branch arrays on the step record itself (one level deep, no
nested conditions), so reordering or deleting a branch step is a local array edit rather than a
separate edge table that can drift.

Survey scoring is derived on every keystroke: each dropdown option carries points, the preview
sums the points of the currently visible answers, and the completion screen compares that running
score with the optional pass mark. The redirect is validated as `http(s)` but never navigated to —
submitting is simulated, and the completion screen only shows where the respondent would land.
Inbox threads are keyed by contact **and** channel, so starting a conversation appends to the
existing thread for that pair instead of duplicating it; the same contact can hold an SMS thread
and a WhatsApp thread at once. Contact custom fields are stored as a `name → value` record on the
contact and rendered from the field definitions in Settings, which keeps the form in sync when a
definition is added without migrating old records.

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
- **No payment processing.** Store gateways are labels with illustrative fee math; no card data,
  processor credentials or payment intent ever exists.
- **No server, database or job queue.** Persistence is browser-local.

Those are the parts you would need to design yourself before this could serve real users.

## Legal

Operza is an independent educational project. It is not a copy of, and is not affiliated with,
any commercial CRM vendor. Names, data and copy inside the demo are fictional. If you are
studying a commercial product, review its terms of service before copying anything from it —
reproducing proprietary source or assets is not permitted by most licences, and this repository
deliberately avoids doing that.

## License

MIT for the code in this repository.
