import { Navigate, Route, Routes } from 'react-router-dom';
import { DEFAULT_MODULE_ID } from '@/modules/registry';
import { AboutPage } from '@/pages/AboutPage';
import {
  CurriculumBucketPage,
  CurriculumLevelPage,
  CurriculumPage,
  CurriculumPracticePage,
} from '@/pages/curriculum';
import { HistoryPage } from '@/pages/HistoryPage';
import { LessonsPage } from '@/pages/LessonsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { TrainerPage } from '@/pages/TrainerPage';

/**
 * Trainers share one route: :moduleId selects the plug-in, so a new module
 * becomes reachable the moment it is registered.
 *
 * The curriculum mirrors its own shape — level / bucket / practice — so every
 * node in the tree is a bookmarkable URL without a route per level.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/train/${DEFAULT_MODULE_ID}`} replace />} />
      <Route path="/train/:moduleId" element={<TrainerPage />} />
      <Route path="/curriculum" element={<CurriculumPage />} />
      <Route path="/curriculum/:levelId" element={<CurriculumLevelPage />} />
      <Route path="/curriculum/:levelId/:bucketId" element={<CurriculumBucketPage />} />
      <Route
        path="/curriculum/:levelId/:bucketId/:practiceId"
        element={<CurriculumPracticePage />}
      />
      <Route path="/lessons" element={<LessonsPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/statistics" element={<StatisticsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
