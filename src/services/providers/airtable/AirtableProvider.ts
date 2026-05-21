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
import { AirtableClient, type AirtableConfig } from './client';
import {
  athleteMapper,
  prospectMapper,
  dealMapper,
  paymentMapper,
  taskMapper,
  complianceMapper,
  documentMapper,
} from './mappers';
import { logger } from '../../../observability/logger';

/** Airtable table names. Adjust to match the target base. */
const TABLES = {
  athletes: 'Athletes',
  prospects: 'Prospects',
  deals: 'Deals',
  payments: 'Payments',
  tasks: 'Tasks',
  compliance: 'Compliance',
  documents: 'Documents',
} as const;

/**
 * OPTIONAL BACKEND — Airtable adapter.
 *
 * A drop-in `DataProvider`: it satisfies the exact same contract as
 * `MockDataProvider`, so switching backends touches nothing above the
 * service layer. UI, modules, domain and RBAC are all untouched.
 *
 * Responsibilities are split:
 *   AirtableClient  — HTTP transport, auth, pagination
 *   mappers         — record <-> domain translation
 *   this class      — wires them to the DataProvider contract
 */
export class AirtableDataProvider implements DataProvider {
  private readonly client: AirtableClient;

  constructor(config: AirtableConfig) {
    if (!config.proxyUrl && (!config.apiKey || !config.baseId)) {
      throw new Error(
        'AirtableDataProvider needs apiKey + baseId, or a proxyUrl. ' +
          'Set VITE_AIRTABLE_* env vars, or run with VITE_BACKEND=mock.',
      );
    }
    if (!config.proxyUrl && config.apiKey) {
      logger.warn(
        'airtable.security',
        'Airtable token is bundled into the client. For production set ' +
          'VITE_AIRTABLE_PROXY_URL and keep the token server-side.',
      );
    }
    this.client = new AirtableClient(config);
  }

  athletes = {
    getAll: async (): Promise<Athlete[]> =>
      (await this.client.list(TABLES.athletes)).map(athleteMapper.toEntity),
    getById: async (id: ID): Promise<Athlete> =>
      athleteMapper.toEntity(await this.client.get(TABLES.athletes, id)),
    create: async (data: Omit<Athlete, 'id'>): Promise<Athlete> =>
      athleteMapper.toEntity(
        await this.client.create(TABLES.athletes, athleteMapper.toFields(data)),
      ),
    update: async (id: ID, data: Partial<Athlete>): Promise<Athlete> =>
      athleteMapper.toEntity(
        await this.client.update(TABLES.athletes, id, athleteMapper.toFields(data)),
      ),
  };

  prospects = {
    getAll: async (): Promise<Prospect[]> =>
      (await this.client.list(TABLES.prospects)).map(prospectMapper.toEntity),
    update: async (id: ID, data: Partial<Prospect>): Promise<Prospect> =>
      prospectMapper.toEntity(
        await this.client.update(TABLES.prospects, id, prospectMapper.toFields(data)),
      ),
  };

  deals = {
    getAll: async (): Promise<Deal[]> =>
      (await this.client.list(TABLES.deals)).map(dealMapper.toEntity),
    create: async (data: Omit<Deal, 'id'>): Promise<Deal> =>
      dealMapper.toEntity(await this.client.create(TABLES.deals, dealMapper.toFields(data))),
    update: async (id: ID, data: Partial<Deal>): Promise<Deal> =>
      dealMapper.toEntity(
        await this.client.update(TABLES.deals, id, dealMapper.toFields(data)),
      ),
  };

  payments = {
    getAll: async (): Promise<Payment[]> =>
      (await this.client.list(TABLES.payments)).map(paymentMapper.toEntity),
    create: async (data: Omit<Payment, 'id'>): Promise<Payment> =>
      paymentMapper.toEntity(
        await this.client.create(TABLES.payments, paymentMapper.toFields(data)),
      ),
    update: async (id: ID, data: Partial<Payment>): Promise<Payment> =>
      paymentMapper.toEntity(
        await this.client.update(TABLES.payments, id, paymentMapper.toFields(data)),
      ),
  };

  tasks = {
    getAll: async (): Promise<Task[]> =>
      (await this.client.list(TABLES.tasks)).map(taskMapper.toEntity),
    create: async (data: Omit<Task, 'id'>): Promise<Task> =>
      taskMapper.toEntity(await this.client.create(TABLES.tasks, taskMapper.toFields(data))),
    update: async (id: ID, data: Partial<Task>): Promise<Task> =>
      taskMapper.toEntity(
        await this.client.update(TABLES.tasks, id, taskMapper.toFields(data)),
      ),
  };

  compliance = {
    getAll: async (): Promise<ComplianceItem[]> =>
      (await this.client.list(TABLES.compliance)).map(complianceMapper.toEntity),
    update: async (id: ID, data: Partial<ComplianceItem>): Promise<ComplianceItem> =>
      complianceMapper.toEntity(
        await this.client.update(TABLES.compliance, id, complianceMapper.toFields(data)),
      ),
  };

  documents = {
    getAll: async (): Promise<Document[]> =>
      (await this.client.list(TABLES.documents)).map(documentMapper.toEntity),
    create: async (doc: Document): Promise<Document> =>
      documentMapper.toEntity(
        await this.client.create(TABLES.documents, documentMapper.toFields(doc)),
      ),
  };
}
