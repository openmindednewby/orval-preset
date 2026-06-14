# Changelog

All notable changes to `@dloizides/orval-preset` are documented here.

## [1.0.0] - 2026-06-14

### Added

- Initial extraction from the duplicated Orval setup in `erevna-web` and
  `katalogos-web` (task #196).
- `defineOrvalConfig({ swaggerDir, outDir, mutatorPath, prettier? })` — builds
  the shared 6-API Orval config (onlineMenu / identity / questioner / content /
  payment / notification) from app-supplied paths.
- The 6 mutators (`customInstance`, `identityInstance`, `questionerInstance`,
  `contentInstance`, `notificationInstance`, `paymentInstance`) plus the runtime
  registry (`registerMutators` / `getMutator`).
- `createHttpClient(httpService, opts)` — the axios-bridge factory, with the
  transport injected as a port (`HttpServicePort`) so the package imports no
  product or concrete http layer. Whitespace-normalized vs the per-app copies;
  behaviour-identical.
