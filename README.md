# AI Resume Reviewer & Mock Interview Platform

A polished Next.js and TypeScript code sample for AI-assisted resume feedback and
mock interview practice. Users can upload a PDF or DOCX resume, request a
role-targeted review, and complete an eight-question interview with structured
answer feedback.

The scores in this project are AI-assisted estimates for practice and educational
use. They do not reproduce or claim to represent any employer's applicant tracking
system or hiring algorithm.

## Features

- PDF and DOCX resume text extraction
- General or job-description-targeted resume feedback
- Five-category resume scoring and position-level suggestions
- Missing-keyword and strong-match analysis
- Copyable rewritten resume bullets
- Three behavioral, three technical, and two project interview questions
- Structured answer scoring, feedback, and improved-answer examples
- Refresh-safe browser persistence for active and completed interviews
- Accessible inline error messages and retryable generation failures
- Responsive Tailwind CSS interface

## Sample Results

A completed resume review includes an overall score, five category scores,
job-match insights, focused suggestions, and rewritten bullet points. For example:

```json
{
  "overallScore": 75,
  "categories": [
    {
      "name": "Impact",
      "score": 15,
      "feedback": "The resume demonstrates relevant project experience.",
      "suggestions": [
        "Add measurable outcomes to project descriptions."
      ]
    }
  ],
  "improvedBullets": [
    "Built a TypeScript application that reduced processing time by 30%."
  ]
}
```

The mock interview also provides an overall answer score, communication and
technical-depth scores, actionable feedback, and an improved answer example.

> Sample results are representative. Actual results vary by resume, target role,
> job description, and model response. AI-generated scores are intended for
> educational and career-preparation use, not as an employer's ATS score or hiring
> decision.

## Architecture

The application uses the Next.js App Router and keeps server and browser concerns
separate:

```text
src/
├── app/
│   ├── api/
│   │   ├── parse/                 # PDF/DOCX extraction
│   │   ├── review/                # Structured resume review
│   │   └── interview/
│   │       ├── generate/          # Structured question generation
│   │       └── score/             # Structured answer evaluation
│   ├── HomeClient.tsx             # Resume state and request orchestration
│   └── interview/InterviewClient.tsx
├── components/
│   ├── ErrorMessage.tsx
│   ├── resume/                    # Resume form and result presentation
│   └── interview/                 # Interview question and report presentation
└── lib/
    ├── openai.ts                  # Lazy server-side OpenAI client
    ├── prompts.ts                 # Resume-review prompt
    ├── schemas.ts                 # Shared Zod schemas and inferred types
    └── storage.ts                 # Validated sessionStorage helpers
```

Client components retain state and request orchestration. Focused presentation
components receive typed props and callbacks. API routes validate requests before
calling OpenAI and validate application-level invariants before returning data.

## Runtime Validation and Structured Outputs

Zod provides a shared contract across API routes, React components, tests, and
browser storage. Validation includes:

- Input size limits and required request fields
- Exactly five named resume categories
- Category and overall score ranges
- Overall score consistency with category totals
- Unique interview question IDs and question text
- Exact 3/3/2 interview-question composition
- Answer-feedback score ranges
- Consistent interview-session index and completion state

The OpenAI routes use the SDK's `zodResponseFormat` helper with
`chat.completions.parse()`. Model-facing schemas contain only Structured
Outputs-compatible Zod objects. Application-only refinements run after parsing.
Missing parsed output, refusals, and inconsistent results return clear `502`
responses rather than being trusted by the UI.

## Browser Session Persistence

Resume review input/results, mock interview input, and interview sessions are stored
in `sessionStorage`. Every read is parsed and validated with Zod. Missing, malformed,
or outdated values return `null` and are removed safely.

Interview persistence records:

- Generated questions immediately after successful generation
- Each submitted answer and its feedback atomically
- The current question index
- Completion status

Refreshing restores the correct question, answer, and feedback. Restarting an
interview clears only the interview-session entry.

Session storage survives refreshes in the current tab but is cleared when that tab's
page session ends. It is not a substitute for authenticated, server-side persistence.

## Error and Rate-Limit Handling

API responses use stable error codes, human-readable messages, and a `retryable`
flag. Routes distinguish invalid input, missing configuration, model refusals,
invalid model output, provider rate limits, and temporary provider outages. OpenAI
request IDs are logged server-side when available.

Provider rate limits return HTTP `429`, but this sample does not implement a shared
distributed rate limiter. A production multi-user deployment should add
identity-aware throttling, abuse prevention, monitoring, and centralized logs.

## Local Development

Requirements:

- Node.js 20 or newer
- npm
- An OpenAI API key for live AI requests

Install dependencies and start the application:

```bash
npm install
npm run dev
```

Configure `OPENAI_API_KEY` in the local Next.js environment before making live
review or interview requests. Open <http://localhost:3000> in a browser.

## Quality Commands

```bash
npm run lint       # ESLint
npm test           # Vitest unit and mocked API-route tests
npm run build      # Production build and TypeScript validation
npm run test:e2e   # Playwright mocked browser workflow
```

Install Playwright's Chromium runtime once before the first end-to-end run:

```bash
npx playwright install chromium
```

## Testing

Vitest covers schema refinements and all OpenAI-backed API routes. The OpenAI client
is mocked, so tests do not require secrets, call the provider, or consume credits.
Coverage includes invalid and oversized input, valid structured responses, missing
or inconsistent output, refusals, rate limits, and interview composition.

The Playwright test mocks the application's API routes and verifies the browser
workflow from resume entry through rendered feedback and generated interview
questions.

GitHub Actions runs on pushes and pull requests with Node.js 20:

```text
npm ci → npm run lint → npm test → npm run build
```

## Technology

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS
- OpenAI JavaScript SDK
- Zod
- `pdfreader` and `mammoth`
- Vitest
- Playwright

## Current Limitations

- No user accounts, database, or cross-device history
- No distributed application-level rate limiter
- AI feedback can be incomplete or inaccurate and should be reviewed critically
- PDF extraction quality depends on the source document; scanned PDFs need OCR,
  which is outside this sample's scope
- Resume and interview content is sent to the configured AI provider for processing

These boundaries keep the repository focused as a clear, reviewable MLH code sample.
