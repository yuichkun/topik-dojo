import database from '../../index';
import { Unit, Word } from '../../models';
import { TableName } from '../../constants';
import {
  getUnitsByGrade,
  getUnit,
  getWordsByUnitId,
  getWordsByUnit,
  getUnitCountByGrade,
} from '../unitQueries';

describe('unitQueries', () => {

  describe('getUnitsByGrade', () => {
    it('should return units for a specific grade sorted by unit_number', async () => {
      await database.write(async () => {
        // 3級のユニットを作成（順序をバラバラに）
        await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
          unit.grade = 3;
          unit.unitNumber = 3;
        });
        await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
          unit.grade = 3;
          unit.unitNumber = 1;
        });
        await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
          unit.grade = 3;
          unit.unitNumber = 2;
        });
        // 他の級のユニット
        await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
          unit.grade = 1;
          unit.unitNumber = 1;
        });
      });

      const units = await getUnitsByGrade(3);

      expect(units.length).toBe(3);
      expect(units[0].unitNumber).toBe(1);
      expect(units[1].unitNumber).toBe(2);
      expect(units[2].unitNumber).toBe(3);
      expect(units[0].displayName).toBe('1-10');
      expect(units[1].displayName).toBe('11-20');
      expect(units[2].displayName).toBe('21-30');
    });

    it('should return empty array if no units exist for the grade', async () => {
      const units = await getUnitsByGrade(6);
      expect(units).toEqual([]);
    });
  });

  describe('getUnit', () => {
    it('should return a specific unit by grade and unit number', async () => {
      await database.write(async () => {
        await database.collections.get<Unit>(TableName.UNITS).create((unitData) => {
          unitData.grade = 2;
          unitData.unitNumber = 5;
        });
      });

      const unit = await getUnit(2, 5);

      expect(unit).toBeTruthy();
      expect(unit?.grade).toBe(2);
      expect(unit?.unitNumber).toBe(5);
      expect(unit?.displayName).toBe('41-50');
    });

    it('should return null if unit does not exist', async () => {
      const unit = await getUnit(1, 999);
      expect(unit).toBeNull();
    });
  });

  describe('getWordsByUnitId', () => {
    it('should return words for a specific unit sorted by unit_order', async () => {
      let unitId: string;
      await database.write(async () => {
        const unit = await database.collections.get<Unit>(TableName.UNITS).create((unitData) => {
          unitData.grade = 1;
          unitData.unitNumber = 1;
        });
        unitId = unit.id;

        // 単語を順序をバラバラに作成
        await database.collections.get<Word>(TableName.WORDS).create((word) => {
          word.korean = '단어3';
          word.japanese = '単語3';
          word.grade = 1;
          word.unitId = unitId;
          word.unitOrder = 3;
        });
        await database.collections.get<Word>(TableName.WORDS).create((word) => {
          word.korean = '단어1';
          word.japanese = '単語1';
          word.grade = 1;
          word.unitId = unitId;
          word.unitOrder = 1;
        });
        await database.collections.get<Word>(TableName.WORDS).create((word) => {
          word.korean = '단어2';
          word.japanese = '単語2';
          word.grade = 1;
          word.unitId = unitId;
          word.unitOrder = 2;
        });
      });

      const words = await getWordsByUnitId(unitId);

      expect(words.length).toBe(3);
      expect(words[0].unitOrder).toBe(1);
      expect(words[1].unitOrder).toBe(2);
      expect(words[2].unitOrder).toBe(3);
      expect(words[0].korean).toBe('단어1');
    });
  });

  describe('getWordsByUnit', () => {
    it('should return words for a specific grade and unit number', async () => {
      await database.write(async () => {
        const unit = await database.collections.get<Unit>(TableName.UNITS).create((unitData) => {
          unitData.grade = 3;
          unitData.unitNumber = 10;
        });

        // ユニット10の単語を作成
        for (let i = 1; i <= 5; i++) {
          await database.collections.get<Word>(TableName.WORDS).create((word) => {
            word.korean = `단어${i}`;
            word.japanese = `単語${i}`;
            word.grade = 3;
            word.unitId = unit.id;
            word.unitOrder = i;
          });
        }
      });

      const words = await getWordsByUnit(3, 10);

      expect(words.length).toBe(5);
      expect(words[0].unitOrder).toBe(1);
      expect(words[4].unitOrder).toBe(5);
    });

    it('should return empty array if unit does not exist', async () => {
      const words = await getWordsByUnit(1, 999);
      expect(words).toEqual([]);
    });
  });

  describe('getUnitCountByGrade', () => {
    it('should return the correct count of units for a grade', async () => {
      await database.write(async () => {
        // 2級に15ユニット作成
        for (let i = 1; i <= 15; i++) {
          await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
            unit.grade = 2;
            unit.unitNumber = i;
          });
        }
        // 3級に5ユニット作成
        for (let i = 1; i <= 5; i++) {
          await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
            unit.grade = 3;
            unit.unitNumber = i;
          });
        }
      });

      const count2 = await getUnitCountByGrade(2);
      const count3 = await getUnitCountByGrade(3);
      const count4 = await getUnitCountByGrade(4);

      expect(count2).toBe(15);
      expect(count3).toBe(5);
      expect(count4).toBe(0);
    });
  });

  describe('実際の級別ユニット表示名の確認', () => {
    it('should display correct unit names for all grades', async () => {
      await database.write(async () => {
        const testCases = [
          // 1級（40ユニット）
          { grade: 1, unitNumber: 1, expectedDisplay: '1-10' },
          { grade: 1, unitNumber: 40, expectedDisplay: '391-400' },
          
          // 2級（140ユニット）
          { grade: 2, unitNumber: 1, expectedDisplay: '1-10' },
          { grade: 2, unitNumber: 140, expectedDisplay: '1391-1400' },
          
          // 3級（200ユニット）
          { grade: 3, unitNumber: 1, expectedDisplay: '1-10' },
          { grade: 3, unitNumber: 100, expectedDisplay: '991-1000' },
          { grade: 3, unitNumber: 200, expectedDisplay: '1991-2000' },
          
          // 5級（300ユニット）
          { grade: 5, unitNumber: 1, expectedDisplay: '1-10' },
          { grade: 5, unitNumber: 150, expectedDisplay: '1491-1500' },
          { grade: 5, unitNumber: 300, expectedDisplay: '2991-3000' },
        ];

        for (const testCase of testCases) {
          await database.collections.get<Unit>(TableName.UNITS).create((unit) => {
            unit.grade = testCase.grade;
            unit.unitNumber = testCase.unitNumber;
          });
        }
      });

      // 各テストケースの検証
      const testVerifications = [
        { grade: 1, unitNumber: 1, expectedDisplay: '1-10' },
        { grade: 1, unitNumber: 40, expectedDisplay: '391-400' },
        { grade: 2, unitNumber: 1, expectedDisplay: '1-10' },
        { grade: 2, unitNumber: 140, expectedDisplay: '1391-1400' },
        { grade: 3, unitNumber: 1, expectedDisplay: '1-10' },
        { grade: 3, unitNumber: 100, expectedDisplay: '991-1000' },
        { grade: 3, unitNumber: 200, expectedDisplay: '1991-2000' },
        { grade: 5, unitNumber: 1, expectedDisplay: '1-10' },
        { grade: 5, unitNumber: 150, expectedDisplay: '1491-1500' },
        { grade: 5, unitNumber: 300, expectedDisplay: '2991-3000' },
      ];

      for (const verification of testVerifications) {
        const unit = await getUnit(verification.grade, verification.unitNumber);
        expect(unit).toBeTruthy();
        expect(unit?.displayName).toBe(verification.expectedDisplay);
      }
    });
  });
});