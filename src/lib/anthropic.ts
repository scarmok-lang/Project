import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file to enable AI analysis and question generation."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export type Section = "LOGICAL_REASONING" | "READING_COMPREHENSION" | "LOGIC_GAMES";

const SECTION_LABEL: Record<Section, string> = {
  LOGICAL_REASONING: "Logical Reasoning",
  READING_COMPREHENSION: "Reading Comprehension",
  LOGIC_GAMES: "Logic Games (Analytical Reasoning)",
};

export interface ChoiceMap {
  [key: string]: string;
}

export interface WrongQuestionInput {
  section: Section;
  passage?: string | null;
  stem: string;
  choices: ChoiceMap;
  correctAnswer: string;
  userAnswer: string;
}

export interface AnalysisResult {
  questionType: string;
  coreSkill: string;
  skillCategory: string;
  errorPattern: string;
  explanation: string;
}

/**
 * Given an LSAT question the user answered incorrectly, ask Claude to diagnose
 * the specific reasoning skill the question hinges on and why the user's chosen
 * answer is a tempting-but-wrong trap for that skill.
 */
export async function analyzeWrongQuestion(
  q: WrongQuestionInput
): Promise<AnalysisResult> {
  const anthropic = getClient();

  const choicesText = Object.entries(q.choices)
    .map(([letter, text]) => `(${letter}) ${text}`)
    .join("\n");

  const userPrompt = `Section: ${SECTION_LABEL[q.section]}
${q.passage ? `Passage:\n${q.passage}\n\n` : ""}Question stem:
${q.stem}

Answer choices:
${choicesText}

Correct answer: ${q.correctAnswer}
Answer the student chose: ${q.userAnswer}

Diagnose this missed question.`;

  const tool: Anthropic.Tool = {
    name: "record_analysis",
    description:
      "Record a diagnostic analysis of an LSAT question the student answered incorrectly.",
    input_schema: {
      type: "object",
      properties: {
        questionType: {
          type: "string",
          description:
            "The canonical LSAT question type, e.g. 'Necessary Assumption', 'Strengthen', 'Flaw in the Reasoning', 'Must Be True', 'Parallel Reasoning', 'Main Point', 'Method of Reasoning', 'Resolve the Paradox', 'Point at Issue', 'Sufficient Assumption', or the equivalent RC/Logic Games category.",
        },
        coreSkill: {
          type: "string",
          description:
            "A short, reusable, canonical name for the *specific reasoning skill* this question tests — not the question type, but the underlying logical skill or common trap, e.g. 'Necessary vs. Sufficient Conditions', 'Correlation vs. Causation', 'Quantifier Shift (some/most/all)', 'Scope Shift / Equivocation', 'Overlooked Alternative Explanations', 'Circular Reasoning Detection', 'Sampling & Representativeness'. Use consistent, canonical naming so this skill can be matched across many different questions.",
        },
        skillCategory: {
          type: "string",
          description:
            "Broad category the core skill belongs to, e.g. 'Logical Reasoning', 'Reading Comprehension', or 'Logic Games'.",
        },
        errorPattern: {
          type: "string",
          description:
            "1-3 sentences explaining specifically why the student's chosen answer is wrong and why it was tempting — tie it directly to the core skill gap, not a generic explanation.",
        },
        explanation: {
          type: "string",
          description:
            "A full explanation (3-6 sentences) of why the correct answer is correct and why each other notably tempting distractor fails.",
        },
      },
      required: [
        "questionType",
        "coreSkill",
        "skillCategory",
        "errorPattern",
        "explanation",
      ],
    },
  };

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system:
      "You are an expert LSAT tutor who has scored a perfect 180 and has taught thousands of students. You are precise about LSAT terminology and skilled at isolating the exact reasoning skill a question is testing, not just its surface question type. Always call the record_analysis tool with your diagnosis.",
    tools: [tool],
    tool_choice: { type: "tool", name: "record_analysis" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude did not return a structured analysis.");
  }
  return toolUse.input as AnalysisResult;
}

export interface GeneratedQuestion {
  stem: string;
  choices: ChoiceMap;
  correctAnswer: string;
  explanation: string;
}

/**
 * Generate new, original LSAT-style practice questions that target a specific
 * reasoning skill the student has struggled with, optionally grounded in
 * examples of questions they've previously missed on that skill.
 */
export async function generatePracticeQuestions(params: {
  skillName: string;
  skillCategory: string;
  count: number;
  exampleMisses: { stem: string; errorPattern: string }[];
}): Promise<GeneratedQuestion[]> {
  const anthropic = getClient();
  const { skillName, skillCategory, count, exampleMisses } = params;

  const examplesText = exampleMisses.length
    ? `Here are examples of real questions the student has previously missed on this exact skill, and why they missed them:\n\n${exampleMisses
        .map(
          (e, i) =>
            `Example ${i + 1}:\nStem: ${e.stem}\nWhy they missed it: ${e.errorPattern}`
        )
        .join("\n\n")}\n\n`
    : "";

  const userPrompt = `${examplesText}Generate ${count} brand-new, original LSAT-style ${skillCategory} practice question(s) that specifically drill the reasoning skill: "${skillName}".

Requirements:
- Each question must be an entirely original stimulus/argument (never copy real LSAT content), written in authentic LSAT style and difficulty.
- Each question must have exactly 5 answer choices labeled A-E, with exactly one correct answer.
- The incorrect choices should include realistic distractors that specifically exploit the "${skillName}" weakness, similar in spirit to the example misses above (if any) but with different surface content.
- Include a clear, rigorous explanation of why the correct answer is right and briefly why the strongest distractor(s) are wrong.
- Vary the topic/subject matter across questions so the student isn't just pattern-matching content.`;

  const tool: Anthropic.Tool = {
    name: "record_practice_questions",
    description: "Record a batch of newly generated LSAT practice questions.",
    input_schema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stem: {
                type: "string",
                description:
                  "The full stimulus/argument plus the question line, formatted as it would appear on the LSAT.",
              },
              choices: {
                type: "object",
                description:
                  "Map of answer letter to answer text. Must have exactly keys A, B, C, D, E.",
                properties: {
                  A: { type: "string" },
                  B: { type: "string" },
                  C: { type: "string" },
                  D: { type: "string" },
                  E: { type: "string" },
                },
                required: ["A", "B", "C", "D", "E"],
              },
              correctAnswer: {
                type: "string",
                description: "The letter (A-E) of the correct answer.",
              },
              explanation: {
                type: "string",
                description:
                  "Explanation of why the correct answer is right and why the best distractor(s) are wrong.",
              },
            },
            required: ["stem", "choices", "correctAnswer", "explanation"],
          },
        },
      },
      required: ["questions"],
    },
  };

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system:
      "You are an expert LSAT question writer who has authored official-style practice questions professionally. You write original, rigorous, well-calibrated LSAT questions with no ambiguity about the single best answer. Always call the record_practice_questions tool.",
    tools: [tool],
    tool_choice: { type: "tool", name: "record_practice_questions" },
    messages: [{ role: "user", content: userPrompt }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  if (!toolUse) {
    throw new Error("Claude did not return structured practice questions.");
  }
  const input = toolUse.input as { questions: GeneratedQuestion[] };
  return input.questions;
}
