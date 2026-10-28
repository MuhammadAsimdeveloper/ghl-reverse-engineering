import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Badge, EmptyState, PageHeader, StatCard, StatusBadge } from '../components/ui';
import { BarChart } from '../components/Chart';
import { useStore } from '../lib/store';
import { num, pct, shortDate } from '../lib/format';

export default function Campaigns() {
  const { state } = useStore();
  const [kind, setKind] = useState<'all' | 'email' | 'sms'>('all');
  const [query, setQuery] = useState('');

  const rows = state.campaigns.filter((c) => {
    if (kind !== 'all' && c.kind !== kind) return false;
    return c.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  const sent = state.campaigns.filter((c) => c.status === 'sent');
  const totalSent = sent.reduce((s, c) => s + c.sent, 0);
  const totalOpened = sent.reduce((s, c) => s + c.opened, 0);
  const totalClicked = sent.reduce((s, c) => s + c.clicked, 0);

  const performance = sent.map((c) => ({
    label: c.name.split(' ')[0],
    value: c.clicked,
  }));

  return (
    <div className="content">
      <PageHeader
        title="Campaigns"
        subtitle="Email and SMS broadcasts with delivery and engagement metrics."
        actions={
          <button className="btn btn--primary">
            <Icon name="plus" size={16} /> New campaign
          </button>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 16 }}>
        <StatCard label="Messages sent" value={num(totalSent)} icon={<Icon name="send" size={15} />} meta={`${sent.length} campaigns`} />
        <StatCard label="Open rate" value={pct(totalOpened, totalSent)} icon={<Icon name="eye" size={15} />} meta={`${num(totalOpened)} opens`} />
        <StatCard label="Click rate" value={pct(totalClicked, totalSent)} icon={<Icon name="link" size={15} />} meta={`${num(totalClicked)} clicks`} />
        <StatCard label="Audience" value={num(state.contacts.length)} icon={<Icon name="users" size={15} />} meta="contacts reachable" />
      </div>

      <div className="grid grid--sidebar" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Clicks by campaign</div>
            <div className="card__actions">
              <Badge>Sent campaigns</Badge>
            </div>
          </div>
          <div className="card__body">
            {performance.length ? (
              <BarChart data={performance} color="#4f46e5" valueFormat={(n) => num(n)} />
            ) : (
              <EmptyState icon={<Icon name="chart" size={20} />} title="No campaign data yet" />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Delivery funnel</div>
          </div>
          <div className="card__body stack" style={{ gap: 14 }}>
            {[
              { label: 'Delivered', value: totalSent, color: 'var(--blue)' },
              { label: 'Opened', value: totalOpened, color: 'var(--violet)' },
              { label: 'Clicked', value: totalClicked, color: 'var(--green)' },
            ].map((row) => (
              <div key={row.label}>
                <div className="row row--between" style={{ marginBottom: 5 }}>
                  <span className="hint">{row.label}</span>
                  <strong style={{ fontSize: 13 }}>{num(row.value)}</strong>
                </div>
                <div style={{ height: 7, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${totalSent ? Math.max((row.value / totalSent) * 100, 2) : 0}%`,
                      height: '100%',
                      background: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="hint">Rates are computed from all sent campaigns in this workspace.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__head" style={{ gap: 8, flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 220px', maxWidth: 300 }}>
            <Icon name="search" size={15} />
            <input className="input" placeholder="Search campaigns" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="segmented">
            {(['all', 'email', 'sms'] as const).map((k) => (
              <button key={k} className={kind === k ? 'is-active' : ''} onClick={() => setKind(k)} style={{ textTransform: 'capitalize' }}>
                {k === 'all' ? 'All' : k}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<Icon name="megaphone" size={20} />} title="No campaigns match" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th className="cell-right">Sent</th>
                  <th className="cell-right">Opened</th>
                  <th className="cell-right">Clicked</th>
                  <th style={{ width: 130 }}>CTR</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-main">{c.name}</td>
                    <td>
                      <Badge tone={c.kind === 'email' ? 'blue' : 'violet'}>{c.kind.toUpperCase()}</Badge>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="cell-sub">{shortDate(c.scheduledAt)}</td>
                    <td className="cell-right cell-num">{num(c.sent)}</td>
                    <td className="cell-right cell-num">{num(c.opened)}</td>
                    <td className="cell-right cell-num">{num(c.clicked)}</td>
                    <td>
                      <div className="row" style={{ gap: 7 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: pct(c.clicked, c.sent || 1),
                              height: '100%',
                              background: 'var(--green)',
                            }}
                          />
                        </div>
                        <span className="cell-sub" style={{ width: 30, textAlign: 'right' }}>
                          {pct(c.clicked, c.sent || 1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
