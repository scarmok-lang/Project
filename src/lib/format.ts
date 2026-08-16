export const SECTION_LABELS: Record<string, string> = {
  LOGICAL_REASONING: "Logical Reasoning",
  READING_COMPREHENSION: "Reading Comprehension",
};

export const SECTION_OPTIONS = [
  { value: "LOGICAL_REASONING", label: "Logical Reasoning" },
  { value: "READING_COMPREHENSION", label: "Reading Comprehension" },
];

export function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? section;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
