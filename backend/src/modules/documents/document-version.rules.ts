type ContentSnapshot<Content> = Readonly<{
  content: Content;
  editability: 'editable' | 'protected-by-submission';
}>;

type ContentEditResult<Content> =
  { accepted: true; snapshot: ContentSnapshot<Content> } | { accepted: false };

/** Evalúa una edición sin modificar el estado de entrada ni avanzar el contador. */
export function editDocumentContent<Content>(
  current: ContentSnapshot<Content>,
  replacement: Content,
  counter: Readonly<{ expected: number; current: number }>,
): ContentEditResult<Content> {
  if (
    current.editability !== 'editable' ||
    counter.expected !== counter.current
  ) {
    return { accepted: false };
  }

  return { accepted: true, snapshot: { ...current, content: replacement } };
}

export function findDocumentVersionById<
  Version extends { readonly id: string },
>(versions: readonly Version[], id: string): Version | undefined {
  return versions.find((version) => version.id === id);
}
