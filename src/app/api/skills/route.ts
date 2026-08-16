import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const skills = await prisma.skillTag.findMany({
    orderBy: { missCount: "desc" },
    include: {
      _count: { select: { wrongQuestions: true, practiceSets: true } },
    },
  });

  const totalWrongQuestions = await prisma.wrongQuestion.count();
  const totalAnalyzed = await prisma.wrongQuestion.count({
    where: { analyzedAt: { not: null } },
  });

  return NextResponse.json({ skills, totalWrongQuestions, totalAnalyzed });
}
