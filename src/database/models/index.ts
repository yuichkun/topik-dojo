// モデルのエクスポート
export { default as Word } from './Word';
export { default as SrsManagement } from './SrsManagement';

// モデルクラスの配列（Database初期化時に使用）
import Word from './Word';
import SrsManagement from './SrsManagement';

export const modelClasses = [
  Word,
  SrsManagement,
];