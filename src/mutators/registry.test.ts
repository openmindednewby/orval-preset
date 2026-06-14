import {
  registerMutators,
  getMutator,
  customInstance,
  identityInstance,
  questionerInstance,
  contentInstance,
  notificationInstance,
  paymentInstance,
} from './index';
import type { OrvalMutator } from './registry';

/** A mutator stub that records its call and echoes a tagged value. */
function makeStub(tag: string): OrvalMutator {
  return jest.fn(async (_opts: unknown) => tag as unknown) as OrvalMutator;
}

describe('registry', () => {
  it('throws a helpful error before any mutator is registered', () => {
    expect(() => getMutator('customInstance')).toThrow(
      "HTTP client 'customInstance' not registered. Call registerMutators() at app startup.",
    );
  });

  it('registers and retrieves every mutator', () => {
    const stubs = {
      customInstance: makeStub('custom'),
      identityInstance: makeStub('identity'),
      questionerInstance: makeStub('questioner'),
      contentInstance: makeStub('content'),
      notificationInstance: makeStub('notification'),
      paymentInstance: makeStub('payment'),
    };
    registerMutators(stubs);

    expect(getMutator('customInstance')).toBe(stubs.customInstance);
    expect(getMutator('identityInstance')).toBe(stubs.identityInstance);
    expect(getMutator('questionerInstance')).toBe(stubs.questionerInstance);
    expect(getMutator('contentInstance')).toBe(stubs.contentInstance);
    expect(getMutator('notificationInstance')).toBe(stubs.notificationInstance);
    expect(getMutator('paymentInstance')).toBe(stubs.paymentInstance);
  });

  it('ignores undefined entries in a partial registration', () => {
    const existing = getMutator('customInstance');
    registerMutators({});
    // Nothing overwritten by the empty partial.
    expect(getMutator('customInstance')).toBe(existing);
  });

  it('each generated mutator delegates to its registered implementation', async () => {
    const stubs = {
      customInstance: makeStub('custom'),
      identityInstance: makeStub('identity'),
      questionerInstance: makeStub('questioner'),
      contentInstance: makeStub('content'),
      notificationInstance: makeStub('notification'),
      paymentInstance: makeStub('payment'),
    };
    registerMutators(stubs);

    const req = { url: '/x' };
    await expect(customInstance(req)).resolves.toBe('custom');
    await expect(identityInstance(req)).resolves.toBe('identity');
    await expect(questionerInstance(req)).resolves.toBe('questioner');
    await expect(contentInstance(req)).resolves.toBe('content');
    await expect(notificationInstance(req)).resolves.toBe('notification');
    await expect(paymentInstance(req)).resolves.toBe('payment');

    expect(stubs.customInstance).toHaveBeenCalledWith(req);
    expect(stubs.paymentInstance).toHaveBeenCalledWith(req);
  });
});
