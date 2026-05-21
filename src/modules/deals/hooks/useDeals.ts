import { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { useMutation } from '../../../hooks/useMutation';
import { canAccess } from '../../../rbac';
import type { Deal, DealStatus } from '../../../domain';

export interface DealsView {
  deals: Deal[];
  /** athleteId -> display name, for joining without leaking the athlete module. */
  athleteName: Record<string, string>;
}

/** Deal list hook — joins athlete names, exposes create + status change. */
export function useDeals() {
  const service = useDataService();
  const { user } = useAuth();

  const state = useAsyncData<DealsView>(async () => {
    const [deals, athletes] = await Promise.all([
      service.deals.getAll(),
      service.athletes.getAll(),
    ]);
    const athleteName: Record<string, string> = {};
    for (const a of athletes) athleteName[a.id] = a.name;
    return { deals, athleteName };
  }, [user]);

  const mutation = useMutation();
  const [movingId, setMovingId] = useState<string | null>(null);

  async function create(data: Omit<Deal, 'id'>): Promise<boolean> {
    const done = await mutation.run(() => service.deals.create(data));
    if (done) state.reload();
    return done;
  }

  /** Move a deal to a new lifecycle status. */
  async function changeStatus(deal: Deal, status: DealStatus): Promise<void> {
    setMovingId(deal.id);
    const done = await mutation.run(() => service.deals.update(deal.id, { status }));
    if (done) state.reload();
    setMovingId(null);
  }

  return {
    ...state,
    canCreate: canAccess(user, 'deal', 'create'),
    canEdit: canAccess(user, 'deal', 'update'),
    create,
    changeStatus,
    movingId,
    saving: mutation.pending,
    saveError: mutation.error,
    clearSaveError: mutation.clearError,
  };
}
