/**
 * Amazon Bedrock integration for the "generate" Lambda.
 *
 * Uses Anthropic Claude on Bedrock to turn a natural-language request into a
 * STRUCTURED, teaching-focused command description. The model is instructed to
 * return JSON only. IMPORTANT: the model output is NEVER executed directly —
 * the execute path re-validates against the allowlist independently.
 */
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const REGION = process.env.AWS_REGION || 'us-east-1';
// Default to Amazon Nova Lite (AWS-native, fast + cheap, no Marketplace
// subscription required). Override via BEDROCK_MODEL_ID for other models.
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

const client = new BedrockRuntimeClient({ region: REGION });

const SUPPORTED = {
  s3: 'Amazon S3',
  ec2: 'Amazon EC2',
  lambda: 'AWS Lambda',
  dynamodb: 'Amazon DynamoDB',
  sts: 'AWS STS',
};

function buildPrompt(service, userPrompt) {
  const serviceName = SUPPORTED[service] || service;
  return `You are an AWS CLI teaching assistant. A learner selected the service "${serviceName}" and asked: "${userPrompt}".

Return ONLY valid JSON (no markdown, no prose) with this exact shape:
{
  "command": "the single aws CLI command, read-only preferred, no shell operators",
  "explanation": "one or two sentences explaining what it does",
  "breakdown": [{"token": "part of the command", "meaning": "what it means"}],
  "service": "${serviceName}",
  "concept": "the AWS concept being demonstrated"
}

Rules:
- Produce exactly ONE aws command. Never chain commands.
- Never include &&, ||, ;, |, >, <, backticks, or $().
- Strongly prefer read-only commands (ls, describe-*, list-*, get-caller-identity).
- Keep it minimal and correct.`;
}

/**
 * Calls Bedrock and returns parsed structured JSON.
 * Throws an Error with code 'BEDROCK_ERROR' on failure so the handler can
 * respond with a clean message (test scenario 9).
 */
export async function generateWithBedrock(service, userPrompt) {
  const body = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 700,
    temperature: 0.2,
    messages: [
      { role: 'user', content: buildPrompt(service, userPrompt) },
    ],
  };

  let response;
  try {
    response = await client.send(
      new InvokeModelCommand({
        modelId: MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      })
    );
  } catch (err) {
    const e = new Error(`Bedrock invocation failed: ${err.message}`);
    e.code = 'BEDROCK_ERROR';
    throw e;
  }

  let parsed;
  try {
    const raw = JSON.parse(new TextDecoder().decode(response.body));
    const text = raw?.content?.[0]?.text ?? '';
    parsed = extractJson(text);
  } catch (err) {
    const e = new Error('Could not parse a valid response from the AI model.');
    e.code = 'BEDROCK_ERROR';
    throw e;
  }

  if (!parsed || !parsed.command) {
    const e = new Error('AI model returned no command.');
    e.code = 'BEDROCK_ERROR';
    throw e;
  }
  return parsed;
}

// Extract the first JSON object from a text blob (defends against stray prose).
export function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  return JSON.parse(text.slice(start, end + 1));
}

export { SUPPORTED };
