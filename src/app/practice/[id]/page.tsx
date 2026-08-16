import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PracticeQuiz from "@/components/PracticeQuiz";

export const dynamic = "force-dynamic";

export default async function PracticeSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const set = await prisma.practiceSet.findUnique({
    where: { id },
    include: { skillTag: true, questions: { orderBy: { createdAt: "asc" } } },
  });
  if (!set) notFound();

  const completed = Boolean(set.completedAt);

  const initial = {
    id: set.id,
    skillTag: set.skillTag,
    completedAt: set.completedAt ? set.completedAt.toISOString() : null,
    questions: set.questions.map((q) => {
      const choices = q.choices as Record<string, string>;
      if (!completed) {
        return { id: q.id, stem: q.stem, choices };
      }
      return {
        id: q.id,
        stem: q.stem,
        choices,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
      };
    }),
  };

  return <PracticeQuiz initial={initial} />;
}
