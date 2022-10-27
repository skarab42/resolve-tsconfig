import ts from 'typescript';
import path from 'node:path';
import { findConfigFile } from './find-config-file.js';
import { createDiagnostic } from './create-diagnostic.js';

/**
 * The {@link resolveTsConfig} Options.
 */
export type ResolveTsConfigOptions = {
  filePath?: string | undefined;
  startDirectory?: string | undefined;
  stopDirectory?: string | undefined;
  startDirectoryShouldExists?: boolean | undefined;
};

export type ResolvedTsConfig =
  | { diagnostics: ts.Diagnostic[]; config?: never }
  | { config: ts.ParsedCommandLine; diagnostics?: never };

/**
 * Find and resolve a tsconfig with some options.
 *
 * @param options See {@link ResolveTsConfigOptions}.
 * @returns The resolved config or an array of diagnostics.
 */
export function resolveTsConfig(options?: ResolveTsConfigOptions): ResolvedTsConfig {
  const filePath = options?.filePath ?? 'tsconfig.json';
  const { diagnostics, configFilePath } = findConfigFile({ ...options, filePath });

  if (diagnostics) {
    return { diagnostics };
  }

  const jsonText = ts.sys.readFile(configFilePath);

  if (!jsonText) {
    return {
      diagnostics: [
        createDiagnostic({ code: 5083, file: configFilePath, messageText: `Cannot read file '${configFilePath}'.` }),
      ],
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
    undefined,
    configFilePath,
  );

  if (parsedCommandLine.errors.length > 0) {
    return { diagnostics: parsedCommandLine.errors };
  }

  return { config: parsedCommandLine };
}
