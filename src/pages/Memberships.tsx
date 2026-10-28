import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Avatar, Badge, EmptyState, PageHeader, StatCard, Switch } from '../components/ui';
import { useStore } from '../lib/store';
import { currency, num, shortDate } from '../lib/format';

type Filter = 'all' | 'published' | 'draft';

export default function Memberships() {
  const { state, dispatch } = useStore();
  const { courses, enrollments } = state;
  const [filter, setFilter] = useState<Filter>('all');

  const totalEnrollments = courses.reduce((s, c) => s + c.enrollments, 0);
  const revenue = courses.reduce((s, c) => {
    const seats = c.kind === 'community' ? c.enrollments * 12 : c.enrollments;
    return s + seats * c.price;
  }, 0);
  const completion = enrollments.length
    ? enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length
    : 0;

  const visible = courses.filter((c) =>
    filter === 'all' ? true : filter === 'published' ? c.published : !c.published,
  );

  const contactName = (id: string) => {
    const c = state.contacts.find((x) => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : 'Unknown contact';
  };

  return (
    <div className="content">
      <PageHeader
        title="Memberships"
        subtitle="Courses, communities and the people learning inside them."
        actions={
          <>
            <button className="btn">
              <Icon name="users" size={15} /> Members
            </button>
            <button className="btn btn--primary">
              <Icon name="plus" size={15} /> New offer
            </button>
          </>
        }
      />

      <div className="grid grid--4" style={{ marginBottom: 16 }}>
        <StatCard
          label="Active members"
          value={num(totalEnrollments)}
          icon={<Icon name="users" size={15} />}
          trend={{ direction: 'up', value: '9.2%' }}
          meta="vs. last month"
        />
        <StatCard
          label="Offers live"
          value={`${courses.filter((c) => c.published).length}/${courses.length}`}
          icon={<Icon name="book" size={15} />}
          meta="published"
        />
        <StatCard
          label="Avg. completion"
          value={`${Math.round(completion)}%`}
          icon={<Icon name="chart" size={15} />}
          meta="across enrollments"
        />
        <StatCard
          label="Course revenue"
          value={currency(revenue)}
          icon={<Icon name="dollar" size={15} />}
          meta="lifetime"
        />
      </div>

      <div className="row row--between" style={{ marginBottom: 12 }}>
        <div className="tabs" style={{ margin: 0 }}>
          {(['all', 'published', 'draft'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`tab${filter === f ? ' is-active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All offers' : f === 'published' ? 'Published' : 'Drafts'}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Icon name="book" size={22} />}
          title="No offers in this view"
          text="Publish an offer or switch the filter."
        />
      ) : (
        <div className="grid grid--3" style={{ marginBottom: 16 }}>
          {visible.map((course) => {
            const seats = enrollments.filter((e) => e.courseId === course.id);
            const avgProgress = seats.length
              ? Math.round(seats.reduce((s, e) => s + e.progress, 0) / seats.length)
              : 0;
            return (
              <div key={course.id} className="card course">
                <div className="course__cover">
                  <Icon name={course.kind === 'community' ? 'users' : 'book'} size={26} />
                </div>
                <div className="course__body">
                  <div className="row row--between" style={{ gap: 8 }}>
                    <strong style={{ fontSize: 13.5 }}>{course.title}</strong>
                    <Badge tone={course.kind === 'community' ? 'violet' : 'blue'}>
                      {course.kind === 'community' ? 'Community' : 'Course'}
                    </Badge>
                  </div>
                  <div className="cell-sub" style={{ marginTop: 2 }}>
                    {course.kind === 'community'
                      ? 'Monthly membership'
                      : `${course.lessons} lessons`}
                    {' · '}
                    {currency(course.price)}
                    {course.kind === 'community' ? '/mo' : ''}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div className="row row--between" style={{ marginBottom: 4 }}>
                      <span className="hint">Avg. progress</span>
                      <span className="cell-sub">{avgProgress}%</span>
                    </div>
                    <div className="meter">
                      <div className="meter__fill" style={{ width: `${avgProgress}%` }} />
                    </div>
                  </div>

                  <div className="row row--between" style={{ marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 650 }}>{num(course.enrollments)}</div>
                      <div className="cell-sub">enrolled</div>
                    </div>
                    <span className="row" style={{ gap: 8 }}>
                      <Switch
                        on={course.published}
                        label={`Publish ${course.title}`}
                        onChange={() => dispatch({ type: 'course/toggle', id: course.id })}
                      />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="card__head">
          <div>
            <div className="card__title">Recent enrollments</div>
            <div className="card__sub">{enrollments.length} active seats</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Offer</th>
                <th>Started</th>
                <th style={{ width: 200 }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((en) => {
                const course = courses.find((c) => c.id === en.courseId);
                return (
                  <tr key={en.id}>
                    <td>
                      <span className="person">
                        <Avatar name={contactName(en.contactId)} />
                        <span className="person__text">
                          <span className="person__name">{contactName(en.contactId)}</span>
                          <span className="person__sub">
                            {state.contacts.find((c) => c.id === en.contactId)?.email ?? ''}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td>{course?.title ?? '—'}</td>
                    <td className="cell-sub">{shortDate(en.startedAt)}</td>
                    <td>
                      <div className="row" style={{ gap: 8 }}>
                        <div className="meter" style={{ flex: 1 }}>
                          <div
                            className="meter__fill"
                            style={{
                              width: `${en.progress}%`,
                              background: en.progress === 100 ? 'var(--green)' : undefined,
                            }}
                          />
                        </div>
                        <span className="cell-sub" style={{ width: 34, textAlign: 'right' }}>
                          {en.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
