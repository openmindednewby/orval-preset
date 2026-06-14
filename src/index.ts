/**
 * `@dloizides/orval-preset` — shared Orval generation setup for the dloizides.com
 * SaaS frontends (erevna-web + katalogos-web).
 *
 * Both apps generate React Query hooks from the SAME six OpenAPI services with a
 * byte-for-byte identical config, mutator registry, and axios-bridge http client.
 * This package owns that shared shape; each app keeps only its own
 * `swagger/*.json` inputs, output paths, and the generated client dirs.
 *
 * Surface:
 *   • `defineOrvalConfig(opts)` — build the 6-API Orval config from app paths
 *     (build-time use, called from the app's `orval.config.js`).
 *   • the 6 mutators (`customInstance`, `identityInstance`, …) — referenced by the
 *     generated hooks; they delegate at runtime to the registry.
 *   • `registerMutators` / `getMutator` — the runtime registry the app populates
 *     at startup with the real http clients.
 *   • `createHttpClient(httpService, opts)` — the axios-bridge factory; the app
 *     injects its own `httpService` transport as a port (no product import).
 */

// Build-time: Orval config factory
export { defineOrvalConfig } from './defineOrvalConfig';
export type {
  DefineOrvalConfigOptions,
  OrvalConfig,
} from './defineOrvalConfig';

// Runtime: registry + the six mutators (referenced by generated hooks)
export {
  registerMutators,
  getMutator,
  customInstance,
  identityInstance,
  questionerInstance,
  contentInstance,
  notificationInstance,
  paymentInstance,
} from './mutators';
export type { OrvalRequest, OrvalMutator } from './mutators';

// Runtime: the axios-bridge http client factory (app injects its transport)
export { createHttpClient } from './createHttpClient';
export type {
  HttpServicePort,
  HttpRequestOptions,
} from './createHttpClient';
