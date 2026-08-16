"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteWrongQuestionButton({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm("Delete this logged question? This can't be undone.")) return;
    setLoading(true);
    try {
      await fetch(`/api/wrong-questions/${questionId}`, { method: "DELETE" });
      router.push("/wrong-questions");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-60"
    >
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
