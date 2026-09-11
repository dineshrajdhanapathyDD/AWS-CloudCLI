/**
 * POST /generate
 * Body: { service: string, prompt: string }
 *
 * Uses Bedrock to produce a structured, teaching-focused command description,
 * then runs the SAME allowlist validator to compute the risk level and whether
 * the command is executable. The model output is advisory only.
 */
import { ok, badRequest, serverError, parseBody } from '../lib/http.js';
import { generateWithBedrock, SUPPORTED } from '../lib/bedrock.js';
import { validateCommand } from '../lib/commandValidator.js';

export async function handler(event) {
  if (event?.httpMethod === 'OPTIONS') return ok({});

  const { service, prompt } = parseBody(event);

  // Scenario 11: empty user request
  if (!prompt || !prompt.trim()) {
    return badRequest('Please describe what you want to accomplish.', 'EMPTY_PROMPT');
  }

  // Scenario 12: invalid service selection
  if (!service || !SUPPORTED[service]) {
    return badRequest(
      `Unsupported service "${service ?? ''}". Choose one of: ${Object.keys(SUPPORTED).join(', ')}.`,
      'INVALID_SERVICE'
    );
  }

  // Scenario 9: Bedrock failure -> clean 500 with BEDROCK_ERROR code
  let generated;
  try {
    generated = await generateWithBedrock(service, prompt.trim());
  } catch (err) {
    if (err.code === 'BEDROCK_ERROR') {
      return serverError('The AI service is temporarily unavailable. Please try again.', 'BEDROCK_ERROR');
    }
    return serverError('Unexpected error generating the command.', 'INTERNAL_ERROR');
  }

  // Re-validate the model's command with the allowlist to derive risk/executability.
  const validation = validateCommand(generated.command);

  return ok({
    prompt: prompt.trim(),
    command: validation.normalized || generated.command,
    explanation: generated.explanation || '',
    breakdown: Array.isArray(generated.breakdown) ? generated.breakdown : [],
    service: generated.service || SUPPORTED[service],
    concept: generated.concept || '',
    risk: validation.risk,
    executable: validation.allowed,
    validationReason: validation.reason,
  });
}
