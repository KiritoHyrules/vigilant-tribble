import { parseCorsOrigins } from './cors';

describe('parseCorsOrigins', () => {
  it.each(['', '   '])('vacío significa sin CORS (%p)', (value) => {
    expect(parseCorsOrigins(value)).toEqual([]);
  });

  it('acepta HTTP con puerto y HTTPS', () => {
    expect(
      parseCorsOrigins('http://localhost:5178, https://trasu.example'),
    ).toEqual(['http://localhost:5178', 'https://trasu.example']);
  });

  it('normaliza mayúsculas y el puerto por defecto', () => {
    expect(parseCorsOrigins('HTTPS://Trasu.Example:443')).toEqual([
      'https://trasu.example',
    ]);
  });

  it.each([
    ['sin esquema', 'localhost:5178'],
    ['con barra final', 'https://trasu.example/'],
    ['con ruta', 'https://trasu.example/app'],
    ['con parámetros', 'https://trasu.example?a=1'],
    ['con fragmento', 'https://trasu.example#a'],
    ['con credenciales', 'https://user:clave@trasu.example'],
    ['con otro protocolo', 'ftp://trasu.example'],
    ['comodín', '*'],
    ['subdominio comodín', 'https://*.trasu.example'],
    ['comodín codificado', 'https://%2A.trasu.example'],
    ['puerto inválido', 'http://localhost:99999'],
    ['sin host', 'http://'],
    ['entrada vacía en la lista', 'https://trasu.example,'],
    ['una válida y otra no', 'https://trasu.example,otro'],
  ])('rechaza %s', (_case, value) => {
    expect(() => parseCorsOrigins(value)).toThrow('CORS_ORIGINS');
  });
});
