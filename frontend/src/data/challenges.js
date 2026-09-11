// Learning Mode challenges. Each has a prompt, the expected command,
// and a lesson explaining what the learner takes away.
export const CHALLENGES = [
  {
    id: 'whoami',
    title: 'Find your AWS identity',
    prompt: 'Find the AWS identity currently configured in your CLI environment.',
    expected: 'aws sts get-caller-identity',
    lesson:
      'You used AWS STS to confirm which IAM principal (user or role) your CLI is authenticated as. This is the first thing to check when debugging permissions.',
  },
  {
    id: 'list-buckets',
    title: 'List your S3 buckets',
    prompt: 'List all of the S3 buckets in your account.',
    expected: 'aws s3 ls',
    lesson:
      'You listed your S3 buckets. `s3 ls` is a read-only operation — it never modifies data, which makes it safe to run anytime.',
  },
  {
    id: 'list-tables',
    title: 'List your DynamoDB tables',
    prompt: 'Show every DynamoDB table in the current region.',
    expected: 'aws dynamodb list-tables',
    lesson:
      'You enumerated your DynamoDB tables. Remember that DynamoDB is region-scoped — you only see tables in the region your CLI is configured for.',
  },
  {
    id: 'describe-instances',
    title: 'Inspect your EC2 instances',
    prompt: 'Show details about your EC2 instances.',
    expected: 'aws ec2 describe-instances',
    lesson:
      'You inspected EC2 compute without changing anything. `describe-*` commands are read-only across most AWS services.',
  },
  {
    id: 'list-functions',
    title: 'List your Lambda functions',
    prompt: 'List all Lambda functions in this account and region.',
    expected: 'aws lambda list-functions',
    lesson:
      'You discovered your deployed Lambda functions. This helps you audit what serverless code is running in an account.',
  },
];
