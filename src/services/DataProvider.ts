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

/**
 * DATA ABSTRACTION CONTRACT.
 *
 * The single boundary between the app and any data source. UI, modules,
 * and domain code depend on THIS interface — never on a concrete provider.
 *
 * Swap the implementation (mock, Airtable, REST, Postgres) without touching
 * a single line above the service layer.
 *
 * Note: this contract is RBAC-agnostic. It returns raw records. Role-based
 * scoping is applied one layer up, in `ScopedDataService`.
 */
export interface DataProvider {
  athletes: {
    getAll(): Promise<Athlete[]>;
    getById(id: ID): Promise<Athlete>;
    create(data: Omit<Athlete, 'id'>): Promise<Athlete>;
    update(id: ID, data: Partial<Athlete>): Promise<Athlete>;
  };

  prospects: {
    getAll(): Promise<Prospect[]>;
    update(id: ID, data: Partial<Prospect>): Promise<Prospect>;
  };

  deals: {
    getAll(): Promise<Deal[]>;
    create(data: Omit<Deal, 'id'>): Promise<Deal>;
    update(id: ID, data: Partial<Deal>): Promise<Deal>;
  };

  payments: {
    getAll(): Promise<Payment[]>;
    create(data: Omit<Payment, 'id'>): Promise<Payment>;
    update(id: ID, data: Partial<Payment>): Promise<Payment>;
  };

  tasks: {
    getAll(): Promise<Task[]>;
    create(data: Omit<Task, 'id'>): Promise<Task>;
    update(id: ID, data: Partial<Task>): Promise<Task>;
  };

  compliance: {
    getAll(): Promise<ComplianceItem[]>;
    update(id: ID, data: Partial<ComplianceItem>): Promise<ComplianceItem>;
  };

  documents: {
    getAll(): Promise<Document[]>;
    create(doc: Document): Promise<Document>;
  };
}
