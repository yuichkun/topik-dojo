import database from '../../index';
import { Unit } from '../index';
import { TableName } from '../../constants';

describe('Unit Model', () => {

  describe('displayName', () => {
    it('should generate correct display name for unit 1', async () => {
      const unit = await database.write(async () => {
        return await database.collections
          .get<Unit>(TableName.UNITS)
          .create((unitData) => {
            unitData.grade = 1;
            unitData.unitNumber = 1;
          });
      });

      expect(unit.displayName).toBe('1-10');
    });

    it('should generate correct display name for unit 15', async () => {
      const unit = await database.write(async () => {
        return await database.collections
          .get<Unit>(TableName.UNITS)
          .create((unitData) => {
            unitData.grade = 3;
            unitData.unitNumber = 15;
          });
      });

      expect(unit.displayName).toBe('141-150');
    });

    it('should generate correct display name for unit 140', async () => {
      const unit = await database.write(async () => {
        return await database.collections
          .get<Unit>(TableName.UNITS)
          .create((unitData) => {
            unitData.grade = 2;
            unitData.unitNumber = 140;
          });
      });

      expect(unit.displayName).toBe('1391-1400');
    });
  });

  describe('unit management', () => {
    it('should create multiple units for a grade', async () => {
      await database.write(async () => {
        // 1級の最初の5ユニットを作成
        for (let i = 1; i <= 5; i++) {
          await database.collections
            .get<Unit>(TableName.UNITS)
            .create((unit) => {
              unit.grade = 1;
              unit.unitNumber = i;
            });
        }
      });

      const units = await database.collections
        .get<Unit>(TableName.UNITS)
        .query()
        .fetch();

      expect(units.length).toBe(5);
      expect(units[0].displayName).toBe('1-10');
      expect(units[1].displayName).toBe('11-20');
      expect(units[2].displayName).toBe('21-30');
      expect(units[3].displayName).toBe('31-40');
      expect(units[4].displayName).toBe('41-50');
    });

    it('should handle different grades correctly', async () => {
      await database.write(async () => {
        // 各級の最初のユニット
        const gradeUnits = [
          { grade: 1, unitNumber: 1 },  // 1級
          { grade: 2, unitNumber: 1 },  // 2級
          { grade: 3, unitNumber: 1 },  // 3級
        ];

        for (const gu of gradeUnits) {
          await database.collections
            .get<Unit>(TableName.UNITS)
            .create((unit) => {
              unit.grade = gu.grade;
              unit.unitNumber = gu.unitNumber;
            });
        }
      });

      const units = await database.collections
        .get<Unit>(TableName.UNITS)
        .query()
        .fetch();

      expect(units.length).toBe(3);
      
      // すべて最初のユニットなので、表示名は同じ
      units.forEach(unit => {
        expect(unit.displayName).toBe('1-10');
      });
    });
  });
});