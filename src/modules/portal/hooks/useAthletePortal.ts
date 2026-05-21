import { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { canAccess } from '../../../rbac';
import {
  athletesDomain,
  taskRules,
  complianceRules,
  type Athlete,
  type Deal,
  type Payment,
  type Task,
  type ComplianceItem,
} from '../../../domain';
import { todayISO } from '../../../utils/date';

export interface AthletePortalData {
  athlete: Athlete;
  totalRevenue: number;
  outstanding: number;
  deals: Deal[];
  payments: Payment[];
  compliance: ComplianceItem[];
  tasks: Task[];
  openTasks: number;
  complianceAlerts: number;
}

/**
 * Athlete portal hook — assembles the signed-in athlete's personal view
 * and lets them advance their own tasks. RBAC-scoped by the service layer.
 */
export function useAthletePortal() {
  const service = useDataService();
  const { user } = useAuth();
  const today = todayISO();

  const state = useAsyncData<AthletePortalData | null>(async () => {
    if (!user.athleteId) return null;
    const [athlete, deals, payments, compliance, tasks] = await Promise.all([
      service.athletes.getById(user.athleteId),
      service.deals.getAll(),
      service.payments.getAll(),
      service.compliance.getAll(),
      service.tasks.getAll(),
    ]);
    return {
      athlete,
      totalRevenue: athletesDomain.getTotalRevenue(payments, user.athleteId),
      outstanding: athletesDomain.getOutstandingForAthlete(payments, user.athleteId, today),
      deals,
      payments,
      compliance,
      tasks,
      openTasks: tasks.filter((t) => taskRules.isOpenTask(t.status)).length,
      complianceAlerts: compliance.filter((c) => complianceRules.needsAttention(c, today))
        .length,
    };
  }, [user]);

  const canActTask = canAccess(user, 'task', 'update');
  const [busyTask, setBusyTask] = useState<string | null>(null);

  /** Advance one of the athlete's own tasks through the status cycle. */
  async function toggleTask(task: Task): Promise<void> {
    if (!canActTask) return;
    setBusyTask(task.id);
    try {
      await service.tasks.update(task.id, {
        status: taskRules.toggleStatus(task.status),
      });
      state.reload();
    } finally {
      setBusyTask(null);
    }
  }

  return { ...state, canActTask, toggleTask, busyTask };
}
