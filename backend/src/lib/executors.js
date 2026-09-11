/**
 * Restricted executors — one function per allowlisted command.
 *
 * SECURITY DESIGN: We do NOT shell out. Each allowlisted read-only command is
 * mapped to a specific AWS SDK call. Because there is no shell involved, shell
 * injection is structurally impossible here. The validator still gates input as
 * defense in depth, and only these exact commands have an executor at all.
 *
 * Output is shaped to loosely resemble AWS CLI output so the terminal panel and
 * the "explain the output" feature stay meaningful.
 */
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';

// Map of normalized command -> executor. Only these can ever run.
export const EXECUTORS = {
  'aws sts get-caller-identity': async () => {
    const c = new STSClient({ region: REGION });
    const r = await c.send(new GetCallerIdentityCommand({}));
    return {
      stdout: JSON.stringify({ UserId: r.UserId, Account: r.Account, Arn: r.Arn }, null, 2),
      explanation:
        'Account is your AWS account ID, and Arn identifies exactly which IAM principal made the call.',
    };
  },

  'aws s3 ls': async () => {
    const c = new S3Client({ region: REGION });
    const r = await c.send(new ListBucketsCommand({}));
    const lines = (r.Buckets || [])
      .map((b) => {
        const d = b.CreationDate ? new Date(b.CreationDate).toISOString().replace('T', ' ').slice(0, 19) : '';
        return `${d} ${b.Name}`;
      })
      .join('\n');
    return {
      stdout: lines || '(no buckets found)',
      explanation: 'Each line is a bucket: the creation date/time followed by the bucket name.',
    };
  },

  'aws ec2 describe-instances': async () => {
    const c = new EC2Client({ region: REGION });
    const r = await c.send(new DescribeInstancesCommand({}));
    const reservations = (r.Reservations || []).map((res) => ({
      Instances: (res.Instances || []).map((i) => ({
        InstanceId: i.InstanceId,
        InstanceType: i.InstanceType,
        State: { Name: i.State?.Name },
      })),
    }));
    return {
      stdout: JSON.stringify({ Reservations: reservations }, null, 2),
      explanation: 'Instances are grouped under Reservations. Each shows its ID, type, and current state.',
    };
  },

  'aws lambda list-functions': async () => {
    const c = new LambdaClient({ region: REGION });
    const r = await c.send(new ListFunctionsCommand({}));
    const Functions = (r.Functions || []).map((f) => ({
      FunctionName: f.FunctionName,
      Runtime: f.Runtime,
    }));
    return {
      stdout: JSON.stringify({ Functions }, null, 2),
      explanation: 'The Functions array lists each deployed function with its name and runtime.',
    };
  },

  'aws dynamodb list-tables': async () => {
    const c = new DynamoDBClient({ region: REGION });
    const r = await c.send(new ListTablesCommand({}));
    return {
      stdout: JSON.stringify({ TableNames: r.TableNames || [] }, null, 2),
      explanation: 'TableNames is an array of every table in this account and region.',
    };
  },
};
