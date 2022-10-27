import path from 'node:path';
import { expect, it } from 'vitest';
import { findConfigFile, normalizePathSeparator } from '../src/index.js';

const cwd = normalizePathSeparator(process.cwd());
const rootTsConfig = { configFilePath: `${cwd}/tsconfig.json` };

it('should find relative path', () => {
  expect(findConfigFile({ filePath: 'tsconfig.json' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: 'package/tsconfig.json' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: './package/tsconfig.json' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: 'tsconfig.json', startDirectory: 'package' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: 'tsconfig.json', startDirectory: './package' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: './tsconfig.json', startDirectory: 'package' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: './tsconfig.json', startDirectory: './package' })).toStrictEqual(rootTsConfig);
});

it('should find absolute path', () => {
  const filePath = path.resolve('tsconfig.json');

  expect(findConfigFile({ filePath })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath, startDirectory: '.' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath, startDirectory: cwd })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath, startDirectory: process.cwd() })).toStrictEqual(rootTsConfig);

  const { diagnostics } = findConfigFile({ filePath, startDirectory: './package' });

  expect(diagnostics).toStrictEqual([
    {
      category: 1,
      code: -100,
      file: undefined,
      length: undefined,
      messageText: `Do not specify the 'startDirectory' option if you give an absolute 'filePath' or they must be equal. Expected '${cwd}', received '${cwd}/package'.`,
      start: undefined,
    },
  ]);
});

it('should find stop directory', () => {
  expect(findConfigFile({ filePath: 'tsconfig.json', stopDirectory: `..` })).toStrictEqual(rootTsConfig);

  const { diagnostics } = findConfigFile({
    filePath: 'tsconfig.json',
    startDirectory: './package/client',
    stopDirectory: './package',
  });

  expect(diagnostics).toStrictEqual([
    {
      category: 1,
      code: 5081,
      file: undefined,
      length: undefined,
      messageText: `Cannot find a 'tsconfig.json' file at the current directory: '${cwd}/package/client'.`,
      start: undefined,
    },
  ]);
});

it('should find deep path', () => {
  expect(findConfigFile({ filePath: 'deep/path/that/does/not/exists/tsconfig.json' })).toStrictEqual(rootTsConfig);

  const { diagnostics } = findConfigFile({ filePath: 'deep/path/that/does/not-exists.json' });

  expect(diagnostics).toStrictEqual([
    {
      category: 1,
      code: 5081,
      file: undefined,
      length: undefined,
      messageText: `Cannot find a 'not-exists.json' file at the current directory: '${cwd}/deep/path/that/does'.`,
      start: undefined,
    },
  ]);
});

it('should return diagnostic with startDirectoryShouldExists to true', () => {
  const { diagnostics } = findConfigFile({
    filePath: 'deep/path/that/does/not/exists/tsconfig.json',
    startDirectoryShouldExists: true,
  });

  expect(diagnostics).toStrictEqual([
    {
      category: 1,
      code: 6148,
      file: undefined,
      length: undefined,
      messageText: `Directory '${cwd}/deep/path/that/does/not/exists' does not exist, skipping all lookups in it.`,
      start: undefined,
    },
  ]);
});
