import { expect, it } from 'vitest';
import { normalizePathSeparator, resolveTsConfig } from '../src/index.js';

const cwd = normalizePathSeparator(process.cwd());

it('should resolve root config', () => {
  const { config } = resolveTsConfig();

  expect(config).toBeDefined();

  if (!config) {
    return;
  }

  expect(config.errors.length).toBe(0);
  expect(config.options.strict).toBe(true);
  expect(config.options.isolatedModules).toBe(true);
  expect(config.fileNames.length > 0).toBe(true);
  expect((config.raw as Record<string, unknown>)['extends']).toBe('@skarab/typescript-config');
});

it('should return diagnostics on not found file', () => {
  const { config, diagnostics } = resolveTsConfig({ filePath: 'test/fixtures/not-exists.json' });

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(
    `Cannot find a 'not-exists.json' file at the current directory: '${cwd}/test/fixtures'.`,
  );
});

it('should return diagnostics on empty file', () => {
  const { config, diagnostics } = resolveTsConfig({ filePath: 'test/fixtures/tsconfig.empty.json' });

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`Cannot read file '${cwd}/test/fixtures/tsconfig.empty.json'.`);
  expect(diagnostics?.[0]?.file?.fileName).toBe(`${cwd}/test/fixtures/tsconfig.empty.json`);
});

it('should return diagnostics on empty file', () => {
  const { config, diagnostics } = resolveTsConfig({
    filePath: 'deep/path/that/does/not/exists/tsconfig.json',
    startDirectoryShouldExists: true,
  });

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(
    `Directory '${cwd}/deep/path/that/does/not/exists' does not exist, skipping all lookups in it.`,
  );
});

it('should return diagnostics if config file is not a valid JSON file', () => {
  const { config, diagnostics } = resolveTsConfig({ filePath: 'test/fixtures/tsconfig.invalid-format.json' });

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`'{' expected.`);
});

it('should return diagnostics if config file has invalid properties', () => {
  const { config, diagnostics } = resolveTsConfig({ filePath: 'test/fixtures/tsconfig.invalid-property.json' });

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`Compiler option 'strict' requires a value of type boolean.`);
});

it('should return diagnostics if config file has no files or include properties and cannot find source files in current working directory', () => {
  const filePath = 'test/fixtures/no-source-files/tsconfig.no-files-or-include.json';
  const { config, diagnostics } = resolveTsConfig({ filePath });

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(
    `No inputs were found in config file '${cwd}/${filePath}'. Specified 'include' paths were '["**/*"]' and 'exclude' paths were '[]'.`,
  );
});

it('should return the config if config file has no files or include properties but we can find source files in current working directory', () => {
  const { config } = resolveTsConfig({ filePath: 'test/fixtures/with-source-files/tsconfig.no-files-or-include.json' });

  expect(config).toBeDefined();

  if (!config) {
    return;
  }

  expect(config.errors.length).toBe(0);
  expect(config.fileNames.length).toBe(2);
  expect(config.fileNames[0]).toMatch('src/module-a.ts');
  expect(config.fileNames[1]).toMatch('src/module-b.ts');
  expect((config.raw as Record<string, unknown>)['extends']).toBe(undefined);
});

it('should return the config from extended config', () => {
  const { config } = resolveTsConfig({ filePath: 'test/fixtures/with-source-files/tsconfig.extends.json' });

  expect(config).toBeDefined();

  if (!config) {
    return;
  }

  expect(config.errors.length).toBe(0);
  expect(config.fileNames.length).toBe(1);
  expect(config.fileNames[0]).toMatch('src/module-b.ts');
  expect((config.raw as Record<string, unknown>)['extends']).toBe('./tsconfig.json');
});
