import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generatePracticeQuestions } from "@/lib/anthropic";

const createSchema = z.object({
  skillTagId: z.string().min(1),
  count: z.number().int().min(1).max(10).default(5),
});

export async function GET() {
  const sets = await prisma.practiceSet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      skillTag: true,
      questions: { select: { id: true, isCorrect: true } },
    },
  });

  const summarized = sets.map((set) => ({
    id: set.id,
    skillTag: set.skillTag,
    createdAt: set.createdAt,
    completedAt: set.completedAt,
    totalQuestions: set.questions.length,
    correctCount: set.questions.filter((q) => q.isCorrect).length,
  }));

  return NextResponse.json({ practiceSets: summarized });
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
  const { skillTagId, count } = parsed.data;

  const skillTag = await prisma.skillTag.findUnique({ where: { id: skillTagId } });
  if (!skillTag) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  const exampleMissesRaw = await prisma.wrongQuestion.findMany({
    where: { skillTagId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const exampleMisses = exampleMissesRaw
    .filter((q) => q.errorPattern)
    .map((q) => ({ stem: q.stem, errorPattern: q.errorPattern as string }));

  try {
    const generated = await generatePracticeQuestions({
      skillName: skillTag.name,
      skillCategory: skillTag.category,
      count,
      exampleMisses,
    });

    const practiceSet = await prisma.practiceSet.create({
      data: {
        skillTagId,
        questions: {
          create: generated.map((q) => ({
            stem: q.stem,
            choices: q.choices,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        },
      },
      include: { questions: true, skillTag: true },
    });

    return NextResponse.json({ practiceSet }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate practice set" },
      { status: 500 }
    );
  }
}
