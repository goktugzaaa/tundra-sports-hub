import type {
  Athlete,
  Prospect,
  Deal,
  Payment,
  Task,
  ComplianceItem,
  Document,
} from '../../../domain';

/**
 * Mock dataset. Production-realistic and fully relational:
 *  - every deal/payment/compliance/document points at a real athlete
 *  - every athlete points at a real recruiter (rec-1 / rec-2)
 *  - tasks are assigned to real users
 *
 * Recruiter identities: rec-1 (Sarah Chen), rec-2 (Mike Torres).
 * Mirrored by users u-rec-1 / u-rec-2 in src/auth/users.ts.
 *
 * `snapshot()` returns deep clones so the provider can mutate freely
 * without corrupting the canonical seed.
 */

const ATHLETES: Athlete[] = [
  {
    id: 'ath-1',
    name: 'Marcus Bennett',
    status: 'active',
    recruiterId: 'rec-1',
    stats: {
      sport: 'Football',
      position: 'Striker',
      season: '2025-26',
      metrics: { goals: 18, assists: 6, appearances: 29, minutesPlayed: 2510 },
    },
    metadata: { agencyTier: 'A', club: 'Riverside FC', marketValueIndex: 88 },
  },
  {
    id: 'ath-2',
    name: 'Elena Petrova',
    status: 'active',
    recruiterId: 'rec-1',
    stats: {
      sport: 'Football',
      position: 'Winger',
      season: '2025-26',
      metrics: { goals: 12, assists: 14, appearances: 27, dribbleSuccessPct: 64.2 },
    },
    metadata: { agencyTier: 'A', club: 'Northgate United', marketValueIndex: 82 },
  },
  {
    id: 'ath-3',
    name: 'Diego Hernandez',
    status: 'injured',
    recruiterId: 'rec-2',
    stats: {
      sport: 'Football',
      position: 'Centre-Back',
      season: '2025-26',
      metrics: { appearances: 22, tacklesPerGame: 3.4, aerialDuelsWonPct: 71.0, clearances: 121 },
    },
    metadata: { agencyTier: 'A', injury: 'ACL — return Q3', club: 'Riverside FC', marketValueIndex: 79 },
  },
  {
    id: 'ath-4',
    name: 'Aisha Okafor',
    status: 'active',
    recruiterId: 'rec-2',
    stats: {
      sport: 'Football',
      position: 'Goalkeeper',
      season: '2025-26',
      metrics: { cleanSheets: 11, savePct: 78.3, appearances: 30 },
    },
    metadata: { agencyTier: 'B', club: 'Harbor City', marketValueIndex: 64 },
  },
  {
    id: 'ath-5',
    name: 'Tom Walsh',
    status: 'inactive',
    recruiterId: 'rec-1',
    stats: {
      sport: 'Football',
      position: 'Central Midfielder',
      season: '2025-26',
      metrics: { goals: 3, assists: 5, appearances: 14, passAccuracyPct: 88.1 },
    },
    metadata: { agencyTier: 'C', note: 'Contract lapsed — re-evaluation pending' },
  },
  {
    id: 'ath-6',
    name: 'Yuki Tanaka',
    status: 'active',
    recruiterId: 'rec-2',
    stats: {
      sport: 'Football',
      position: 'Right-Back',
      season: '2025-26',
      metrics: { assists: 9, appearances: 28, passAccuracyPct: 86.7, tacklesPerGame: 2.6 },
    },
    metadata: { agencyTier: 'B', club: 'Northgate United', marketValueIndex: 71 },
  },
];

const PROSPECTS: Prospect[] = [
  {
    id: 'pr-1',
    name: 'Jordan Mills',
    stage: 'contacted',
    assignedRecruiter: 'rec-1',
    notes: 'Academy winger, projected first-team breakout. Strong 1v1 dribbling.',
  },
  {
    id: 'pr-2',
    name: 'Sofia Andersson',
    stage: 'evaluating',
    assignedRecruiter: 'rec-1',
    notes: 'U21 striker, two clubs scouting. Awaiting medical before an offer.',
  },
  {
    id: 'pr-3',
    name: 'Kwame Asante',
    stage: 'offer',
    assignedRecruiter: 'rec-2',
    notes: 'Academy centre-forward, two clubs competing. Offer extended 2026-05-12.',
  },
  {
    id: 'pr-4',
    name: 'Lucas Meyer',
    stage: 'identified',
    assignedRecruiter: 'rec-2',
    notes: 'Scout flag from regional U19 tournament. No contact yet.',
  },
  {
    id: 'pr-5',
    name: 'Nina Volkov',
    stage: 'signed',
    assignedRecruiter: 'rec-1',
    notes: 'Signed 2026-04-28. Transitioning to athlete onboarding.',
  },
];

