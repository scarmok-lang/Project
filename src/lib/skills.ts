import { prisma } from "@/lib/prisma";

/**
 * Find or create a SkillTag by name and bump its miss count.
 * Matching is case-insensitive on the trimmed name to keep the AI's
 * canonical-but-imperfect naming from fragmenting into duplicates.
 */
export async function recordSkillMiss(name: string, category: string) {
  const trimmed = name.trim();
  const existing = await prisma.skillTag.findFirst({
    where: { name: { equals: trimmed } },
  });

  if (existing) {
    return prisma.skillTag.update({
      where: { id: existing.id },
      data: { missCount: { increment: 1 } },
    });
  }

  return prisma.skillTag.create({
    data: { name: trimmed, category, missCount: 1 },
  });
}

/**
 * Find or create a SkillTag by name WITHOUT bumping its miss count.
 * Used when re-analyzing a question that was already counted once.
 */
async function findOrCreateSkillTag(name: string, category: string) {
  const trimmed = name.trim();
  const existing = await prisma.skillTag.findFirst({
    where: { name: { equals: trimmed } },
  });
  if (existing) return existing;
  return prisma.skillTag.create({
    data: { name: trimmed, category, missCount: 0 },
  });
}

/**
 * Re-run analysis on a question that was already counted against a skill tag.
 * Moves the miss from the old tag to the new one (a no-op if the skill is unchanged).
 */
export async function reassignSkillMiss(
  previousSkillTagId: string | null,
  name: string,
  category: string
) {
  const newTag = await findOrCreateSkillTag(name, category);

  if (previousSkillTagId === newTag.id) {
    // Same skill as before: it's already counted, just make sure it's at least 1.
    if (newTag.missCount < 1) {
      return prisma.skillTag.update({
        where: { id: newTag.id },
        data: { missCount: { increment: 1 } },
      });
    }
    return newTag;
  }

  if (previousSkillTagId) {
    const previous = await prisma.skillTag.findUnique({
      where: { id: previousSkillTagId },
    });
    if (previous && previous.missCount > 0) {
      await prisma.skillTag.update({
        where: { id: previousSkillTagId },
        data: { missCount: { decrement: 1 } },
      });
    }
  }

  return prisma.skillTag.update({
    where: { id: newTag.id },
    data: { missCount: { increment: 1 } },
  });
}
