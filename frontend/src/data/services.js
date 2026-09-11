// AWS services available in the dropdown.
//
// `executable: true` means the service has a read-only command on the backend
// allowlist, so generated commands can actually be run. Other services are
// "teaching-only": CloudCLI still generates + explains a real command for them,
// but Execute is disabled (nothing off the allowlist ever runs).
export const AWS_SERVICES = [
  // --- Core services with live, executable read-only commands ---
  {
    id: 's3',
    name: 'Amazon S3',
    description: 'Object storage built to store and retrieve any amount of data.',
    examplePrompt: 'List all my S3 buckets',
    executable: true,
  },
  {
    id: 'ec2',
    name: 'Amazon EC2',
    description: 'Resizable compute capacity (virtual servers) in the cloud.',
    examplePrompt: 'Show me all my EC2 instances',
    executable: true,
  },
  {
    id: 'lambda',
    name: 'AWS Lambda',
    description: 'Run code without provisioning or managing servers.',
    examplePrompt: 'List all my Lambda functions',
    executable: true,
  },
  {
    id: 'dynamodb',
    name: 'Amazon DynamoDB',
    description: 'Fully managed NoSQL key-value and document database.',
    examplePrompt: 'List all my DynamoDB tables',
    executable: true,
  },
  {
    id: 'sts',
    name: 'AWS STS',
    description: 'Security Token Service — temporary, limited-privilege credentials.',
    examplePrompt: 'Who am I in AWS right now?',
    executable: true,
  },

  // --- Popular services (teaching mode: generate + explain, Execute disabled) ---
  {
    id: 'iam',
    name: 'AWS IAM',
    description: 'Manage users, groups, roles, and permissions across AWS.',
    examplePrompt: 'List all IAM users in my account',
    executable: false,
  },
  {
    id: 'cloudwatch',
    name: 'Amazon CloudWatch',
    description: 'Monitoring and observability: metrics, logs, and alarms.',
    examplePrompt: 'List my CloudWatch alarms',
    executable: false,
  },
  {
    id: 'cloudformation',
    name: 'AWS CloudFormation',
    description: 'Provision infrastructure as code using templates (stacks).',
    examplePrompt: 'List all my CloudFormation stacks',
    executable: false,
  },
  {
    id: 'rds',
    name: 'Amazon RDS',
    description: 'Managed relational databases (MySQL, PostgreSQL, and more).',
    examplePrompt: 'Describe my RDS database instances',
    executable: false,
  },
  {
    id: 'ecs',
    name: 'Amazon ECS',
    description: 'Run and scale containerized applications.',
    examplePrompt: 'List my ECS clusters',
    executable: false,
  },
  {
    id: 'eks',
    name: 'Amazon EKS',
    description: 'Managed Kubernetes service on AWS.',
    examplePrompt: 'List all my EKS clusters',
    executable: false,
  },
  {
    id: 'sns',
    name: 'Amazon SNS',
    description: 'Pub/sub messaging and mobile/email notifications.',
    examplePrompt: 'List all my SNS topics',
    executable: false,
  },
  {
    id: 'sqs',
    name: 'Amazon SQS',
    description: 'Fully managed message queuing for decoupled systems.',
    examplePrompt: 'List all my SQS queues',
    executable: false,
  },
  {
    id: 'apigateway',
    name: 'Amazon API Gateway',
    description: 'Create, publish, and secure REST and HTTP APIs.',
    examplePrompt: 'List my API Gateway REST APIs',
    executable: false,
  },
  {
    id: 'cloudfront',
    name: 'Amazon CloudFront',
    description: 'Global content delivery network (CDN).',
    examplePrompt: 'List my CloudFront distributions',
    executable: false,
  },
  {
    id: 'route53',
    name: 'Amazon Route 53',
    description: 'Scalable DNS and domain name registration.',
    examplePrompt: 'List my Route 53 hosted zones',
    executable: false,
  },
  {
    id: 'secretsmanager',
    name: 'AWS Secrets Manager',
    description: 'Store, rotate, and retrieve secrets like DB credentials.',
    examplePrompt: 'List the secrets in Secrets Manager',
    executable: false,
  },
  {
    id: 'ssm',
    name: 'AWS Systems Manager',
    description: 'Operational management: parameters, patching, automation.',
    examplePrompt: 'List my SSM parameters',
    executable: false,
  },
  {
    id: 'kms',
    name: 'AWS KMS',
    description: 'Create and control encryption keys.',
    examplePrompt: 'List my KMS keys',
    executable: false,
  },
  {
    id: 'ecr',
    name: 'Amazon ECR',
    description: 'Fully managed Docker container registry.',
    examplePrompt: 'List my ECR repositories',
    executable: false,
  },
  {
    id: 'cloudtrail',
    name: 'AWS CloudTrail',
    description: 'Governance and audit logging of account activity.',
    examplePrompt: 'List my CloudTrail trails',
    executable: false,
  },
];

export function getServiceById(id) {
  return AWS_SERVICES.find((s) => s.id === id) || null;
}
