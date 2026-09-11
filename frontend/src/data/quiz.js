// Learning Mode quiz. Multiple-choice questions that build AWS CLI knowledge.
// Each question has options, the index of the correct answer, and an
// explanation shown after answering so users learn from every click.
export const QUIZ = [
  {
    id: 'q-whoami',
    question: 'Which command shows the AWS identity your CLI is currently using?',
    options: [
      'aws iam get-user',
      'aws sts get-caller-identity',
      'aws configure list',
      'aws s3 ls',
    ],
    answer: 1,
    explanation:
      'aws sts get-caller-identity returns the account ID and the ARN of the principal (user or role) making the call. It is the fastest way to confirm who you are before debugging permissions.',
    service: 'AWS STS',
  },
  {
    id: 'q-s3-ls',
    question: 'What does "aws s3 ls" do when run with no arguments?',
    options: [
      'Lists the objects in the default bucket',
      'Lists all buckets in your account',
      'Deletes empty buckets',
      'Uploads the current folder to S3',
    ],
    answer: 1,
    explanation:
      'With no path, aws s3 ls lists all buckets owned by your identity. Add a bucket path (s3://name) to list objects inside it. It is read-only and safe.',
    service: 'Amazon S3',
  },
  {
    id: 'q-readonly-verb',
    question: 'Which verb almost always signals a READ-ONLY AWS CLI command?',
    options: ['delete-', 'terminate-', 'describe-', 'put-'],
    answer: 2,
    explanation:
      'describe-*, list-*, and get-* are read-only across most AWS services. Verbs like delete-, terminate-, create-, and put- change state and carry higher risk.',
    service: 'General',
  },
  {
    id: 'q-ec2-instances',
    question: 'How do you inspect your EC2 instances without changing anything?',
    options: [
      'aws ec2 run-instances',
      'aws ec2 stop-instances',
      'aws ec2 describe-instances',
      'aws ec2 terminate-instances',
    ],
    answer: 2,
    explanation:
      'aws ec2 describe-instances is read-only and returns instance IDs, types, and state. run-, stop-, and terminate- all mutate your infrastructure.',
    service: 'Amazon EC2',
  },
  {
    id: 'q-injection',
    question: 'Why does CloudCLI reject a command like "aws s3 ls && rm -rf /"?',
    options: [
      'The bucket name is invalid',
      'It chains commands with && — a shell injection risk',
      'aws s3 ls is not a real command',
      'The region is missing',
    ],
    answer: 1,
    explanation:
      'The && chains a second command. CloudCLI blocks &&, ||, ;, |, >, <, backticks and $() so AI-generated text can never smuggle in extra shell commands.',
    service: 'Security',
  },
  {
    id: 'q-region',
    question: 'DynamoDB "list-tables" only shows tables from where?',
    options: [
      'Every AWS region at once',
      'Only the region your CLI is configured for',
      'Only us-east-1 always',
      'Only tables you created today',
    ],
    answer: 1,
    explanation:
      'DynamoDB is region-scoped. aws dynamodb list-tables returns tables in your configured region only. Switch regions with --region or your profile config.',
    service: 'Amazon DynamoDB',
  },
  {
    id: 'q-lambda-list',
    question: 'Which command lists the Lambda functions in your account and region?',
    options: [
      'aws lambda invoke',
      'aws lambda delete-function',
      'aws lambda list-functions',
      'aws lambda update-function-code',
    ],
    answer: 2,
    explanation:
      'aws lambda list-functions is read-only and returns each function name and runtime. invoke runs code; delete- and update- change state.',
    service: 'AWS Lambda',
  },
  {
    id: 'q-credentials',
    question: 'In CloudCLI, where do the AWS credentials that run commands live?',
    options: [
      'In the browser, entered by the user',
      'In the Lambda execution role (IAM), never the frontend',
      'Hardcoded in the React app',
      'In a public S3 bucket',
    ],
    answer: 1,
    explanation:
      'Credentials never touch the browser. The backend Lambda uses a least-privilege IAM execution role, so no secret keys are exposed to the client.',
    service: 'Security',
  },
];
