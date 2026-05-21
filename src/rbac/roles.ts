export type Role = 'ADMIN' | 'RECRUITER' | 'ATHLETE';

export type Action = 'create' | 'read' | 'update' | 'delete';

export type Resource =
  | 'athlete'
  | 'prospect'
  | 'deal'
  | 'payment'
  | 'task'
  | 'compliance'
  | 'document';

export const ALL_RESOURCES: Resource[] = [
  'athlete',
  'prospect',
  'deal',
  'payment',
  'task',
  'compliance',
  'document',
];
