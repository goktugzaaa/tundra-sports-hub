import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { useMutation } from '../../../hooks/useMutation';
import { canAccess } from '../../../rbac';
import type { Payment } from '../../../domain';

export interface PaymentsView {
  payments: Payment[];
  athleteName: Record<string, string>;
}

/** Payment list hook — joins athlete names, exposes create + mark-paid. */
export function usePayments() {
  const service = useDataService();
  const { user } = useAuth();

  const state = useAsyncData<PaymentsView>(async () => {
    const [payments, athletes] = await Promise.all([
      service.payments.getAll(),
      service.athletes.getAll(),
    ]);
    const athleteName: Record<string, string> = {};
    for (const a of athletes) athleteName[a.id] = a.name;
    return { payments, athleteName };
  }, [user]);

  const mutation = useMutation();

  async function create(data: Omit<Payment, 'id'>): Promise<boolean> {
    const done = await mutation.run(() => service.payments.create(data));
    if (done) state.reload();
    return done;
  }

  async function markPaid(id: string): Promise<boolean> {
    const done = await mutation.run(() => service.payments.update(id, { status: 'paid' }));
    if (done) state.reload();
    return done;
  }

  return {
    ...state,
    canCreate: canAccess(user, 'payment', 'create'),
    canUpdate: canAccess(user, 'payment', 'update'),
    create,
    markPaid,
    saving: mutation.pending,
    saveError: mutation.error,
    clearSaveError: mutation.clearError,
  };
}
