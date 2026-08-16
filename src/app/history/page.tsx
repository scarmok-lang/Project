import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const sets = await prisma.practiceSet.findMany({
    orderBy: { createdAt: "desc" },
    include: { skillTag: true, questions: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Practice History</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Every practice set you&apos;ve generated, and how you scored.
        </p>
      </div>

      {sets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-neutral-600 dark:text-neutral-400">
          No practice sets yet. Generate one from a skill gap on your dashboard.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          {sets.map((set) => {
            const total = set.questions.length;
            const correct = set.questions.filter((q) => q.isCorrect).length;
            const completed = Boolean(set.completedAt);
            return (
              <li key={set.id}>
                <Link
                  href={`/practice/${set.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{set.skillTag.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {set.skillTag.category} · {formatDate(set.createdAt)} · {total} question
                      {total === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs rounded-full px-2 py-0.5 ${
                      completed
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {completed ? `${correct}/${total} correct` : "in progress"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
