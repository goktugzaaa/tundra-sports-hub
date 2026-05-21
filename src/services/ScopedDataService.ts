import type {
  Athlete,
  Prospect,
  Deal,
  Payment,
  Task,
  ComplianceItem,
  Document,
  ID,
} from '../domain';
import type { DataProvider } from './DataProvider';
import type { User } from '../auth/types';
import { canAccess, type AccessContext } from '../rbac';

/**
 * SERVICE LAYER — RBAC-aware data access.
 *
 * Wraps a raw `DataProvider` and applies role-based scoping so that every
 * collection a module receives is already filtered to what the current
 * user may see. UI/module code calls THIS, never the raw provider.
 *
 * This is where "filtering happens in the service layer, not the UI"
 * (non-negotiable rule) is enforced. Write methods re-check permission
 * as defense in depth.
 */
export class ScopedDataService {
  constructor(
    private readonly provider: DataProvider,
    private readonly user: User,
  ) {}

  // ── Athletes ────────────────────────────────────────────────────
  athletes = {
    getAll: async (): Promise<Athlete[]> => {
      const all = await this.provider.athletes.getAll();
      return all.filter((a) => canAccess(this.user, 'athlete', 'read', athleteCtx(a)));
    },

    getById: async (id: ID): Promise<Athlete> => {
      const athlete = await this.provider.athletes.getById(id);
      if (!canAccess(this.user, 'athlete', 'read', athleteCtx(athlete))) {
        throw new Error('Access denied: you cannot view this athlete.');
      }
      return athlete;
    },

    create: async (data: Omit<Athlete, 'id'>): Promise<Athlete> => {
      if (
        !canAccess(this.user, 'athlete', 'create', { recruiterId: data.recruiterId })
      ) {
        throw new Error('Access denied: you cannot create athletes.');
      }
      return this.provider.athletes.create(data);
    },

    update: async (id: ID, data: Partial<Athlete>): Promise<Athlete> => {
      const current = await this.provider.athletes.getById(id);
      if (!canAccess(this.user, 'athlete', 'update', athleteCtx(current))) {
        throw new Error('Access denied: you cannot edit this athlete.');
      }
      return this.provider.athletes.update(id, data);
    },
  };

  // ── Prospects ───────────────────────────────────────────────────
  prospects = {
    getAll: async (): Promise<Prospect[]> => {
      const all = await this.provider.prospects.getAll();
      return all.filter((p) =>
        canAccess(this.user, 'prospect', 'read', { recruiterId: p.assignedRecruiter }),
      );
    },

    update: async (id: ID, data: Partial<Prospect>): Promise<Prospect> => {
      const all = await this.provider.prospects.getAll();
      const current = all.find((p) => p.id === id);
      if (
        !current ||
        !canAccess(this.user, 'prospect', 'update', {
          recruiterId: current.assignedRecruiter,
        })
      ) {
        throw new Error('Access denied: you cannot edit this prospect.');
      }
      return this.provider.prospects.update(id, data);
    },
  };

  // ── Deals ───────────────────────────────────────────────────────
  deals = {
    getAll: async (): Promise<Deal[]> => {
      const [deals, athletes] = await Promise.all([
        this.provider.deals.getAll(),
        this.provider.athletes.getAll(),
      ]);
      const byId = indexBy(athletes);
      return deals.filter((d) =>
        canAccess(this.user, 'deal', 'read', linkedAthleteCtx(d.athleteId, byId)),
      );
    },

    create: async (data: Omit<Deal, 'id'>): Promise<Deal> => {
      const athletes = await this.provider.athletes.getAll();
      const ctx = linkedAthleteCtx(data.athleteId, indexBy(athletes));
      if (!canAccess(this.user, 'deal', 'create', ctx)) {
        throw new Error('Access denied: you cannot create this deal.');
      }
      return this.provider.deals.create(data);
    },

    update: async (id: ID, data: Partial<Deal>): Promise<Deal> => {
      const [deals, athletes] = await Promise.all([
        this.provider.deals.getAll(),
        this.provider.athletes.getAll(),
      ]);
      const current = deals.find((d) => d.id === id);
      if (
        !current ||
        !canAccess(
          this.user,
          'deal',
          'update',
          linkedAthleteCtx(current.athleteId, indexBy(athletes)),
        )
      ) {
        throw new Error('Access denied: you cannot edit this deal.');
      }
      return this.provider.deals.update(id, data);
    },
  };

  // ── Payments ────────────────────────────────────────────────────
  payments = {
    getAll: async (): Promise<Payment[]> => {
      const [payments, athletes] = await Promise.all([
        this.provider.payments.getAll(),
        this.provider.athletes.getAll(),
      ]);
      const byId = indexBy(athletes);
      return payments.filter((p) =>
        canAccess(this.user, 'payment', 'read', linkedAthleteCtx(p.athleteId, byId)),
      );
    },

    create: async (data: Omit<Payment, 'id'>): Promise<Payment> => {
      const athletes = await this.provider.athletes.getAll();
      const ctx = linkedAthleteCtx(data.athleteId, indexBy(athletes));
      if (!canAccess(this.user, 'payment', 'create', ctx)) {
        throw new Error('Access denied: you cannot record this payment.');
      }
      return this.provider.payments.create(data);
    },

    update: async (id: ID, data: Partial<Payment>): Promise<Payment> => {
      const [payments, athletes] = await Promise.all([
        this.provider.payments.getAll(),
        this.provider.athletes.getAll(),
      ]);
      const current = payments.find((p) => p.id === id);
      if (
        !current ||
        !canAccess(
          this.user,
          'payment',
          'update',
          linkedAthleteCtx(current.athleteId, indexBy(athletes)),
        )
      ) {
        throw new Error('Access denied: you cannot edit this payment.');
      }
      return this.provider.payments.update(id, data);
    },
  };

