import {
  getTestDb,
  createTestUnit,
  createTestUnitProgress,
} from '../../../../__tests__/helpers/databaseHelpers';
import {
  markUnitOpened,
  markUnitCompleted,
  getNextUnit,
  getUnitStudyStateByGrade,
} from '../unitProgressQueries';

describe('unitProgressQueries', () => {
  describe('markUnitOpened', () => {
    it('creates a record with completed=0', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      const db = getTestDb();

      const result = await markUnitOpened(db, 'u1');

      expect(result).not.toBeNull();
      expect(result!.unitId).toBe('u1');
      expect(result!.completed).toBe(0);
    });

    it('is idempotent — does not overwrite existing record', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      const db = getTestDb();

      await markUnitCompleted(db, 'u1');
      const result = await markUnitOpened(db, 'u1');

      expect(result!.completed).toBe(1);
    });
  });

  describe('markUnitCompleted', () => {
    it('sets completed=1', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      const db = getTestDb();

      await markUnitCompleted(db, 'u1');
      const states = await getUnitStudyStateByGrade(db, 1);

      expect(states[0].state).toBe('completed');
    });
  });

  describe('getNextUnit', () => {
    it('returns the first unit when no progress exists', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      const db = getTestDb();

      const result = await getNextUnit(db, 1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('u1');
    });

    it('returns the first incomplete unit', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      await createTestUnit({ id: 'u3', grade: 1, unitNumber: 3 });
      await createTestUnitProgress({ unitId: 'u1', completed: 1 });
      const db = getTestDb();

      const result = await getNextUnit(db, 1);

      expect(result!.id).toBe('u2');
    });

    it('returns the in-progress unit over not-started ones', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      await createTestUnitProgress({ unitId: 'u1', completed: 1 });
      await createTestUnitProgress({ unitId: 'u2', completed: 0 });
      const db = getTestDb();

      const result = await getNextUnit(db, 1);

      expect(result!.id).toBe('u2');
    });

    it('returns last unit when all are completed', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      await createTestUnitProgress({ unitId: 'u1', completed: 1 });
      await createTestUnitProgress({ unitId: 'u2', completed: 1 });
      const db = getTestDb();

      const result = await getNextUnit(db, 1);

      expect(result!.id).toBe('u2');
    });
  });

  describe('getUnitStudyStateByGrade', () => {
    it('returns correct states', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 1, unitNumber: 2 });
      await createTestUnit({ id: 'u3', grade: 1, unitNumber: 3 });
      await createTestUnitProgress({ unitId: 'u1', completed: 1 });
      await createTestUnitProgress({ unitId: 'u2', completed: 0 });
      const db = getTestDb();

      const result = await getUnitStudyStateByGrade(db, 1);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ unitId: 'u1', unitNumber: 1, state: 'completed' });
      expect(result[1]).toEqual({ unitId: 'u2', unitNumber: 2, state: 'in_progress' });
      expect(result[2]).toEqual({ unitId: 'u3', unitNumber: 3, state: 'not_started' });
    });

    it('does not mix grades', async () => {
      await createTestUnit({ id: 'u1', grade: 1, unitNumber: 1 });
      await createTestUnit({ id: 'u2', grade: 2, unitNumber: 1 });
      await createTestUnitProgress({ unitId: 'u1', completed: 1 });
      const db = getTestDb();

      const grade1 = await getUnitStudyStateByGrade(db, 1);
      const grade2 = await getUnitStudyStateByGrade(db, 2);

      expect(grade1[0].state).toBe('completed');
      expect(grade2[0].state).toBe('not_started');
    });
  });
});
