import path from 'node:path';
import { expect, it } from 'vitest';
import { findConfigFile, normalizePathSeparator } from '../src/index.js';

const cwd = normalizePathSeparator(process.cwd());
const rootTsConfig = `${cwd}/tsconfig.json`;

it(`should find relative path`, () => {
  expect(findConfigFile({ filePath: 'tsconfig.json' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: 'package/tsconfig.json' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: './package/tsconfig.json' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: 'tsconfig.json', startDirectory: `package` })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: 'tsconfig.json', startDirectory: `./package` })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: './tsconfig.json', startDirectory: `package` })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: './tsconfig.json', startDirectory: `./package` })).toStrictEqual(rootTsConfig);
});

it(`should find absolute path`, () => {
  const filePath = path.resolve('tsconfig.json');

  expect(findConfigFile({ filePath })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath, startDirectory: `.` })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath, startDirectory: cwd })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath, startDirectory: process.cwd() })).toStrictEqual(rootTsConfig);

  expect(() => findConfigFile({ filePath, startDirectory: `./package` })).toThrow(
    `Do not specify the 'startDirectory' option if you give an absolute 'filePath' or they must be equal. Expected '${cwd}', received '${cwd}/package'.`,
  );
});

it(`should find stop on directory`, () => {
  expect(findConfigFile({ filePath: 'tsconfig.json', stopDirectory: `..` })).toStrictEqual(rootTsConfig);

  expect(
    findConfigFile({ filePath: 'tsconfig.json', startDirectory: `./package/client`, stopDirectory: `./package` }),
  ).toBeUndefined();
});

it(`should find deep path`, () => {
  expect(findConfigFile({ filePath: 'deep/path/that/does/not/exists/tsconfig.json' })).toStrictEqual(rootTsConfig);
  expect(findConfigFile({ filePath: 'deep/path/that/does/not-exists.json' })).toBeUndefined();

  expect(() =>
    findConfigFile({ filePath: 'deep/path/that/does/not/exists/tsconfig.json', startDirectoryShouldExists: true }),
  ).toThrow(
    `The start directory '${cwd}/deep/path/that/does/not/exists' does not exists but it should because you have set the 'startDirectoryShouldExists' option to true.`,
  );
});
