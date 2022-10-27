import ts from 'typescript';
import { expect, it } from 'vitest';
import { createDiagnostic } from '../src/create-diagnostic.js';

it('should find relative path', () => {
  expect(createDiagnostic({ messageText: 'life' })).toMatchInlineSnapshot(`
    {
      "category": 1,
      "code": -0,
      "file": undefined,
      "length": undefined,
      "messageText": "life",
      "start": undefined,
    }
  `);

  expect(createDiagnostic({ messageText: 'life', code: 42 })).toMatchInlineSnapshot(`
    {
      "category": 1,
      "code": 42,
      "file": undefined,
      "length": undefined,
      "messageText": "life",
      "start": undefined,
    }
  `);

  expect(createDiagnostic({ messageText: 'life', code: 42, category: ts.DiagnosticCategory.Warning }))
    .toMatchInlineSnapshot(`
      {
        "category": 0,
        "code": 42,
        "file": undefined,
        "length": undefined,
        "messageText": "life",
        "start": undefined,
      }
    `);

  expect(createDiagnostic({ messageText: 'life', file: 'not-exists.json' })).toMatchInlineSnapshot(`
    {
      "category": 1,
      "code": -0,
      "file": SourceFileObject {
        "amdDependencies": [],
        "bindDiagnostics": [],
        "bindSuggestionDiagnostics": undefined,
        "end": 0,
        "endOfFileToken": TokenObject {
          "end": 0,
          "flags": 67371008,
          "kind": 1,
          "modifierFlagsCache": 0,
          "parent": undefined,
          "pos": 0,
          "transformFlags": 0,
        },
        "fileName": "not-exists.json",
        "flags": 67371008,
        "hasNoDefaultLib": false,
        "identifierCount": 0,
        "identifiers": Map {},
        "isDeclarationFile": false,
        "kind": 305,
        "languageVariant": 1,
        "languageVersion": 2,
        "libReferenceDirectives": [],
        "modifierFlagsCache": 0,
        "nodeCount": 2,
        "parent": undefined,
        "parseDiagnostics": [],
        "pos": 0,
        "pragmas": Map {},
        "referencedFiles": [],
        "scriptKind": 6,
        "setExternalModuleIndicator": [Function],
        "statements": [],
        "text": "",
        "transformFlags": 0,
        "typeReferenceDirectives": [],
      },
      "length": undefined,
      "messageText": "life",
      "start": undefined,
    }
  `);
});
