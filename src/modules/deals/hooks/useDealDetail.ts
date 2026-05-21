import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import type { Deal, Payment, Document } from '../../../domain';

export interface DealDetail {
  deal: Deal;
  athleteName: string;
  payments: Payment[];
  documents: Document[];
}

/**
 * Deal detail hook — aggregates a deal with everything linked to it:
 * its payment schedule and its documents. All RBAC-scoped by the service.
 */
export function useDealDetail(id: string) {
  const service = useDataService();
  const { user } = useAuth();

  return useAsyncData<DealDetail | null>(async () => {
    const [deals, athletes, payments, documents] = await Promise.all([
      service.deals.getAll(),
      service.athletes.getAll(),
      service.payments.getAll(),
      service.documents.getAll(),
    ]);
    const deal = deals.find((d) => d.id === id);
    if (!deal) return null;
    const athlete = athletes.find((a) => a.id === deal.athleteId);
    return {
      deal,
      athleteName: athlete?.name ?? deal.athleteId,
      payments: payments.filter((p) => p.dealId === id),
      documents: documents.filter((d) => d.ownerType === 'deal' && d.ownerId === id),
    };
  }, [user, id]);
}
