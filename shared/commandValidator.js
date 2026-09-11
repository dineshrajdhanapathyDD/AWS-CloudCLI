/**
 * AWS CloudCLI — Command Safety / Validation Layer
 * -------------------------------------------------
 * This module is the security backbone of the application. It sits between
 * AI-generated commands and any execution path. It is deliberately strict.
 *
 * Rules enforced:
 *  - Only commands that begin with `aws` are considered.
 *  - Only an explicit ALLOWLIST of read-only commands may execute.
 *  - No shell metacharacters: && || ; | > < ` $() etc.
 *  - No command chaining, redirects, pipes, or substitution.
 *  - Everything else is rejected with a clear reason.
 *
 * This module has ZERO dependencies so it can run in the browser (mock/preview),
 * in Node/Lambda, and in unit tests unchanged.
 */

// Risk levels used across the app.
export const RISK = {
  READ_ONLY: 'LOW / READ ONLY',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  BLOCKED: 'BLOCKED',
};

/**
 * Explicit allowlist of executable commands.
 * The `pattern` is matched against the FULL normalized command string.
 * Only read-only, non-mutating commands are permitted in the MVP.
 */
export const ALLOWLIST = [
  {
    command: 'aws sts get-caller-identity',
    pattern: /^aws sts get-caller-identity$/,
    service: 'sts',
    risk: RISK.READ_ONLY,
  },
  {
    command: 'aws s3 ls',
    // allow optional bucket path/args but only for the read-only `ls`
    pattern: /^aws s3 ls(\s+s3:\/\/[a-z0-9.\-/]+)?$/,
    service: 's3',
    risk: RISK.READ_ONLY,
  },
  {
    // Read-only equivalent of `s3 ls` that the model often prefers.
    command: 'aws s3api list-buckets',
    pattern: /^aws s3api list-buckets$/,
    service: 's3',
    risk: RISK.READ_ONLY,
  },
  {
    command: 'aws ec2 describe-instances',
    pattern: /^aws ec2 describe-instances$/,
    service: 'ec2',
    risk: RISK.READ_ONLY,
  },
  {
    command: 'aws lambda list-functions',
    pattern: /^aws lambda list-functions$/,
    service: 'lambda',
    risk: RISK.READ_ONLY,
  },
  {
    command: 'aws dynamodb list-tables',
    pattern: /^aws dynamodb list-tables$/,
    service: 'dynamodb',
    risk: RISK.READ_ONLY,
  },
];

// Characters / sequences that indicate an attempt at shell injection or chaining.
const DANGEROUS_PATTERNS = [
  { token: '&&', label: 'command chaining (&&)' },
  { token: '||', label: 'command chaining (||)' },
  { token: ';', label: 'command separator (;)' },
  { token: '|', label: 'pipe (|)' },
  { token: '>', label: 'output redirect (>)' },
  { token: '<', label: 'input redirect (<)' },
  { token: '`', label: 'command substitution (backtick)' },
  { token: '$(', label: 'command substitution ($())' },
  { token: '${', label: 'variable expansion (${})' },
  { token: '\n', label: 'newline' },
  { token: '\r', label: 'carriage return' },
  { token: '&', label: 'background/ampersand (&)' },
  { token: '\\', label: 'backslash escape' },
];

// Destructive/mutating verb prefixes. A token is flagged if it equals one of
// these OR starts with one followed by a hyphen (e.g. "terminate-instances",
// "delete-table", "create-bucket", "put-item"). This catches the whole family
// of mutating AWS CLI subcommands, not just bare verbs.
const DESTRUCTIVE_VERBS = [
  'rb', 'rm', 'delete', 'terminate', 'remove', 'put', 'create',
  'update', 'modify', 'run', 'run-instances', 'stop', 'start', 'reboot',
  'invoke', 'send', 'copy', 'cp', 'mv', 'sync', 'write', 'attach',
  'detach', 'associate', 'disassociate', 'add', 'set', 'enable', 'disable',
  'deregister', 'register', 'reset', 'restore', 'purchase', 'cancel',
];

function isDestructiveToken(token) {
  return DESTRUCTIVE_VERBS.some(
    (verb) => token === verb || token.startsWith(`${verb}-`)
  );
}

/**
 * Normalize a raw command string: trim, collapse internal whitespace.
 * Does NOT lowercase (AWS resource names are case-sensitive).
 */
export function normalizeCommand(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ');
}

/**
 * Validate a command. Returns a structured result:
 *   { allowed: boolean, risk: string, reason: string, matched?: object, normalized: string }
 */
export function validateCommand(raw) {
  const normalized = normalizeCommand(raw);

  if (!normalized) {
    return {
      allowed: false,
      risk: RISK.BLOCKED,
      reason: 'Empty command. Please provide an AWS CLI command.',
      normalized,
    };
  }

  // 1. Must start with `aws`.
  if (!/^aws(\s|$)/.test(normalized)) {
    return {
      allowed: false,
      risk: RISK.BLOCKED,
      reason: 'Only AWS CLI commands (starting with "aws") are permitted.',
      normalized,
    };
  }

  // 2. Reject any shell metacharacters / chaining / injection attempts.
  for (const { token, label } of DANGEROUS_PATTERNS) {
    if (normalized.includes(token)) {
      return {
        allowed: false,
        risk: RISK.BLOCKED,
        reason: `Command rejected: contains ${label}. Command chaining, pipes, redirects, and shell injection are not allowed.`,
        normalized,
      };
    }
  }

  // 3. Reject obviously destructive verbs (defense in depth, even before allowlist).
  const tokens = normalized.split(' ');
  for (const t of tokens) {
    if (isDestructiveToken(t)) {
      return {
        allowed: false,
        risk: RISK.HIGH,
        reason: `Command rejected: "${t}" is a mutating/destructive operation. The MVP only permits read-only commands.`,
        normalized,
      };
    }
  }

  // 4. Must match the explicit allowlist.
  const matched = ALLOWLIST.find((entry) => entry.pattern.test(normalized));
  if (!matched) {
    return {
      allowed: false,
      risk: RISK.BLOCKED,
      reason: 'Command is not on the allowlist. Only explicitly approved read-only commands can be executed in this MVP.',
      normalized,
    };
  }

  // 5. Allowed.
  return {
    allowed: true,
    risk: matched.risk,
    reason: 'Command is on the read-only allowlist and safe to execute.',
    matched,
    normalized,
  };
}

/**
 * Build an argv array (no shell) from a validated command.
 * Splitting on single spaces is safe here because validateCommand already
 * rejected quotes, escapes, and metacharacters.
 */
export function toArgv(normalized) {
  const parts = normalizeCommand(normalized).split(' ');
  // Drop the leading "aws" — the executor invokes the aws binary directly.
  return parts[0] === 'aws' ? parts.slice(1) : parts;
}
