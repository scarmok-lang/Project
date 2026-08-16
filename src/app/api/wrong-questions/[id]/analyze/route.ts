import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeWrongQuestion, ChoiceMap, Section } from "@/lib/anthropic";
import { reassignSkillMiss } from "@/lib/skills";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const question = await prisma.wrongQuestion.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const analysis = await analyzeWrongQuestion({
      section: question.section as Section,
      passage: question.passage,
      stem: question.stem,
      choices: question.choices as ChoiceMap,
      correctAnswer: question.correctAnswer,
      userAnswer: question.userAnswer,
    });
    const skillTag = await reassignSkillMiss(
      question.skillTagId,
      analysis.coreSkill,
      analysis.skillCategory
    );
    const updated = await prisma.wrongQuestion.update({
      where: { id },
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
    return NextResponse.json({ question: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze question" },
      { status: 500 }
    );
  }
}
