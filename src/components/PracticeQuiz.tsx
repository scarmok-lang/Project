"use client";

import { useState } from "react";
import Link from "next/link";

interface QuestionBase {
  id: string;
  stem: string;
  choices: Record<string, string>;
}

interface GradedQuestion extends QuestionBase {
  correctAnswer: string;
  explanation: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
}

interface PracticeSetData {
  id: string;
  skillTag: { id: string; name: string; category: string };
  completedAt: string | null;
  questions: (QuestionBase | GradedQuestion)[];
}

function isGraded(q: QuestionBase | GradedQuestion): q is GradedQuestion {
  return "correctAnswer" in q;
}

export default function PracticeQuiz({ initial }: { initial: PracticeSetData }) {
  const [data, setData] = useState<PracticeSetData>(initial);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completed = Boolean(data.completedAt);
  const allAnswered = data.questions.every((q) => answers[q.id]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/practice-sets/${data.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit");
      setData(json.practiceSet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const correctCount = completed
    ? (data.questions as GradedQuestion[]).filter((q) => q.isCorrect).length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-neutral-500 uppercase tracking-wide">{data.skillTag.category}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{data.skillTag.name}</h1>
        {completed && (
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Score: {correctCount} / {data.questions.length} correct
          </p>
        )}
      </div>

      <div className="space-y-6">
        {data.questions.map((q, idx) => {
          const graded = isGraded(q) ? q : null;
          const selected = answers[q.id];
          return (
            <div
              key={q.id}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
            >
              <p className="text-xs text-neutral-500 mb-2">Question {idx + 1}</p>
              <p className="whitespace-pre-wrap">{q.stem}</p>
              <div className="mt-3 space-y-2">
                {Object.entries(q.choices).map(([letter, text]) => {
                  const isSelected = selected === letter;
                  const isCorrectChoice = graded && letter === graded.correctAnswer;
                  const isWrongPick = graded && graded.userAnswer === letter && !isCorrectChoice;

                  let style =
                    "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700";
                  if (graded) {
                    if (isCorrectChoice)
                      style =
                        "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40";
                    else if (isWrongPick)
                      style = "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40";
                  } else if (isSelected) {
                    style = "border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40";
                  }

                  return (
                    <label
                      key={letter}
                      className={`flex gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${style} ${
                        completed ? "cursor-default" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={letter}
                        checked={isSelected ?? false}
                        disabled={completed}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: letter }))}
                        className="mt-0.5"
                      />
                      <span className="font-medium">{letter}.</span>
                      <span className="flex-1">{text}</span>
                    </label>
                  );
                })}
              </div>
              {graded && (
                <div className="mt-3 rounded-md bg-neutral-50 dark:bg-neutral-800/60 p-3 text-sm">
                  <p className="font-medium">
                    {graded.isCorrect ? "Correct" : "Incorrect"} — the answer is {graded.correctAnswer}.
                  </p>
                  <p className="mt-1 text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                    {graded.explanation}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {!completed ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Grading..." : "Submit answers"}
        </button>
      ) : (
        <div className="flex gap-3">
          <Link
            href="/"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Back to dashboard
          </Link>
          <Link
            href="/history"
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            View practice history
          </Link>
        </div>
      )}
    </div>
  );
}
