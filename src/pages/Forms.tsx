import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Badge, PageHeader, StatCard, StatusBadge, Switch } from '../components/ui';
import { useStore, uid } from '../lib/store';
import { num, pct } from '../lib/format';
import type { FormDef, FormField, FormFieldType, FormKind } from '../lib/types';

const TABS: Array<{ value: 'all' | FormKind; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'form', label: 'Forms' },
  { value: 'survey', label: 'Surveys' },
];

const FIELD_TYPES: Array<{ value: FormFieldType; label: string; icon: string }> = [
  { value: 'text', label: 'Short text', icon: 'file' },
  { value: 'email', label: 'Email', icon: 'mail' },
  { value: 'phone', label: 'Phone', icon: 'phone' },
  { value: 'textarea', label: 'Long text', icon: 'file' },
  { value: 'select', label: 'Dropdown', icon: 'sliders' },
  { value: 'consent', label: 'Consent checkbox', icon: 'check' },
];

function labelFor(type: FormFieldType): string {
  return FIELD_TYPES.find((t) => t.value === type)?.label ?? type;
}

function iconFor(type: FormFieldType): string {
  return FIELD_TYPES.find((t) => t.value === type)?.icon ?? 'file';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function parseOptions(value: string): string[] {
  return value
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}

export default function Forms() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<'all' | FormKind>('all');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const rows = state.forms.filter((f) => tab === 'all' || f.kind === tab);
  const submissions = state.forms.reduce((s, f) => s + f.submissions, 0);
  const published = state.forms.filter((f) => f.published).length;
  const editing = state.forms.find((f) => f.id === editingId) ?? null;
  const embedForm = state.forms[0];

  return (
    <div className="content">
      <PageHeader
        title="Forms & Surveys"
        subtitle="Capture leads with forms and collect feedback with surveys."
        actions={
          <button className="btn btn--primary" onClick={() => setCreating(true)}>
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
                <th style={{ width: 52 }} />
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
                  <td className="cell-sub">{f.fields.length} fields</td>
                  <td className="cell-right cell-num">{num(f.submissions)}</td>
                  <td>
                    <StatusBadge status={f.published ? 'published' : 'draft'} />
                  </td>
                  <td>
                    <Switch on={f.published} label={`Toggle ${f.name}`} onChange={() => dispatch({ type: 'form/toggle', id: f.id })} />
                  </td>
                  <td className="cell-right">
                    <button className="icon-btn" aria-label={`Edit ${f.name}`} onClick={() => setEditingId(f.id)}>
                      <Icon name="edit" size={15} />
                    </button>
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
                        {num(best.submissions)} submissions · {best.fields.length} fields
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
              &lt;iframe src=&quot;https://forms.agency.test/embed/{slugify(embedForm?.name ?? 'contact-us')}&quot; /&gt;
            </div>
            <span className="hint">
              Paste this into any site builder to capture leads into this workspace. The slug follows the first
              form in the list.
            </span>
          </div>
        </div>
      </div>

      {creating && (
        <NewFormModal
          defaultKind={tab === 'survey' ? 'survey' : 'form'}
          onClose={() => setCreating(false)}
          onCreate={(name, kind) => {
            const id = uid('fm');
            dispatch({
              type: 'form/add',
              form: {
                id,
                name,
                kind,
                published: false,
                submissions: 0,
                fields: [
                  { id: uid('ff'), label: 'Full name', type: 'text', required: true, options: [] },
                  { id: uid('ff'), label: 'Email', type: 'email', required: true, options: [] },
                ],
              },
            });
            setCreating(false);
            setEditingId(id);
          }}
        />
      )}

      {editing && <FormEditor form={editing} onClose={() => setEditingId(null)} />}
    </div>
  );
}

function NewFormModal({
  defaultKind,
  onClose,
  onCreate,
}: {
  defaultKind: FormKind;
  onClose: () => void;
  onCreate: (name: string, kind: FormKind) => void;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<FormKind>(defaultKind);

  return (
    <Modal
      title="New form"
      onClose={onClose}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            type="button"
            disabled={name.trim().length < 2}
            onClick={() => onCreate(name.trim(), kind)}
          >
            Create form
          </button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="new-form-name">Name</label>
        <input
          id="new-form-name"
          className="input"
          autoFocus
          placeholder="Discovery call request"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label>Type</label>
        <div className="segmented">
          {(['form', 'survey'] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={kind === value ? 'is-active' : ''}
              onClick={() => setKind(value)}
              style={{ textTransform: 'capitalize' }}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 6 }}>
          New {kind === 'survey' ? 'surveys' : 'forms'} start unpublished with name and email fields you can edit
          right away.
        </div>
      </div>
    </Modal>
  );
}

function FormEditor({ form, onClose }: { form: FormDef; onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState(form.name);
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FormFieldType>('text');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState('');

  const choices = parseOptions(options);
  const canSaveField =
    label.trim().length > 1 && (type !== 'select' || choices.length >= 2);
  const canRename = name.trim().length > 1 && name.trim() !== form.name;

  const resetFieldForm = () => {
    setFieldId(null);
    setLabel('');
    setType('text');
    setRequired(false);
    setOptions('');
  };

  const startEdit = (field: FormField) => {
    setFieldId(field.id);
    setLabel(field.label);
    setType(field.type);
    setRequired(field.required);
    setOptions(field.options.join(', '));
  };

  const saveField = () => {
    if (!canSaveField) return;
    const patch = {
      label: label.trim(),
      type,
      required,
      options: type === 'select' ? choices : [],
    };
    if (fieldId) {
      dispatch({ type: 'form/field/update', formId: form.id, id: fieldId, patch });
    } else {
      dispatch({
        type: 'form/field/add',
        formId: form.id,
        field: { id: uid('ff'), ...patch },
      });
    }
    resetFieldForm();
  };

  return (
    <Modal
      title={`Edit ${form.kind === 'survey' ? 'survey' : 'form'}`}
      wide
      onClose={onClose}
      footer={
        <button className="btn" type="button" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="grid grid--2" style={{ alignItems: 'start' }}>
        <div>
          <div className="field">
            <label htmlFor="form-name">Form name</label>
            <div className="row" style={{ gap: 8 }}>
              <input
                id="form-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button
                className="btn btn--sm"
                type="button"
                disabled={!canRename}
                onClick={() => dispatch({ type: 'form/update', id: form.id, patch: { name: name.trim() } })}
              >
                Rename
              </button>
            </div>
          </div>

          <div className="row row--between" style={{ marginTop: 16, marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Fields</strong>
            <span className="cell-sub">{form.fields.length} total</span>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            {form.fields.length === 0 && (
              <div className="hint">No fields yet. Add the first one below — the preview updates as you go.</div>
            )}
            {form.fields.map((field, index) => (
              <div className="field-row" key={field.id}>
                <span className="avatar avatar--sm avatar--square" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                  <Icon name={iconFor(field.type)} size={13} />
                </span>
                <div className="field-row__body">
                  <div className="field-row__label">{field.label || 'Untitled field'}</div>
                  <div className="field-row__meta">
                    <Badge tone="blue">{labelFor(field.type)}</Badge>
                    {field.required && <Badge tone="amber">Required</Badge>}
                    {field.type === 'select' && field.options.length > 0 && (
                      <span className="cell-sub">{field.options.join(' · ')}</span>
                    )}
                  </div>
                </div>
                <div className="field-row__tools">
                  <button
                    className="icon-btn"
                    aria-label={`Move ${field.label} up`}
                    disabled={index === 0}
                    onClick={() =>
                      dispatch({ type: 'form/field/move', formId: form.id, id: field.id, direction: 'up' })
                    }
                  >
                    <Icon name="chevron-up" size={13} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`Move ${field.label} down`}
                    disabled={index === form.fields.length - 1}
                    onClick={() =>
                      dispatch({ type: 'form/field/move', formId: form.id, id: field.id, direction: 'down' })
                    }
                  >
                    <Icon name="chevron-down" size={13} />
                  </button>
                  <button className="icon-btn" aria-label={`Edit ${field.label}`} onClick={() => startEdit(field)}>
                    <Icon name="edit" size={13} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`Delete ${field.label}`}
                    onClick={() => dispatch({ type: 'form/field/delete', formId: form.id, id: field.id })}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="builder-box" style={{ marginTop: 12 }}>
            <div className="row row--between">
              <strong style={{ fontSize: 13 }}>{fieldId ? 'Edit field' : 'Add a field'}</strong>
              {fieldId && (
                <button className="btn btn--sm" type="button" onClick={resetFieldForm}>
                  Cancel edit
                </button>
              )}
            </div>
            <div className="grid grid--2" style={{ marginTop: 10 }}>
              <div className="field">
                <label htmlFor="field-label">Label</label>
                <input
                  id="field-label"
                  className="input"
                  placeholder="Company size"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="field-type">Type</label>
                <select
                  id="field-type"
                  className="select"
                  value={type}
                  onChange={(e) => setType(e.target.value as FormFieldType)}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {type === 'select' && (
              <div className="field" style={{ marginTop: 10 }}>
                <label htmlFor="field-options">Choices (comma separated, two or more)</label>
                <input
                  id="field-options"
                  className="input"
                  placeholder="1–10, 11–50, 51+"
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                />
                {choices.length < 2 && <div className="hint">Add at least two choices to save this dropdown.</div>}
              </div>
            )}
            <div className="row row--between" style={{ marginTop: 10 }}>
              <div className="row" style={{ gap: 8 }}>
                <Switch on={required} label="Field required" onChange={() => setRequired((v) => !v)} />
                <span className="hint">Required</span>
              </div>
              <button className="btn btn--sm btn--primary" type="button" disabled={!canSaveField} onClick={saveField}>
                {fieldId ? 'Save field' : 'Add field'}
              </button>
            </div>
          </div>
        </div>

        <div className="builder-box">
          <div className="row row--between" style={{ marginBottom: 10 }}>
            <strong style={{ fontSize: 13 }}>Live preview</strong>
            <Badge tone={form.published ? 'green' : 'default'} dot>
              {form.published ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <div className="form-preview">
            <div className="form-preview__title">{name.trim() || form.name}</div>
            {form.fields.length === 0 && <div className="hint">Add a field to see it here.</div>}
            {form.fields.map((field) => (
              <div className="form-preview__field" key={field.id}>
                {field.type === 'consent' ? (
                  <label className="checkbox">
                    <input type="checkbox" disabled />
                    <span>
                      {field.label}
                      {field.required && <span className="form-preview__req">*</span>}
                    </span>
                  </label>
                ) : (
                  <>
                    <label>
                      {field.label}
                      {field.required && <span className="form-preview__req">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea className="input" rows={3} disabled placeholder="Type your answer…" />
                    ) : field.type === 'select' ? (
                      <select className="select" disabled defaultValue="">
                        <option value="" disabled>
                          Select…
                        </option>
                        {field.options.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="input"
                        disabled
                        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                        placeholder={field.type === 'email' ? 'name@example.com' : field.type === 'phone' ? '+1 555 000 0000' : 'Type your answer…'}
                      />
                    )}
                  </>
                )}
              </div>
            ))}
            <button className="btn btn--primary btn--sm" type="button" disabled>
              Submit
            </button>
          </div>
          <div className="hint" style={{ marginTop: 8 }}>
            Preview only — submissions are simulated and stored locally.
          </div>
        </div>
      </div>
    </Modal>
  );
}
