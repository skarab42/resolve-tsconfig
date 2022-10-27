export function normalizePathSeparator(path: string): string {
  return path.replace(/[/\\]+/g, '/');
}
