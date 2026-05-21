import { useMemo, useState } from 'react';
import { AsyncBoundary, Modal, Field } from '../../../ui';
import { Ic, StatusTag, type OpTone } from '../../../ui/ops';
import { formatDate, todayISO } from '../../../utils/date';
import { taskRules, tasksDomain, type TaskStatus, type TaskPriority } from '../../../domain';
import { DEMO_USERS } from '../../../auth/users';
import { useAuth } from '../../../auth/AuthContext';
import { useTasks } from '../hooks/useTasks';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

const STATUS_TONE: Record<TaskStatus, OpTone> = {
  open: '',
  in_progress: 'blue',
  done: 'ok',
  blocked: 'alert',
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
};
const PRIORITY_TONE: Record<TaskPriority, OpTone> = {
  low: '',
  medium: 'warn',
  high: 'alert',
};
/** What the Advance button does next, given the current status. */
const ADVANCE_LABEL: Record<TaskStatus, string> = {
  open: 'Start',
  in_progress: 'Complete',
  done: 'Reopen',
  blocked: 'Unblock',
};
const OWNER_LABEL: Record<string, string> = {
  athlete: 'Athlete',
  recruiter: 'Recruiter',
  system: 'System',
};

/** Tasks — operator work queue, urgency-sorted, one-click status advance. */
export function TaskListView() {
  const { data, loading, error, reload, canEdit, canCreate, toggle, togglingId, create, saving, saveError } =
    useTasks();
  const { user } = useAuth();
  const today = todayISO();

  const [showNew, setShowNew] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fAssignee, setFAssignee] = useState(user.id);
  const [fDue, setFDue] = useState('');
  const [fPriority, setFPriority] = useState<TaskPriority>('medium');

  const tasks = data ?? [];
  const summary = useMemo(
    () => ({
      open: tasksDomain.countOpen(tasks),
      overdue: tasksDomain.getOverdueTasks(tasks, today).length,
      high: tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length,
    }),
    [tasks, today],
  );
  const sorted = useMemo(() => tasksDomain.sortByUrgency(tasks), [tasks]);

  async function submitNew() {
    if (!fTitle.trim() || !fDue) return;
    const done = await create({
      title: fTitle.trim(),
      assignedTo: fAssignee,
      dueDate: fDue,
      status: 'open',
      priority: fPriority,
    });
    if (done) {
      setShowNew(false);
      setFTitle('');
      setFDue('');
    }
  }

  return (
    <div className="op-tablepage">
      <div className="op-tp-head">
        <div className="head">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1>Tasks</h1>
            <span className="subtle">{tasks.length} in your queue</span>
          </div>
          <div className="actions">
            <button
              className="op-btn op-btn-primary"
              disabled={!canCreate}
              onClick={() => setShowNew(true)}
            >
              <Ic.plus /> New task
            </button>
          </div>
        </div>

        <div className="op-summary-line">
          <SumItem l="Open" v={String(summary.open)} />
          <Sep />
          <SumItem l="Overdue" v={String(summary.overdue)} tone={summary.overdue ? 'alert' : ''} />
          <Sep />
          <SumItem l="High priority" v={String(summary.high)} tone={summary.high ? 'warn' : ''} />
        </div>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={!loading && !error && tasks.length === 0}
        emptyText="No tasks visible to your role."
      >
        <div className="op-tp-scroll">
          <table className="op-dtable">
            <thead>
              <tr>
                <th>Task</th>
                <th>Owner</th>
                <th>Priority</th>
                <th className="right">Due</th>
                <th>Status</th>
                <th className="right" style={{ width: 120 }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const overdue = taskRules.isOverdueTask(t, today);
                const busy = togglingId === t.id;
                return (
                  <tr key={t.id} className={overdue ? 'alert' : ''}>
                    <td className="strong">{t.title}</td>
                    <td className="dim">{OWNER_LABEL[taskRules.ownerKind(t)]}</td>
                    <td>
                      <StatusTag tone={PRIORITY_TONE[t.priority]} label={t.priority} />
                    </td>
                    <td
                      className="right mono"
                      style={{ color: overdue ? 'var(--alert)' : undefined }}
                    >
                      {formatDate(t.dueDate)}
                      {overdue ? ' · overdue' : ''}
                    </td>
                    <td>
                      <StatusTag tone={STATUS_TONE[t.status]} label={STATUS_LABEL[t.status]} />
                    </td>
                    <td className="right">
                      <button
                        className={
                          'op-btn' +
                          (t.status === 'open' || t.status === 'in_progress'
                            ? ' op-btn-primary'
                            : '')
                        }
                        style={{ height: 24, fontSize: 11.5 }}
                        disabled={!canEdit || busy}
                        onClick={() => toggle(t)}
                      >
                        {busy ? 'Saving…' : ADVANCE_LABEL[t.status]}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>

      <div className="op-tablefoot" style={{ margin: '0 22px' }}>
        <span>
          {tasks.length} task{tasks.length === 1 ? '' : 's'} · sorted by urgency
        </span>
      </div>

      {showNew && (
        <Modal title="New task" onClose={() => setShowNew(false)}>
          <Field label="Title">
            <input
              autoFocus
              value={fTitle}
              placeholder="e.g. Collect medical clearance"
              onChange={(e) => setFTitle(e.target.value)}
            />
          </Field>
          <Field label="Assigned to">
            <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)}>
              {DEMO_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.role}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" value={fDue} onChange={(e) => setFDue(e.target.value)} />
          </Field>
          <Field label="Priority">
            <select value={fPriority} onChange={(e) => setFPriority(e.target.value as TaskPriority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          {saveError && <div className="op-inline-error">{saveError}</div>}
          <button
            className="op-btn op-btn-primary"
            style={{ height: 30, marginTop: 4 }}
            disabled={saving || !fTitle.trim() || !fDue}
            onClick={submitNew}
          >
            {saving ? 'Creating…' : 'Create task'}
          </button>
        </Modal>
      )}
    </div>
  );
}

function SumItem({ l, v, tone = '' }: { l: string; v: string; tone?: string }) {
  return (
    <span className="item">
      <span className="l">{l}</span>
      <span className={'v ' + tone}>{v}</span>
    </span>
  );
}
function Sep() {
  return <span className="sep">·</span>;
}
