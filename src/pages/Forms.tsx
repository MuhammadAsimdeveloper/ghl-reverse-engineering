import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, PageHeader, StatCard, StatusBadge, Switch } from '../components/ui';
import { useStore } from '../lib/store';
import { num, pct } from '../lib/format';
import type { FormKind } from '../lib/types';

const TABS: Array<{ value: 'all' | FormKind; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'form', label: 'Forms' },
  { value: 'survey', label: 'Surveys' },
];

export default function Forms() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<'all' | FormKind>('all');

  const rows = state.forms.filter((f) => tab === 'all' || f.kind === tab);
  const submissions = state.forms.reduce((s, f) => s + f.submissions, 0);
  const published = state.forms.filter((f) => f.published).length;

  return (
    <div className="content">
      <PageHeader
        title="Forms & Surveys"
        subtitle="Capture leads with forms and collect feedback with surveys."
        actions={
          <button className="btn btn--primary">
            <Icon name="plus" size={16} /> New {tab === 'survey' ? 'survey' : 'form'}
          </button>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 16 }}>
        <StatCard label="Live forms" value={`${published}/${state.forms.length}`} icon={<Icon name="clipboard" size={15} />} meta="published" />
        <StatCard label="Submissions" value={num(submissions)} icon={<Icon name="send" size={15} />} meta="all time" />
        <StatCard
          label="Avg per form"
          value={num(Math.round(submissions / Math.max(state.forms.length, 1)))}
          icon={<Icon name="chart" size={15} />}
          meta="submissions"
        />
        <StatCard
          label="Completion"
          value={pct(state.forms.filter((f) => f.submissions > 0).length, state.forms.length || 1)}
          icon={<Icon name="check" size={15} />}
          meta="forms with data"
        />
      </div>

      <div className="card">
        <div className="card__head">
          <div className="tabs" style={{ borderBottom: 'none', padding: 0 }}>
            {TABS.map((t) => (
              <button key={t.value} className={`tab${tab === t.value ? ' is-active' : ''}`} onClick={() => setTab(t.value)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="card__actions">
            <span className="hint">{rows.length} items</span>
          </div>
        </div>

        <div className="table-wrap" style={{ borderTop: '1px solid var(--line)' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Fields</th>
                <th className="cell-right">Submissions</th>
                <th>Status</th>
                <th style={{ width: 60 }}>Live</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id}>
                  <td>
                    <div className="row" style={{ gap: 9 }}>
                      <span
                        className="avatar avatar--sm"
                        style={{
                          background: f.kind === 'survey' ? 'var(--violet-soft)' : 'var(--accent-soft)',
                          color: f.kind === 'survey' ? 'var(--violet)' : 'var(--accent)',
                          borderRadius: 7,
                        }}
                      >
                        <Icon name={f.kind === 'survey' ? 'survey' : 'clipboard'} size={14} />
                      </span>
                      <span className="cell-main">{f.name}</span>
                    </div>
                  </td>
                  <td>
                    <Badge tone={f.kind === 'survey' ? 'violet' : 'blue'}>{f.kind}</Badge>
                  </td>
                  <td className="cell-sub">{f.fields} fields</td>
                  <td className="cell-right cell-num">{num(f.submissions)}</td>
                  <td>
                    <StatusBadge status={f.published ? 'published' : 'draft'} />
                  </td>
                  <td>
                    <Switch on={f.published} label={`Toggle ${f.name}`} onChange={() => dispatch({ type: 'form/toggle', id: f.id })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid--2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Top performer</div>
          </div>
          <div className="card__body">
            {(() => {
              const best = [...state.forms].sort((a, b) => b.submissions - a.submissions)[0];
              if (!best) return <span className="hint">No data yet</span>;
              return (
                <div className="stack" style={{ gap: 10 }}>
                  <div className="row" style={{ gap: 10 }}>
                    <span className="avatar avatar--md" style={{ background: 'var(--green-soft)', color: 'var(--green)' }}>
                      <Icon name="sparkles" size={17} />
                    </span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 650 }}>{best.name}</div>
                      <div className="cell-sub">
                        {num(best.submissions)} submissions · {best.fields} fields
                      </div>
                    </div>
                  </div>
                  <div className="hint">
                    This {best.kind} accounts for{' '}
                    {pct(best.submissions, state.forms.reduce((s, f) => s + f.submissions, 0) || 1)} of all captured leads.
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Embed snippet</div>
          </div>
          <div className="card__body stack">
            <div className="note" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              &lt;iframe src=&quot;https://forms.agency.test/embed/contact-us&quot; /&gt;
            </div>
            <span className="hint">Paste this into any site builder to capture leads into this workspace.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
