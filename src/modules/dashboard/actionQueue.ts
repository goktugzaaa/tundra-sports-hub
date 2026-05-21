import type { Payment, Task, ComplianceItem, Prospect } from '../../domain';
import { paymentRules, taskRules, complianceRules } from '../../domain';
import { formatMoney } from '../../utils/format';

/**
 * Action queue view-model — "what needs you", not "what is the state".
 * Synthesised from cross-module data; each item links into the record so
 * the user can act. Module-layer concern, RBAC-scoped upstream.
 */
export interface ActionItem {
  id: string;
  label: string;
  detail: string;
  link: string;
  tone: 'red' | 'amber' | 'blue';
}

const RANK: Record<ActionItem['tone'], number> = { red: 0, amber: 1, blue: 2 };

export function buildActionQueue(
  payments: Payment[],
  tasks: Task[],
  compliance: ComplianceItem[],
  prospects: Prospect[],
  athleteName: Record<string, string>,
  today: string,
  limit = 7,
): ActionItem[] {
  const items: ActionItem[] = [];
  const who = (id: string) => athleteName[id] ?? id;

  for (const p of payments) {
    if (paymentRules.effectiveStatus(p, today) !== 'overdue') continue;
    items.push({
      id: `pay-${p.id}`,
      label: 'Chase overdue payment',
      detail: `${who(p.athleteId)} · ${formatMoney(p.amount)}`,
      link: `/payments?focus=${p.id}`,
      tone: 'red',
    });
  }

  for (const c of compliance) {
    if (!complianceRules.needsAttention(c, today)) continue;
    const eff = complianceRules.effectiveComplianceStatus(c, today);
    items.push({
      id: `comp-${c.id}`,
      label: eff === 'expired' ? 'Renew expired compliance' : 'Resolve compliance item',
      detail: `${c.type} · ${who(c.athleteId)}`,
      link: `/compliance?focus=${c.id}`,
      tone: eff === 'expired' || eff === 'flagged' ? 'red' : 'amber',
    });
  }

  for (const t of tasks) {
    if (!taskRules.isOverdueTask(t, today)) continue;
    items.push({
      id: `task-${t.id}`,
      label: 'Overdue task',
      detail: t.title,
      link: `/tasks?focus=${t.id}`,
      tone: 'amber',
    });
  }

  for (const p of prospects) {
    if (p.stage !== 'signed' || p.convertedAthleteId) continue;
    items.push({
      id: `pros-${p.id}`,
      label: 'Convert signed prospect',
      detail: p.name,
      link: `/prospects?focus=${p.id}`,
      tone: 'blue',
    });
  }

  return items.sort((a, b) => RANK[a.tone] - RANK[b.tone]).slice(0, limit);
}
