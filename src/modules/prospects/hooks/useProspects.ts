import { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { canAccess } from '../../../rbac';
import { prospectsDomain, type Prospect, type ProspectStage } from '../../../domain';

/**
 * Prospect pipeline hook. Exposes the scoped prospect list plus a
 * `moveStage` action. The stage transition itself is decided by the
 * prospect domain service — the hook only orchestrates persistence.
 */
export function useProspects() {
  const service = useDataService();
  const { user } = useAuth();

  const state = useAsyncData<Prospect[]>(() => service.prospects.getAll(), [user]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const canMove = canAccess(user, 'prospect', 'update');

  async function moveStage(prospect: Prospect, newStage: ProspectStage) {
    if (!canMove) return;

    const result = prospectsDomain.moveProspectStage(prospect, newStage);
    if (!result.ok) {
      setMoveError(result.error);
      return;
    }

    setMoveError(null);
    setMovingId(prospect.id);
    try {
      await service.prospects.update(prospect.id, { stage: result.value.stage });
      state.reload();
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : String(e));
    } finally {
      setMovingId(null);
    }
  }

  return { ...state, canMove, moveStage, movingId, moveError };
}