const DEALS: Deal[] = [
  {
    id: 'd-1',
    athleteId: 'ath-1',
    value: { amount: 2_400_000, currency: 'USD' },
    status: 'active',
    startDate: '2025-08-01',
    endDate: '2028-07-31',
  },
  {
    id: 'd-2',
    athleteId: 'ath-1',
    value: { amount: 850_000, currency: 'USD' },
    status: 'negotiation',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
  },
  {
    id: 'd-3',
    athleteId: 'ath-2',
    value: { amount: 1_200_000, currency: 'USD' },
    status: 'signed',
    startDate: '2026-01-01',
    endDate: '2027-12-31',
  },
  {
    id: 'd-4',
    athleteId: 'ath-3',
    value: { amount: 3_100_000, currency: 'USD' },
    status: 'active',
    startDate: '2024-07-01',
    endDate: '2027-06-30',
  },
  {
    id: 'd-5',
    athleteId: 'ath-4',
    value: { amount: 500_000, currency: 'USD' },
    status: 'negotiation',
    startDate: '2026-09-01',
    endDate: '2028-08-31',
  },
  {
    id: 'd-6',
    athleteId: 'ath-6',
    value: { amount: 1_800_000, currency: 'USD' },
    status: 'active',
    startDate: '2025-02-01',
    endDate: '2027-01-31',
  },
  {
    id: 'd-7',
    athleteId: 'ath-5',
    value: { amount: 600_000, currency: 'USD' },
    status: 'closed',
    startDate: '2023-08-01',
    endDate: '2025-07-31',
  },
];

const PAYMENTS: Payment[] = [
  { id: 'p-1', athleteId: 'ath-1', dealId: 'd-1', amount: { amount: 200_000, currency: 'USD' }, dueDate: '2026-04-01', status: 'paid' },
  { id: 'p-2', athleteId: 'ath-1', dealId: 'd-1', amount: { amount: 200_000, currency: 'USD' }, dueDate: '2026-06-01', status: 'pending' },
  { id: 'p-3', athleteId: 'ath-1', dealId: 'd-2', amount: { amount: 85_000, currency: 'USD' }, dueDate: '2026-05-10', status: 'pending' },
  { id: 'p-4', athleteId: 'ath-2', dealId: 'd-3', amount: { amount: 150_000, currency: 'USD' }, dueDate: '2026-03-15', status: 'paid' },
  { id: 'p-5', athleteId: 'ath-2', dealId: 'd-3', amount: { amount: 150_000, currency: 'USD' }, dueDate: '2026-05-01', status: 'overdue' },
  { id: 'p-6', athleteId: 'ath-3', dealId: 'd-4', amount: { amount: 310_000, currency: 'USD' }, dueDate: '2026-04-20', status: 'paid' },
  { id: 'p-7', athleteId: 'ath-3', dealId: 'd-4', amount: { amount: 310_000, currency: 'USD' }, dueDate: '2026-07-01', status: 'pending' },
  { id: 'p-8', athleteId: 'ath-4', dealId: 'd-5', amount: { amount: 50_000, currency: 'USD' }, dueDate: '2026-06-15', status: 'pending' },
  { id: 'p-9', athleteId: 'ath-6', dealId: 'd-6', amount: { amount: 180_000, currency: 'USD' }, dueDate: '2026-05-05', status: 'pending' },
  { id: 'p-10', athleteId: 'ath-6', dealId: 'd-6', amount: { amount: 180_000, currency: 'USD' }, dueDate: '2026-02-28', status: 'paid' },
];

