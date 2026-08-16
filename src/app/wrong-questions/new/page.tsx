"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SECTION_OPTIONS } from "@/lib/format";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function NewWrongQuestionPage() {
  const router = useRouter();
  const [section, setSection] = useState("LOGICAL_REASONING");
  const [passage, setPassage] = useState("");
  const [stem, setStem] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({
    A: "",
    B: "",
    C: "",
    D: "",
    E: "",
  });
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const filledChoices = Object.fromEntries(
      Object.entries(choices).filter(([, text]) => text.trim().length > 0)
    );

    if (!stem.trim()) return setError("Question stem is required.");
    if (Object.keys(filledChoices).length < 2)
      return setError("Enter at least two answer choices.");
    if (!correctAnswer) return setError("Select the correct answer.");
    if (!userAnswer) return setError("Select the answer you chose.");
    if (!(correctAnswer in filledChoices))
      return setError("The correct answer must have choice text filled in.");
    if (!(userAnswer in filledChoices))
      return setError("Your chosen answer must have choice text filled in.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/wrong-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          passage: passage.trim() || undefined,
          stem: stem.trim(),
          choices: filledChoices,
          correctAnswer,
          userAnswer,
          source: source.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save question");
      router.push(`/wrong-questions/${data.question.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Log a missed question</h1>
      <p className="mt-1 text-neutral-600 dark:text-neutral-400">
        Paste in a question you got wrong from an official question bank or PrepTest. LSAT Coach
        will diagnose the exact reasoning skill it tests.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Field label="Section">
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="input"
          >
            {SECTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        {section === "READING_COMPREHENSION" && (
          <Field label="Passage (optional, paste relevant excerpt)">
            <textarea
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              rows={6}
              className="input"
              placeholder="Paste the passage or relevant excerpt..."
            />
          </Field>
        )}

        <Field label="Question stem">
          <textarea
            value={stem}
            onChange={(e) => setStem(e.target.value)}
            rows={4}
            className="input"
            placeholder="e.g. Which one of the following, if true, most weakens the argument above?"
            required
          />
        </Field>

        <Field label="Answer choices">
          <div className="space-y-2">
            {LETTERS.map((letter) => (
              <div key={letter} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-sm font-medium text-neutral-500">
                  {letter}
                </span>
                <input
                  value={choices[letter]}
                  onChange={(e) =>
                    setChoices((c) => ({ ...c, [letter]: e.target.value }))
                  }
                  className="input"
                  placeholder={`Choice ${letter}${letter === "A" || letter === "B" ? "" : " (optional)"}`}
                />
              </div>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Correct answer">
            <AnswerPicker
              choices={choices}
              value={correctAnswer}
              onChange={setCorrectAnswer}
            />
          </Field>
          <Field label="Your answer">
            <AnswerPicker choices={choices} value={userAnswer} onChange={setUserAnswer} />
          </Field>
        </div>

        <Field label="Source (optional)">
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="input"
            placeholder="e.g. PrepTest 90, Section 2, Q14"
          />
        </Field>

        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="input"
            placeholder="Anything else you want to remember about this question..."
          />
        </Field>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-wait"
        >
          {submitting ? "Analyzing..." : "Save & Analyze"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}

function AnswerPicker({
  choices,
  value,
  onChange,
}: {
  choices: Record<string, string>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
      <option value="">Select...</option>
      {LETTERS.filter((l) => choices[l]?.trim()).map((letter) => (
        <option key={letter} value={letter}>
          {letter}
        </option>
      ))}
    </select>
  );
}
