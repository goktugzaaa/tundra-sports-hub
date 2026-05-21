import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { useMutation } from '../../../hooks/useMutation';
import { canAccess } from '../../../rbac';
import { complianceDomain, type ComplianceItem } from '../../../domain';

export interface ComplianceView {
  items: ComplianceItem[];
  athleteName: Record<string, string>;
}

/**
 * Compliance hook — scoped item list plus resolution actions.
 * The status patches come from the compliance domain service; the hook
 * only orchestrates persistence and RBAC gating.
 */
export function useCompliance() {
  const service = useDataService();
  const { user } = useAuth();

  const state = useAsyncData<ComplianceView>(async () => {
    const [items, athletes] = await Promise.all([
      service.compliance.getAll(),
      service.athletes.getAll(),
    ]);
    const athleteName: Record<string, string> = {};
    for (const a of athletes) athleteName[a.id] = a.name;
    return { items, athleteName };
  }, [user]);

  const mutation = useMutation();
  const canResolve = canAccess(user, 'compliance', 'update');

  /** Clear a pending or flagged item to valid. */
  async function resolve(item: ComplianceItem): Promise<boolean> {
    const done = await mutation.run(() =>
      service.compliance.update(item.id, complianceDomain.clearComplianceItem()),
    );
    if (done) state.reload();
    return done;
  }

  /** Renew an expired item with a fresh expiry date. */
  async function renew(item: ComplianceItem, newExpiry: string): Promise<boolean> {
    const done = await mutation.run(() =>
      service.compliance.update(item.id, complianceDomain.renewComplianceItem(newExpiry)),
    );
    if (done) state.reload();
    return done;
  }

  return {
    ...state,
    canResolve,
    resolve,
    renew,
    saving: mutation.pending,
    saveError: mutation.error,
  };
}
