import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import {
  paymentRules,
  taskRules,
  complianceRules,
  dealRules,
  type DealStatus,
  type PaymentStatus,
} from '../../../domain';
import { todayISO } from '../../../utils/date';
import { buildActivity, type ActivityItem } from '../activity';
import { buildActionQueue, type ActionItem } from '../actionQueue';

export interface DashboardSummary {
  athleteCount: number;
  activeDeals: number;
  outstandingBalance: number;
  overduePayments: number;
  openTasks: number;
  complianceAlerts: number;
}

export interface PipelineStage {
  stage: DealStatus;
  count: number;
  value: number;
}

export interface PaymentSlice {
  status: PaymentStatus;
  count: number;
  amount: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  pipeline: PipelineStage[];
  payments: PaymentSlice[];
  activity: ActivityItem[];
  actionQueue: ActionItem[];
}

const DEAL_STAGES: DealStatus[] = ['negotiation', 'signed', 'active', 'closed'];
const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'pending', 'overdue'];

/**
 * Dashboard hook — fans out across every module through the single
 * scoped service, then reduces to headline figures, pipeline/payment
 * breakdowns and a recent-activity feed. All RBAC-scoped upstream.
 */
export function useDashboard() {
  const service = useDataService();
  const { user } = useAuth();
  const today = todayISO();

  return useAsyncData<DashboardData>(async () => {
    const [athletes, deals, payments, tasks, compliance, prospects] = await Promise.all([
      service.athletes.getAll(),
      service.deals.getAll(),
      service.payments.getAll(),
      service.tasks.getAll(),
      service.compliance.getAll(),
      service.prospects.getAll(),
    ]);

    const athleteName: Record<string, string> = {};
    for (const a of athletes) athleteName[a.id] = a.name;

    const summary: DashboardSummary = {
      athleteCount: athletes.length,
      activeDeals: deals.filter(dealRules.isRevenueGenerating).length,
      outstandingBalance: paymentRules.outstandingBalance(payments, today),
      overduePayments: payments.filter((p) => paymentRules.isOverdue(p, today)).length,
      openTasks: tasks.filter((t) => taskRules.isOpenTask(t.status)).length,
      complianceAlerts: compliance.filter((c) => complianceRules.needsAttention(c, today))
        .length,
    };

    const pipeline: PipelineStage[] = DEAL_STAGES.map((stage) => {
      const inStage = deals.filter((d) => d.status === stage);
      return {
        stage,
        count: inStage.length,
        value: inStage.reduce((s, d) => s + d.value.amount, 0),
      };
    });

    const paymentSlices: PaymentSlice[] = PAYMENT_STATUSES.map((status) => {
      const inStatus = payments.filter(
        (p) => paymentRules.effectiveStatus(p, today) === status,
      );
      return {
        status,
        count: inStatus.length,
        amount: inStatus.reduce((s, p) => s + p.amount.amount, 0),
      };
    });

    return {
      summary,
      pipeline,
      payments: paymentSlices,
      activity: buildActivity(deals, payments, tasks, compliance, athleteName, today),
      actionQueue: buildActionQueue(payments, tasks, compliance, prospects, athleteName, today),
    };
  }, [user]);
}
