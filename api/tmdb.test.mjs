import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './tmdb.js';

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    setHeader(key, value) { this.headers[key] = value; }
  };
}

test('rejeita métodos diferentes de GET', async () => {
  const response = responseRecorder();
  await handler({ method: 'POST', query: {} }, response);
  assert.equal(response.statusCode, 405);
});

test('rejeita rotas fora da lista permitida', async () => {
  const previous = process.env.TMDB_API_KEY;
  process.env.TMDB_API_KEY = 'teste';
  const response = responseRecorder();
  await handler({ method: 'GET', query: { path: '/configuration' } }, response);
  assert.equal(response.statusCode, 400);
  process.env.TMDB_API_KEY = previous;
});

test('exige configuração da chave da API', async () => {
  const previous = process.env.TMDB_API_KEY;
  delete process.env.TMDB_API_KEY;
  const response = responseRecorder();
  await handler({ method: 'GET', query: { path: '/movie/popular' } }, response);
  assert.equal(response.statusCode, 500);
  process.env.TMDB_API_KEY = previous;
});
