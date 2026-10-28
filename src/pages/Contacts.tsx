import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Avatar, Badge, EmptyState, PageHeader, StatusBadge } from '../components/ui';
import { useStore, uid } from '../lib/store';
import { shortDate } from '../lib/format';
import type { Contact, ContactStatus } from '../lib/types';

const STATUSES: Array<{ value: 'all' | ContactStatus; label: string }> = [
  { value: 'all', label: 'All contacts' },
  { value: 'lead', label: 'Leads' },
  { value: 'customer', label: 'Customers' },
  { value: 'cold', label: 'Cold' },
];

export default function Contacts() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | ContactStatus>('all');
  const [tag, setTag] = useState('all');
  const [adding, setAdding] = useState(false);

  const allTags = useMemo(
    () => Array.from(new Set(state.contacts.flatMap((c) => c.tags))).sort(),
    [state.contacts],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.contacts
      .filter((c) => {
        if (status !== 'all' && c.status !== status) return false;
        if (tag !== 'all' && !c.tags.includes(tag)) return false;
        if (!q) return true;
        return `${c.firstName} ${c.lastName} ${c.email} ${c.company} ${c.phone}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.contacts, query, status, tag]);

  return (
    <div className="content">
      <PageHeader
        title="Contacts"
        subtitle={`${state.contacts.length} people in this workspace`}
        actions={
          <>
            <button className="btn">
              <Icon name="filter" size={15} /> Import
            </button>
            <button className="btn btn--primary" onClick={() => setAdding(true)}>
              <Icon name="plus" size={16} /> Add contact
            </button>
          </>
        }
      />

      <div className="card">
        <div className="card__head" style={{ gap: 8, flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 240px', maxWidth: 320 }}>
            <Icon name="search" size={15} />
            <input
              className="input"
              placeholder="Search name, email, company…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="select" style={{ width: 150 }} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select className="select" style={{ width: 150 }} value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="all">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <span className="spacer" />
          <span className="hint">{rows.length} shown</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Icon name="users" size={22} />}
            title="No contacts match"
            text="Try clearing the search or filters."
            action={
              <button className="btn btn--sm" onClick={() => { setQuery(''); setStatus('all'); setTag('all'); }}>
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Tags</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th className="cell-right">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="is-clickable" onClick={() => navigate(`/contacts/${c.id}`)}>
                    <td>
                      <Link className="person" to={`/contacts/${c.id}`} onClick={(e) => e.stopPropagation()}>
                        <Avatar name={`${c.firstName} ${c.lastName}`} />
                        <span className="person__text">
                          <span className="person__name">
                            {c.firstName} {c.lastName}
                          </span>
                          <span className="person__sub">{c.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td>{c.company || '—'}</td>
                    <td>
                      <span className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                        {c.tags.slice(0, 2).map((t) => (
                          <span className="tag" key={t}>
                            {t}
                          </span>
                        ))}
                        {c.tags.length > 2 && <Badge>+{c.tags.length - 2}</Badge>}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{c.source}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{c.owner}</td>
                    <td className="cell-right cell-sub">{shortDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {adding && (
        <AddContact
          onClose={() => setAdding(false)}
          onSave={(contact) => {
            dispatch({ type: 'contact/add', contact });
            setAdding(false);
            navigate(`/contacts/${contact.id}`);
          }}
        />
      )}
    </div>
  );
}

export function AddContact({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (contact: Contact) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('Manual');
  const [status, setStatus] = useState<ContactStatus>('lead');
  const [tags, setTags] = useState('');

  const valid = firstName.trim() && lastName.trim() && email.trim();

  const submit = () => {
    if (!valid) return;
    onSave({
      id: uid('c'),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
        .filter(Boolean),
      source,
      status,
      owner: 'Asim R.',
      createdAt: new Date().toISOString(),
      notes: [],
      customFields: {},
    });
  };

  return (
    <Modal
      title="Add contact"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit} disabled={!valid}>
            Save contact
          </button>
        </>
      }
    >
      <div className="grid grid--2">
        <div className="field">
          <label>First name</label>
          <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Last name</label>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid grid--2">
        <div className="field">
          <label>Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Company</label>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
      </div>
      <div className="grid grid--2">
        <div className="field">
          <label>Source</label>
          <select className="select" value={source} onChange={(e) => setSource(e.target.value)}>
            {['Manual', 'Facebook Ads', 'Google Ads', 'Instagram', 'LinkedIn', 'Referral', 'Webinar', 'Organic search', 'Cold email'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as ContactStatus)}>
            <option value="lead">Lead</option>
            <option value="customer">Customer</option>
            <option value="cold">Cold</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Tags (comma separated)</label>
        <input className="input" placeholder="hot-lead, webinar" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
    </Modal>
  );
}
