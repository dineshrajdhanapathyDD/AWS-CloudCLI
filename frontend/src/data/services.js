// Initial AWS services supported by the MVP.
// Keep this list intentionally small (per the challenge spec).
export const AWS_SERVICES = [
  {
    id: 's3',
    name: 'Amazon S3',
    description: 'Object storage built to store and retrieve any amount of data.',
    examplePrompt: 'List all my S3 buckets',
  },
  {
    id: 'ec2',
    name: 'Amazon EC2',
    description: 'Resizable compute capacity (virtual servers) in the cloud.',
    examplePrompt: 'Show me all my EC2 instances',
  },
  {
    id: 'lambda',
    name: 'AWS Lambda',
    description: 'Run code without provisioning or managing servers.',
    examplePrompt: 'List all my Lambda functions',
  },
  {
    id: 'dynamodb',
    name: 'Amazon DynamoDB',
    description: 'Fully managed NoSQL key-value and document database.',
    examplePrompt: 'List all my DynamoDB tables',
  },
  {
    id: 'sts',
    name: 'AWS STS',
    description: 'Security Token Service — temporary, limited-privilege credentials.',
    examplePrompt: 'Who am I in AWS right now?',
  },
];

export function getServiceById(id) {
  return AWS_SERVICES.find((s) => s.id === id) || null;
}
