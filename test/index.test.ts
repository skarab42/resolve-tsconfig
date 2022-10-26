import path from 'node:path';
import { expect, it } from 'vitest';
import { findConfigFile, normalizePathSeparator, resolveTSConfig } from '../src/index.js';

const cwd = normalizePathSeparator(process.cwd());

it(`should find relative path`, () => {
  expect(findConfigFile()).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`tsconfig.json`)).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`package/tsconfig.json`)).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`./package/tsconfig.json`)).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`tsconfig.json`, { startDirectory: `package` })).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`tsconfig.json`, { startDirectory: `./package` })).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`./tsconfig.json`, { startDirectory: `package` })).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`./tsconfig.json`, { startDirectory: `./package` })).toStrictEqual(`${cwd}/tsconfig.json`);
});

it(`should find absolute path`, () => {
  expect(findConfigFile(path.resolve(`tsconfig.json`))).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(path.resolve(`tsconfig.json`), { startDirectory: `.` })).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(path.resolve(`tsconfig.json`), { startDirectory: cwd })).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(path.resolve(`tsconfig.json`), { startDirectory: process.cwd() })).toStrictEqual(
    `${cwd}/tsconfig.json`,
  );

  expect(() => findConfigFile(path.resolve(`tsconfig.json`), { startDirectory: `./package` })).toThrow(
    `Do not specify the 'startDirectory' option if you give an absolute 'filePath' or they must be equal. Expected '${cwd}', received '${cwd}/package'.`,
  );
});

it(`should find stop on directory`, () => {
  expect(findConfigFile(`tsconfig.json`, { stopDirectory: `..` })).toStrictEqual(`${cwd}/tsconfig.json`);

  expect(
    findConfigFile(`tsconfig.json`, { startDirectory: `./package/client`, stopDirectory: `./package` }),
  ).toBeUndefined();
});

it(`should find deep path`, () => {
  expect(findConfigFile(`deep/path/that/does/not/exists/tsconfig.json`)).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`deep/path/that/does/not-exists.json`)).toBeUndefined();

  expect(() =>
    findConfigFile(`deep/path/that/does/not/exists/tsconfig.json`, { startDirectoryShouldExists: true }),
  ).toThrow(
    `The start directory '${cwd}/deep/path/that/does/not/exists' does not exists but it should because you have set the 'startDirectoryShouldExists' option to true.`,
  );
});

it(`should resolve root config`, () => {
  const { config } = resolveTSConfig();

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

it(`should return diagnostics on not found file`, () => {
  const { config, diagnostics } = resolveTSConfig('test/fixtures/not-exists.json');

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`Cannot find a 'test/fixtures/not-exists.json' file.`);
});

it(`should return diagnostics on empty file`, () => {
  const { config, diagnostics } = resolveTSConfig('test/fixtures/tsconfig.empty.json');

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`Cannot read '${cwd}/test/fixtures/tsconfig.empty.json' file.`);
});

it(`should return diagnostics on empty file`, () => {
  const { config, diagnostics } = resolveTSConfig('deep/path/that/does/not/exists/tsconfig.json', {
    startDirectoryShouldExists: true,
  });

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(
    `The start directory '${cwd}/deep/path/that/does/not/exists' does not exists but it should because you have set the 'startDirectoryShouldExists' option to true.`,
  );
});

it('should return diagnostics if config file is not a valid JSON file', () => {
  const { config, diagnostics } = resolveTSConfig('test/fixtures/tsconfig.invalid-format.json');

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`'{' expected.`);
});

it('should return diagnostics if config file has invalid properties', () => {
  const { config, diagnostics } = resolveTSConfig('test/fixtures/tsconfig.invalid-property.json');

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`Compiler option 'strict' requires a value of type boolean.`);
});

it('should return diagnostics if config file has no files or include properties and cannot find source files in current working directory', () => {
  const filePath = 'test/fixtures/no-source-files/tsconfig.no-files-or-include.json';
  const { config, diagnostics } = resolveTSConfig(filePath);

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(
    `No inputs were found in config file '${cwd}/${filePath}'. Specified 'include' paths were '["**/*"]' and 'exclude' paths were '[]'.`,
  );
});

it('should return the config if config file has no files or include properties but we can find source files in current working directory', () => {
  const { config } = resolveTSConfig('test/fixtures/with-source-files/tsconfig.no-files-or-include.json');

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
  const { config } = resolveTSConfig('test/fixtures/with-source-files/tsconfig.extends.json');

  expect(config).toBeDefined();

  if (!config) {
    return;
  }

  expect(config.errors.length).toBe(0);
  expect(config.fileNames.length).toBe(1);
  expect(config.fileNames[0]).toMatch('src/module-b.ts');
  expect((config.raw as Record<string, unknown>)['extends']).toBe('./tsconfig.json');
});
