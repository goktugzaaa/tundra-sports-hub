import { useMemo, useState } from 'react';
import {
  PageHeader,
  AsyncBoundary,
  StatCard,
  TableSkeleton,
  StatusBadge,
  Modal,
  Field,
} from '../../../ui';
import { focusScroll, useFocusParam } from '../../../hooks/useFocusParam';
import { formatDate, todayISO } from '../../../utils/date';
import { taskRules, tasksDomain, type Task, type TaskPriority } from '../../../domain';
import { DEMO_USERS } from '../../../auth/users';
import { useAuth } from '../../../auth/AuthContext';
import { useTasks } from '../hooks/useTasks';

const OWNER_LABEL: Record<string, string> = {
  athlete: 'Athlete',
  recruiter: 'Recruiter',
  system: 'System',
};

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

/**
 * Tasks workflow module — urgency-sorted table with priority indicators,
 * due-date highlighting, quick status toggle and task creation.
 */
export function TaskListView() {
  const { data, loading, error, reload, canEdit, canCreate, toggle, togglingId, create, saving, saveError } =
    useTasks();
  const { user } = useAuth();
  const today = todayISO();
  const focus = useFocusParam();

  const [showNew, setShowNew] = useState(false);
  const [fTitle, setFTitle] = useState('');
  const [fAssignee, setFAssignee] = useState(user.id);
  const [fDue, setFDue] = useState('');
  const [fPriority, setFPriority] = useState<TaskPriority>('medium');

  const summary = useMemo(() => {
    const tasks = data ?? [];
    return {
      open: tasksDomain.countOpen(tasks),
      overdue: tasksDomain.getOverdueTasks(tasks, today).length,
      high: tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length,
    };
  }, [data, today]);

  const sorted = useMemo(() => tasksDomain.sortByUrgency(data ?? []), [data]);

  async function submitNew() {
    if (!fTitle.trim() || !fDue) return;
    const payload: Omit<Task, 'id'> = {
      title: fTitle.trim(),
      assignedTo: fAssignee,
      dueDate: fDue,
      status: 'open',
      priority: fPriority,
    };
    const done = await create(payload);
    if (done) {
      setShowNew(false);
      setFTitle('');
      setFDue('');
    }
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Operational workflow — your tasks and tasks for athletes you manage."
        actions={
          <button
            className="btn btn-primary"
            disabled={!canCreate}
            onClick={() => setShowNew(true)}
          >
            + New Task
          </button>
        }
      />

      <AsyncBoundary
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<TableSkeleton rows={6} cols={5} />}
        isEmpty={!!data && data.length === 0}
        emptyText="No tasks visible to your role."
      >
        {data && (
          <>
            <div className="grid grid-3">
              <StatCard label="Open Tasks" value={summary.open} />
              <StatCard label="Overdue" value={summary.overdue} />
              <StatCard label="High Priority" value={summary.high} />
            </div>

            <div className="section-title">Task Queue</div>
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Owner</th>
                    <th>Priority</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => {
                    const overdue = taskRules.isOverdueTask(t, today);
                    return (
                      <tr
                        key={t.id}
                        ref={t.id === focus ? focusScroll : undefined}
                        className={
                          [overdue && 'row-overdue', t.id === focus && 'row-focus']
                            .filter(Boolean)
                            .join(' ') || undefined
                        }
                      >
                        <td>
                          <span className={`priority-dot dot-${t.priority}`} />
                          {t.title}
                        </td>
                        <td className="muted">{OWNER_LABEL[taskRules.ownerKind(t)]}</td>
                        <td>
                          <StatusBadge kind="priority" value={t.priority} />
                        </td>
                        <td className={overdue ? 'amount-overdue' : undefined}>
                          {formatDate(t.dueDate)}
                          {overdue && ' · overdue'}
                        </td>
                        <td>
                          <StatusBadge kind="task" value={t.status} />
                        </td>
                        <td>
                          <button
                            className="btn"
                            disabled={!canEdit || togglingId === t.id}
                            onClick={() => toggle(t)}
                          >
                            {togglingId === t.id ? 'Saving…' : 'Advance'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AsyncBoundary>

      {showNew && (
        <Modal title="New Task" onClose={() => setShowNew(false)}>
          <Field label="Title">
            <input
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
            <select
              value={fPriority}
              onChange={(e) => setFPriority(e.target.value as TaskPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          {saveError && <div className="inline-error">{saveError}</div>}
          <button
            className="btn btn-primary"
            disabled={saving || !fTitle.trim() || !fDue}
            onClick={submitNew}
          >
            {saving ? 'Creating…' : 'Create Task'}
          </button>
        </Modal>
      )}
    </div>
  );
}
