import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Bedrock module so we can simulate success + failure (scenario 9).
vi.mock('../src/lib/bedrock.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    generateWithBedrock: vi.fn(),
  };
});

// Mock the executors so we can simulate AWS API success + failure (scenario 10).
vi.mock('../src/lib/executors.js', () => ({
  EXECUTORS: {
    'aws s3 ls': vi.fn(),
    'aws sts get-caller-identity': vi.fn(),
    'aws ec2 describe-instances': vi.fn(),
    'aws lambda list-functions': vi.fn(),
    'aws dynamodb list-tables': vi.fn(),
  },
}));

import { handler as generate } from '../src/handlers/generate.js';
import { handler as execute } from '../src/handlers/execute.js';
import { generateWithBedrock } from '../src/lib/bedrock.js';
import { EXECUTORS } from '../src/lib/executors.js';

const evt = (body) => ({ httpMethod: 'POST', body: JSON.stringify(body) });
const parse = (res) => JSON.parse(res.body);

describe('generate handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('scenario 1: valid S3 request returns a structured, executable command', async () => {
    generateWithBedrock.mockResolvedValue({
      command: 'aws s3 ls',
      explanation: 'Lists buckets.',
      breakdown: [{ token: 'aws', meaning: 'CLI' }],
      service: 'Amazon S3',
      concept: 'Storage discovery',
    });
    const res = await generate(evt({ service: 's3', prompt: 'list buckets' }));
    const body = parse(res);
    expect(res.statusCode).toBe(200);
    expect(body.command).toBe('aws s3 ls');
    expect(body.executable).toBe(true);
    expect(body.risk).toBe('LOW / READ ONLY');
  });

  it('scenario 11: empty prompt is rejected', async () => {
    const res = await generate(evt({ service: 's3', prompt: '   ' }));
    expect(res.statusCode).toBe(400);
    expect(parse(res).code).toBe('EMPTY_PROMPT');
  });

  it('scenario 12: invalid service selection is rejected', async () => {
    const res = await generate(evt({ service: 'not-a-real-service', prompt: 'do a thing' }));
    expect(res.statusCode).toBe(400);
    expect(parse(res).code).toBe('INVALID_SERVICE');
  });

  it('scenario 9: Bedrock failure returns a clean error', async () => {
    const err = new Error('model down');
    err.code = 'BEDROCK_ERROR';
    generateWithBedrock.mockRejectedValue(err);
    const res = await generate(evt({ service: 's3', prompt: 'list buckets' }));
    expect(res.statusCode).toBe(500);
    expect(parse(res).code).toBe('BEDROCK_ERROR');
  });

  it('marks a non-allowlisted model suggestion as not executable', async () => {
    generateWithBedrock.mockResolvedValue({
      command: 'aws s3api delete-bucket --bucket x',
      explanation: 'Deletes a bucket.',
      breakdown: [],
      service: 'Amazon S3',
      concept: 'x',
    });
    const res = await generate(evt({ service: 's3', prompt: 'delete a bucket' }));
    const body = parse(res);
    expect(body.executable).toBe(false);
  });
});

describe('execute handler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('scenarios 1-5: runs an allowlisted command and returns output', async () => {
    EXECUTORS['aws sts get-caller-identity'].mockResolvedValue({
      stdout: '{"Account":"123456789012"}',
      explanation: 'Your identity.',
    });
    const res = await execute(evt({ command: 'aws sts get-caller-identity' }));
    const body = parse(res);
    expect(body.success).toBe(true);
    expect(body.stdout).toContain('123456789012');
  });

  it('scenario 6: rejects an unsupported (non-allowlisted) command', async () => {
    const res = await execute(evt({ command: 'aws s3api get-object --bucket x --key y z' }));
    expect(parse(res).success).toBe(false);
  });

  it('scenario 7: rejects a dangerous/destructive command', async () => {
    const res = await execute(evt({ command: 'aws ec2 terminate-instances --instance-ids i-1' }));
    const body = parse(res);
    expect(body.success).toBe(false);
    expect(body.stderr).toMatch(/mutating|destructive/i);
  });

  it('scenario 8: rejects a shell injection attempt', async () => {
    const res = await execute(evt({ command: 'aws s3 ls && rm -rf /' }));
    const body = parse(res);
    expect(body.success).toBe(false);
    expect(body.risk).toBe('BLOCKED');
  });

  it('scenario 10: AWS API failure returns a clean error, not a crash', async () => {
    const apiErr = new Error('User is not authorized to perform: s3:ListAllMyBuckets');
    apiErr.name = 'AccessDenied';
    EXECUTORS['aws s3 ls'].mockRejectedValue(apiErr);
    const res = await execute(evt({ command: 'aws s3 ls' }));
    const body = parse(res);
    expect(res.statusCode).toBe(200);
    expect(body.success).toBe(false);
    expect(body.stderr).toContain('AccessDenied');
  });

  it('scenario 11: empty command is rejected', async () => {
    const res = await execute(evt({ command: '' }));
    expect(parse(res).success).toBe(false);
  });
});
