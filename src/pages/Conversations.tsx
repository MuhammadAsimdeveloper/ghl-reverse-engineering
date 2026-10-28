import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Avatar, Badge, EmptyState } from '../components/ui';
import { CHANNEL_META, useStore } from '../lib/store';
import { relative, timeOf } from '../lib/format';

const FILTERS = ['all', 'unread', 'starred'] as const;
type Filter = (typeof FILTERS)[number];

export default function Conversations() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(state.conversations[0]?.id ?? null);
  const [draft, setDraft] = useState('');

  const contactOf = (id: string) => state.contacts.find((c) => c.id === id);

  const conversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.conversations
      .filter((c) => {
        if (filter === 'unread' && c.unread === 0) return false;
        if (filter === 'starred' && !c.starred) return false;
        if (!q) return true;
        const contact = contactOf(c.contactId);
        const text = `${contact?.firstName ?? ''} ${contact?.lastName ?? ''} ${contact?.company ?? ''}`.toLowerCase();
        return text.includes(q);
      })
      .sort((a, b) => {
        const aLast = a.messages[a.messages.length - 1]?.at ?? '';
        const bLast = b.messages[b.messages.length - 1]?.at ?? '';
        return bLast.localeCompare(aLast);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.conversations, state.contacts, filter, query]);

  const selected = state.conversations.find((c) => c.id === selectedId) ?? null;
  const selectedContact = selected ? contactOf(selected.contactId) : undefined;

  const openConversation = (id: string) => {
    setSelectedId(id);
    dispatch({ type: 'conversation/read', id });
  };

  const send = () => {
    if (!selected || !draft.trim()) return;
    dispatch({ type: 'conversation/send', id: selected.id, body: draft.trim() });
    setDraft('');
  };

  return (
    <div className="content content--flush">
      <div className="inbox">
        <section className={`inbox__list${selected ? ' is-hidden-mobile' : ''}`}>
          <div className="inbox__list-head">
            <div className="row">
              <strong style={{ fontSize: 14 }}>Inbox</strong>
              <Badge tone="accent">
                {state.conversations.reduce((s, c) => s + c.unread, 0)} unread
              </Badge>
              <button className="icon-btn" style={{ marginLeft: 'auto' }} aria-label="Compose">
                <Icon name="edit" size={16} />
              </button>
            </div>
            <div className="search">
              <Icon name="search" size={15} />
              <input
                className="input"
                placeholder="Search conversations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="segmented">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={filter === f ? 'is-active' : ''}
                  onClick={() => setFilter(f)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="inbox__scroll">
            {conversations.length === 0 && (
              <EmptyState icon={<Icon name="message" size={20} />} title="No conversations" text="Nothing matches this filter." />
            )}
            {conversations.map((c) => {
              const contact = contactOf(c.contactId);
              if (!contact) return null;
              const last = c.messages[c.messages.length - 1];
              const meta = CHANNEL_META[c.channel];
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`conv${c.id === selectedId ? ' is-active' : ''}`}
                  onClick={() => openConversation(c.id)}
                >
                  <Avatar name={`${contact.firstName} ${contact.lastName}`} size="md" />
                  <span className="conv__body">
                    <span className="conv__top">
                      <span className="conv__name">
                        {contact.firstName} {contact.lastName}
                      </span>
                      <span className="conv__time">{last ? relative(last.at) : ''}</span>
                      {c.unread > 0 && <span className="conv__badge">{c.unread}</span>}
                    </span>
                    <span className="conv__preview" style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <Icon name={meta.icon} size={12} />
                      {last?.body}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {selected && selectedContact ? (
          <section className="thread">
            <div className="thread__head">
              <button
                className="icon-btn"
                aria-label="Back"
                onClick={() => setSelectedId(null)}
                style={{ display: 'none' }}
              >
                <Icon name="chevron-left" size={17} />
              </button>
              <Avatar name={`${selectedContact.firstName} ${selectedContact.lastName}`} size="md" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 650 }}>
                  {selectedContact.firstName} {selectedContact.lastName}
                </div>
                <div className="cell-sub">
                  {CHANNEL_META[selected.channel].label} · {selectedContact.phone}
                </div>
              </div>
              <div className="card__actions">
                <button
                  className="icon-btn"
                  aria-label="Star"
                  onClick={() => dispatch({ type: 'conversation/star', id: selected.id })}
                  style={{ color: selected.starred ? '#f59e0b' : undefined }}
                >
                  <Icon name="star" size={16} />
                </button>
                <Link className="btn btn--sm" to={`/contacts/${selectedContact.id}`}>
                  <Icon name="user" size={14} /> View contact
                </Link>
                <button className="icon-btn" aria-label="More">
                  <Icon name="dots" size={16} />
                </button>
              </div>
            </div>

            <div className="thread__scroll">
              {selected.messages.map((m) => (
                <div key={m.id} className={`bubble bubble--${m.direction}`}>
                  {m.body}
                  <div className="bubble__meta">
                    {m.direction === 'out' ? 'Asim R. · ' : ''}
                    {timeOf(m.at)}
                  </div>
                </div>
              ))}
            </div>

            <div className="thread__composer">
              <button className="icon-btn" aria-label="Attach">
                <Icon name="link" size={17} />
              </button>
              <textarea
                placeholder={`Reply via ${CHANNEL_META[selected.channel].label}…`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
              />
              <button className="btn btn--primary" onClick={send} disabled={!draft.trim()}>
                <Icon name="send" size={15} /> Send
              </button>
            </div>
          </section>
        ) : (
          <section className="thread">
            <EmptyState
              icon={<Icon name="message" size={22} />}
              title="Select a conversation"
              text="Pick a thread on the left to read and reply."
            />
          </section>
        )}
      </div>
    </div>
  );
}
