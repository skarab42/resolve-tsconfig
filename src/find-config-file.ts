import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { findFileUp } from './find-file-up.js';
import { normalizePathSeparator } from './normalize-path-separator.js';

/**
 * The {@link findConfigFile} Options.
 */
export type FindConfigFileOptions = {
  filePath: string;
  startDirectory?: string | undefined;
  stopDirectory?: string | undefined;
  startDirectoryShouldExists?: boolean | undefined;
};

type NormalizedOptions = {
  fileName: string;
  startDirectory: string;
  stopDirectory: string | undefined;
  startDirectoryShouldExists: boolean | undefined;
};

function normalizeOptions(options: FindConfigFileOptions): NormalizedOptions | never {
  const absolutePath = normalizePathSeparator(path.resolve(options.startDirectory ?? process.cwd(), options.filePath));
  const startDirectory = path.dirname(absolutePath);

  if (options.startDirectory && path.isAbsolute(options.filePath)) {
    const providedStartDirectory = normalizePathSeparator(path.resolve(options.startDirectory));

    if (startDirectory !== providedStartDirectory) {
      throw new Error(
        `Do not specify the 'startDirectory' option if you give an absolute 'filePath' or they must be equal. Expected '${startDirectory}', received '${providedStartDirectory}'.`,
      );
    }
  }

  if (options.startDirectoryShouldExists && !fs.existsSync(startDirectory)) {
    throw new Error(
      `The start directory '${startDirectory}' does not exists but it should because you have set the 'startDirectoryShouldExists' option to true.`,
    );
  }

  return {
    fileName: path.basename(absolutePath),
    startDirectory,
    startDirectoryShouldExists: Boolean(options.startDirectoryShouldExists),
    stopDirectory: options.stopDirectory ? normalizePathSeparator(path.resolve(options.stopDirectory)) : undefined,
  };
}

/**
 * Find a config file with some options.
 *
 * @param options See {@link FindConfigFileOptions}.
 * @returns The config file path or `undefined`.
 */
export function findConfigFile(options: FindConfigFileOptions): string | undefined {
  const { fileName, startDirectory, stopDirectory } = normalizeOptions(options);

  return findFileUp(startDirectory, stopDirectory, (directory) => {
    const filePath = `${directory}/${fileName}`;

    return ts.sys.fileExists(filePath) ? filePath : undefined;
  });
}
