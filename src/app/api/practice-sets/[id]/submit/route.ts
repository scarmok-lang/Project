import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const submitSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const set = await prisma.practiceSet.findUnique({
    where: { id },
    include: { questions: true },
  });
  if (!set) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (set.completedAt) {
    return NextResponse.json({ error: "This practice set was already submitted" }, { status: 400 });
  }

  const { answers } = parsed.data;
  const now = new Date();

  await Promise.all(
    set.questions.map((q) => {
      const userAnswer = answers[q.id];
      if (!userAnswer) return Promise.resolve();
      return prisma.practiceQuestion.update({
        where: { id: q.id },
        data: {
          userAnswer,
          isCorrect: userAnswer === q.correctAnswer,
          answeredAt: now,
        },
      });
    })
  );

  const updated = await prisma.practiceSet.update({
    where: { id },
    data: { completedAt: now },
    include: { questions: true, skillTag: true },
  });

  return NextResponse.json({ practiceSet: updated });
}
