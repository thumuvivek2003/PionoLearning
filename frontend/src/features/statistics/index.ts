export { StatisticsProvider, useStatistics } from './StatisticsContext';
export {
  formatAccuracy,
  formatDuration,
  sessionsByModule,
  summarise,
  weakestItems,
} from './statisticsService';
export type {
  AnswerRecord,
  ItemStat,
  SessionRecord,
  StatisticsSummary,
} from './statistics.types';
