import ts from 'typescript';

export type DiagnosticMessage = {
  messageText: string | ts.DiagnosticMessageChain;
  code?: number | undefined;
  category?: ts.DiagnosticCategory | undefined;
  file?: string | ts.SourceFile | undefined;
  start?: number | undefined;
  length?: number | undefined;
};

export function createDiagnostic(message: DiagnosticMessage): ts.Diagnostic {
  let file = message.file;

  if (typeof file === 'string') {
    file = ts.createSourceFile(file, ts.sys.readFile(file) ?? '', ts.ScriptTarget.ESNext);
  }

  return {
    messageText: message.messageText,
    code: message.code === undefined ? -0 : message.code,
    category: message.category ?? ts.DiagnosticCategory.Error,
    file,
    start: message.start ?? undefined,
    length: message.length ?? undefined,
  };
}
