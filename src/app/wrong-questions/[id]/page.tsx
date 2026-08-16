import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sectionLabel, formatDate } from "@/lib/format";
import AnalyzeButton from "@/components/AnalyzeButton";
import DeleteWrongQuestionButton from "@/components/DeleteWrongQuestionButton";
import PracticeSkillButton from "@/components/PracticeSkillButton";

export const dynamic = "force-dynamic";

export default async function WrongQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const question = await prisma.wrongQuestion.findUnique({
    where: { id },
    include: { skillTag: true },
  });
  if (!question) notFound();

  const choices = question.choices as Record<string, string>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/wrong-questions" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          ← All missed questions
        </Link>
        <DeleteWrongQuestionButton questionId={question.id} />
      </div>

      <div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{sectionLabel(question.section)}</span>
          <span>·</span>
          <span>{formatDate(question.createdAt)}</span>
          {question.source && (
            <>
              <span>·</span>
              <span>{question.source}</span>
            </>
          )}
        </div>
        {question.passage && (
          <div className="mt-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-sm whitespace-pre-wrap">
            {question.passage}
          </div>
        )}
        <p className="mt-4 whitespace-pre-wrap">{question.stem}</p>

        <ul className="mt-4 space-y-2">
          {Object.entries(choices).map(([letter, text]) => {
            const isCorrect = letter === question.correctAnswer;
            const isUserPick = letter === question.userAnswer;
            return (
              <li
                key={letter}
                className={`flex gap-2 rounded-md border px-3 py-2 text-sm ${
                  isCorrect
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
                    : isUserPick
                      ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
                      : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <span className="font-medium">{letter}.</span>
                <span className="flex-1">{text}</span>
                {isCorrect && (
                  <span className="shrink-0 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Correct
                  </span>
                )}
                {isUserPick && !isCorrect && (
                  <span className="shrink-0 text-xs font-medium text-red-700 dark:text-red-400">
                    Your pick
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {question.notes && (
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="font-medium">Notes: </span>
            {question.notes}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <h2 className="font-semibold">Diagnosis</h2>
        {question.analyzedAt ? (
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Question type</span>
              <p>{question.questionType}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Core skill</span>
              <p className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{question.coreSkill}</span>
                {question.skillTag && (
                  <span className="text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5">
                    {question.skillTag.category}
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">
                Why you missed it
              </span>
              <p>{question.errorPattern}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-neutral-500">Full explanation</span>
              <p className="whitespace-pre-wrap">{question.explanation}</p>
            </div>
            {question.skillTag && (
              <div className="pt-2">
                <PracticeSkillButton
                  skillTagId={question.skillTag.id}
                  label={`Practice "${question.skillTag.name}"`}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              This question hasn&apos;t been analyzed yet. This usually means the AI analysis failed
              (e.g. missing API key) — try again below.
            </p>
            <div className="mt-3">
              <AnalyzeButton questionId={question.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
