import path from 'node:path';

export function findFileUp(
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
