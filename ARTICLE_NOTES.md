# AWS Builder Center Article — Evidence & Notes

Use this as the raw material for the required challenge article. Each section
maps to a prompt the article needs to answer. Fill the bracketed bits after you
deploy.

---

## What the application does

AWS CloudCLI is an interactive AWS CLI *learning* tool. You choose a service,
describe your goal in plain English, and Amazon Bedrock generates the correct
AWS CLI command. Crucially, it doesn't stop at the command — it explains the
command, breaks down every token, names the AWS concept, labels the risk, and
lets you safely run read-only commands. A Learning Mode adds guided challenges.

**Tagline:** Ask. Understand. Execute. Learn AWS.

## Why I built it

AI can generate CLI commands, but beginners often run commands they don't
understand — sometimes destructive ones, sometimes straight from an LLM into a
shell. I wanted a tool that teaches *while* it generates, and that makes unsafe
execution impossible by design.

## Development process (BUILD → TEST → DEPLOY → DOCUMENT)

Built in the phased order recommended by the challenge:

1. **Phase 1** — React (Vite) frontend with **mocked AI**, so the full UX worked
   before any cloud resources existed. Deployable immediately.
2. **Phase 2** — Backend scaffolding: AWS SAM template, API Gateway, two Lambdas.
3. **Phase 3** — Amazon Bedrock integration in the `generate` Lambda.
4. **Phase 4 & 5** — The command safety layer + restricted execution Lambda.
5. **Phase 6** — Deployment config (Amplify + SAM).
6. **Phase 7** — Testing (unit suites + manual E2E checklist).

The app stayed deployable after every phase.

## Technical decisions

- **Vite + React** over CRA: faster builds, smaller output, current standard.
- **Two Lambdas, not one.** The `execute` Lambda never sees raw model output;
  it only accepts a string that must pass the allowlist. Separation of concerns
  = smaller blast radius.
- **AWS SDK, not shell.** Instead of shelling out to `aws`, each allowlisted
  command maps to a fixed SDK call. This makes shell injection *structurally*
  impossible, not just filtered.
- **Single source-of-truth validator** in `shared/`, synced into the Lambda
  bundle. Same logic runs in the browser (mock), the backend, and the tests.
- **esbuild bundling for Lambda** with `@aws-sdk/*` marked external (the SDK
  ships in the `nodejs24.x` runtime) — tiny 5.7 KB bundles.
- **Least-privilege IAM** scoped to exactly the actions used.

## Problems encountered & how I solved them

1. **`nodejs20.x` runtime was deprecated.** SAM lint flagged it (disabled for
   creation as of mid-2026). *Fix:* moved both functions to `nodejs24.x`.
2. **`sam build` failed on Windows with `WinError 3` (MAX_PATH).** The deep
   `@aws-sdk` dependency tree exceeded Windows' 260-char path limit when SAM
   copied `node_modules`. *Fix:* switched to the **esbuild** build method and
   marked `@aws-sdk/*` as **external** + moved those packages to
   `devDependencies` (they exist in the Lambda runtime). Bundles dropped to a
   few KB and the copy step no longer touches the SDK tree.
3. **esbuild not found by SAM.** *Fix:* run builds via `npm run build`, which
   puts `node_modules/.bin` on PATH so SAM's esbuild builder resolves it.
4. **Trusting AI output.** *Fix:* the model's command is re-validated against
   the allowlist independently before any execute decision.
5. **Bedrock model access blocked by billing.** My first choice, Claude 3 Haiku,
   failed at invoke time with `INVALID_PAYMENT_INSTRUMENT` because the account
   had no valid payment method for the AWS Marketplace subscription. *Fix:*
   switched to **Amazon Nova Lite**, an AWS-native Bedrock model that needs no
   Marketplace subscription. This also meant adapting the request/response
   schema — Nova uses a `system` + `messages[].content[].text` shape and returns
   `output.message.content[0].text`, unlike Claude's `messages`/`content` format.
6. **The model kept suggesting off-allowlist equivalents.** Nova often returned
   `aws s3api list-buckets` instead of `aws s3 ls` — both read-only and correct,
   but only one was allowlisted, so Execute was disabled. *Fix:* added the
   read-only equivalent to the allowlist (with its own SDK executor) so the demo
   flows, without weakening the security model.

## AWS architecture

React (Vite) → **AWS Amplify Hosting** → **API Gateway** → **AWS Lambda**
(`generate` → **Amazon Bedrock**; `execute` → validator → **AWS SDK** read-only
calls). IAM provides least-privilege roles. CloudFormation (via SAM) provisions
the backend.

## AWS services used

Amplify Hosting, API Gateway, Lambda, Bedrock, IAM, CloudFormation/SAM, and the
read-only targets S3 / EC2 / DynamoDB / STS. (See README table.)

