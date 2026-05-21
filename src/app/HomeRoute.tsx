import { useAuth } from '../auth/AuthContext';
import { DashboardView } from '../modules/dashboard';
import { AthletePortalView } from '../modules/portal';

/**
 * Home route — role-aware landing.
 *  - ATHLETE          → personal portal
 *  - ADMIN / RECRUITER → agency operations dashboard
 */
export function HomeRoute() {
  const { user } = useAuth();
  return user.role === 'ATHLETE' ? <AthletePortalView /> : <DashboardView />;
}
