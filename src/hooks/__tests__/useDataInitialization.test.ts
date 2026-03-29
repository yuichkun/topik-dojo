import { renderHook, act, waitFor } from '@testing-library/react-native';
import { seedIfNeeded } from '../../utils/seedDatabase';
import db from '../../database/client';

jest.mock('../../utils/seedDatabase', () => ({
  seedIfNeeded: jest.fn(),
}));

jest.mock('../../database/client', () => ({
  __esModule: true,
  default: { fake: 'db' },
}));

const mockSeedIfNeeded = seedIfNeeded as jest.MockedFunction<
  typeof seedIfNeeded
>;

describe('useDataInitialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('migrationSuccess=false では seedIfNeeded が呼ばれない', () => {
    mockSeedIfNeeded.mockResolvedValue(undefined);

    const { result } = renderHook(() => {
      const { useDataInitialization } = require('../../hooks/useDataInitialization');
      return useDataInitialization(false);
    });

    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockSeedIfNeeded).not.toHaveBeenCalled();
  });

  it('migrationSuccess=true で seedIfNeeded が呼ばれる', async () => {
    mockSeedIfNeeded.mockResolvedValue(undefined);

    const { result } = renderHook(() => {
      const { useDataInitialization } = require('../../hooks/useDataInitialization');
      return useDataInitialization(true);
    });

    await waitFor(() => {
      expect(mockSeedIfNeeded).toHaveBeenCalled();
    });
  });

  it('seedIfNeeded の引数に database が渡される', async () => {
    mockSeedIfNeeded.mockResolvedValue(undefined);

    renderHook(() => {
      const { useDataInitialization } = require('../../hooks/useDataInitialization');
      return useDataInitialization(true);
    });

    await waitFor(() => {
      expect(mockSeedIfNeeded).toHaveBeenCalledWith(db);
    });
  });

  it('シード完了後に ready=true になる', async () => {
    mockSeedIfNeeded.mockResolvedValue(undefined);

    const { result } = renderHook(() => {
      const { useDataInitialization } = require('../../hooks/useDataInitialization');
      return useDataInitialization(true);
    });

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(result.current.error).toBeNull();
  });

  it('シード実行中は ready=false のまま', async () => {
    let resolvePromise: () => void;
    const pendingPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mockSeedIfNeeded.mockReturnValue(pendingPromise);

    const { result } = renderHook(() => {
      const { useDataInitialization } = require('../../hooks/useDataInitialization');
      return useDataInitialization(true);
    });

    // シード実行中
    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBeNull();

    // シード完了
    await act(async () => {
      resolvePromise!();
    });

    expect(result.current.ready).toBe(true);
  });

  it('シードエラー時に error にメッセージが入る', async () => {
    mockSeedIfNeeded.mockRejectedValue(new Error('シード失敗'));

    const { result } = renderHook(() => {
      const { useDataInitialization } = require('../../hooks/useDataInitialization');
      return useDataInitialization(true);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('シード失敗');
    });
  });

  it('エラー時は ready=false のまま', async () => {
    mockSeedIfNeeded.mockRejectedValue(new Error('DB接続エラー'));

    const { result } = renderHook(() => {
      const { useDataInitialization } = require('../../hooks/useDataInitialization');
      return useDataInitialization(true);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('DB接続エラー');
    });

    expect(result.current.ready).toBe(false);
  });

  it('migrationSuccess が true のまま再レンダーしても seedIfNeeded は1回だけ呼ばれる', async () => {
    mockSeedIfNeeded.mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ migrationSuccess }) => {
        const { useDataInitialization } = require('../../hooks/useDataInitialization');
        return useDataInitialization(migrationSuccess);
      },
      { initialProps: { migrationSuccess: true } },
    );

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    rerender({ migrationSuccess: true });
    rerender({ migrationSuccess: true });

    expect(mockSeedIfNeeded).toHaveBeenCalledTimes(1);
  });

  it('migrationSuccess が false→true に変わった時に seedIfNeeded が呼ばれる', async () => {
    mockSeedIfNeeded.mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ migrationSuccess }) => {
        const { useDataInitialization } = require('../../hooks/useDataInitialization');
        return useDataInitialization(migrationSuccess);
      },
      { initialProps: { migrationSuccess: false } },
    );

    expect(result.current.ready).toBe(false);
    expect(mockSeedIfNeeded).not.toHaveBeenCalled();

    rerender({ migrationSuccess: true });

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(mockSeedIfNeeded).toHaveBeenCalledTimes(1);
    expect(mockSeedIfNeeded).toHaveBeenCalledWith(db);
  });
});
