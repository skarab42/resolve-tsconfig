# resolve-tsconfig

Find and resolve a tsconfig with some options.

## Installation

```bash
pnpm add resolve-tsconfig
```

## Usage

```ts
import { resolveTSConfig } from 'resolve-tsconfig';

const { config, diagnostics } = resolveTSConfig();
```

## Signature

```ts
function resolveTSConfig(filePath?: string, options?: Options): LoadedConfig;
```

## Options

- **startDirectory**: `string | undefined` - Default to current workind directory.
- **stopDirectory**: `string | undefined` - Default to root directory.
- **startDirectoryShouldExists**: `boolean | undefined` - Should raise an error if the start directory does not exist.
- **compilerOptions**: `ts.CompilerOptions | undefined` - Default compiler options which will be merged with those found.

---

Scaffolded with [@skarab/skaffold](https://www.npmjs.com/package/@skarab/skaffold)
