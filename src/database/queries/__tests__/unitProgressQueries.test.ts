import {
  getTestDb,
  createTestUnit,
  createTestUnitProgress,
} from '../../../../__tests__/helpers/databaseHelpers';
import {
  upsertUnitProgress,
  getWordsLearnedByGrade,
  getCurrentUnit,
  getAllUnitProgressByGrade,
  getCompletedUnitCount,
} from '../unitProgressQueries';

describe('unitProgressQueries', () => {
  describe('upsertUnitProgress', () => {
    it('creates a new record when none exists', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      const db = getTestDb();

      const result = await upsertUnitProgress(db, 'u1', 3);

      expect(result).not.toBeNull();
      expect(result!.unitId).toBe('u1');
      expect(result!.lastWordIndex).toBe(3);
      expect(result!.completedAt).toBeNull();
    });

    it('updates existing record', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      const db = getTestDb();

      await upsertUnitProgress(db, 'u1', 3);
      const result = await upsertUnitProgress(db, 'u1', 7);

      expect(result!.lastWordIndex).toBe(7);
      expect(result!.completedAt).toBeNull();
    });

    it('sets completedAt when lastWordIndex reaches 9', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      const db = getTestDb();

      const result = await upsertUnitProgress(db, 'u1', 9);

      expect(result!.lastWordIndex).toBe(9);
      expect(result!.completedAt).not.toBeNull();
    });

    it('does not overwrite completedAt on subsequent updates', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      const db = getTestDb();

      const first = await upsertUnitProgress(db, 'u1', 9);
      const originalCompletedAt = first!.completedAt;

      // Re-open the unit and view word 0
      const second = await upsertUnitProgress(db, 'u1', 0);

      expect(second!.lastWordIndex).toBe(0);
      expect(second!.completedAt).toBe(originalCompletedAt);
    });
  });

  describe('getWordsLearnedByGrade', () => {
    it('returns 0 when no progress exists', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      const db = getTestDb();

      const count = await getWordsLearnedByGrade(db, 1);
      expect(count).toBe(0);
    });

    it('counts words correctly from completed units', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      const db = getTestDb();

      // Complete unit 1 (10 words), partial unit 2 (5 words seen, index 4)
      await createTestUnitProgress({ id: 'p1', unitId: 'u1', lastWordIndex: 9, completedAt: Date.now() });
      await createTestUnitProgress({ id: 'p2', unitId: 'u2', lastWordIndex: 4 });

      const count = await getWordsLearnedByGrade(db, 1);
      // Unit 1: 9+1=10, Unit 2: 4+1=5 → total 15
      expect(count).toBe(15);
    });

    it('does not count units from other grades', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 2, unitNumber: 1 });
      const db = getTestDb();

      await createTestUnitProgress({ id: 'p1', unitId: 'u1', lastWordIndex: 9, completedAt: Date.now() });
      await createTestUnitProgress({ id: 'p2', unitId: 'u2', lastWordIndex: 9, completedAt: Date.now() });

      expect(await getWordsLearnedByGrade(db, 1)).toBe(10);
      expect(await getWordsLearnedByGrade(db, 2)).toBe(10);
    });
  });

  describe('getCurrentUnit', () => {
    it('returns the first unit when no progress exists', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      const db = getTestDb();

      const result = await getCurrentUnit(db, 1);

      expect(result).not.toBeNull();
      expect(result!.unit.id).toBe('u1');
      expect(result!.lastWordIndex).toBe(-1);
    });

    it('returns the in-progress unit', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      await createTestUnit({ id: 'u3', grade: 1, unitNumber: 3 });
      const db = getTestDb();

      await createTestUnitProgress({ id: 'p1', unitId: 'u1', lastWordIndex: 9, completedAt: Date.now() });
      await createTestUnitProgress({ id: 'p2', unitId: 'u2', lastWordIndex: 5 });

      const result = await getCurrentUnit(db, 1);

      expect(result!.unit.id).toBe('u2');
      expect(result!.lastWordIndex).toBe(5);
    });

    it('returns the first unit without progress when some are completed', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      await createTestUnit({ id: 'u3', grade: 1, unitNumber: 3 });
      const db = getTestDb();

      await createTestUnitProgress({ id: 'p1', unitId: 'u1', lastWordIndex: 9, completedAt: Date.now() });

      const result = await getCurrentUnit(db, 1);

      expect(result!.unit.id).toBe('u2');
      expect(result!.lastWordIndex).toBe(-1);
    });
  });

  describe('getCompletedUnitCount', () => {
    it('counts only completed units', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      await createTestUnit({ id: 'u3', grade: 1, unitNumber: 3 });
      const db = getTestDb();

      await createTestUnitProgress({ id: 'p1', unitId: 'u1', lastWordIndex: 9, completedAt: Date.now() });
      await createTestUnitProgress({ id: 'p2', unitId: 'u2', lastWordIndex: 5 });

      const count = await getCompletedUnitCount(db, 1);
      expect(count).toBe(1);
    });
  });

  describe('getAllUnitProgressByGrade', () => {
    it('returns all units with their progress state', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      await createTestUnit({ id: 'u3', grade: 1, unitNumber: 3 });
      const db = getTestDb();

      await createTestUnitProgress({ id: 'p1', unitId: 'u1', lastWordIndex: 9, completedAt: Date.now() });

      const result = await getAllUnitProgressByGrade(db, 1);

      expect(result).toHaveLength(3);
      expect(result[0].unitNumber).toBe(1);
      expect(result[0].completedAt).not.toBeNull();
      expect(result[1].unitNumber).toBe(2);
      expect(result[1].completedAt).toBeNull();
      expect(result[1].lastWordIndex).toBeNull();
    });
  });
});
