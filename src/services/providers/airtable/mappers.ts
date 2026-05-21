import type {
  Athlete,
  AthleteStatus,
  Prospect,
  ProspectStage,
  Deal,
  DealStatus,
  Payment,
  PaymentStatus,
  Task,
  TaskStatus,
  TaskPriority,
  ComplianceItem,
  ComplianceStatus,
  Document,
  DocumentOwnerType,
} from '../../../domain';
import type { AirtableRecord } from './client';

/**
 * Record <-> domain entity mappers.
 *
 * Translation boundary between Airtable's flat `fields` shape and the
 * domain model. Nested objects (stats, metadata, money) are stored as
 * JSON text columns. The domain `id` is the Airtable record id.
 *
 * Expected Airtable schema is documented per mapper below.
 */

type Fields = Record<string, unknown>;

const str = (f: Fields, k: string): string => (f[k] == null ? '' : String(f[k]));
const optStr = (f: Fields, k: string): string | undefined =>
  f[k] == null ? undefined : String(f[k]);
const num = (f: Fields, k: string): number => Number(f[k] ?? 0);

function parseJson<T>(f: Fields, k: string, fallback: T): T {
  const raw = f[k];
  if (typeof raw !== 'string' || raw.trim() === '') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Drop undefined keys so PATCH only sends what changed. */
function compact(fields: Fields): Fields {
  return Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
}

// ── Athlete ── columns: name, status, recruiterId, sport, position,
//    season, metrics (JSON), metadata (JSON)
export const athleteMapper = {
  toEntity(r: AirtableRecord): Athlete {
    const f = r.fields;
    return {
      id: r.id,
      name: str(f, 'name'),
      status: str(f, 'status') as AthleteStatus,
      recruiterId: str(f, 'recruiterId'),
      stats: {
        sport: str(f, 'sport'),
        position: optStr(f, 'position'),
        season: optStr(f, 'season'),
        metrics: parseJson<Record<string, number>>(f, 'metrics', {}),
      },
      metadata: parseJson<Record<string, unknown>>(f, 'metadata', {}),
    };
  },
  toFields(data: Partial<Athlete>): Fields {
    return compact({
      name: data.name,
      status: data.status,
      recruiterId: data.recruiterId,
      sport: data.stats?.sport,
      position: data.stats?.position,
      season: data.stats?.season,
      metrics: data.stats ? JSON.stringify(data.stats.metrics) : undefined,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    });
  },
};

// ── Prospect ── columns: name, stage, assignedRecruiter, notes
export const prospectMapper = {
  toEntity(r: AirtableRecord): Prospect {
    const f = r.fields;
    return {
      id: r.id,
      name: str(f, 'name'),
      stage: str(f, 'stage') as ProspectStage,
      assignedRecruiter: str(f, 'assignedRecruiter'),
      notes: str(f, 'notes'),
    };
  },
  toFields(data: Partial<Prospect>): Fields {
    return compact({
      name: data.name,
      stage: data.stage,
      assignedRecruiter: data.assignedRecruiter,
      notes: data.notes,
    });
  },
};

// ── Deal ── columns: athleteId, valueAmount, valueCurrency, status,
//    startDate, endDate
export const dealMapper = {
  toEntity(r: AirtableRecord): Deal {
    const f = r.fields;
    return {
      id: r.id,
      athleteId: str(f, 'athleteId'),
      value: { amount: num(f, 'valueAmount'), currency: str(f, 'valueCurrency') || 'USD' },
      status: str(f, 'status') as DealStatus,
      startDate: str(f, 'startDate'),
      endDate: str(f, 'endDate'),
    };
  },
  toFields(data: Partial<Deal>): Fields {
    return compact({
      athleteId: data.athleteId,
      valueAmount: data.value?.amount,
      valueCurrency: data.value?.currency,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
    });
  },
};

// ── Payment ── columns: athleteId, dealId, amount, currency, dueDate, status
export const paymentMapper = {
  toEntity(r: AirtableRecord): Payment {
    const f = r.fields;
    return {
      id: r.id,
      athleteId: str(f, 'athleteId'),
      dealId: optStr(f, 'dealId'),
      amount: { amount: num(f, 'amount'), currency: str(f, 'currency') || 'USD' },
      dueDate: str(f, 'dueDate'),
      status: str(f, 'status') as PaymentStatus,
    };
  },
  toFields(data: Partial<Payment>): Fields {
    return compact({
      athleteId: data.athleteId,
      dealId: data.dealId,
      amount: data.amount?.amount,
      currency: data.amount?.currency,
      dueDate: data.dueDate,
      status: data.status,
    });
  },
};

// ── Task ── columns: title, assignedTo, dueDate, status, priority, athleteId
export const taskMapper = {
  toEntity(r: AirtableRecord): Task {
    const f = r.fields;
    return {
      id: r.id,
      title: str(f, 'title'),
      assignedTo: str(f, 'assignedTo'),
      dueDate: str(f, 'dueDate'),
      status: str(f, 'status') as TaskStatus,
      priority: (str(f, 'priority') || 'medium') as TaskPriority,
      athleteId: optStr(f, 'athleteId'),
    };
  },
  toFields(data: Partial<Task>): Fields {
    return compact({
      title: data.title,
      assignedTo: data.assignedTo,
      dueDate: data.dueDate,
      status: data.status,
      priority: data.priority,
      athleteId: data.athleteId,
    });
  },
};

// ── Compliance ── columns: athleteId, type, status, expiryDate
export const complianceMapper = {
  toEntity(r: AirtableRecord): ComplianceItem {
    const f = r.fields;
    return {
      id: r.id,
      athleteId: str(f, 'athleteId'),
      type: str(f, 'type'),
      status: str(f, 'status') as ComplianceStatus,
      expiryDate: str(f, 'expiryDate'),
    };
  },
  toFields(data: Partial<ComplianceItem>): Fields {
    return compact({
      athleteId: data.athleteId,
      type: data.type,
      status: data.status,
      expiryDate: data.expiryDate,
    });
  },
};

// ── Document ── columns: ownerType, ownerId, type, url, uploadedAt, expiresAt
export const documentMapper = {
  toEntity(r: AirtableRecord): Document {
    const f = r.fields;
    return {
      id: r.id,
      ownerType: str(f, 'ownerType') as DocumentOwnerType,
      ownerId: str(f, 'ownerId'),
      type: str(f, 'type'),
      url: str(f, 'url'),
      uploadedAt: str(f, 'uploadedAt'),
      expiresAt: optStr(f, 'expiresAt'),
    };
  },
  toFields(data: Document): Fields {
    return compact({
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      type: data.type,
      url: data.url,
      uploadedAt: data.uploadedAt,
      expiresAt: data.expiresAt,
    });
  },
};
