// モデルのエクスポート
export { default as Word } from './Word';
export { default as SrsManagement } from './SrsManagement';
export { default as LearningStatus } from './LearningStatus';
export { default as TestResult } from './TestResult';
export { default as TestQuestion } from './TestQuestion';
export { default as ReviewHistory } from './ReviewHistory';
export { default as LearningProgress } from './LearningProgress';

// モデルクラスの配列（Database初期化時に使用）
import Word from './Word';
import SrsManagement from './SrsManagement';
import LearningStatus from './LearningStatus';
import TestResult from './TestResult';
import TestQuestion from './TestQuestion';
import ReviewHistory from './ReviewHistory';
import LearningProgress from './LearningProgress';

export const modelClasses = [
  Word,
  SrsManagement,
  LearningStatus,
  TestResult,
  TestQuestion,
  ReviewHistory,
  LearningProgress,
];