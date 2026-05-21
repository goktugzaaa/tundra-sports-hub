import type { Deal, Payment, Task, ComplianceItem } from '../../domain';
import { paymentRules, complianceRules } from '../../domain';
import { formatMoney } from '../../utils/format';

/**
 * Recent-activity view-model. With no real activity log, the feed is
 * synthesised from entity dates across modules — a module-layer concern,
 * not domain logic. Everything passed in is already RBAC-scoped.
 *
 * Each item carries a `link` so the dashboard can drill into the exact
 * record in its module (with that row focused).
 */
export interface ActivityItem {
  id: string;
  date: string;
  text: string;
  detail: string;
  tone: 'blue' | 'green' | 'amber' | 'red' | 'gray';
  /** Route + focus param into the owning module. */
  link: string;
}

export function buildActivity(
  deals: Deal[],
  payments: Payment[],
  tasks: Task[],
  compliance: ComplianceItem[],
  athleteName: Record<string, string>,
  today: string,
  limit = 8,
): ActivityItem[] {
  const items: ActivityItem[] = [];
  const who = (id: string) => athleteName[id] ?? id;

  for (const d of deals) {
    items.push({
      id: `deal-${d.id}`,
      date: d.startDate,
      text: `NIL deal ${d.status}`,
      detail: `${who(d.athleteId)} · ${formatMoney(d.value)}`,
      tone: d.status === 'closed' ? 'gray' : d.status === 'negotiation' ? 'blue' : 'green',
      link: `/deals?focus=${d.id}`,
    });
  }

  for (const p of payments) {
    const eff = paymentRules.effectiveStatus(p, today);
    items.push({
      id: `pay-${p.id}`,
      date: p.dueDate,
      text:
        eff === 'paid' ? 'Payment settled' : eff === 'overdue' ? 'Payment overdue' : 'Payment due',
      detail: `${who(p.athleteId)} · ${formatMoney(p.amount)}`,
      tone: eff === 'paid' ? 'green' : eff === 'overdue' ? 'red' : 'blue',
      link: `/payments?focus=${p.id}`,
    });
  }

  for (const t of tasks) {
    items.push({
      id: `task-${t.id}`,
      date: t.dueDate,
      text: `Task ${t.status.replace('_', ' ')}`,
      detail: t.title,
      tone: t.status === 'done' ? 'green' : t.status === 'blocked' ? 'red' : 'blue',
      link: `/tasks?focus=${t.id}`,
    });
  }

  for (const c of compliance) {
    if (!complianceRules.needsAttention(c, today)) continue;
    const eff = complianceRules.effectiveComplianceStatus(c, today);
    items.push({
      id: `comp-${c.id}`,
      date: c.expiryDate,
      text: `Compliance ${eff}`,
      detail: `${c.type} · ${who(c.athleteId)}`,
      tone: eff === 'expired' || eff === 'flagged' ? 'red' : 'amber',
      link: `/compliance?focus=${c.id}`,
    });
  }

  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