## Deployment process

- Backend: `cd backend && npm run deploy:guided` → note the `ApiBaseUrl` output.
- Frontend: connect the repo in Amplify (auto-detects `amplify.yml`), set
  `VITE_API_BASE_URL` to the API base URL, deploy.
- Lock CORS to the Amplify origin by redeploying the backend with `CorsOrigin`.

## What I learned

- How to place a **safety/validation boundary** between an LLM and any execution.
- Designing execution so injection is impossible by construction (SDK vs shell).
- Least-privilege IAM in practice with SAM policy templates.
- Real-world packaging gotchas (runtime deprecation, Windows path limits,
  bundler externals) — and how to diagnose them from build logs.

## Working application URL

- **Live app:** https://main.da70y6rhrbfc1.amplifyapp.com/
- **Source code:** https://github.com/dineshrajdhanapathyDD/AWS-CloudCLI
- _(The API Gateway endpoint is kept private — the frontend gets it via the
  `VITE_API_BASE_URL` env var; don't publish it in the article.)_

## Screenshots to capture

- Build a Command — generated command + breakdown + risk badge
- Terminal output panel with the "what this means" explanation
- A blocked command (paste `aws s3 ls && rm -rf /`) showing the safety message
- Learning Mode — a solved challenge with the lesson
- (Optional) AWS console: Amplify app, API Gateway routes, Lambda functions,
  the two IAM roles, Bedrock model access.

## Talking points / evidence checklist

- [ ] Screenshot: generated command with full breakdown
- [ ] Screenshot: successful execution + output explanation
- [ ] Screenshot: blocked injection attempt (proves the safety layer)
- [ ] Screenshot: Learning Mode lesson
- [ ] Terminal: shared validator tests (15 passing) and backend handler tests (11 passing)
- [ ] Console: Amplify build succeeded
- [ ] Console: SAM/CloudFormation stack `aws-cloudcli-backend` CREATE_COMPLETE
- [ ] Live URL working end-to-end

## Pricing

CloudCLI is deliberately **serverless and pay-per-use**, so there's nothing
running (or billing) while it sits idle. For the weekend challenge and light
personal use it stays within — or very close to — the AWS Free Tier.

| Service | How you're charged | Demo-scale cost |
| --- | --- | --- |
| Amazon Bedrock (Nova Lite) | Per 1K input/output tokens | A few cents for hundreds of generations |
| AWS Lambda | Per request + GB-seconds (generous free tier) | ~$0 |
| Amazon API Gateway (REST) | ~$3.50 / million requests | ~$0 |
| AWS Amplify Hosting | Build minutes + data served/stored | Cents/month for a static SPA |
| Amazon S3 (SAM deploy bucket) | Storage + requests | Negligible |
| CloudWatch Logs | Log ingestion + storage | Negligible |

**Estimated total:** typically **under $1/month** at demo scale, dominated by
Bedrock token usage — which only grows with how many commands you generate.
Because execution is read-only, there are no surprise costs from spinning up
compute or storage on the target services.

*Tip for the article:* mention setting an **AWS Budgets** alert (e.g. $5) as a
safety net — good practice to show, and a nice "responsible builder" detail.

## Conclusion

AWS CloudCLI set out to solve a specific problem: people can already generate
AWS CLI commands with AI, but they often run commands they don't understand — or
paste raw model output straight into a shell. CloudCLI closes that gap by pairing
**generation with teaching** and putting a strict **safety layer** between the AI
and any execution.

What I'm most proud of is the security design. Instead of filtering shell input,
the execute path never uses a shell at all — each allowlisted, read-only command
maps to a fixed AWS SDK call, so command injection is *impossible by
construction*, not just blocked by a regex. The AI's output is always
re-validated against an explicit allowlist before anything runs, and no
credentials ever touch the browser.

The build followed a clean arc — **BUILD → TEST → DEPLOY → DOCUMENT** — and
stayed deployable at every phase, starting from a fully mocked frontend. Along
the way I hit real-world issues (a deprecated Lambda runtime, Windows path
limits during bundling, and a Bedrock billing block that pushed me from Claude to
Amazon Nova) and solved each one — exactly the kind of hands-on learning this
challenge is about.

The result is a small but genuinely useful app: 21 AWS services in the dropdown,
five with live read-only execution, an interactive quiz to build CLI knowledge,
and a documented, least-privilege, serverless architecture that costs pennies to
run. If I take it further, the next steps are Cognito auth, per-user IAM scoping,
command history in DynamoDB, and a CI pipeline.

**Try it:** https://main.da70y6rhrbfc1.amplifyapp.com/
**Code:** https://github.com/dineshrajdhanapathyDD/AWS-CloudCLI
