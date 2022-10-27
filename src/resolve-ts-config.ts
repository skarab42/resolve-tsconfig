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
  try {
    const { filePath, ...restOptions } = options ?? {};
    const settings = { filePath: filePath ?? 'tsconfig.json', ...restOptions };

    const configFilePath = findConfigFile(settings);

    if (!configFilePath) {
      return {
        diagnostics: [createDiagnostic({ message: `Cannot find a '${settings.filePath}' file.` })],
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
      undefined,
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
