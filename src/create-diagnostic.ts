import ts from 'typescript';

export type DiagnosticMessage = {
  message: string;
  code?: number;
  category?: ts.DiagnosticCategory;
};

export function createDiagnostic(message: DiagnosticMessage): ts.Diagnostic {
  return {
    messageText: message.message,
    code: message.code === undefined ? -0 : message.code,
    category: message.category ?? ts.DiagnosticCategory.Error,
    file: undefined,
    start: undefined,
    length: undefined,
  };
}
