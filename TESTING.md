# Testing

## Automated tests

Two suites cover the 12 required scenarios.

```bash
# Security / allowlist validator (14 tests) — from repo root
npm test

# Backend handlers: Bedrock failure, AWS API failure, invalid service,
# execution security (11 tests)
cd backend && npm test
```

### Coverage map (12 required scenarios)

| # | Scenario | Where tested |
| --- | --- | --- |
| 1 | Valid S3 request | validator + generate handler |
| 2 | Valid STS request | validator |
| 3 | Valid EC2 read-only request | validator |
| 4 | Valid Lambda read-only request | validator |
| 5 | Valid DynamoDB read-only request | validator |
| 6 | Invalid/unsupported command | validator + execute handler |
| 7 | Dangerous command | validator + execute handler |
| 8 | Shell injection attempt | validator + execute handler |
| 9 | Bedrock failure | generate handler (mocked failure) |
| 10 | AWS API failure | execute handler (mocked SDK error) |
| 11 | Empty user request | validator + generate handler |
| 12 | Invalid service selection | generate handler |

## Manual end-to-end checklist (after deploy)

Run these against the live app. In mock mode they also work locally.

### Build a Command
1. Select **Amazon S3**, ask "list my buckets" → expect `aws s3 ls`, risk
   `LOW / READ ONLY`, breakdown shown, Execute enabled.
2. Click **Execute** → terminal shows buckets + "what this means" explanation.
3. Select **AWS STS**, ask "who am I" → `aws sts get-caller-identity`, execute →
   shows Account + Arn.
4. Repeat for EC2 / Lambda / DynamoDB.

### Safety
5. In the request box, describe a delete/terminate action. If the model returns
   a mutating command, **Execute must be disabled**.
6. (Live API) POST `{"command":"aws s3 ls && rm -rf /"}` to `/execute` → expect
   `success:false`, risk `BLOCKED`, a clear rejection message. **Nothing runs.**
7. POST `{"command":"ls -la"}` → rejected (not an aws command).
8. POST `{"command":"aws ec2 terminate-instances --instance-ids i-1"}` →
   rejected as mutating/destructive.

### States
9. Empty request → inline error, no API call.
10. Invalid service (via API) → `INVALID_SERVICE`.
11. Loading spinner appears while generating/executing.
12. Learning Mode: solve a challenge → correct feedback, runs, shows the lesson;
    a wrong answer shows a hint.

### Record evidence
- Screenshot each of the above for the article (see `ARTICLE_NOTES.md`).
