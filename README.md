# LSAT Coach

A personalized LSAT prep tool: log the questions you get wrong on official LSAT
question banks and PrepTests, and it diagnoses the specific reasoning skill each
one hinges on — not just the surface question type — then generates original
practice questions targeted at your actual gaps.

## How it works

1. **Log a miss** (`/wrong-questions/new`) — paste in the question stem, answer
   choices, the correct answer, and the answer you picked.
2. **Diagnosis** — Claude analyzes the question and identifies:
   - the LSAT question type (Strengthen, Necessary Assumption, Flaw, etc.)
   - the underlying **core reasoning skill** it tests (e.g. "Necessary vs.
     Sufficient Conditions", "Correlation vs. Causation", "Quantifier Shift")
   - why your chosen answer was a tempting trap for that specific skill
3. **Dashboard** (`/`) — misses are aggregated by core skill so you can see
   your biggest gaps at a glance, ranked by how often they show up.
4. **Practice** — generate a fresh batch of original, LSAT-style questions
   targeted at one skill gap, grounded in the real questions you've missed on
   it. Take the quiz, get graded, and read explanations tied to the same
   skill.
5. **History** (`/history`) — track every practice set and your accuracy
   over time.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + SQLite for storage
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) for
  question analysis and generation (via tool-use for structured output)

## Getting started

```bash
npm install
cp .env.example .env   # then add your ANTHROPIC_API_KEY
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Get an API key at [console.anthropic.com](https://console.anthropic.com/).
Without a key set, you can still log missed questions — analysis and practice
generation will show a clear error until a key is added, and you can retry
analysis at any time from a question's detail page.

## Data model

- `WrongQuestion` — a missed question plus its AI diagnosis
- `SkillTag` — a normalized reasoning skill, aggregated across misses
- `PracticeSet` / `PracticeQuestion` — a generated, gradable practice quiz
  targeting one skill

See `prisma/schema.prisma` for the full schema.
