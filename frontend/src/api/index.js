/**
 * API layer. Toggles between mock (Phase 1) and live backend (Phase 6+).
 *
 * Set VITE_API_BASE_URL in a .env file to point at your deployed API Gateway.
 * If it is not set, the app runs in MOCK mode automatically.
 */

import { mockGenerate, mockExecute } from './mockApi.js';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';
export const IS_MOCK = !API_BASE;

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.code = data.code || 'API_ERROR';
    throw err;
  }
  return data;
}

export async function generateCommand({ service, prompt }) {
  if (IS_MOCK) return mockGenerate({ service, prompt });
  return postJson('/generate', { service, prompt });
}

export async function executeCommand({ command }) {
  if (IS_MOCK) return mockExecute({ command });
  return postJson('/execute', { command });
}
