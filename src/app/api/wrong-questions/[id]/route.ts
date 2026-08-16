import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const question = await prisma.wrongQuestion.findUnique({
    where: { id },
    include: { skillTag: true },
  });
  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ question });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const question = await prisma.wrongQuestion.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ ok: true });
  }
  if (question.skillTagId) {
    const tag = await prisma.skillTag.findUnique({ where: { id: question.skillTagId } });
    if (tag && tag.missCount > 0) {
      await prisma.skillTag.update({
        where: { id: question.skillTagId },
        data: { missCount: { decrement: 1 } },
      });
    }
  }
  await prisma.wrongQuestion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
