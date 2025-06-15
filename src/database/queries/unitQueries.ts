import { Q } from '@nozbe/watermelondb';
import database from '../index';
import { Unit, Word } from '../models';
import { TableName } from '../constants';

/**
 * 指定された級のユニット一覧を取得
 * @param grade 級（1-6）
 * @returns ユニット一覧（unit_number順）
 */
export const getUnitsByGrade = async (grade: number): Promise<Unit[]> => {
  return await database.collections
    .get<Unit>(TableName.UNITS)
    .query(
      Q.where('grade', grade),
      Q.sortBy('unit_number', Q.asc)
    )
    .fetch();
};

/**
 * 指定された級とユニット番号のユニットを取得
 * @param grade 級（1-6）
 * @param unitNumber ユニット番号
 * @returns ユニット（存在しない場合はnull）
 */
export const getUnit = async (grade: number, unitNumber: number): Promise<Unit | null> => {
  const units = await database.collections
    .get<Unit>(TableName.UNITS)
    .query(
      Q.where('grade', grade),
      Q.where('unit_number', unitNumber)
    )
    .fetch();
  
  return units.length > 0 ? units[0] : null;
};

/**
 * 指定されたユニットに属する単語一覧を取得
 * @param unitId ユニットID
 * @returns 単語一覧（unit_order順）
 */
export const getWordsByUnitId = async (unitId: string): Promise<Word[]> => {
  return await database.collections
    .get<Word>(TableName.WORDS)
    .query(
      Q.where('unit_id', unitId),
      Q.sortBy('unit_order', Q.asc)
    )
    .fetch();
};

/**
 * 指定された級とユニット番号の単語一覧を取得
 * @param grade 級（1-6）
 * @param unitNumber ユニット番号
 * @returns 単語一覧（unit_order順）
 */
export const getWordsByUnit = async (grade: number, unitNumber: number): Promise<Word[]> => {
  const unit = await getUnit(grade, unitNumber);
  if (!unit) {
    return [];
  }
  
  return await getWordsByUnitId(unit.id);
};

/**
 * 指定された級の全ユニット数を取得
 * @param grade 級（1-6）
 * @returns ユニット数
 */
export const getUnitCountByGrade = async (grade: number): Promise<number> => {
  const units = await database.collections
    .get<Unit>(TableName.UNITS)
    .query(Q.where('grade', grade))
    .fetchCount();
  
  return units;
};