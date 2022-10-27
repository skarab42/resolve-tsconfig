import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { findFileUp } from './find-file-up.js';
import { createDiagnostic } from './create-diagnostic.js';
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

type NormalizeOptions =
  | { diagnostics: ts.Diagnostic[]; normalizedOptions?: never }
  | { normalizedOptions: NormalizedOptions; diagnostics?: never };

function normalizeOptions(options: FindConfigFileOptions): NormalizeOptions {
  const absolutePath = normalizePathSeparator(path.resolve(options.startDirectory ?? process.cwd(), options.filePath));
  const startDirectory = path.dirname(absolutePath);

  if (options.startDirectory && path.isAbsolute(options.filePath)) {
    const providedStartDirectory = normalizePathSeparator(path.resolve(options.startDirectory));

    if (startDirectory !== providedStartDirectory) {
      return {
        diagnostics: [
          createDiagnostic({
            code: -100,
            messageText: `Do not specify the 'startDirectory' option if you give an absolute 'filePath' or they must be equal. Expected '${startDirectory}', received '${providedStartDirectory}'.`,
          }),
        ],
      };
    }
  }

  if (options.startDirectoryShouldExists && !fs.existsSync(startDirectory)) {
    return {
      diagnostics: [
        createDiagnostic({
          code: 6148,
          messageText: `Directory '${startDirectory}' does not exist, skipping all lookups in it.`,
        }),
      ],
    };
  }

  return {
    normalizedOptions: {
      fileName: path.basename(absolutePath),
      startDirectory,
      startDirectoryShouldExists: Boolean(options.startDirectoryShouldExists),
      stopDirectory: options.stopDirectory ? normalizePathSeparator(path.resolve(options.stopDirectory)) : undefined,
    },
  };
}

export type FindConfigFile =
  | { diagnostics: ts.Diagnostic[]; configFilePath?: never }
  | { configFilePath: string; diagnostics?: never };

/**
 * Find a config file with some options.
 *
 * @param options See {@link FindConfigFileOptions}.
 * @returns The config file path or `undefined`.
 */
export function findConfigFile(options: FindConfigFileOptions): FindConfigFile {
  const { diagnostics: diagnostic, normalizedOptions } = normalizeOptions(options);

  if (diagnostic) {
    return { diagnostics: diagnostic };
  }

  const { startDirectory, stopDirectory, fileName } = normalizedOptions;

  const configFilePath = findFileUp(startDirectory, stopDirectory, (directory) => {
    const filePath = `${directory}/${fileName}`;

    return ts.sys.fileExists(filePath) ? filePath : undefined;
  });

  if (configFilePath) {
    return { configFilePath };
  }

  return {
    diagnostics: [
      createDiagnostic({
        code: 5081,
        messageText: `Cannot find a '${fileName}' file at the current directory: '${startDirectory}'.`,
      }),
    ],
  };
}
