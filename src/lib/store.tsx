import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { seed } from './seed';
import type {
  Appointment,
  Contact,
  ContractDoc,
  CustomField,
  Invoice,
  MediaAsset,
  Note,
  Opportunity,
  PaymentLink,
  Product,
  QrCode,
  SmartList,
  SocialPost,
  Task,
  TeamMember,
  TriggerLink,
  WorkspaceState,
  Workflow,
} from './types';

const STORAGE_KEY = 'ghl-lite.workspace.v3';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export type Action =
  | { type: 'contact/add'; contact: Contact }
  | { type: 'contact/update'; id: string; patch: Partial<Contact> }
  | { type: 'contact/delete'; id: string }
  | { type: 'contact/bulkTag'; ids: string[]; tag: string }
  | { type: 'contact/bulkStatus'; ids: string[]; status: Contact['status'] }
  | { type: 'contact/bulkDelete'; ids: string[] }
  | { type: 'contact/note'; id: string; body: string; author: string }
  | { type: 'opportunity/add'; opportunity: Opportunity }
  | { type: 'opportunity/move'; id: string; stageId: string }
  | { type: 'opportunity/delete'; id: string }
  | { type: 'conversation/send'; id: string; body: string }
  | { type: 'conversation/read'; id: string }
  | { type: 'conversation/star'; id: string }
  | { type: 'appointment/add'; appointment: Appointment }
  | { type: 'appointment/status'; id: string; status: Appointment['status'] }
  | { type: 'appointment/delete'; id: string }
  | { type: 'invoice/add'; invoice: Invoice }
  | { type: 'invoice/status'; id: string; status: Invoice['status'] }
  | { type: 'product/toggle'; id: string }
  | { type: 'product/add'; product: Product }
  | { type: 'product/update'; id: string; patch: Partial<Product> }
  | { type: 'paymentLink/add'; link: PaymentLink }
  | { type: 'paymentLink/toggle'; id: string }
  | { type: 'paymentLink/visit'; id: string }
  | { type: 'task/add'; task: Task }
  | { type: 'task/toggle'; id: string }
  | { type: 'task/delete'; id: string }
  | { type: 'post/add'; post: SocialPost }
  | { type: 'post/status'; id: string; status: SocialPost['status'] }
  | { type: 'site/toggle'; id: string }
  | { type: 'form/toggle'; id: string }
  | { type: 'workflow/toggle'; id: string }
  | { type: 'workflow/add'; workflow: Workflow }
  | { type: 'integration/toggle'; id: string }
  | { type: 'review/reply'; id: string; reply: string }
  | { type: 'review/status'; id: string; status: 'new' | 'flagged' }
  | { type: 'listing/toggle'; id: string }
  | { type: 'course/toggle'; id: string }
  | { type: 'document/add'; document: ContractDoc }
  | { type: 'document/status'; id: string; status: ContractDoc['status'] }
  | { type: 'media/add'; asset: MediaAsset }
  | { type: 'media/delete'; id: string }
  | { type: 'prospect/status'; id: string; status: 'new' | 'contacted' | 'qualified' | 'skipped' }
  | { type: 'order/status'; id: string; status: 'paid' | 'pending' | 'refunded' }
  | { type: 'subscription/status'; id: string; status: 'active' | 'past_due' | 'canceled' }
  | { type: 'affiliate/status'; id: string; status: 'active' | 'pending' | 'paused' }
  | { type: 'template/use'; id: string }
  | { type: 'triggerLink/add'; link: TriggerLink }
  | { type: 'triggerLink/click'; id: string }
  | { type: 'blog/toggle'; id: string }
  | { type: 'qr/add'; code: QrCode }
  | { type: 'smartList/add'; list: SmartList }
  | { type: 'customField/add'; field: CustomField }
  | { type: 'team/add'; member: TeamMember }
  | { type: 'team/role'; id: string; role: TeamMember['role'] }
  | { type: 'notifications/readAll' }
  | { type: 'workspace/reset' };

