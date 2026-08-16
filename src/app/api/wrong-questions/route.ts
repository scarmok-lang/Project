import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { analyzeWrongQuestion } from "@/lib/anthropic";
import { recordSkillMiss } from "@/lib/skills";

const createSchema = z.object({
  section: z.enum(["LOGICAL_REASONING", "READING_COMPREHENSION"]),
  passage: z.string().trim().optional(),
  stem: z.string().trim().min(1, "Question stem is required"),
  choices: z.record(z.string(), z.string().trim().min(1)).refine(
    (c) => Object.keys(c).length >= 2,
    "At least two answer choices are required"
  ),
  correctAnswer: z.string().trim().min(1),
  userAnswer: z.string().trim().min(1),
  source: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function GET() {
  const questions = await prisma.wrongQuestion.findMany({
    orderBy: { createdAt: "desc" },
    include: { skillTag: true },
  });
  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  if (!(data.correctAnswer in data.choices)) {
    return NextResponse.json(
      { error: "correctAnswer must match one of the provided choice letters" },
      { status: 400 }
    );
  }
  if (!(data.userAnswer in data.choices)) {
    return NextResponse.json(
      { error: "userAnswer must match one of the provided choice letters" },
      { status: 400 }
    );
  }

  const question = await prisma.wrongQuestion.create({ data });

  try {
    const analysis = await analyzeWrongQuestion({
      section: data.section,
      passage: data.passage,
      stem: data.stem,
      choices: data.choices,
      correctAnswer: data.correctAnswer,
      userAnswer: data.userAnswer,
    });
    const skillTag = await recordSkillMiss(analysis.coreSkill, analysis.skillCategory);
    const updated = await prisma.wrongQuestion.update({
      where: { id: question.id },
      data: {
        questionType: analysis.questionType,
        coreSkill: analysis.coreSkill,
        errorPattern: analysis.errorPattern,
        explanation: analysis.explanation,
        analyzedAt: new Date(),
        skillTagId: skillTag.id,
      },
      include: { skillTag: true },
    });
    return NextResponse.json({ question: updated }, { status: 201 });
  } catch (err) {
    // Question is still saved even if analysis fails (e.g. missing API key).
    // The client can retry analysis via POST /api/wrong-questions/[id]/analyze.
    return NextResponse.json(
      {
        question,
        analysisError:
          err instanceof Error ? err.message : "Failed to analyze question",
      },
      { status: 201 }
    );
  }
}
