import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export function normalizePathSeparator(path: string): string {
  return path.replace(/[/\\]+/g, '/');
}

function findFileUp(
  directory: string,
  stopDirectory: string | undefined,
  callback: (directory: string) => string | undefined,
): string | undefined {
  const result = callback(directory);

  if (result !== undefined) {
    return result;
  }

  if (directory === stopDirectory) {
    return undefined;
  }

  const parentPath = path.dirname(directory);

  if (parentPath === directory) {
    return undefined;
  }

  return findFileUp(parentPath, stopDirectory, callback);
}

type Options = {
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

function normalizeInput(filePath: string, options: Options): NormalizedOptions | never {
  const absolutePath = normalizePathSeparator(path.resolve(options.startDirectory ?? process.cwd(), filePath));
  const startDirectory = path.dirname(absolutePath);

  if (options.startDirectory && path.isAbsolute(filePath)) {
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

export function findConfigFile(filePath = 'tsconfig.json', options: Options = {}): string | undefined {
  const { fileName, startDirectory, stopDirectory } = normalizeInput(filePath, options);

  return findFileUp(startDirectory, stopDirectory, (directory) => {
    const filePath = `${directory}/${fileName}`;

    return ts.sys.fileExists(filePath) ? filePath : undefined;
  });
}
