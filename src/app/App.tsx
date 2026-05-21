import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { RequireAccess } from '../components/RequireAccess';
import { HomeRoute } from './HomeRoute';
import { AthleteListView, AthleteDetailView } from '../modules/athletes';
import { ProspectPipelineView } from '../modules/prospects';
import { DealBoardView, DealDetailView } from '../modules/deals';
import { PaymentTableView } from '../modules/payments';
import { TaskListView } from '../modules/tasks';
import { ComplianceListView } from '../modules/compliance';
import { DocumentListView } from '../modules/documents';
import { SettingsView } from '../modules/settings';

/**
 * Route table. Each module route is wrapped in <RequireAccess> so RBAC
 * is enforced at the route boundary, not just inside views.
 */
export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomeRoute />} />
        <Route
          path="athletes"
          element={
            <RequireAccess resource="athlete">
              <AthleteListView />
            </RequireAccess>
          }
        />
        <Route
          path="athletes/:id"
          element={
            <RequireAccess resource="athlete">
              <AthleteDetailView />
            </RequireAccess>
          }
        />
        <Route
          path="prospects"
          element={
            <RequireAccess resource="prospect">
              <ProspectPipelineView />
            </RequireAccess>
          }
        />
        <Route
          path="deals"
          element={
            <RequireAccess resource="deal">
              <DealBoardView />
            </RequireAccess>
          }
        />
        <Route
          path="deals/:id"
          element={
            <RequireAccess resource="deal">
              <DealDetailView />
            </RequireAccess>
          }
        />
        <Route
          path="payments"
          element={
            <RequireAccess resource="payment">
              <PaymentTableView />
            </RequireAccess>
          }
        />
        <Route
          path="tasks"
          element={
            <RequireAccess resource="task">
              <TaskListView />
            </RequireAccess>
          }
        />
        <Route
          path="compliance"
          element={
            <RequireAccess resource="compliance">
              <ComplianceListView />
            </RequireAccess>
          }
        />
        <Route
          path="documents"
          element={
            <RequireAccess resource="document">
              <DocumentListView />
            </RequireAccess>
          }
        />
        <Route path="settings" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
