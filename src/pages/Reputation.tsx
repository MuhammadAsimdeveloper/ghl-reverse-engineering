import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Avatar, Badge, EmptyState, PageHeader, StatCard, Switch } from '../components/ui';
import { useStore } from '../lib/store';
import { fullDate, num, relative } from '../lib/format';

const SOURCE_META = {
  google: { label: 'Google', icon: 'google' },
  facebook: { label: 'Facebook', icon: 'facebook' },
  yelp: { label: 'Yelp', icon: 'star' },
} as const;

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'stars__on' : 'stars__off'}>
          <Icon name="star" size={size} />
        </span>
      ))}
    </span>
  );
}

type Filter = 'all' | 'new' | 'replied' | 'flagged';

export default function Reputation() {
  const { state, dispatch } = useStore();
  const { reviews, listings } = state;
  const [filter, setFilter] = useState<Filter>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const replied = reviews.filter((r) => r.status === 'replied').length;
  const pending = reviews.filter((r) => r.status === 'new').length;

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: reviews.filter((r) => r.rating === rating).length,
      })),
    [reviews],
  );
  const maxBucket = Math.max(...distribution.map((d) => d.count), 1);

  const visible = reviews.filter((r) => (filter === 'all' ? true : r.status === filter));

  const contactName = (id: string) => {
    const c = state.contacts.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : 'Unknown contact';
  };

  function submitReply(id: string) {
    const body = draft.trim();
    if (!body) return;
    dispatch({ type: 'review/reply', id, reply: body });
    setReplyingTo(null);
    setDraft('');
  }

  return (
    <div className="content">
      <PageHeader
        title="Reputation"
        subtitle="Collect reviews, reply to feedback and watch your listings."
        actions={
          <>
            <button className="btn">
              <Icon name="link" size={15} /> Review link
            </button>
            <button className="btn btn--primary">
              <Icon name="send" size={15} /> Request reviews
            </button>
          </>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 16 }}>
        <StatCard
          label="Average rating"
          value={avg.toFixed(1)}
          icon={<Icon name="star" size={15} />}
          meta={`${reviews.length} reviews`}
        />
        <StatCard
          label="Awaiting reply"
          value={num(pending)}
          icon={<Icon name="message" size={15} />}
          meta="respond within 24h"
        />
        <StatCard
          label="Response rate"
          value={`${Math.round((replied / Math.max(reviews.length, 1)) * 100)}%`}
          icon={<Icon name="check" size={15} />}
          meta={`${replied} replied`}
        />
        <StatCard
          label="Requests sent"
          value={num(240)}
          icon={<Icon name="send" size={15} />}
          trend={{ direction: 'up', value: '18%' }}
          meta="last 30 days"
        />
      </div>

      <div className="grid grid--3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card__head">
            <div className="card__title">Rating breakdown</div>
          </div>
          <div className="card__body stack" style={{ gap: 10 }}>
            {distribution.map((row) => (
              <div key={row.rating} className="row" style={{ gap: 10 }}>
                <span className="hint" style={{ width: 34 }}>
                  {row.rating} ★
                </span>
                <div className="meter" style={{ flex: 1 }}>
                  <div
                    className="meter__fill"
                    style={{
                      width: `${(row.count / maxBucket) * 100}%`,
                      background: row.rating >= 4 ? 'var(--green)' : row.rating === 3 ? '#f59e0b' : 'var(--red)',
                    }}
                  />
                </div>
                <span className="cell-num" style={{ width: 22, textAlign: 'right' }}>
                  {row.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card__head">
            <div>
              <div className="card__title">Connected listings</div>
              <div className="card__sub">Reviews sync from each source</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Source</th>
                  <th className="cell-right">Rating</th>
                  <th className="cell-right">Reviews</th>
                  <th className="cell-right">Sync</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td>
                      <span className="row" style={{ gap: 6 }}>
                        <Icon name={SOURCE_META[l.source].icon} size={14} />
                        {SOURCE_META[l.source].label}
                      </span>
                    </td>
                    <td className="cell-right cell-num">{l.rating.toFixed(1)}</td>
                    <td className="cell-right cell-num">{l.reviews}</td>
                    <td className="cell-right">
                      <span style={{ display: 'inline-flex' }}>
                        <Switch
                          on={l.connected}
                          label={`Toggle ${l.source} sync`}
                          onChange={() => dispatch({ type: 'listing/toggle', id: l.id })}
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div>
            <div className="card__title">Reviews</div>
            <div className="card__sub">{visible.length} shown</div>
          </div>
          <div className="card__actions">
            <div className="tabs" style={{ margin: 0 }}>
              {(['all', 'new', 'replied', 'flagged'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`tab${filter === f ? ' is-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="card__body">
            <EmptyState
              icon={<Icon name="star" size={22} />}
              title="No reviews here"
              text="Nothing matches this filter yet."
            />
          </div>
        ) : (
          <div className="card__body stack" style={{ gap: 14 }}>
            {visible.map((review) => (
              <div key={review.id} className="review">
                <div className="review__head">
                  <Avatar name={contactName(review.contactId)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <strong style={{ fontSize: 13.5 }}>{contactName(review.contactId)}</strong>
                      <Badge>{SOURCE_META[review.source].label}</Badge>
                      {review.status === 'new' && <Badge tone="amber">New</Badge>}
                      {review.status === 'flagged' && <Badge tone="red">Flagged</Badge>}
                    </div>
                    <div className="row" style={{ gap: 8, marginTop: 3 }}>
                      <Stars rating={review.rating} />
                      <span className="cell-sub" title={fullDate(review.at)}>
                        {relative(review.at)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() =>
                      dispatch({
                        type: 'review/status',
                        id: review.id,
                        status: review.status === 'flagged' ? 'new' : 'flagged',
                      })
                    }
                  >
                    <Icon name={review.status === 'flagged' ? 'refresh' : 'x'} size={14} />
                    {review.status === 'flagged' ? 'Unflag' : 'Flag'}
                  </button>
                </div>

                <p className="review__body">{review.body}</p>

                {review.reply ? (
                  <div className="review__reply">
                    <div className="review__reply-label">
                      <Icon name="message" size={13} /> Your reply
                    </div>
                    <div>{review.reply}</div>
                  </div>
                ) : replyingTo === review.id ? (
                  <div className="stack" style={{ gap: 8 }}>
                    <textarea
                      className="input"
                      rows={3}
                      autoFocus
                      placeholder="Write a public reply…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn btn--primary btn--sm" type="button" onClick={() => submitReply(review.id)}>
                        <Icon name="send" size={13} /> Post reply
                      </button>
                      <button
                        className="btn btn--sm"
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          setDraft('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn btn--sm"
                    type="button"
                    onClick={() => {
                      setReplyingTo(review.id);
                      setDraft('');
                    }}
                  >
                    <Icon name="message" size={13} /> Reply
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
