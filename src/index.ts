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

/**
 * The {@link resolveTSConfig} Options.
 */
export type Options = {
  startDirectory?: string | undefined;
  stopDirectory?: string | undefined;
  startDirectoryShouldExists?: boolean | undefined;
  compilerOptions?: ts.CompilerOptions | undefined;
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

/**
 * Find a config file with some options.
 *
 * @param filePath An absolute or relative file path.
 * @param options See {@link Options}.
 * @returns The config file path or `undefined`.
 */
export function findConfigFile(filePath = 'tsconfig.json', options?: Options): string | undefined {
  const { fileName, startDirectory, stopDirectory } = normalizeInput(filePath, options ?? {});

  return findFileUp(startDirectory, stopDirectory, (directory) => {
    const filePath = `${directory}/${fileName}`;

    return ts.sys.fileExists(filePath) ? filePath : undefined;
  });
}

type DiagnosticMessage = {
  message: string;
  code?: number;
  category?: ts.DiagnosticCategory;
};

function createDiagnostic(message: DiagnosticMessage): ts.Diagnostic {
  return {
    messageText: message.message,
    code: message.code === undefined ? -0 : message.code,
    category: message.category ?? ts.DiagnosticCategory.Error,
    file: undefined,
    start: undefined,
    length: undefined,
  };
}

type LoadedConfig =
  | { diagnostics: ts.Diagnostic[]; config?: never }
  | { config: ts.ParsedCommandLine; diagnostics?: never };

/**
 * Find and resolve a tsconfig with some options.
 *
 * @param filePath An absolute or relative file path.
 * @param options See {@link Options}.
 * @returns The resolved config or an array of diagnostics.
 */
export function resolveTSConfig(filePath = 'tsconfig.json', options?: Options): LoadedConfig {
  try {
    const configFilePath = findConfigFile(filePath, options);

    if (!configFilePath) {
      return {
        diagnostics: [createDiagnostic({ message: `Cannot find a '${filePath}' file.` })],
      };
    }

    const jsonText = ts.sys.readFile(configFilePath);

    if (!jsonText) {
      return {
        diagnostics: [createDiagnostic({ message: `Cannot read '${configFilePath}' file.` })],
      };
    }

    const configObject = ts.parseConfigFileTextToJson(configFilePath, jsonText);

    if (configObject.error) {
      return { diagnostics: [configObject.error] };
    }

    const parsedCommandLine = ts.parseJsonConfigFileContent(
      configObject.config,
      ts.sys,
      path.dirname(configFilePath),
      options?.compilerOptions,
      configFilePath,
    );

    if (parsedCommandLine.errors.length > 0) {
      return { diagnostics: parsedCommandLine.errors };
    }

    return { config: parsedCommandLine };
  } catch (error) {
    return { diagnostics: [createDiagnostic({ message: (error as Error).message })] };
  }
}
