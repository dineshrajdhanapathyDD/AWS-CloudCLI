/**
 * Mock AI + execution API for Phase 1.
 *
 * This simulates the backend so the frontend is fully usable before the
 * real API Gateway/Lambda/Bedrock stack exists. The response shape here is
 * the SAME contract the real backend implements, so swapping to live mode
 * is a one-line change in api/index.js.
 */

import { validateCommand } from '../../../shared/commandValidator.js';

// Keyword-driven mock "AI". Maps a service + intent to a structured command.
const KNOWLEDGE = {
  s3: {
    command: 'aws s3 ls',
    explanation: 'Lists the S3 buckets accessible to the current AWS identity.',
    breakdown: [
      { token: 'aws', meaning: 'The AWS CLI entry point' },
      { token: 's3', meaning: 'Amazon S3 service namespace' },
      { token: 'ls', meaning: 'List operation (read-only)' },
    ],
    service: 'Amazon S3',
    concept: 'Object storage discovery — enumerating buckets in your account.',
  },
  ec2: {
    command: 'aws ec2 describe-instances',
    explanation: 'Returns details about your EC2 instances, such as instance IDs, state, and type.',
    breakdown: [
      { token: 'aws', meaning: 'The AWS CLI entry point' },
      { token: 'ec2', meaning: 'Amazon EC2 service namespace' },
      { token: 'describe-instances', meaning: 'Read-only query for instance metadata' },
    ],
    service: 'Amazon EC2',
    concept: 'Compute inventory — inspecting virtual servers without changing them.',
  },
  lambda: {
    command: 'aws lambda list-functions',
    explanation: 'Lists the Lambda functions defined in the current account and region.',
    breakdown: [
      { token: 'aws', meaning: 'The AWS CLI entry point' },
      { token: 'lambda', meaning: 'AWS Lambda service namespace' },
      { token: 'list-functions', meaning: 'Read-only listing of functions' },
    ],
    service: 'AWS Lambda',
    concept: 'Serverless inventory — discovering deployed functions.',
  },
  dynamodb: {
    command: 'aws dynamodb list-tables',
    explanation: 'Lists the DynamoDB tables in the current account and region.',
    breakdown: [
      { token: 'aws', meaning: 'The AWS CLI entry point' },
      { token: 'dynamodb', meaning: 'Amazon DynamoDB service namespace' },
      { token: 'list-tables', meaning: 'Read-only listing of tables' },
    ],
    service: 'Amazon DynamoDB',
    concept: 'NoSQL data model discovery — enumerating tables.',
  },
  sts: {
    command: 'aws sts get-caller-identity',
    explanation: 'Returns the AWS account ID, IAM user/role ARN, and user ID of the current caller.',
    breakdown: [
      { token: 'aws', meaning: 'The AWS CLI entry point' },
      { token: 'sts', meaning: 'AWS Security Token Service namespace' },
      { token: 'get-caller-identity', meaning: 'Read-only identity lookup' },
    ],
    service: 'AWS STS',
    concept: 'Identity & access — confirming which principal your CLI is using.',
  },
};

// Sample execution outputs so the terminal panel is meaningful in mock mode.
const MOCK_OUTPUTS = {
  'aws s3 ls': `2024-01-15 09:22:31 my-app-logs
2024-03-02 14:05:10 my-static-site
2024-06-18 11:47:59 my-data-lake`,
  'aws ec2 describe-instances': `{
  "Reservations": [
    {
      "Instances": [
        { "InstanceId": "i-0abc123def456", "InstanceType": "t3.micro", "State": { "Name": "running" } }
      ]
    }
  ]
}`,
  'aws lambda list-functions': `{
  "Functions": [
    { "FunctionName": "cloudcli-generate", "Runtime": "nodejs20.x" },
    { "FunctionName": "cloudcli-execute", "Runtime": "nodejs20.x" }
  ]
}`,
  'aws dynamodb list-tables': `{
  "TableNames": ["cloudcli-history", "users", "sessions"]
}`,
  'aws sts get-caller-identity': `{
  "UserId": "AIDA...EXAMPLE",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/demo"
}`,
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Mock "generate" endpoint.
 * @param {{ service: string, prompt: string }} input
 * @returns structured command info matching the backend contract
 */
export async function mockGenerate({ service, prompt }) {
  await delay(700); // simulate network + model latency

  if (!prompt || !prompt.trim()) {
    const err = new Error('Please describe what you want to do.');
    err.code = 'EMPTY_PROMPT';
    throw err;
  }

  const entry = KNOWLEDGE[service];
  if (!entry) {
    const err = new Error(`Unsupported service: "${service}". Choose one of the supported services.`);
    err.code = 'INVALID_SERVICE';
    throw err;
  }

  const validation = validateCommand(entry.command);

  return {
    prompt,
    ...entry,
    risk: validation.risk,
    executable: validation.allowed,
  };
}

/**
 * Mock "execute" endpoint. Runs validation FIRST, then returns canned output.
 * @param {{ command: string }} input
 */
export async function mockExecute({ command }) {
  await delay(500);

  const validation = validateCommand(command);
  if (!validation.allowed) {
    return {
      success: false,
      risk: validation.risk,
      stderr: validation.reason,
      stdout: '',
      command: validation.normalized,
    };
  }

  const output = MOCK_OUTPUTS[validation.normalized] ?? '(no sample output available for this command)';
  return {
    success: true,
    risk: validation.risk,
    stdout: output,
    stderr: '',
    command: validation.normalized,
    explanation: explainOutput(validation.normalized),
  };
}

// Explain what the output means — supports the "learn" goal.
function explainOutput(command) {
  const map = {
    'aws s3 ls': 'Each line is a bucket: the date/time is when it was created, followed by the bucket name.',
    'aws ec2 describe-instances': 'The JSON groups instances under Reservations. Each instance shows its ID, type, and current state.',
    'aws lambda list-functions': 'The Functions array lists each deployed function with its name and runtime.',
    'aws dynamodb list-tables': 'TableNames is a simple array of every table in this account/region.',
    'aws sts get-caller-identity': 'Account is your AWS account ID, and Arn identifies exactly which IAM principal made the call.',
  };
  return map[command] ?? 'The command completed successfully.';
}
