-- CreateTable
CREATE TABLE "WrongQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "passage" TEXT,
    "stem" TEXT NOT NULL,
    "choices" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "questionType" TEXT,
    "coreSkill" TEXT,
    "errorPattern" TEXT,
    "explanation" TEXT,
    "analyzedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "skillTagId" TEXT,
    CONSTRAINT "WrongQuestion_skillTagId_fkey" FOREIGN KEY ("skillTagId") REFERENCES "SkillTag" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SkillTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "missCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PracticeSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillTagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "PracticeSet_skillTagId_fkey" FOREIGN KEY ("skillTagId") REFERENCES "SkillTag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceSetId" TEXT NOT NULL,
    "sourceWrongQuestionId" TEXT,
    "stem" TEXT NOT NULL,
    "choices" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "answeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeQuestion_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "PracticeSet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeQuestion_sourceWrongQuestionId_fkey" FOREIGN KEY ("sourceWrongQuestionId") REFERENCES "WrongQuestion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WrongQuestion_skillTagId_idx" ON "WrongQuestion"("skillTagId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillTag_name_key" ON "SkillTag"("name");

-- CreateIndex
CREATE INDEX "PracticeSet_skillTagId_idx" ON "PracticeSet"("skillTagId");

-- CreateIndex
CREATE INDEX "PracticeQuestion_practiceSetId_idx" ON "PracticeQuestion"("practiceSetId");
