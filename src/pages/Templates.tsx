import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Badge, EmptyState, PageHeader } from '../components/ui';
import { useStore } from '../lib/store';
import { num, relative } from '../lib/format';
import type { EmailTemplate } from '../lib/types';

export default function Templates() {
  const { state, dispatch } = useStore();
  const { templates } = state;
  const [category, setCategory] = useState('All');
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(templates.map((t) => t.category)))],
    [templates],
  );
  const visible = templates.filter((t) => category === 'All' || t.category === category);

  async function applyTemplate(t: EmailTemplate) {
    try {
      await navigator.clipboard.writeText(t.subject);
    } catch {
      /* clipboard unavailable — the increment still records the use */
    }
    dispatch({ type: 'template/use', id: t.id });
    setCopied(t.id);
    window.setTimeout(() => setCopied((cur) => (cur === t.id ? null : cur)), 1600);
  }

  return (
    <div className="content">
      <PageHeader
        title="Email Templates"
        subtitle="Reusable copy for campaigns, workflows and one-off sends."
        actions={
          <>
            <button className="btn">
              <Icon name="folder" size={15} /> Categories
            </button>
            <button className="btn btn--primary">
              <Icon name="plus" size={15} /> New template
            </button>
          </>
        }
      />

      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip${category === c ? ' is-active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Icon name="mail" size={22} />} title="No templates" text="Try another category." />
      ) : (
        <div className="grid grid--3">
          {visible.map((t) => (
            <div key={t.id} className="card template">
              <div className="card__head">
                <div style={{ minWidth: 0 }}>
                  <div className="card__title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </div>
                  <div className="card__sub">{t.category}</div>
                </div>
                <div className="card__actions">
                  <Badge>{num(t.uses)} uses</Badge>
                </div>
              </div>
              <div className="card__body stack" style={{ gap: 10 }}>
                <div className="template__subject">{t.subject}</div>
                <div className="cell-sub">Updated {relative(t.updatedAt)}</div>
                <div className="row" style={{ gap: 8, marginTop: 2 }}>
                  <button type="button" className="btn btn--sm btn--primary" onClick={() => applyTemplate(t)}>
                    <Icon name={copied === t.id ? 'check' : 'copy'} size={13} />
                    {copied === t.id ? 'Copied' : 'Copy subject'}
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => setPreview(t)}>
                    <Icon name="eye" size={13} /> Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <Modal
          title={preview.name}
          onClose={() => setPreview(null)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => setPreview(null)}>
                Close
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => {
                  applyTemplate(preview);
                  setPreview(null);
                }}
              >
                <Icon name="copy" size={14} /> Copy subject
              </button>
            </>
          }
        >
          <div className="field">
            <label>Subject</label>
            <div className="template__subject">{preview.subject}</div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Body</label>
            <div className="template__preview">
              <p>Hi {'{{contact.first_name}}'},</p>
              <p>
                Thanks for your time today. I have put together the next steps we discussed, including the
                timeline and the deliverables for the first sprint.
              </p>
              <p>
                If everything looks right, reply with a thumbs up and we will get started on Monday.
              </p>
              <p>
                — Asim
                <br />
                Asim Growth Agency
              </p>
            </div>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <Badge tone="blue">{preview.category}</Badge>
            <Badge>{num(preview.uses)} uses</Badge>
            <Badge>Updated {relative(preview.updatedAt)}</Badge>
          </div>
        </Modal>
      )}
    </div>
  );
}
