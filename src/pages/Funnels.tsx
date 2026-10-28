import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Badge, PageHeader, StatCard, StatusBadge, Switch } from '../components/ui';
import { useStore } from '../lib/store';
import { num, pct } from '../lib/format';
import type { Site } from '../lib/types';

const BANNERS = [
  'linear-gradient(135deg, #4f46e5, #7c3aed)',
  'linear-gradient(135deg, #0ea5e9, #2563eb)',
  'linear-gradient(135deg, #10b981, #0d9488)',
  'linear-gradient(135deg, #f59e0b, #ea580c)',
];

export default function Funnels() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<Site | null>(null);

  const funnels = state.sites.filter((s) => s.kind === 'funnel');
  const rows = funnels.filter((f) => {
    if (filter === 'published') return f.published;
    if (filter === 'draft') return !f.published;
    return true;
  });

  const visits = funnels.reduce((s, f) => s + f.visits, 0);
  const optins = funnels.reduce((s, f) => s + f.optins, 0);

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
                <button className="btn btn--sm" onClick={() => setEditing(funnel)}>
                  <Icon name="sliders" size={14} /> Open builder
                </button>
                <button className="btn btn--sm">
                  <Icon name="copy" size={14} /> Duplicate
                </button>
                <span className="spacer" />
                <Badge>{funnel.pages.length} steps</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing.name}
          wide
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn" onClick={() => setEditing(null)}>
                Close
              </button>
              <button
                className="btn btn--primary"
                onClick={() => {
                  dispatch({ type: 'site/toggle', id: editing.id });
                  setEditing(null);
                }}
              >
                {editing.published ? 'Unpublish funnel' : 'Publish funnel'}
              </button>
            </>
          }
        >
          <div className="row row--between">
            <div>
              <div className="cell-sub">Public URL</div>
              <div className="row" style={{ gap: 6, fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                go.agency.test/{editing.name.toLowerCase().replace(/\s+/g, '-')}
              </div>
            </div>
            <StatusBadge status={editing.published ? 'published' : 'draft'} />
          </div>
          <div className="divider" />
          <strong style={{ fontSize: 13 }}>Steps</strong>
          <div className="stack" style={{ gap: 8 }}>
            {editing.pages.map((page, idx) => {
              const pageVisits = Math.round(editing.visits * Math.pow(0.62, idx));
              return (
                <div className="list-row" key={page.id} style={{ border: '1px solid var(--line)', borderRadius: 9, background: 'var(--surface-2)' }}>
                  <span
                    className="avatar avatar--sm"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 11 }}
                  >
                    {idx + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{page.name}</div>
                    <div className="cell-sub" style={{ fontFamily: 'var(--font-mono)' }}>
                      {page.path}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{num(pageVisits)}</div>
                    <div className="cell-sub">visits</div>
                  </div>
                  <button className="icon-btn" aria-label="Edit step">
                    <Icon name="edit" size={15} />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="hint">Demo builder: steps are read-only in this build.</div>
        </Modal>
      )}
    </div>
  );
}
