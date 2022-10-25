import path from 'node:path';
import { expect, test } from 'vitest';
import { findConfigFile, normalizePathSeparator } from '../src/index.js';

const cwd = normalizePathSeparator(process.cwd());

test(`relative path`, () => {
  expect(findConfigFile()).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`tsconfig.json`)).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`package/tsconfig.json`)).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`./package/tsconfig.json`)).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`tsconfig.json`, { startDirectory: `package` })).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`tsconfig.json`, { startDirectory: `./package` })).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`./tsconfig.json`, { startDirectory: `package` })).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`./tsconfig.json`, { startDirectory: `./package` })).toStrictEqual(`${cwd}/tsconfig.json`);
});

test(`absolute path`, () => {
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

test(`stop directory`, () => {
  expect(findConfigFile(`tsconfig.json`, { stopDirectory: `..` })).toStrictEqual(`${cwd}/tsconfig.json`);

  expect(
    findConfigFile(`tsconfig.json`, { startDirectory: `./package/client`, stopDirectory: `./package` }),
  ).toBeUndefined();
});

test(`deep path`, () => {
  expect(findConfigFile(`deep/path/that/does/not/exists/tsconfig.json`)).toStrictEqual(`${cwd}/tsconfig.json`);
  expect(findConfigFile(`deep/path/that/does/not-exists.json`)).toBeUndefined();

  expect(() =>
    findConfigFile(`deep/path/that/does/not/exists/tsconfig.json`, { startDirectoryShouldExists: true }),
  ).toThrow(
    `The start directory '${cwd}/deep/path/that/does/not/exists' does not exists but it should because you have set the 'startDirectoryShouldExists' option to true.`,
  );
});
