# resolve-tsconfig

Find and resolve a tsconfig with some options.

## Installation

```bash
pnpm add resolve-tsconfig
```

## Usage

```ts
import { resolveTsConfig } from 'resolve-tsconfig';

const { config, diagnostics } = resolveTsConfig();
```

## Signature

```ts
function resolveTsConfig(options?: ResolveTsConfigOptions): ResolvedTsConfig;
```

### Options

- **filePath**: `string | undefined` - Default to `tsconfig.json`.
- **startDirectory**: `string | undefined` - Default to current workind directory.
- **stopDirectory**: `string | undefined` - Default to root directory.
- **startDirectoryShouldExists**: `boolean | undefined` - Default to `false`.

### Return

```ts
type ResolvedTsConfig =
  | { diagnostics: ts.Diagnostic[]; config?: never }
  | { config: ts.ParsedCommandLine; diagnostics?: never };
```

---

Scaffolded with [@skarab/skaffold](https://www.npmjs.com/package/@skarab/skaffold)
