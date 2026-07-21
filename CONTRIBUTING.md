# Contributing

Thank you for considering contributing to AliExpress Product Extraction Engine!

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you agree to uphold it.

## How to Contribute

### Reporting Bugs

- Use GitHub Issues
- Include reproduction steps
- Include sample HTML/JSON if possible (sanitize sensitive data)
- Include engine config and version

### Suggesting Features

- Open an issue with `enhancement` label
- Describe use case and expected behavior
- Consider if it fits the resilience goal

### Pull Requests

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Install deps: `npm install`
4. Make changes following architecture principles
5. Add tests: `npm test`
6. Lint: `npm run lint`
7. Typecheck: `npm run typecheck`
8. Build: `npm run build`
9. Push and open PR

### Architecture Principles (Must Follow)

- **Never hardcode CSS classes** - use JSON signal discovery
- **Never hardcode API endpoints** - detect by content
- **Every field must have confidence + provenance**
- **SOLID, DRY, KISS**
- **Strict TypeScript, no `any`**
- **Pure functions where possible**
- **Composition over inheritance**
- **Test every extractor, normalizer, utility**

### Adding a New Extractor

1. Create file in `src/extractors/<domain>/MyExtractor.ts`
2. Extend `BaseExtractor<T>`
3. Define `id` and `signals` from `SIGNAL_DICTIONARY` or new signals
4. Implement `parseEntry`
5. Add optional `validate`
6. Add unit test in `tests/unit/extractors/`
7. Register in `ProductExtractionEngine.createDefaultRegistry()`
8. Export in `src/index.ts`

Example:
```ts
export class MyExtractor extends BaseExtractor<string> {
  override readonly id: string = 'myField';
  override readonly signals = ['myKey', 'myField'] as const;
  protected override parseEntry(entry: FoundEntry): string | null {
    return TextNormalizer.normalize(entry.value);
  }
}
```

### Testing

- Every normalizer → `tests/unit/normalizers/`
- Every utility → `tests/unit/utils/`
- Every extractor → `tests/unit/extractors/`
- Use realistic fixtures from `tests/fixtures/`

Run:
```bash
npm run test:watch
npm run test -- --coverage
```

### Commit Messages

- Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `perf:`
- Example: `feat(extractor): add weight extractor`

## Development Setup

```bash
npm install
npm run build
npm run dev
```

## Questions?

Open an issue or discussion.

Thank you!
