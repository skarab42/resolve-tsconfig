import ts from 'typescript';
import { expect, it } from 'vitest';
import { createDiagnostic } from '../src/create-diagnostic.js';

it(`should find relative path`, () => {
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
});
