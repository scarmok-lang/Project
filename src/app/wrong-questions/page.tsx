import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sectionLabel, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WrongQuestionsPage() {
  const questions = await prisma.wrongQuestion.findMany({
    orderBy: { createdAt: "desc" },
    include: { skillTag: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Missed Questions</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Every question you&apos;ve logged, with its diagnosed skill gap.
          </p>
        </div>
        <Link
          href="/wrong-questions/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 whitespace-nowrap"
        >
          + Log a miss
        </Link>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-neutral-600 dark:text-neutral-400">
          Nothing logged yet.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          {questions.map((q) => (
            <li key={q.id}>
              <Link
                href={`/wrong-questions/${q.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate">{q.stem}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {sectionLabel(q.section)} · {formatDate(q.createdAt)}
                    {q.source ? ` · ${q.source}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {q.skillTag ? (
                    <span className="text-xs rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5">
                      {q.skillTag.name}
                    </span>
                  ) : (
                    <span className="text-xs rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5">
                      analysis pending
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
