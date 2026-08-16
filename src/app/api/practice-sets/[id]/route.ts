import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const set = await prisma.practiceSet.findUnique({
    where: { id },
    include: {
      skillTag: true,
      questions: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Hide answers/explanations until the set has been completed, so the
  // practice UI can't accidentally leak them before the student submits.
  if (!set.completedAt) {
    return NextResponse.json({
      practiceSet: {
        ...set,
        questions: set.questions.map((q) => ({
          id: q.id,
          stem: q.stem,
          choices: q.choices,
          userAnswer: q.userAnswer,
        })),
      },
    });
  }

  return NextResponse.json({ practiceSet: set });
}
