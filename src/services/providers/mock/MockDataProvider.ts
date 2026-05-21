import type { DataProvider } from '../../DataProvider';
import type {
  Athlete,
  Prospect,
  Deal,
  Payment,
  Task,
  ComplianceItem,
  Document,
  ID,
} from '../../../domain';
import { snapshot } from './seed';

export interface MockProviderOptions {
  /** Min/max simulated network latency, ms. */
  minLatencyMs?: number;
  maxLatencyMs?: number;
  /** Probability [0..1] a read fails, to exercise error UI. Default 0. */
  errorRate?: number;
}

/**
 * In-memory DataProvider. Simulates a real backend:
 *  - 300-800ms latency per call
 *  - optional random failures (errorRate)
 *  - mutations persist for the session (held in memory)
 *
 * Default, zero-config data source. Replaceable by any other DataProvider
 * implementation without touching code above the service layer.
 */
export class MockDataProvider implements DataProvider {
  private db = snapshot();
  private readonly minLatency: number;
  private readonly maxLatency: number;
  private readonly errorRate: number;

  constructor(opts: MockProviderOptions = {}) {
    this.minLatency = opts.minLatencyMs ?? 300;
    this.maxLatency = opts.maxLatencyMs ?? 800;
    this.errorRate = opts.errorRate ?? 0;
  }

  /** Resolves after simulated latency, or rejects to simulate a backend error. */
  private async simulate(label: string): Promise<void> {
    const delay =
      this.minLatency + Math.random() * (this.maxLatency - this.minLatency);
    await new Promise((r) => setTimeout(r, delay));
    if (Math.random() < this.errorRate) {
      throw new Error(`Mock backend error while loading "${label}". Please retry.`);
    }
  }

  athletes = {
    getAll: async (): Promise<Athlete[]> => {
      await this.simulate('athletes');
      return clone(this.db.athletes);
    },
    getById: async (id: ID): Promise<Athlete> => {
      await this.simulate('athlete');
      const found = this.db.athletes.find((a) => a.id === id);
      if (!found) throw new Error(`Athlete "${id}" not found.`);
      return clone(found);
    },
    create: async (data: Omit<Athlete, 'id'>): Promise<Athlete> => {
      await this.simulate('athlete create');
      const athlete: Athlete = { ...data, id: genId('ath') };
      this.db.athletes.push(clone(athlete));
      return clone(athlete);
    },
    update: async (id: ID, data: Partial<Athlete>): Promise<Athlete> => {
      await this.simulate('athlete update');
      const idx = this.db.athletes.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error(`Athlete "${id}" not found.`);
      this.db.athletes[idx] = { ...this.db.athletes[idx], ...data, id };
      return clone(this.db.athletes[idx]);
    },
  };

  prospects = {
    getAll: async () => {
      await this.simulate('prospects');
      return clone(this.db.prospects);
    },
    update: async (id: ID, data: Partial<Prospect>): Promise<Prospect> => {
      await this.simulate('prospect update');
      const idx = this.db.prospects.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Prospect "${id}" not found.`);
      this.db.prospects[idx] = { ...this.db.prospects[idx], ...data, id };
      return clone(this.db.prospects[idx]);
    },
  };

  deals = {
    getAll: async () => {
      await this.simulate('deals');
      return clone(this.db.deals);
    },
    create: async (data: Omit<Deal, 'id'>): Promise<Deal> => {
      await this.simulate('deal create');
      const deal: Deal = { ...data, id: genId('d') };
      this.db.deals.push(clone(deal));
      return clone(deal);
    },
    update: async (id: ID, data: Partial<Deal>): Promise<Deal> => {
      await this.simulate('deal update');
      const idx = this.db.deals.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error(`Deal "${id}" not found.`);
      this.db.deals[idx] = { ...this.db.deals[idx], ...data, id };
      return clone(this.db.deals[idx]);
    },
  };

  payments = {
    getAll: async () => {
      await this.simulate('payments');
      return clone(this.db.payments);
    },
    create: async (data: Omit<Payment, 'id'>): Promise<Payment> => {
      await this.simulate('payment create');
      const payment: Payment = { ...data, id: genId('p') };
      this.db.payments.push(clone(payment));
      return clone(payment);
    },
    update: async (id: ID, data: Partial<Payment>): Promise<Payment> => {
      await this.simulate('payment update');
      const idx = this.db.payments.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error(`Payment "${id}" not found.`);
      this.db.payments[idx] = { ...this.db.payments[idx], ...data, id };
      return clone(this.db.payments[idx]);
    },
  };

  tasks = {
    getAll: async () => {
      await this.simulate('tasks');
      return clone(this.db.tasks);
    },
    create: async (data: Omit<Task, 'id'>): Promise<Task> => {
      await this.simulate('task create');
      const task: Task = { ...data, id: genId('t') };
      this.db.tasks.push(clone(task));
      return clone(task);
    },
    update: async (id: ID, data: Partial<Task>): Promise<Task> => {
      await this.simulate('task update');
      const idx = this.db.tasks.findIndex((t) => t.id === id);
      if (idx === -1) throw new Error(`Task "${id}" not found.`);
      this.db.tasks[idx] = { ...this.db.tasks[idx], ...data, id };
      return clone(this.db.tasks[idx]);
    },
  };

  compliance = {
    getAll: async () => {
      await this.simulate('compliance');
      return clone(this.db.compliance);
    },
    update: async (id: ID, data: Partial<ComplianceItem>): Promise<ComplianceItem> => {
      await this.simulate('compliance update');
      const idx = this.db.compliance.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error(`Compliance item "${id}" not found.`);
      this.db.compliance[idx] = { ...this.db.compliance[idx], ...data, id };
      return clone(this.db.compliance[idx]);
    },
  };

  documents = {
    getAll: async () => {
      await this.simulate('documents');
      return clone(this.db.documents);
    },
    create: async (doc: Document): Promise<Document> => {
      await this.simulate('document upload');
      this.db.documents.push(clone(doc));
      return clone(doc);
    },
  };
}

const clone = <T>(v: T): T => structuredClone(v);

/** Client-side id generator for mock-created records. */
const genId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
