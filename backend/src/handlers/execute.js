/**
 * POST /execute
 * Body: { command: string }
 *
 * The controlled execution mechanism. Flow:
 *   1. Validate against the allowlist (rejects injection, chaining, mutations).
 *   2. Look up the matching SDK executor (no shell, ever).
 *   3. Run it and return structured output + an explanation of the result.
 *
 * Scenario 10 (AWS API failure) is handled by catching SDK errors and
 * returning a clean, non-leaking message.
 */
import { ok, badRequest, parseBody } from '../lib/http.js';
import { validateCommand } from '../lib/commandValidator.js';
import { EXECUTORS } from '../lib/executors.js';

export async function handler(event) {
  if (event?.httpMethod === 'OPTIONS') return ok({});

  const { command } = parseBody(event);

  const validation = validateCommand(command);
  if (!validation.allowed) {
    // Not permitted — return a clear message (scenarios 6, 7, 8, 11).
    return ok({
      success: false,
      command: validation.normalized,
      risk: validation.risk,
      stdout: '',
      stderr: validation.reason,
    });
  }

  const executor = EXECUTORS[validation.normalized];
  if (!executor) {
    // Allowlisted but no executor wired (should not happen) — fail safe.
    return badRequest('This command is allowed but not executable in this environment.', 'NO_EXECUTOR');
  }

  try {
    const { stdout, explanation } = await executor();
    return ok({
      success: true,
      command: validation.normalized,
      risk: validation.risk,
      stdout,
      stderr: '',
      explanation,
    });
  } catch (err) {
    // Scenario 10: AWS API failure (e.g. AccessDenied, throttling).
    return ok({
      success: false,
      command: validation.normalized,
      risk: validation.risk,
      stdout: '',
      stderr: `AWS API error: ${err.name || 'Error'} — ${sanitize(err.message)}`,
    });
  }
}

// Avoid leaking internal details; keep the message short and useful.
function sanitize(msg) {
  if (!msg) return 'The AWS API call failed.';
  return String(msg).slice(0, 300);
}
