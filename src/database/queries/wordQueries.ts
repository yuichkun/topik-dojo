import { Q } from '@nozbe/watermelondb';
import database from '../index';
import { Word } from '../models';
import { TableName } from '../constants';

/**
 * 指定された級の単語を取得（ランダム選択肢生成用）
 * @param grade 級（1-6）
 * @param excludeWordId 除外する単語ID（正解の単語）
 * @param limit 取得数
 * @returns ランダムな単語一覧
 */
export const getRandomWordsByGrade = async (
  grade: number, 
  excludeWordId: string, 
  limit: number
): Promise<Word[]> => {
  const words = await database.collections
    .get<Word>(TableName.WORDS)
    .query(
      Q.where('grade', grade),
      Q.where('id', Q.notEq(excludeWordId))
    )
    .fetch();
  
  // ランダムに選択
  const shuffled = words.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

/**
 * 指定されたIDの単語を取得
 * @param wordId 単語ID
 * @returns 単語（存在しない場合はnull）
 */
export const getWordById = async (wordId: string): Promise<Word | null> => {
  try {
    return await database.collections
      .get<Word>(TableName.WORDS)
      .find(wordId);
  } catch {
    return null;
  }
};

/**
 * 複数の単語IDから単語を取得
 * @param wordIds 単語IDの配列
 * @returns 単語一覧
 */
export const getWordsByIds = async (wordIds: string[]): Promise<Word[]> => {
  if (wordIds.length === 0) {
    return [];
  }
  
  return await database.collections
    .get<Word>(TableName.WORDS)
    .query(Q.where('id', Q.oneOf(wordIds)))
    .fetch();
};

/**
 * 指定された級の全単語数を取得
 * @param grade 級（1-6）
 * @returns 単語数
 */
export const getWordCountByGrade = async (grade: number): Promise<number> => {
  return await database.collections
    .get<Word>(TableName.WORDS)
    .query(Q.where('grade', grade))
    .fetchCount();
};

/**
 * 韓国語の候補リストから単語を検索
 * @param koreanCandidates 韓国語の候補リスト（原形推測結果）
 * @returns 最初に見つかった単語（見つからない場合はnull）
 */
export const searchWordsByKorean = async (
  koreanCandidates: string[]
): Promise<Word | null> => {
  if (koreanCandidates.length === 0) {
    return null;
  }

  try {
    const words = await database.collections
      .get<Word>(TableName.WORDS)
      .query(Q.where('korean', Q.oneOf(koreanCandidates)))
      .fetch();
    
    return words.length > 0 ? words[0] : null;
  } catch (error) {
    console.error('Error searching words by Korean:', error);
    return null;
  }
};