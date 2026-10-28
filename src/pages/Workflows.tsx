import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, EmptyState, PageHeader, StatCard, StatusBadge, Switch } from '../components/ui';
import { useStore } from '../lib/store';
import { num, pct } from '../lib/format';

const ACTION_ICON: Record<string, string> = {
  sms: 'message',
  email: 'mail',
  wait: 'wait',
  tag: 'tag',
  task: 'task',
  webhook: 'webhook',
  condition: 'condition',
};

export default function Workflows() {
  const { state, dispatch } = useStore();
  const [selectedId, setSelectedId] = useState(state.workflows[0]?.id ?? null);

  const selected = state.workflows.find((w) => w.id === selectedId) ?? null;
  const live = state.workflows.filter((w) => w.status === 'published');
  const enrolled = state.workflows.reduce((s, w) => s + w.enrolled, 0);

  return (
    <div className="content">
      <PageHeader
        title="Workflows"
        subtitle="Automations that run on triggers, waits and conditions."
        actions={
          <button className="btn btn--primary">
            <Icon name="plus" size={16} /> New workflow
          </button>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 16 }}>
        <StatCard label="Live workflows" value={`${live.length}/${state.workflows.length}`} icon={<Icon name="zap" size={15} />} meta="published" />
        <StatCard label="Ever enrolled" value={num(enrolled)} icon={<Icon name="users" size={15} />} meta="across all flows" />
        <StatCard
          label="Completion"
          value={pct(
            state.workflows.reduce((s, w) => s + w.completed, 0),
            enrolled || 1,
          )}
          icon={<Icon name="check" size={15} />}
          meta="finished the flow"
        />
        <StatCard label="Steps" value={String(state.workflows.reduce((s, w) => s + w.actions.length, 0))} icon={<Icon name="sliders" size={15} />} meta="total actions" />
      </div>

      <div className="grid grid--sidebar">
        <div className="stack">
          {state.workflows.map((w) => (
            <div
              key={w.id}
              className="card"
              style={{
                borderColor: w.id === selectedId ? 'var(--accent)' : undefined,
                boxShadow: w.id === selectedId ? '0 0 0 3px var(--accent-soft)' : undefined,
              }}
            >
              <div className="card__head" style={{ borderBottom: 'none' }}>
                <span
                  className="avatar avatar--md avatar--square"
                  style={{
                    background: w.status === 'published' ? 'var(--green-soft)' : 'var(--surface-3)',
                    color: w.status === 'published' ? 'var(--green)' : 'var(--text-3)',
                  }}
                >
                  <Icon name="zap" size={17} />
                </span>
                <button type="button" className="wf-head" onClick={() => setSelectedId(w.id)}>
                  <span className="row" style={{ gap: 8 }}>
                    <strong style={{ fontSize: 13.5 }}>{w.name}</strong>
                    <StatusBadge status={w.status} />
                  </span>
                  <span className="cell-sub" style={{ display: 'block' }}>
                    Trigger: {w.trigger} · {w.actions.length} steps
                  </span>
                </button>
                <div className="card__actions">
                  <div style={{ textAlign: 'right', marginRight: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 650 }}>{num(w.enrolled)}</div>
                    <div className="cell-sub">enrolled</div>
                  </div>
                  <Switch on={w.status === 'published'} label={`Toggle ${w.name}`} onChange={() => dispatch({ type: 'workflow/toggle', id: w.id })} />
                </div>
              </div>
              <button type="button" className="wf-steps" onClick={() => setSelectedId(w.id)}>
                <span className="row" style={{ gap: 6 }}>
                  {w.actions.slice(0, 6).map((a, i) => (
                    <span key={a.id} className="row" style={{ gap: 6 }}>
                      {i > 0 && <Icon name="chevron-right" size={12} style={{ color: 'var(--text-3)' }} />}
                      <span className="tag" style={{ background: 'var(--surface-3)' }} title={a.label}>
                        <Icon name={ACTION_ICON[a.kind] ?? 'sliders'} size={11} /> {a.kind}
                      </span>
                    </span>
                  ))}
                </span>
              </button>
            </div>
          ))}
        </div>

        <div className="card" style={{ position: 'sticky', top: 0 }}>
          {!selected ? (
            <EmptyState icon={<Icon name="zap" size={20} />} title="Select a workflow" />
          ) : (
            <>
              <div className="card__head">
                <div>
                  <div className="card__title">{selected.name}</div>
                  <div className="card__sub">
                    {num(selected.enrolled)} enrolled · {num(selected.completed)} completed
                  </div>
                </div>
                <div className="card__actions">
                  <Badge tone={selected.status === 'published' ? 'green' : 'default'} dot>
                    {selected.status}
                  </Badge>
                </div>
              </div>
              <div className="card__body">
                <div className="flow">
                  <span className="flow__trigger">
                    <Icon name="zap" size={13} /> {selected.trigger}
                  </span>
                  {selected.actions.map((a) => (
                    <div className="flow__node" key={a.id}>
                      <span className="flow__node-icon">
                        <Icon name={ACTION_ICON[a.kind] ?? 'sliders'} size={13} />
                      </span>
                      <div>
                        <div>{a.label}</div>
                        <div className="flow__node-meta">{a.kind}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flow__node" style={{ borderStyle: 'dashed', color: 'var(--text-3)' }}>
                    <span className="flow__node-icon" style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}>
                      <Icon name="check" size={13} />
                    </span>
                    <div>Goal reached — exit workflow</div>
                  </div>
                </div>
                <div className="divider" style={{ margin: '14px 0' }} />
                <div className="row row--between">
                  <span className="hint">Completion rate</span>
                  <strong style={{ fontSize: 13 }}>{pct(selected.completed, selected.enrolled || 1)}</strong>
                </div>
                <div style={{ height: 7, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden', marginTop: 7 }}>
                  <div style={{ width: pct(selected.completed, selected.enrolled || 1), height: '100%', background: 'var(--green)' }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
