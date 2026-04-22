/**
 * Shared test helpers for unit tests.
 * Provides factory functions for building Request objects and route params.
 */

/**
 * Build a JSON POST Request.
 * @param {object} body
 * @returns {Request}
 */
function makeJsonRequest(body, method = 'POST') {
  return new Request('http://localhost/api/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Build a multipart FormData POST Request.
 * @param {Record<string, string>} fields
 * @returns {Request}
 */
function makeFormDataRequest(fields) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  return new Request('http://localhost/api/test', { method: 'POST', body: fd });
}

/**
 * Wrap a plain object in the Next.js App Router params shape.
 * Route handlers receive `{ params: Promise<{ ... }> }` as their second argument.
 * @param {object} obj
 * @returns {{ params: Promise<object> }}
 */
function makeParams(obj) {
  return { params: Promise.resolve(obj) };
}

module.exports = { makeJsonRequest, makeFormDataRequest, makeParams };
