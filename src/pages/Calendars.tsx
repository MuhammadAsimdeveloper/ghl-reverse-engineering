import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { Avatar, Badge, EmptyState, PageHeader, StatusBadge } from '../components/ui';
import { useStore, uid } from '../lib/store';
import { monthMatrix, sameDay, timeOf, toDateTimeInput } from '../lib/format';

export default function Calendars() {
  const { state, dispatch } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [hidden, setHidden] = useState<string[]>([]);
  const [creating, setCreating] = useState<string | null>(null); // ISO date when creating

  const visible = state.appointments.filter(
    (a) => !hidden.includes(a.calendarId) && a.status !== 'cancelled',
  );

  const byDay = useMemo(() => {
    const map = new Map<string, typeof visible>();
    visible.forEach((a) => {
      const d = new Date(a.start);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), a]);
    });
    return map;
  }, [visible]);

  const days = monthMatrix(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const upcoming = [...state.appointments]
    .filter((a) => new Date(a.start).getTime() >= Date.now() - 3_600_000 && a.status !== 'cancelled')
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);

  const calendarOf = (id: string) => state.calendars.find((c) => c.id === id);
  const colorOf = (id: string) => calendarOf(id)?.color ?? '#6366f1';

  const shift = (delta: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  };

  return (
    <div className="content">
      <PageHeader
        title="Calendars"
        subtitle="Bookings across discovery, onboarding and internal meetings."
        actions={
          <button className="btn btn--primary" onClick={() => setCreating(new Date().toISOString())}>
            <Icon name="plus" size={16} /> New appointment
          </button>
        }
      />

      <div className="grid grid--sidebar">
        <div className="stack">
          <div className="card">
            <div className="card__head">
              <div className="row" style={{ gap: 6 }}>
                <button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous month">
                  <Icon name="chevron-left" size={17} />
                </button>
                <button className="icon-btn" onClick={() => shift(1)} aria-label="Next month">
                  <Icon name="chevron-right" size={17} />
                </button>
                <strong style={{ fontSize: 14, marginLeft: 6 }}>{monthLabel}</strong>
              </div>
              <div className="card__actions">
                <button className="btn btn--sm" onClick={() => setCursor(new Date())}>
                  Today
                </button>
              </div>
            </div>

            <div className="calendar" style={{ border: 'none', borderRadius: 0 }}>
              <div className="calendar__dow">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="calendar__grid">
                {days.map((day) => {
                  const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                  const events = (byDay.get(key) ?? []).sort((a, b) => a.start.localeCompare(b.start));
                  const outside = day.getMonth() !== cursor.getMonth();
                  const isToday = sameDay(day, new Date());
                  return (
                    <div
                      key={key}
                      className={`day${outside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}`}
                      onClick={() => setCreating(day.toISOString())}
                    >
                      <span className="day__num">{day.getDate()}</span>
                      {events.slice(0, 3).map((a) => (
                        <span
                          key={a.id}
                          className="event-chip"
                          style={{ background: colorOf(a.calendarId) }}
                          title={`${timeOf(a.start)} ${a.title}`}
                        >
                          {timeOf(a.start)} {a.title}
                        </span>
                      ))}
                      {events.length > 3 && <span className="event-more">+{events.length - 3} more</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card__head">
              <div className="card__title">Calendars</div>
            </div>
            <div>
              {state.calendars.map((cal) => {
                const on = !hidden.includes(cal.id);
                return (
                  <label className="list-row" key={cal.id} style={{ cursor: 'pointer' }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: cal.color }} />
                    <span style={{ fontSize: 13, fontWeight: 550, flex: 1 }}>{cal.name}</span>
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setHidden((prev) =>
                          on ? [...prev, cal.id] : prev.filter((id) => id !== cal.id),
                        )
                      }
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <div className="card__title">Upcoming</div>
              <div className="card__actions">
                <Badge>{upcoming.length}</Badge>
              </div>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState icon={<Icon name="calendar" size={20} />} title="Nothing booked" />
            ) : (
              <div>
                {upcoming.map((a) => {
                  const contact = state.contacts.find((c) => c.id === a.contactId);
                  return (
                    <div className="list-row" key={a.id}>
                      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: colorOf(a.calendarId) }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 550 }}>{a.title}</div>
                        <div className="cell-sub">
                          {new Date(a.start).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                          {timeOf(a.start)}
                        </div>
                        {contact && (
                          <Link
                            to={`/contacts/${contact.id}`}
                            className="row"
                            style={{ gap: 5, marginTop: 4, fontSize: 11.5, color: 'var(--text-3)' }}
                          >
                            <Avatar name={`${contact.firstName} ${contact.lastName}`} size="xs" />
                            {contact.firstName} {contact.lastName}
                          </Link>
                        )}
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {creating && <NewAppointment defaultDate={creating} onClose={() => setCreating(null)} dispatch={dispatch} />}
    </div>
  );
}

function NewAppointment({
  defaultDate,
  onClose,
  dispatch,
}: {
  defaultDate: string;
  onClose: () => void;
  dispatch: ReturnType<typeof useStore>['dispatch'];
}) {
  const { state } = useStore();
  const start = new Date(defaultDate);
  start.setHours(10, 0, 0, 0);

  const [title, setTitle] = useState('Discovery call');
  const [contactId, setContactId] = useState(state.contacts[0]?.id ?? '');
  const [calendarId, setCalendarId] = useState(state.calendars[0]?.id ?? '');
  const [when, setWhen] = useState(toDateTimeInput(start));
  const [duration, setDuration] = useState(30);

  const submit = () => {
    if (!title.trim() || !contactId) return;
    dispatch({
      type: 'appointment/add',
      appointment: {
        id: uid('apt'),
        calendarId,
        contactId,
        title: title.trim(),
        start: new Date(when).toISOString(),
        durationMin: duration,
        status: 'confirmed',
      },
    });
    onClose();
  };

  return (
    <Modal
      title="New appointment"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary" onClick={submit}>
            Book appointment
          </button>
        </>
      }
    >
      <div className="field">
        <label>Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="field">
        <label>Contact</label>
        <select className="select" value={contactId} onChange={(e) => setContactId(e.target.value)}>
          {state.contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName} — {c.company}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid--2">
        <div className="field">
          <label>Calendar</label>
          <select className="select" value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
            {state.calendars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Duration (minutes)</label>
          <select className="select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {[15, 30, 45, 60, 90].map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Starts</label>
        <input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </div>
    </Modal>
  );
}
