import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Badge, PageHeader, StatCard, StatusBadge, Switch } from '../components/ui';
import { useStore } from '../lib/store';
import { num, pct } from '../lib/format';
import type { Site } from '../lib/types';

export default function Websites() {
  const { state, dispatch } = useStore();
  const [preview, setPreview] = useState<Site | null>(null);

  const sites = state.sites.filter((s) => s.kind === 'website');
  const visits = sites.reduce((s, x) => s + x.visits, 0);
  const optins = sites.reduce((s, x) => s + x.optins, 0);
  const pages = sites.reduce((s, x) => s + x.pages.length, 0);

  return (
    <div className="content">
      <PageHeader title="Websites" subtitle="Hosted site pages, navigation and lead capture." />

      <div className="grid grid--4" style={{ marginBottom: 16 }}>
        <StatCard label="Websites" value={String(sites.length)} icon={<Icon name="globe" size={15} />} meta="hosted in workspace" />
        <StatCard label="Pages" value={String(pages)} icon={<Icon name="copy" size={15} />} meta="total published pages" />
        <StatCard label="Visits" value={num(visits)} icon={<Icon name="eye" size={15} />} meta="all time" />
        <StatCard label="Opt-ins" value={num(optins)} icon={<Icon name="users" size={15} />} meta={`${pct(optins, visits || 1)} conversion`} />
      </div>

      <div className="stack">
        {sites.map((site) => (
          <div className="card" key={site.id}>
            <div className="card__head">
              <div
                className="avatar avatar--md avatar--square"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                <Icon name="globe" size={17} />
              </div>
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <strong style={{ fontSize: 14 }}>{site.name}</strong>
                  <StatusBadge status={site.published ? 'published' : 'draft'} />
                </div>
                <div className="cell-sub">agency.test/{site.name.toLowerCase().replace(/\s+/g, '-')}</div>
              </div>
              <div className="card__actions">
                <Switch on={site.published} label={`Toggle ${site.name}`} onChange={() => dispatch({ type: 'site/toggle', id: site.id })} />
                <button className="btn btn--sm" onClick={() => setPreview(site)}>
                  <Icon name="eye" size={14} /> Preview
                </button>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Path</th>
                    <th className="cell-right">Visits</th>
                    <th className="cell-right">Share</th>
                    <th className="cell-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {site.pages.map((page) => {
                    const share = Math.round(100 / site.pages.length);
                    return (
                      <tr key={page.id}>
                        <td className="cell-main">{page.name}</td>
                        <td className="cell-sub" style={{ fontFamily: 'var(--font-mono)' }}>
                          {page.path}
                        </td>
                        <td className="cell-right cell-num">{num(Math.round(site.visits / site.pages.length))}</td>
                        <td className="cell-right cell-sub">{share}%</td>
                        <td className="cell-right">
                          <button className="icon-btn" aria-label="Edit page" style={{ marginLeft: 'auto' }}>
                            <Icon name="edit" size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <Modal
          title={`Preview · ${preview.name}`}
          wide
          onClose={() => setPreview(null)}
          footer={
            <button className="btn btn--primary" onClick={() => setPreview(null)}>
              Done
            </button>
          }
        >
          <div className="row" style={{ gap: 6, fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            <Icon name="lock" size={13} /> agency.test/{preview.name.toLowerCase().replace(/\s+/g, '-')}
          </div>
          <div className="page-head" style={{ marginBottom: 12 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="brand__mark">AG</span>
              <strong style={{ fontSize: 14 }}>{preview.name}</strong>
              <Badge tone="green" dot>
                Live
              </Badge>
            </div>
            <span className="spacer" />
            {preview.pages.map((p) => (
              <span key={p.id} className="hint" style={{ fontSize: 12 }}>
                {p.name}
              </span>
            ))}
          </div>
          <div
            style={{
              borderRadius: 12,
              padding: '40px 28px',
              background: 'linear-gradient(160deg, #eef0ff, #f7f5ff 60%, #ffffff)',
              border: '1px solid var(--line)',
              textAlign: 'center',
            }}
          >
            <div className="hint" style={{ marginBottom: 8 }}>
              {preview.name}
            </div>
            <h2 style={{ fontSize: 24, letterSpacing: '-0.03em', fontWeight: 700, lineHeight: 1.2 }}>
              Grow faster with a system
              <br />
              that runs itself
            </h2>
            <p className="hint" style={{ maxWidth: 420, margin: '10px auto 18px' }}>
              This is a placeholder rendering of the site page. Wire it to real content in{' '}
              <code>pages/Websites.tsx</code>.
            </p>
            <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
              <button className="btn btn--primary">Book a call</button>
              <button className="btn">See pricing</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