const TASKS: Task[] = [
  { id: 't-1', title: 'Renew Marcus Bennett contract clause', assignedTo: 'u-rec-1', athleteId: 'ath-1', dueDate: '2026-05-25', status: 'open', priority: 'high' },
  { id: 't-2', title: 'Schedule Elena Petrova media day', assignedTo: 'u-rec-1', athleteId: 'ath-2', dueDate: '2026-05-15', status: 'in_progress', priority: 'medium' },
  { id: 't-3', title: 'Review Diego Hernandez MRI results', assignedTo: 'u-rec-2', athleteId: 'ath-3', dueDate: '2026-05-22', status: 'blocked', priority: 'high' },
  { id: 't-4', title: 'Build Aisha Okafor sponsorship pitch deck', assignedTo: 'u-rec-2', athleteId: 'ath-4', dueDate: '2026-06-01', status: 'open', priority: 'low' },
  { id: 't-5', title: 'File Yuki Tanaka visa paperwork', assignedTo: 'u-rec-2', athleteId: 'ath-6', dueDate: '2026-05-12', status: 'in_progress', priority: 'high' },
  { id: 't-6', title: 'Quarterly compliance audit', assignedTo: 'u-admin', dueDate: '2026-05-30', status: 'open', priority: 'medium' },
  { id: 't-7', title: 'Onboard newly signed prospects', assignedTo: 'u-rec-1', dueDate: '2026-05-10', status: 'done', priority: 'low' },
  { id: 't-8', title: 'Marcus Bennett payment follow-up', assignedTo: 'u-rec-1', athleteId: 'ath-1', dueDate: '2026-05-18', status: 'open', priority: 'high' },
];

const COMPLIANCE: ComplianceItem[] = [
  { id: 'c-1', athleteId: 'ath-1', type: 'Annual Medical', status: 'valid', expiryDate: '2026-11-01' },
  { id: 'c-2', athleteId: 'ath-1', type: 'League Eligibility', status: 'valid', expiryDate: '2026-06-10' },
  { id: 'c-3', athleteId: 'ath-2', type: 'Anti-Doping Test', status: 'valid', expiryDate: '2026-09-01' },
  { id: 'c-4', athleteId: 'ath-3', type: 'Annual Medical', status: 'flagged', expiryDate: '2026-08-01' },
  { id: 'c-5', athleteId: 'ath-3', type: 'Work Visa', status: 'expired', expiryDate: '2026-04-15' },
  { id: 'c-6', athleteId: 'ath-4', type: 'League Eligibility', status: 'pending', expiryDate: '2026-07-01' },
  { id: 'c-7', athleteId: 'ath-6', type: 'Work Visa', status: 'valid', expiryDate: '2026-05-30' },
];

const DOCUMENTS: Document[] = [
  { id: 'doc-1', ownerType: 'athlete', ownerId: 'ath-1', type: 'Representation Agreement', url: 'mock://docs/ath-1-rep.pdf', uploadedAt: '2026-04-02', expiresAt: '2027-08-01' },
  { id: 'doc-2', ownerType: 'deal', ownerId: 'd-1', type: 'Endorsement Contract', url: 'mock://docs/d-1-contract.pdf', uploadedAt: '2026-01-15', expiresAt: '2028-07-31' },
  { id: 'doc-3', ownerType: 'athlete', ownerId: 'ath-2', type: 'Medical Report', url: 'mock://docs/ath-2-medical.pdf', uploadedAt: '2026-03-16', expiresAt: '2026-05-10' },
  { id: 'doc-4', ownerType: 'deal', ownerId: 'd-4', type: 'Image Rights Addendum', url: 'mock://docs/d-4-image.pdf', uploadedAt: '2026-02-01', expiresAt: '2026-06-15' },
  { id: 'doc-5', ownerType: 'athlete', ownerId: 'ath-3', type: 'ID Verification Scan', url: 'mock://docs/ath-3-id.pdf', uploadedAt: '2026-01-10' },
  { id: 'doc-6', ownerType: 'prospect', ownerId: 'pr-2', type: 'Scouting Evaluation', url: 'mock://docs/pr-2-eval.pdf', uploadedAt: '2026-05-01' },
];

interface SeedSnapshot {
  athletes: Athlete[];
  prospects: Prospect[];
  deals: Deal[];
  payments: Payment[];
  tasks: Task[];
  compliance: ComplianceItem[];
  documents: Document[];
}

/** Deep-cloned, mutation-safe copy of the full dataset. */
export function snapshot(): SeedSnapshot {
  return structuredClone({
    athletes: ATHLETES,
    prospects: PROSPECTS,
    deals: DEALS,
    payments: PAYMENTS,
    tasks: TASKS,
    compliance: COMPLIANCE,
    documents: DOCUMENTS,
  });
}
