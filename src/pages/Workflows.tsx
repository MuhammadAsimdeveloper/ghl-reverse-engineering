import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Badge, EmptyState, PageHeader, StatCard, StatusBadge, Switch } from '../components/ui';
import { num, pct } from '../lib/format';
import { uid, useStore } from '../lib/store';
import type { Workflow, WorkflowAction } from '../lib/types';

const ACTION_ICON: Record<WorkflowAction['kind'], string> = {
  sms: 'message',
  email: 'mail',
  wait: 'wait',
  tag: 'tag',
  task: 'task',
  webhook: 'webhook',
  condition: 'condition',
};

const KINDS: Array<{ value: WorkflowAction['kind']; label: string; defaultLabel: string }> = [
  { value: 'email', label: 'Send email', defaultLabel: 'Send email' },
  { value: 'sms', label: 'Send SMS', defaultLabel: 'Send SMS' },
  { value: 'wait', label: 'Wait', defaultLabel: 'Wait step' },
  { value: 'tag', label: 'Apply tag', defaultLabel: 'Apply tag' },
  { value: 'task', label: 'Create task', defaultLabel: 'Create follow-up task' },
  { value: 'webhook', label: 'Webhook', defaultLabel: 'POST to endpoint' },
  { value: 'condition', label: 'If / else', defaultLabel: 'If condition met' },
];

const TRIGGERS = [
  'Form submitted',
  'Appointment booked',
  'Invoice overdue',
  'Payment received',
  'Tag added',
  'Manual enrollment',
];

