# AWS CloudCLI
# AWS CloudCLI

**Ask. Understand. Execute. Learn AWS.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-online-3fb950)](https://main.da70y6rhrbfc1.amplifyapp.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-ff9900)](./LICENSE)

An interactive AWS CLI learning application. Pick an AWS service, describe what
you want to do in plain English, and CloudCLI uses Amazon Bedrock to generate
the right AWS CLI command — then *teaches* you what it means, breaks it down,
labels its risk, and (for safe read-only commands) lets you run it against a
tightly controlled backend.

- **Live app:** https://main.da70y6rhrbfc1.amplifyapp.com/
- **Source:** https://github.com/dineshrajdhanapathyDD/AWS-CloudCLI

Built for the **AWS Builder Center — Deploy Your First App Weekend Challenge**.

---

## Project overview

CloudCLI turns natural-language intent into a **structured, explained** AWS CLI
command. It never just spits out a command — for every result it shows:

1. The AWS CLI command
2. A short explanation
3. A token-by-token command breakdown
4. The AWS service involved
5. The AWS concept being demonstrated
6. A risk level (e.g. `LOW / READ ONLY`)
7. A **Copy command** button
8. An **Execute** button — only when the command is on the safe allowlist

It also has a **Learning Mode** — an interactive multiple-choice quiz that
builds AWS CLI knowledge, revealing an explanation after every answer and
tracking your score.

## Problem

New AWS users can generate CLI commands with AI, but they often:

- copy commands they don't understand,
- run destructive commands by accident, or
- paste AI output straight into a shell (a real security risk).

CloudCLI fixes this by pairing generation with **teaching** and a strict
**command safety layer**. AI output is never executed directly — it is
re-validated against an explicit allowlist, and execution happens only through a
controlled backend that uses the AWS SDK (no shell at all).

## Features

- Natural-language → AWS CLI command generation via Amazon Bedrock (Amazon Nova Lite)
- **21 AWS services** in the dropdown: 5 with live executable read-only commands
  (S3, EC2, Lambda, DynamoDB, STS) plus 16 popular services in teaching mode
  (IAM, CloudWatch, CloudFormation, RDS, ECS, EKS, SNS, SQS, API Gateway,
  CloudFront, Route 53, Secrets Manager, Systems Manager, KMS, ECR, CloudTrail)
- Full teaching breakdown for every command
- Risk labelling (read-only / medium / high / blocked)
- Copy + one-click Execute for allowlisted read-only commands
- Terminal-style output panel with an "what this means" explanation
- **Learning Mode quiz** — multiple-choice questions with per-answer explanations and scoring
- Learning / Challenge mode
- Loading, empty, error, and execution states; responsive layout
- **Mock mode** so the whole UI works with zero backend (great for local dev/demos)

## Architecture

```
React (Vite SPA)
   │  hosted on
   ▼
AWS Amplify Hosting
   │  HTTPS
   ▼
Amazon API Gateway (REST, /generate + /execute)
   │
   ├── Lambda: generate ──► Amazon Bedrock (Claude) ──► structured JSON
   │
   └── Lambda: execute  ──► Command validator (allowlist) ──► AWS SDK read-only calls
```

Two separate Lambdas by design: the **execute** path never receives raw model
output. It only accepts a command string that must pass the allowlist validator,
and it runs it through fixed AWS SDK calls — there is no shell to inject into.

## AWS services used

| Service | Role in CloudCLI |
| --- | --- |
| **AWS Amplify Hosting** | Hosts and serves the React frontend (CI/CD from Git) |
| **Amazon API Gateway** | REST API exposing `/generate` and `/execute` |
| **AWS Lambda** | Two functions: command generation and controlled execution |
| **Amazon Bedrock** | LLM (Amazon Nova Lite) that generates the structured command |
| **AWS IAM** | Least-privilege execution roles for each Lambda |
| **Amazon S3 / EC2 / DynamoDB / STS** | Targets of the allowlisted read-only demo commands |
| **AWS CloudFormation** | Provisions the backend stack (via AWS SAM) |

## Repository layout

```
.
├── amplify.yml                 # Amplify Hosting build spec (frontend)
├── package.json                # Root: runs shared validator tests
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── api/                # mock + live API layer (VITE_API_BASE_URL toggle)
│   │   ├── components/         # CommandPanel, TerminalOutput, LearningMode, ...
│   │   └── data/               # services + challenges
│   └── .env.example
├── backend/                    # AWS SAM app
│   ├── template.yaml           # API Gateway + 2 Lambdas + IAM (esbuild bundling)
│   ├── samconfig.toml
│   └── src/
│       ├── handlers/           # generate.js, execute.js
│       └── lib/                # bedrock.js, executors.js, commandValidator.js, http.js
├── shared/
│   ├── commandValidator.js     # SOURCE OF TRUTH for the safety layer
│   └── commandValidator.test.js
└── scripts/sync-validator.mjs  # copies validator into the Lambda bundle
```

## Local setup

Prerequisites: **Node.js 20+**, **npm**, and (for the backend) the **AWS CLI**
and **AWS SAM CLI**.

```bash
# 1. Frontend (runs in MOCK mode by default — no backend needed)
cd frontend
npm install
npm run dev        # http://localhost:5173

# 2. Shared validator tests (from repo root)
npm install
npm test           # runs the security/allowlist test suite

# 3. Backend tests
cd backend
npm install
npm test
```

## Environment variables

**Frontend** (`frontend/.env`, see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the deployed API Gateway. **Leave empty for MOCK mode.** |

**Backend** (SAM parameters, see `backend/.env.example`):

| Variable / Param | Purpose |
| --- | --- |
| `BEDROCK_MODEL_ID` | Bedrock model ID (default `amazon.nova-lite-v1:0`) |
| `CORS_ORIGIN` | Allowed CORS origin — set to your Amplify URL in production |
| `AWS_REGION` | Provided automatically by Lambda at runtime |

## Deployment instructions

### Backend (AWS SAM → API Gateway + Lambda + Bedrock)

> Make sure the Bedrock model you use is **enabled** in your account/region
> (Bedrock console → *Model access*).

```bash
cd backend
npm install
npm run deploy:guided     # first time: prompts for stack name, region, etc.
# subsequent deploys:
npm run deploy
```

Copy the `ApiBaseUrl` from the stack outputs — you'll give it to the frontend.

> Note (Windows): `npm run build`/`npm run deploy` add `node_modules/.bin` to
> PATH so the esbuild bundler resolves. If you call `sam build` directly, ensure
> esbuild is on your PATH.

### Frontend (AWS Amplify Hosting)

1. Push this repo to GitHub/GitLab/CodeCommit.
2. In the Amplify console, **Host web app** → connect the repo.
3. Amplify auto-detects `amplify.yml`. It builds `frontend/` and publishes `frontend/dist`.
4. Add an environment variable **`VITE_API_BASE_URL`** = the `ApiBaseUrl` from the SAM stack.
5. (Recommended) Redeploy the backend with `CorsOrigin` set to your Amplify URL.

Leaving `VITE_API_BASE_URL` unset deploys a fully working **mock** demo.

## Security considerations

Security is the core of this project. The command safety layer
(`shared/commandValidator.js`) enforces:

- **Allowlist only.** Only explicitly approved read-only commands can execute.
- **No shell, ever.** The execute Lambda maps each allowlisted command to a fixed
  AWS SDK call. There is no `child_process`/shell, so shell injection is
  structurally impossible.
- **No chaining or injection.** `&&`, `||`, `;`, `|`, `>`, `<`, backticks, `$()`,
  `${}`, newlines, and `&` are all rejected.
- **Destructive verbs blocked.** `delete-*`, `terminate-*`, `create-*`, `put-*`,
  etc. are rejected even before the allowlist check.
- **AI output is never trusted.** Model output is re-validated independently
  before any execution decision.
- **No credentials in the browser.** The frontend never holds AWS keys. Lambdas
  use least-privilege IAM execution roles.
- **Least-privilege IAM.** generate → `bedrock:InvokeModel` only; execute →
  exactly the five read-only actions its executors use.
- **Explicit user action + visible risk** required before any execution.

## Testing

```bash
# Security/allowlist suite (15 tests)
npm test                    # from repo root

# Backend handler suite (11 tests, scenarios 9/10/12 + execution security)
cd backend && npm test
```

The suites cover all 12 required scenarios:

1. Valid S3 request · 2. Valid STS request · 3. Valid EC2 read-only ·
4. Valid Lambda read-only · 5. Valid DynamoDB read-only ·
6. Invalid/unsupported command · 7. Dangerous command · 8. Shell injection ·
9. Bedrock failure · 10. AWS API failure · 11. Empty request ·
12. Invalid service selection.

See [`TESTING.md`](./TESTING.md) for the manual end-to-end checklist.

## Known limitations

- The dropdown offers **21 services**, but only **five** (S3, EC2, Lambda,
  DynamoDB, STS) have executable read-only commands. The other 16 are
  "teaching mode": CloudCLI generates and explains a real command, but Execute
  is disabled. This is intentional.
- Execution is **read-only** only. No mutating commands can run.
- Bedrock output can vary; if the model suggests a non-allowlisted command, the
  UI shows it but disables Execute.
- No auth on the API in the MVP (lock down `CorsOrigin` and add API keys/Cognito
  for real use).

## Future improvements

- Add Amazon Cognito auth + per-user IAM scoping.
- Persist command history in DynamoDB.
- Expand the allowlist (still read-only) and add pagination for large outputs.
- Add a "dry-run / explain-only" toggle and cost-awareness hints.
- CI pipeline (GitHub Actions) running the test suites on every push.

## Screenshots

_Add screenshots here after deploying:_

- `docs/screenshot-build.png` — Build a Command view
- `docs/screenshot-output.png` — Terminal output + explanation
- `docs/screenshot-learning.png` — Learning Mode

## Cost / pricing

CloudCLI runs on **serverless, pay-per-use** services, so idle cost is
effectively zero and a demo workload costs cents. Rough figures for `us-east-1`
(check the AWS pricing pages for current rates):

| Service | Pricing model | Typical demo cost |
| --- | --- | --- |
| **Amazon Bedrock — Nova Lite** | Per 1K input/output tokens (fractions of a cent per request) | A few cents for hundreds of generations |
| **AWS Lambda** | Free tier: 1M requests + 400K GB-sec/month | ~$0 at demo scale |
| **Amazon API Gateway (REST)** | ~$3.50 per million requests + data transfer | ~$0 at demo scale |
| **AWS Amplify Hosting** | Build minutes + GB served/stored (small monthly free allowance) | Cents/month for a static SPA |
| **S3 (SAM deploy bucket)** | Storage + requests | Negligible |
| **CloudWatch Logs** | Ingestion + storage | Negligible at demo scale |

**Bottom line:** for the weekend challenge and light personal use, expect this
to stay within or near the AWS Free Tier — typically well under **$1/month**.
The main variable is Bedrock token usage, which scales only with how many
commands you generate.

> Tip: set a small **AWS Budgets** alert (e.g. $5) to stay worry-free.

## License

Released under the [MIT License](./LICENSE). © 2026 Dinesh Raj Dhanapathy (DD).

## Live deployment URL

> **Live app:** https://main.da70y6rhrbfc1.amplifyapp.com/
> **Source code:** https://github.com/dineshrajdhanapathyDD/AWS-CloudCLI

The backend API endpoint is intentionally not published here. The frontend
receives it at build time via the `VITE_API_BASE_URL` environment variable
(set in Amplify), and the SAM stack prints it as the `ApiBaseUrl` output.

---

Built with React, AWS Amplify, API Gateway, AWS Lambda, and Amazon Bedrock.

