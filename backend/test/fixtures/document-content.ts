/** Muestras de contenido lógico; no son archivos ni fijan un formato persistente. */
export const documentContentSamples = {
  original: '  Proyecto ficticio\r\nCaf\u00e9\tversión de prueba  \r\n',
  lineEndingsChanged: '  Proyecto ficticio\nCaf\u00e9\tversión de prueba  \n',
  normalizationChanged:
    '  Proyecto ficticio\r\nCafe\u0301\tversión de prueba  \r\n',
} as const;
