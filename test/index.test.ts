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
  const { config, diagnostics } = resolveTSConfig('test/fixtures/config/not-exists.json');

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`Cannot find a 'test/fixtures/config/not-exists.json' file.`);
});

it(`should return diagnostics on empty file`, () => {
  const { config, diagnostics } = resolveTSConfig('test/fixtures/config/tsconfig.empty.json');

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`Cannot read '${cwd}/test/fixtures/config/tsconfig.empty.json' file.`);
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
  const { config, diagnostics } = resolveTSConfig('test/fixtures/config/tsconfig.invalid-format.json');

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`'{' expected.`);
});

it('should return diagnostics if config file has invalid properties', () => {
  const { config, diagnostics } = resolveTSConfig('test/fixtures/config/tsconfig.invalid-property.json');

  expect(config).toBeUndefined();
  expect(diagnostics?.[0]?.category).toBe(1);
  expect(diagnostics?.[0]?.messageText).toBe(`Compiler option 'strict' requires a value of type boolean.`);
});
