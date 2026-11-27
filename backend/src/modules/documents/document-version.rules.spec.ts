import {
  editDocumentContent,
  findDocumentVersionById,
} from './document-version.rules';

const originalContent = Object.freeze({ sample: Symbol('original') });
const replacement = Object.freeze({ sample: Symbol('proposed') });

describe('editDocumentContent', () => {
  const editable = Object.freeze({
    content: originalContent,
    editability: 'editable' as const,
  });
  const protectedVersion = Object.freeze({
    content: originalContent,
    editability: 'protected-by-submission' as const,
  });
  const matchingCounter = { expected: 5, current: 5 };
  const staleCounter = { expected: 4, current: 5 };

  it('acepta una edición de contenido editable con el contador vigente', () => {
    const result = editDocumentContent(editable, replacement, matchingCounter);

    expect(result).toStrictEqual({
      accepted: true,
      snapshot: { editability: 'editable', content: replacement },
    });
    expect(result.accepted && result.snapshot.content).toBe(replacement);
    expect(editable.content).toBe(originalContent);
  });

  it('rechaza una edición de contenido editable con el contador obsoleto', () => {
    expect(editDocumentContent(editable, replacement, staleCounter)).toEqual({
      accepted: false,
    });
  });

  it('rechaza la edición de una versión sometida incluso con el contador vigente', () => {
    expect(
      editDocumentContent(protectedVersion, replacement, matchingCounter),
    ).toEqual({ accepted: false });
  });

  it.each([
    ['contador obsoleto', editable, staleCounter],
    ['versión protegida', protectedVersion, matchingCounter],
  ])(
    'conserva el contenido original al rechazar: %s',
    (_, current, counter) => {
      editDocumentContent(current, replacement, counter);

      expect(current.content).toBe(originalContent);
    },
  );
});

describe('findDocumentVersionById', () => {
  const earlier = { id: 'version-demo-1', content: originalContent };
  const latest = { id: 'version-demo-2', content: replacement };
  const versions = [earlier, latest] as const;

  it('devuelve la versión identificada aunque exista una posterior', () => {
    expect(findDocumentVersionById(versions, earlier.id)).toBe(earlier);
  });

  it('no sustituye una identidad inexistente por la última versión', () => {
    expect(findDocumentVersionById(versions, 'version-demo')).toBeUndefined();
  });
});
