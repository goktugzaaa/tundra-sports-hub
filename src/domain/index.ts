/**
 * Domain layer barrel. Pure business types + rules.
 * This layer imports nothing from UI, services, or React.
 */

export * from './shared/types';

export * from './athlete/types';
export * as athleteRules from './athlete/rules';
export * as athletesDomain from './athlete/service';

export * from './prospect/types';
export * as prospectRules from './prospect/rules';
export * as prospectsDomain from './prospect/service';

export * from './deal/types';
export * as dealRules from './deal/rules';
export * as dealsDomain from './deal/service';

export * from './payment/types';
export * as paymentRules from './payment/rules';
export * as paymentsDomain from './payment/service';

export * from './task/types';
export * as taskRules from './task/rules';
export * as tasksDomain from './task/service';

export * from './compliance/types';
export * as complianceRules from './compliance/rules';
export * as complianceDomain from './compliance/service';

export * from './document/types';
export * as documentRules from './document/rules';
export * as documentsDomain from './document/service';
