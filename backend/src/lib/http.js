// Small helpers for consistent API Gateway (proxy integration) responses.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
  'Content-Type': 'application/json',
};

export function json(statusCode, payload) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(payload),
  };
}

export function ok(payload) {
  return json(200, payload);
}

export function badRequest(message, code = 'BAD_REQUEST') {
  return json(400, { message, code });
}

export function serverError(message, code = 'INTERNAL_ERROR') {
  return json(500, { message, code });
}

// Parse a JSON body from an API Gateway proxy event. Returns {} on failure.
export function parseBody(event) {
  if (!event || !event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

export { CORS_HEADERS };
