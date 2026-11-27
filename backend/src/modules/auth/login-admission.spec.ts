import { LoginAdmission } from './login-admission';

describe('Login admission', () => {
  it('bounds global concurrency across peers and recovers after a rejected check', async () => {
    const admission = new LoginAdmission();
    let reject!: (error: Error) => void;
    let release!: () => void;
    const first = admission.run(
      'peer-a',
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        }),
    );
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const others = ['peer-b', 'peer-c', 'peer-d'].map((peer) =>
      admission.run(peer, () => held),
    );
    const check = jest.fn(() => Promise.resolve('accepted'));
    try {
      await expect(admission.run('peer-e', check)).rejects.toMatchObject({
        status: 503,
      });
      expect(check).not.toHaveBeenCalled();
      const failed = expect(first).rejects.toThrow('synthetic failure');
      reject(new Error('synthetic failure'));
      await failed;
      await expect(admission.run('peer-a', check)).resolves.toBe('accepted');
    } finally {
      reject(new Error('cleanup'));
      release();
      await Promise.allSettled([first, ...others]);
    }
  });

  it('limits sequential attempts per peer, not per login or globally', async () => {
    jest.useFakeTimers();
    try {
      const admission = new LoginAdmission();
      const check = jest.fn(() => Promise.resolve('accepted'));
      for (let attempt = 0; attempt < 12; attempt++)
        await admission.run('peer-a', check);
      await expect(admission.run('peer-a', check)).rejects.toMatchObject({
        status: 429,
      });
      expect(check).toHaveBeenCalledTimes(12);
      await expect(admission.run('peer-b', check)).resolves.toBe('accepted');
      jest.advanceTimersByTime(60_000);
      await expect(admission.run('peer-a', check)).resolves.toBe('accepted');
    } finally {
      jest.useRealTimers();
    }
  });
});