  // ── Tasks ───────────────────────────────────────────────────────
  tasks = {
    getAll: async (): Promise<Task[]> => {
      const [tasks, athletes] = await Promise.all([
        this.provider.tasks.getAll(),
        this.provider.athletes.getAll(),
      ]);
      const byId = indexBy(athletes);
      return tasks.filter((t) => this.canSeeTask(t, byId));
    },

    create: async (data: Omit<Task, 'id'>): Promise<Task> => {
      const athletes = await this.provider.athletes.getAll();
      const ctx = data.athleteId
        ? linkedAthleteCtx(data.athleteId, indexBy(athletes))
        : undefined;
      if (!canAccess(this.user, 'task', 'create', ctx)) {
        throw new Error('Access denied: you cannot create this task.');
      }
      return this.provider.tasks.create(data);
    },

    update: async (id: ID, data: Partial<Task>): Promise<Task> => {
      if (!canAccess(this.user, 'task', 'update')) {
        throw new Error('Access denied: you cannot edit tasks.');
      }
      const [tasks, athletes] = await Promise.all([
        this.provider.tasks.getAll(),
        this.provider.athletes.getAll(),
      ]);
      const target = tasks.find((t) => t.id === id);
      if (!target || !this.canSeeTask(target, indexBy(athletes))) {
        throw new Error('Access denied: you cannot edit this task.');
      }
      return this.provider.tasks.update(id, data);
    },
  };

  // ── Compliance ──────────────────────────────────────────────────
  compliance = {
    getAll: async (): Promise<ComplianceItem[]> => {
      const [items, athletes] = await Promise.all([
        this.provider.compliance.getAll(),
        this.provider.athletes.getAll(),
      ]);
      const byId = indexBy(athletes);
      return items.filter((c) =>
        canAccess(this.user, 'compliance', 'read', linkedAthleteCtx(c.athleteId, byId)),
      );
    },

    update: async (id: ID, data: Partial<ComplianceItem>): Promise<ComplianceItem> => {
      const [items, athletes] = await Promise.all([
        this.provider.compliance.getAll(),
        this.provider.athletes.getAll(),
      ]);
      const current = items.find((c) => c.id === id);
      if (
        !current ||
        !canAccess(
          this.user,
          'compliance',
          'update',
          linkedAthleteCtx(current.athleteId, indexBy(athletes)),
        )
      ) {
        throw new Error('Access denied: you cannot update this compliance item.');
      }
      return this.provider.compliance.update(id, data);
    },
  };

  // ── Documents ───────────────────────────────────────────────────
  documents = {
    getAll: async (): Promise<Document[]> => {
      const [docs, athletes, deals, prospects] = await Promise.all([
        this.provider.documents.getAll(),
        this.provider.athletes.getAll(),
        this.provider.deals.getAll(),
        this.provider.prospects.getAll(),
      ]);
      const byAthlete = indexBy(athletes);
      const dealById = indexBy(deals);
      const prospectById = indexBy(prospects);
      return docs.filter((doc) => {
        const ctx = documentCtx(doc, byAthlete, dealById, prospectById);
        return canAccess(this.user, 'document', 'read', ctx);
      });
    },

    create: async (doc: Document): Promise<Document> => {
      const [athletes, deals, prospects] = await Promise.all([
        this.provider.athletes.getAll(),
        this.provider.deals.getAll(),
        this.provider.prospects.getAll(),
      ]);
      const ctx = documentCtx(
        doc,
        indexBy(athletes),
        indexBy(deals),
        indexBy(prospects),
      );
      if (!canAccess(this.user, 'document', 'create', ctx)) {
        throw new Error('Access denied: you cannot upload this document.');
      }
      return this.provider.documents.create(doc);
    },
  };

  /** Task visibility: linked to a visible athlete, or assigned to the user. */
  private canSeeTask(task: Task, athletesById: Map<ID, Athlete>): boolean {
    if (!canAccess(this.user, 'task', 'read')) return false;
    if (this.user.role === 'ADMIN') return true;
    if (task.assignedTo === this.user.id) return true;
    if (task.athleteId) {
      return canAccess(
        this.user,
        'task',
        'read',
        linkedAthleteCtx(task.athleteId, athletesById),
      );
    }
    return false;
  }
}

// ── Context builders ───────────────────────────────────────────────

function athleteCtx(a: Athlete): AccessContext {
  return { recruiterId: a.recruiterId, athleteId: a.id };
}

function linkedAthleteCtx(athleteId: ID, athletesById: Map<ID, Athlete>): AccessContext {
  const a = athletesById.get(athleteId);
  return { recruiterId: a?.recruiterId, athleteId };
}

function documentCtx(
  doc: Document,
  athletesById: Map<ID, Athlete>,
  dealById: Map<ID, Deal>,
  prospectById: Map<ID, Prospect>,
): AccessContext {
  if (doc.ownerType === 'athlete') {
    return linkedAthleteCtx(doc.ownerId, athletesById);
  }
  if (doc.ownerType === 'deal') {
    const deal = dealById.get(doc.ownerId);
    return deal ? linkedAthleteCtx(deal.athleteId, athletesById) : {};
  }
  // prospect-owned
  const prospect = prospectById.get(doc.ownerId);
  return prospect ? { recruiterId: prospect.assignedRecruiter } : {};
}

function indexBy<T extends { id: ID }>(rows: T[]): Map<ID, T> {
  return new Map(rows.map((r) => [r.id, r]));
}
