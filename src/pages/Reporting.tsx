import { Icon } from '../components/Icon';
import { Avatar, Badge, PageHeader, StatCard } from '../components/ui';
import { BarChart, Donut, LineChart } from '../components/Chart';
import { useStore } from '../lib/store';
import { currency, num, pct } from '../lib/format';

export default function Reporting() {
  const { state } = useStore();
  const { invoices, opportunities, contacts, campaigns, team } = state;

  const collected = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const won = opportunities.filter((o) => o.status === 'won');
  const wonValue = won.reduce((s, o) => s + o.value, 0);
  const closed = opportunities.filter((o) => o.status !== 'open');

  const months: Array<{ label: string; key: string; billed: number; collected: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      billed: 0,
      collected: 0,
    });
  }
  invoices.forEach((inv) => {
    const d = new Date(inv.issuedAt);
    const bucket = months.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (!bucket) return;
    bucket.billed += inv.amount;
    if (inv.status === 'paid') bucket.collected += inv.amount;
  });

  const bySource = Object.entries(
    contacts.reduce<Record<string, number>>((acc, c) => {
      acc[c.source] = (acc[c.source] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label: label.split(' ')[0], value }));

  const statusMix = [
    { label: 'Leads', value: contacts.filter((c) => c.status === 'lead').length, color: '#3b82f6' },
    { label: 'Customers', value: contacts.filter((c) => c.status === 'customer').length, color: '#10b981' },
    { label: 'Cold', value: contacts.filter((c) => c.status === 'cold').length, color: '#94a3b8' },
  ];

  const ownerRows = team.map((member) => {
    const deals = opportunities.filter((o) => o.owner === member.name);
    const memberWon = deals.filter((d) => d.status === 'won');
    return {
      member,
      deals: deals.length,
      won: memberWon.length,
      value: deals.reduce((s, d) => s + d.value, 0),
      winRate: deals.length ? memberWon.length / deals.length : 0,
    };
  });

  const sent = campaigns.filter((c) => c.status === 'sent');
  const openRate = sent.length
    ? sent.reduce((s, c) => s + c.opened, 0) / Math.max(sent.reduce((s, c) => s + c.sent, 0), 1)
    : 0;

  return (
    <div className="content">
      <PageHeader
        title="Reporting"
        subtitle="Revenue, pipeline and marketing performance in one place."
        actions={
          <>
            <button className="btn">
              <Icon name="filter" size={15} /> Last 6 months
            </button>
            <button className="btn btn--primary">
              <Icon name="copy" size={15} /> Export
            </button>
          </>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 16 }}>
        <StatCard label="Collected revenue" value={currency(collected)} icon={<Icon name="wallet" size={15} />} trend={{ direction: 'up', value: '12.4%' }} meta="vs. prior period" />
        <StatCard label="Won value" value={currency(wonValue)} icon={<Icon name="check" size={15} />} trend={{ direction: 'up', value: '6.8%' }} meta={`${won.length} deals`} />
        <StatCard label="Win rate" value={pct(won.length, closed.length || 1)} icon={<Icon name="chart" size={15} />} meta={`${closed.length} closed deals`} />
        <StatCard label="Email open rate" value={pct(Math.round(openRate * 100), 100)} icon={<Icon name="mail" size={15} />} meta={`${sent.length} campaigns`} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card__head">
          <div>
            <div className="card__title">Billed vs. collected</div>
            <div className="card__sub">Monthly totals from invoices</div>
          </div>
        </div>
        <div className="card__body">
          <LineChart
            labels={months.map((m) => m.label)}
            series={[
              { name: 'Billed', color: '#4f46e5', values: months.map((m) => m.billed) },
              { name: 'Collected', color: '#10b981', values: months.map((m) => m.collected) },
            ]}
            height={230}
          />
        </div>
      </div>

      <div className="grid grid--3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Leads by source</div>
          </div>
          <div className="card__body">
            <BarChart data={bySource} color="#0ea5e9" valueFormat={(n) => num(n)} height={200} />
          </div>
        </div>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Contact mix</div>
          </div>
          <div className="card__body">
            <Donut segments={statusMix} centerLabel="contacts" centerValue={num(contacts.length)} size={160} />
          </div>
        </div>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Pipeline health</div>
          </div>
          <div className="card__body stack" style={{ gap: 13 }}>
            {state.pipelines[0].stages.map((stage) => {
              const deals = state.opportunities.filter((o) => o.stageId === stage.id);
              const value = deals.reduce((s, d) => s + d.value, 0);
              const max = Math.max(
                ...state.pipelines[0].stages.map((s) =>
                  state.opportunities.filter((o) => o.stageId === s.id).reduce((a, d) => a + d.value, 0),
                ),
                1,
              );
              return (
                <div key={stage.id}>
                  <div className="row row--between" style={{ marginBottom: 4 }}>
                    <span className="hint">{stage.name}</span>
                    <strong style={{ fontSize: 12.5 }}>{currency(value)}</strong>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: stage.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div className="card__title">Team performance</div>
          <div className="card__actions">
            <Badge>{team.length} members</Badge>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th className="cell-right">Deals</th>
                <th className="cell-right">Won</th>
                <th className="cell-right">Pipeline value</th>
                <th style={{ width: 150 }}>Win rate</th>
              </tr>
            </thead>
            <tbody>
              {ownerRows.map((row) => (
                <tr key={row.member.id}>
                  <td>
                    <span className="person">
                      <Avatar name={row.member.name} />
                      <span className="person__text">
                        <span className="person__name">{row.member.name}</span>
                        <span className="person__sub">{row.member.email}</span>
                      </span>
                    </span>
                  </td>
                  <td>
                    <Badge tone={row.member.role === 'admin' ? 'accent' : 'default'}>{row.member.role}</Badge>
                  </td>
                  <td className="cell-right cell-num">{row.deals}</td>
                  <td className="cell-right cell-num">{row.won}</td>
                  <td className="cell-right cell-num">{currency(row.value)}</td>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round(row.winRate * 100)}%`, height: '100%', background: 'var(--green)' }} />
                      </div>
                      <span className="cell-sub" style={{ width: 30, textAlign: 'right' }}>
                        {Math.round(row.winRate * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
