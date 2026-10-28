import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Badge, PageHeader, StatCard, StatusBadge, Switch } from '../components/ui';
import { uid, useStore } from '../lib/store';
import { num, pct } from '../lib/format';
import type { Site, SitePage } from '../lib/types';

const BANNERS = [
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #0ea5e9, #2563eb)',
  'linear-gradient(135deg, #10b981, #0d9488)',
  'linear-gradient(135deg, #f59e0b, #ea580c)',
];

function slugPath(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `/${slug}` : '/';
}

export default function Funnels() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const funnels = state.sites.filter((s) => s.kind === 'funnel');
  const rows = funnels.filter((f) => {
    if (filter === 'published') return f.published;
    if (filter === 'draft') return !f.published;
    return true;
  });
  const editing = funnels.find((f) => f.id === editingId) ?? null;

  const visits = funnels.reduce((s, f) => s + f.visits, 0);
  const optins = funnels.reduce((s, f) => s + f.optins, 0);

  const duplicate = (funnel: Site) => {
    dispatch({
      type: 'site/duplicate',
      copy: {
        ...funnel,
        id: uid('f'),
        name: `${funnel.name} copy`,
        published: false,
        visits: 0,
        optins: 0,
        pages: funnel.pages.map((page) => ({ ...page, id: uid('fp'), visits: 0, optins: 0 })),
      },
    });
  };

  return (
    <div className="content">
      <PageHeader
        title="Funnels"
        subtitle="Multi-step opt-in flows and their conversion performance."
        actions={
          <div className="segmented">
            {(['all', 'published', 'draft'] as const).map((f) => (
              <button key={f} className={filter === f ? 'is-active' : ''} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 16 }}>
        <StatCard label="Total visits" value={num(visits)} icon={<Icon name="eye" size={15} />} meta="all funnels" />
        <StatCard label="Opt-ins" value={num(optins)} icon={<Icon name="users" size={15} />} meta="form submissions" />
        <StatCard label="Conversion" value={pct(optins, visits || 1)} icon={<Icon name="chart" size={15} />} meta="visits → opt-in" />
        <StatCard label="Live funnels" value={`${funnels.filter((f) => f.published).length}/${funnels.length}`} icon={<Icon name="play" size={15} />} meta="published" />
      </div>

      <div className="grid grid--2">
        {rows.map((funnel, i) => (
          <div className="card" key={funnel.id}>
            <div className="site-card__banner" style={{ background: BANNERS[i % BANNERS.length] }}>
              <Icon name="funnel" size={26} />
            </div>
            <div className="card__body">
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: 14.5, letterSpacing: '-0.01em' }}>{funnel.name}</strong>
                <StatusBadge status={funnel.published ? 'published' : 'draft'} />
                <span className="spacer" />
                <Switch
                  on={funnel.published}
                  label={`Toggle ${funnel.name}`}
                  onChange={() => dispatch({ type: 'site/toggle', id: funnel.id })}
                />
              </div>
              <div className="row" style={{ gap: 18, margin: '10px 0 12px' }}>
                <div>
                  <div className="cell-sub">Visits</div>
                  <strong style={{ fontSize: 14 }}>{num(funnel.visits)}</strong>
                </div>
                <div>
                  <div className="cell-sub">Opt-ins</div>
                  <strong style={{ fontSize: 14 }}>{num(funnel.optins)}</strong>
                </div>
                <div>
                  <div className="cell-sub">Conversion</div>
                  <strong style={{ fontSize: 14, color: 'var(--green)' }}>{pct(funnel.optins, funnel.visits || 1)}</strong>
                </div>
              </div>
              <div className="funnel-path">
                {funnel.pages.map((page, idx) => (
                  <span key={page.id} className="row" style={{ gap: 6 }}>
                    {idx > 0 && <Icon name="chevron-right" size={13} className="funnel-arrow" />}
                    <span className="funnel-step">{page.name}</span>
                  </span>
                ))}
              </div>
              <div className="row" style={{ gap: 8, marginTop: 14 }}>
                <button className="btn btn--sm" onClick={() => setEditingId(funnel.id)}>
                  <Icon name="sliders" size={14} /> Open builder
                </button>
                <button className="btn btn--sm" onClick={() => duplicate(funnel)}>
                  <Icon name="copy" size={14} /> Duplicate
                </button>
                <span className="spacer" />
                <Badge>{funnel.pages.length} steps</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <FunnelBuilder funnel={editing} onClose={() => setEditingId(null)} />}
    </div>
  );
}

function FunnelBuilder({ funnel, onClose }: { funnel: Site; onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [path, setPath] = useState('');

  const addStep = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cleanPath = path.trim();
    const page: SitePage = {
      id: uid('fp'),
      name: trimmed,
      path: cleanPath.startsWith('/') ? cleanPath : `/${cleanPath || slugPath(trimmed).slice(1)}`,
      visits: 0,
      optins: 0,
    };
    dispatch({ type: 'site/step/add', siteId: funnel.id, page });
    setName('');
    setPath('');
  };

  return (
    <Modal
      title={funnel.name}
      wide
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn--primary"
            onClick={() => dispatch({ type: 'site/toggle', id: funnel.id })}
          >
            {funnel.published ? 'Unpublish funnel' : 'Publish funnel'}
          </button>
        </>
      }
    >
      <div className="row row--between">
        <div>
          <div className="cell-sub">Public URL</div>
          <div className="row" style={{ gap: 6, fontSize: 13, fontFamily: 'var(--font-mono)' }}>
            go.agency.test/{funnel.name.toLowerCase().replace(/\s+/g, '-')}
          </div>
        </div>
        <StatusBadge status={funnel.published ? 'published' : 'draft'} />
      </div>
      <div className="divider" />
      <div className="row row--between">
        <strong style={{ fontSize: 13 }}>Steps</strong>
        <span className="cell-sub">
          {num(funnel.visits)} visits · {num(funnel.optins)} opt-ins
        </span>
      </div>

      {funnel.pages.length === 0 ? (
        <div className="hint">No steps yet — add the first page below.</div>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {funnel.pages.map((page, idx) => (
            <div
              className="list-row"
              key={page.id}
              style={{ border: '1px solid var(--line)', borderRadius: 9, background: 'var(--surface-2)' }}
            >
              <span
                className="avatar avatar--sm"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 11 }}
              >
                {idx + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 150px', gap: 8 }}>
                <input
                  className="input"
                  aria-label={`Step ${idx + 1} name`}
                  value={page.name}
                  onChange={(e) =>
                    dispatch({
                      type: 'site/step/update',
                      siteId: funnel.id,
                      id: page.id,
                      patch: { name: e.target.value },
                    })
                  }
                />
                <input
                  className="input"
                  aria-label={`Step ${idx + 1} path`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  value={page.path}
                  onChange={(e) =>
                    dispatch({
                      type: 'site/step/update',
                      siteId: funnel.id,
                      id: page.id,
                      patch: { path: e.target.value },
                    })
                  }
                />
              </div>
              <div style={{ textAlign: 'right', minWidth: 96 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{num(page.visits)}</div>
                <div className="cell-sub">
                  {num(page.optins)} opt-ins · {pct(page.optins, page.visits || 1)}
                </div>
              </div>
              <div className="row" style={{ gap: 2 }}>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Move ${page.name} up`}
                  disabled={idx === 0}
                  onClick={() => dispatch({ type: 'site/step/move', siteId: funnel.id, id: page.id, direction: 'up' })}
                >
                  <Icon name="chevron-up" size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Move ${page.name} down`}
                  disabled={idx === funnel.pages.length - 1}
                  onClick={() => dispatch({ type: 'site/step/move', siteId: funnel.id, id: page.id, direction: 'down' })}
                >
                  <Icon name="chevron-down" size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Delete ${page.name}`}
                  onClick={() => dispatch({ type: 'site/step/delete', siteId: funnel.id, id: page.id })}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="divider" />
      <div className="grid grid--3" style={{ alignItems: 'end' }}>
        <div className="field">
          <label htmlFor="step-name">Step name</label>
          <input
            id="step-name"
            className="input"
            placeholder="Checkout"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="step-path">Path</label>
          <input
            id="step-path"
            className="input"
            placeholder="/checkout"
            style={{ fontFamily: 'var(--font-mono)' }}
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </div>
        <button className="btn" type="button" disabled={!name.trim()} onClick={addStep}>
          <Icon name="plus" size={14} /> Add step
        </button>
      </div>
    </Modal>
  );
}