function delayText(hours?: number): string {
  if (!hours) return 'No delay set';
  if (hours % 24 === 0) {
    const days = hours / 24;
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

export default function Workflows() {
  const { state, dispatch } = useStore();
  const [selectedId, setSelectedId] = useState(state.workflows[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [editingDetails, setEditingDetails] = useState<Workflow | null>(null);
  const [stepDraft, setStepDraft] = useState<{ workflowId: string; step?: WorkflowAction } | null>(null);

  const selected = state.workflows.find((w) => w.id === selectedId) ?? null;
  const live = state.workflows.filter((w) => w.status === 'published');
  const enrolled = state.workflows.reduce((s, w) => s + w.enrolled, 0);

  return (
    <div className="content">
      <PageHeader
        title="Workflows"
        subtitle="Automations that run on triggers, waits and conditions."
        actions={
          <button className="btn btn--primary" onClick={() => setCreating(true)}>
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
                {w.actions.length === 0 ? (
                  <span className="cell-sub">No steps yet — open the flow to add one</span>
                ) : (
                  <span className="row" style={{ gap: 6 }}>
                    {w.actions.slice(0, 6).map((a, i) => (
                      <span key={a.id} className="row" style={{ gap: 6 }}>
                        {i > 0 && <Icon name="chevron-right" size={12} style={{ color: 'var(--text-3)' }} />}
                        <span className="tag" style={{ background: 'var(--surface-3)' }} title={a.label}>
                          <Icon name={ACTION_ICON[a.kind]} size={11} /> {a.kind}
                        </span>
                      </span>
                    ))}
                  </span>
                )}
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
                <div style={{ minWidth: 0 }}>
                  <div className="card__title">{selected.name}</div>
                  <div className="card__sub">
                    {num(selected.enrolled)} enrolled · {num(selected.completed)} completed
                  </div>
                </div>
                <div className="card__actions">
                  <Badge tone={selected.status === 'published' ? 'green' : 'default'} dot>
                    {selected.status}
                  </Badge>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Edit ${selected.name} details`}
                    onClick={() => setEditingDetails(selected)}
                  >
                    <Icon name="edit" size={15} />
                  </button>
                </div>
              </div>
              <div className="card__body">
                <div className="flow">
                  <span className="flow__trigger">
                    <Icon name="zap" size={13} /> {selected.trigger}
                  </span>
                  {selected.actions.map((a, i) => (
                    <div className="flow__node flow__node--edit" key={a.id}>
                      <span className="flow__node-icon">
                        <Icon name={ACTION_ICON[a.kind]} size={13} />
                      </span>
                      <button
                        type="button"
                        className="flow__node-main"
                        onClick={() => setStepDraft({ workflowId: selected.id, step: a })}
                      >
                        <span>{a.label}</span>
                        <span className="flow__node-meta">
                          {a.kind === 'wait' ? `${a.kind} · ${delayText(a.delayHours)}` : a.kind}
                        </span>
                      </button>
                      <div className="flow__node-tools">
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Move ${a.label} up`}
                          disabled={i === 0}
                          onClick={() =>
                            dispatch({ type: 'workflow/step/move', workflowId: selected.id, id: a.id, direction: 'up' })
                          }
                        >
                          <Icon name="chevron-up" size={13} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Move ${a.label} down`}
                          disabled={i === selected.actions.length - 1}
                          onClick={() =>
                            dispatch({ type: 'workflow/step/move', workflowId: selected.id, id: a.id, direction: 'down' })
                          }
                        >
                          <Icon name="chevron-down" size={13} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Edit ${a.label}`}
                          onClick={() => setStepDraft({ workflowId: selected.id, step: a })}
                        >
                          <Icon name="edit" size={13} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={`Remove ${a.label}`}
                          onClick={() =>
                            dispatch({ type: 'workflow/step/delete', workflowId: selected.id, id: a.id })
                          }
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="flow__add"
                    onClick={() => setStepDraft({ workflowId: selected.id })}
                  >
                    <Icon name="plus" size={14} /> Add step
                  </button>
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

      {creating && (
        <WorkflowDetails
          onClose={() => setCreating(false)}
          onSave={(name, trigger) => {
            const id = uid('wf');
            dispatch({
              type: 'workflow/add',
              workflow: { id, name, status: 'draft', trigger, actions: [], enrolled: 0, completed: 0 },
            });
            setSelectedId(id);
            setCreating(false);
          }}
        />
      )}

      {editingDetails && (
        <WorkflowDetails
          workflow={editingDetails}
          onClose={() => setEditingDetails(null)}
          onSave={(name, trigger) => {
            dispatch({ type: 'workflow/update', id: editingDetails.id, patch: { name, trigger } });
            setEditingDetails(null);
          }}
        />
      )}

      {stepDraft && (
        <StepModal
          step={stepDraft.step}
          onClose={() => setStepDraft(null)}
          onSave={(step) => {
            if (stepDraft.step) {
              dispatch({ type: 'workflow/step/update', workflowId: stepDraft.workflowId, id: stepDraft.step.id, patch: step });
            } else {
              dispatch({ type: 'workflow/step/add', workflowId: stepDraft.workflowId, step: { ...step, id: uid('wa') } });
            }
            setStepDraft(null);
          }}
        />
      )}
    </div>
  );
}

function WorkflowDetails({
  workflow,
  onClose,
  onSave,
}: {
  workflow?: Workflow;
  onClose: () => void;
  onSave: (name: string, trigger: string) => void;
}) {
  const [name, setName] = useState(workflow?.name ?? '');
  const [trigger, setTrigger] = useState(workflow?.trigger ?? TRIGGERS[0]);

  const canSave = name.trim().length > 1;

  return (
    <Modal
      title={workflow ? 'Workflow details' : 'New workflow'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            type="button"
            disabled={!canSave}
            onClick={() => onSave(name.trim(), trigger)}
          >
            {workflow ? 'Save changes' : 'Create workflow'}
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="workflow-name">Name</label>
        <input
          id="workflow-name"
          className="input"
          autoFocus
          placeholder="New client onboarding"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="workflow-trigger">Trigger</label>
        <select
          id="workflow-trigger"
          className="select"
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
        >
          {TRIGGERS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="hint" style={{ marginTop: 6 }}>
          {workflow
            ? 'Changing the trigger does not affect contacts already enrolled.'
            : 'New workflows start as drafts. Add steps, then publish when the flow looks right.'}
        </div>
      </div>
    </Modal>
  );
}

function StepModal({
  step,
  onClose,
  onSave,
}: {
  step?: WorkflowAction;
  onClose: () => void;
  onSave: (step: Omit<WorkflowAction, 'id'>) => void;
}) {
  const [kind, setKind] = useState<WorkflowAction['kind']>(step?.kind ?? 'email');
  const [label, setLabel] = useState(step?.label ?? KINDS[0].defaultLabel);
  const [delay, setDelay] = useState(String(step?.delayHours ?? 24));

  const hours = Number(delay);
  const canSave =
    label.trim().length > 1 && (kind !== 'wait' || (Number.isFinite(hours) && hours > 0));

  const changeKind = (next: WorkflowAction['kind']) => {
    const previousDefault = KINDS.find((k) => k.value === kind)?.defaultLabel ?? '';
    setKind(next);
    if (!label.trim() || label === previousDefault) {
      setLabel(KINDS.find((k) => k.value === next)?.defaultLabel ?? '');
    }
  };

  return (
    <Modal
      title={step ? 'Edit step' : 'Add step'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            type="button"
            disabled={!canSave}
            onClick={() =>
              onSave({
                kind,
                label: label.trim(),
                delayHours: kind === 'wait' ? Math.round(hours) : undefined,
              })
            }
          >
            {step ? 'Save step' : 'Add step'}
          </button>
        </>
      }
    >
      <div className="grid grid--2">
        <div className="field">
          <label htmlFor="step-kind">Step type</label>
          <select
            id="step-kind"
            className="select"
            value={kind}
            onChange={(e) => changeKind(e.target.value as WorkflowAction['kind'])}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="step-label">Label</label>
          <input
            id="step-label"
            className="input"
            placeholder="What does this step do?"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
      </div>

      {kind === 'wait' && (
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="step-delay">Wait before the next step (hours)</label>
          <input
            id="step-delay"
            className="input"
            type="number"
            min="1"
            step="1"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
          />
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            {[1, 24, 72, 168].map((preset) => (
              <button
                key={preset}
                type="button"
                className={`btn btn--sm${Number(delay) === preset ? ' btn--primary' : ''}`}
                onClick={() => setDelay(String(preset))}
              >
                {delayText(preset)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="hint" style={{ marginTop: 12 }}>
        {kind === 'wait'
          ? 'Waits pause the contact between the steps above and below. Hours convert into days automatically in the flow.'
          : 'Steps run in order. Use the arrows in the flow to move this step, or the pencil to come back and edit it.'}
      </div>
    </Modal>
  );
}
