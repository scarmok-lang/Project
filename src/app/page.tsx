import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sectionLabel, formatDate } from "@/lib/format";
import PracticeSkillButton from "@/components/PracticeSkillButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [skills, recentWrong, practiceSets, totalWrong] = await Promise.all([
    prisma.skillTag.findMany({
      orderBy: { missCount: "desc" },
      take: 8,
      include: { _count: { select: { wrongQuestions: true } } },
    }),
    prisma.wrongQuestion.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { skillTag: true },
    }),
    prisma.practiceSet.findMany({
      where: { completedAt: { not: null } },
      include: { questions: true },
    }),
    prisma.wrongQuestion.count(),
  ]);

  const totalPracticeQuestions = practiceSets.reduce((sum, s) => sum + s.questions.length, 0);
  const totalCorrect = practiceSets.reduce(
    (sum, s) => sum + s.questions.filter((q) => q.isCorrect).length,
    0
  );
  const accuracy = totalPracticeQuestions > 0 ? Math.round((totalCorrect / totalPracticeQuestions) * 100) : null;

  const maxMiss = skills[0]?.missCount ?? 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          Log the questions you miss and LSAT Coach will find the patterns and build practice around them.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Missed questions logged" value={totalWrong} />
        <StatCard label="Skill gaps identified" value={skills.length} />
        <StatCard label="Practice questions completed" value={totalPracticeQuestions} />
        <StatCard label="Practice accuracy" value={accuracy !== null ? `${accuracy}%` : "—"} />
      </div>

      {totalWrong === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
          <h2 className="font-medium text-lg">No missed questions logged yet</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Start by logging a question you got wrong from an official LSAT question bank or PrepTest.
          </p>
          <Link
            href="/wrong-questions/new"
            className="mt-4 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Log your first missed question
          </Link>
        </div>
      ) : (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your biggest skill gaps</h2>
            <Link href="/wrong-questions" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              View all missed questions →
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {skills.map((skill) => (
              <li
                key={skill.id}
                className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5">
                        {skill.category}
                      </span>
                    </div>
                    {skill.description && (
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{skill.description}</p>
                    )}
                    <div className="mt-2 h-1.5 w-full max-w-xs rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${maxMiss > 0 ? Math.max(8, (skill.missCount / maxMiss) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      Missed {skill.missCount} question{skill.missCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <PracticeSkillButton skillTagId={skill.id} className="shrink-0" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentWrong.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Recently logged</h2>
          <ul className="mt-4 divide-y divide-neutral-200 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            {recentWrong.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/wrong-questions/${q.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate">{q.stem}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {sectionLabel(q.section)} · {formatDate(q.createdAt)}
                      {q.skillTag ? ` · ${q.skillTag.name}` : q.analyzedAt ? "" : " · analysis pending"}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 shrink-0">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
    </div>
  );
}
