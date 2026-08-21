import { Navigate, Route, Routes } from 'react-router-dom';
import { DEFAULT_MODULE_ID } from '@/modules/registry';
import { AboutPage } from '@/pages/AboutPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { TrainerPage } from '@/pages/TrainerPage';

/**
 * Trainers share one route: :moduleId selects the plug-in, so a new module
 * becomes reachable the moment it is registered.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/train/${DEFAULT_MODULE_ID}`} replace />} />
      <Route path="/train/:moduleId" element={<TrainerPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