function pruneContacts(state: WorkspaceState, ids: Set<string>): WorkspaceState {
  const keep = (contactId: string) => !ids.has(contactId);
  return {
    ...state,
    contacts: state.contacts.filter((c) => keep(c.id)),
    opportunities: state.opportunities.filter((o) => keep(o.contactId)),
    conversations: state.conversations.filter((c) => keep(c.contactId)),
    appointments: state.appointments.filter((a) => keep(a.contactId)),
    invoices: state.invoices.filter((i) => keep(i.contactId)),
    enrollments: state.enrollments.filter((e) => keep(e.contactId)),
    reviews: state.reviews.filter((r) => keep(r.contactId)),
    documents: state.documents.filter((d) => keep(d.contactId)),
    orders: state.orders.filter((o) => keep(o.contactId)),
    subscriptions: state.subscriptions.filter((s) => keep(s.contactId)),
    tasks: state.tasks.filter((t) => !t.contactId || keep(t.contactId)),
  };
}

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'contact/add':
      return { ...state, contacts: [action.contact, ...state.contacts] };

    case 'contact/update':
      return {
        ...state,
        contacts: state.contacts.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      };

    case 'contact/delete':
      return pruneContacts(state, new Set([action.id]));

    case 'contact/bulkTag': {
      const ids = new Set(action.ids);
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          ids.has(c.id) && !c.tags.includes(action.tag) ? { ...c, tags: [...c.tags, action.tag] } : c,
        ),
      };
    }

    case 'contact/bulkStatus': {
      const ids = new Set(action.ids);
      return {
        ...state,
        contacts: state.contacts.map((c) => (ids.has(c.id) ? { ...c, status: action.status } : c)),
      };
    }

    case 'contact/bulkDelete':
      return pruneContacts(state, new Set(action.ids));

    case 'contact/note': {
      const note: Note = { id: uid('note'), body: action.body, at: new Date().toISOString(), author: action.author };
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.id ? { ...c, notes: [note, ...c.notes] } : c,
        ),
      };
    }

    case 'opportunity/add':
      return { ...state, opportunities: [action.opportunity, ...state.opportunities] };

    case 'opportunity/move':
      return {
        ...state,
        opportunities: state.opportunities.map((o) =>
          o.id === action.id ? { ...o, stageId: action.stageId } : o,
        ),
      };

    case 'opportunity/delete':
      return { ...state, opportunities: state.opportunities.filter((o) => o.id !== action.id) };

    case 'conversation/send':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id
            ? {
                ...c,
                unread: 0,
                messages: [
                  ...c.messages,
                  { id: uid('msg'), direction: 'out', body: action.body, at: new Date().toISOString() },
                ],
              }
            : c,
        ),
      };

    case 'conversation/read':
      return {
        ...state,
        conversations: state.conversations.map((c) => (c.id === action.id ? { ...c, unread: 0 } : c)),
      };

    case 'conversation/star':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, starred: !c.starred } : c,
        ),
      };

    case 'appointment/add':
      return { ...state, appointments: [...state.appointments, action.appointment] };

    case 'appointment/status':
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.id ? { ...a, status: action.status } : a,
        ),
      };

    case 'appointment/delete':
      return { ...state, appointments: state.appointments.filter((a) => a.id !== action.id) };

    case 'invoice/add':
      return { ...state, invoices: [action.invoice, ...state.invoices] };

    case 'invoice/status':
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.id ? { ...i, status: action.status } : i)),
      };

    case 'product/toggle':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.id ? { ...p, active: !p.active } : p)),
      };

    case 'product/add':
      return { ...state, products: [...state.products, action.product] };

    case 'product/update':
      return {
        ...state,
        products: state.products.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };

    case 'paymentLink/add':
      return { ...state, paymentLinks: [action.link, ...state.paymentLinks] };

    case 'paymentLink/toggle':
      return {
        ...state,
        paymentLinks: state.paymentLinks.map((l) =>
          l.id === action.id ? { ...l, active: !l.active } : l,
        ),
      };

    case 'paymentLink/visit':
      return {
        ...state,
        paymentLinks: state.paymentLinks.map((l) =>
          l.id === action.id ? { ...l, visits: l.visits + 1 } : l,
        ),
      };

    case 'task/add':
      return { ...state, tasks: [action.task, ...state.tasks] };

    case 'task/toggle':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)),
      };

    case 'task/delete':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    case 'post/add':
      return { ...state, posts: [action.post, ...state.posts] };

    case 'post/status':
      return {
        ...state,
        posts: state.posts.map((p) => (p.id === action.id ? { ...p, status: action.status } : p)),
      };

    case 'site/toggle':
      return {
        ...state,
        sites: state.sites.map((s) => (s.id === action.id ? { ...s, published: !s.published } : s)),
      };

    case 'form/toggle':
      return {
        ...state,
        forms: state.forms.map((f) => (f.id === action.id ? { ...f, published: !f.published } : f)),
      };

    case 'workflow/toggle':
      return {
        ...state,
        workflows: state.workflows.map((w) =>
          w.id === action.id ? { ...w, status: w.status === 'published' ? 'draft' : 'published' } : w,
        ),
      };

    case 'workflow/add':
      return { ...state, workflows: [action.workflow, ...state.workflows] };

    case 'integration/toggle':
      return {
        ...state,
        integrations: state.integrations.map((i) =>
          i.id === action.id ? { ...i, connected: !i.connected } : i,
        ),
      };

    case 'review/reply':
      return {
        ...state,
        reviews: state.reviews.map((r) =>
          r.id === action.id ? { ...r, reply: action.reply, status: 'replied' } : r,
        ),
      };

    case 'review/status':
      return {
        ...state,
        reviews: state.reviews.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)),
      };

    case 'listing/toggle':
      return {
        ...state,
        listings: state.listings.map((l) => (l.id === action.id ? { ...l, connected: !l.connected } : l)),
      };

    case 'course/toggle':
      return {
        ...state,
        courses: state.courses.map((c) => (c.id === action.id ? { ...c, published: !c.published } : c)),
      };

    case 'document/add':
      return { ...state, documents: [action.document, ...state.documents] };

    case 'document/status':
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.id ? { ...d, status: action.status, updatedAt: new Date().toISOString() } : d,
        ),
      };

    case 'media/add':
      return { ...state, media: [action.asset, ...state.media] };

    case 'media/delete':
      return { ...state, media: state.media.filter((m) => m.id !== action.id) };

    case 'prospect/status':
      return {
        ...state,
        prospects: state.prospects.map((p) => (p.id === action.id ? { ...p, status: action.status } : p)),
      };

    case 'order/status':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: action.status } : o)),
      };

    case 'subscription/status':
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) =>
          s.id === action.id ? { ...s, status: action.status } : s,
        ),
      };

    case 'affiliate/status':
      return {
        ...state,
        affiliates: state.affiliates.map((a) => (a.id === action.id ? { ...a, status: action.status } : a)),
      };

    case 'template/use':
      return {
        ...state,
        templates: state.templates.map((t) => (t.id === action.id ? { ...t, uses: t.uses + 1 } : t)),
      };

    case 'triggerLink/add':
      return { ...state, triggerLinks: [action.link, ...state.triggerLinks] };

    case 'triggerLink/click':
      return {
        ...state,
        triggerLinks: state.triggerLinks.map((l) =>
          l.id === action.id
            ? { ...l, clicks: l.clicks + 1, lastClickAt: new Date().toISOString() }
            : l,
        ),
      };

    case 'blog/toggle':
      return {
        ...state,
        blogs: state.blogs.map((b) =>
          b.id === action.id
            ? {
                ...b,
                status: b.status === 'published' ? 'draft' : 'published',
                publishedAt: b.status === 'published' ? b.publishedAt : new Date().toISOString(),
              }
            : b,
        ),
      };

    case 'qr/add':
      return { ...state, qrCodes: [action.code, ...state.qrCodes] };

    case 'smartList/add':
      return { ...state, smartLists: [action.list, ...state.smartLists] };

    case 'customField/add':
      return { ...state, customFields: [...state.customFields, action.field] };

    case 'team/add':
      return { ...state, team: [...state.team, action.member] };

    case 'team/role':
      return {
        ...state,
        team: state.team.map((m) => (m.id === action.id ? { ...m, role: action.role } : m)),
      };

    case 'notifications/readAll':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };

    case 'workspace/reset':
      return seed;

    default:
      return state;
  }
}

function loadInitial(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    // Merge over the seed so a workspace saved by an older build still gets new collections.
    return parsed.contacts ? { ...seed, ...parsed } : seed;
  } catch {
    return seed;
  }
}

interface StoreValue {
  state: WorkspaceState;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota exceeded — keep running in memory */
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

/** Convenience lookup helpers. */
export function useContact(id: string | undefined) {
  const { state } = useStore();
  return state.contacts.find((c) => c.id === id);
}

export function useContactName(id: string): string {
  const contact = useContact(id);
  return contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown contact';
}

export const CHANNEL_META = {
  sms: { label: 'SMS', icon: 'message' },
  email: { label: 'Email', icon: 'mail' },
  facebook: { label: 'Facebook', icon: 'facebook' },
  instagram: { label: 'Instagram', icon: 'instagram' },
  webchat: { label: 'Web chat', icon: 'globe' },
} as const;

export const INTEGRATION_CATEGORIES = [
  'Payments', 'Messaging', 'Email', 'Scheduling', 'Advertising', 'Automation', 'Notifications', 'Accounting',
] as const;
