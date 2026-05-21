import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { useMutation } from '../../../hooks/useMutation';
import { canAccess } from '../../../rbac';
import { athletesDomain, type Athlete, type Deal } from '../../../domain';
import { todayISO } from '../../../utils/date';

export interface AthleteDetail {
  athlete: Athlete;
  assignedDeals: Deal[];
  totalRevenue: number;
  outstanding: number;
  isActive: boolean;
}

/**
 * Athlete detail hook. Pulls the athlete plus the deals/payments it needs,
 * derives figures through the athlete domain service, and exposes a
 * `save` action for edits.
 */
export function useAthleteDetail(id: string) {
  const service = useDataService();
  const { user } = useAuth();
  const today = todayISO();

  const state = useAsyncData<AthleteDetail>(async () => {
    const [athlete, deals, payments] = await Promise.all([
      service.athletes.getById(id),
      service.deals.getAll(),
      service.payments.getAll(),
    ]);
    return {
      athlete,
      assignedDeals: athletesDomain.getAssignedDeals(deals, id),
      totalRevenue: athletesDomain.getTotalRevenue(payments, id),
      outstanding: athletesDomain.getOutstandingForAthlete(payments, id, today),
      isActive: athletesDomain.getActiveStatus(athlete),
    };
  }, [user, id]);

  const mutation = useMutation();

  async function save(patch: Partial<Athlete>): Promise<boolean> {
    const done = await mutation.run(() => service.athletes.update(id, patch));
    if (done) state.reload();
    return done;
  }

  return {
    ...state,
    canEdit: canAccess(user, 'athlete', 'update'),
    save,
    saving: mutation.pending,
    saveError: mutation.error,
    clearSaveError: mutation.clearError,
  };
}
