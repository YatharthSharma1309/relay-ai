-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requiredSkills" TEXT NOT NULL,
    "preferredSkills" TEXT NOT NULL DEFAULT '[]',
    "experienceLevel" TEXT NOT NULL DEFAULT '',
    "minYearsExperience" INTEGER,
    "educationRequirements" TEXT NOT NULL DEFAULT '[]',
    "certifications" TEXT NOT NULL DEFAULT '[]',
    "roleType" TEXT NOT NULL DEFAULT '',
    "pendingHireCandidateId" TEXT,
    "pendingHireExpiresAt" TIMESTAMP(3),
    "pendingHirePreviousStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "filePath" TEXT,
    "rawText" TEXT NOT NULL,
    "parseStatus" TEXT NOT NULL DEFAULT 'ok',
    "status" TEXT NOT NULL DEFAULT 'new',
    "statusBeforeArchive" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateAnalysis" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "extractedSkills" TEXT NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "scoreBreakdown" TEXT NOT NULL DEFAULT '{}',
    "matchRationale" TEXT NOT NULL,
    "missingSkills" TEXT NOT NULL,
    "interviewQuestions" TEXT NOT NULL,
    "modelId" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentAuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "actorId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecruitmentAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Job_organizationId_idx" ON "Job"("organizationId");

-- CreateIndex
CREATE INDEX "Job_createdAt_idx" ON "Job"("createdAt");

-- CreateIndex
CREATE INDEX "Candidate_jobId_idx" ON "Candidate"("jobId");

-- CreateIndex
CREATE INDEX "Candidate_status_idx" ON "Candidate"("status");

-- CreateIndex
CREATE INDEX "Candidate_createdAt_idx" ON "Candidate"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateAnalysis_candidateId_key" ON "CandidateAnalysis"("candidateId");

-- CreateIndex
CREATE INDEX "RecruitmentAuditEvent_organizationId_idx" ON "RecruitmentAuditEvent"("organizationId");

-- CreateIndex
CREATE INDEX "RecruitmentAuditEvent_action_idx" ON "RecruitmentAuditEvent"("action");

-- CreateIndex
CREATE INDEX "RecruitmentAuditEvent_entityType_idx" ON "RecruitmentAuditEvent"("entityType");

-- CreateIndex
CREATE INDEX "RecruitmentAuditEvent_createdAt_idx" ON "RecruitmentAuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateAnalysis" ADD CONSTRAINT "CandidateAnalysis_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruitmentAuditEvent" ADD CONSTRAINT "RecruitmentAuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
