-- CreateTable
CREATE TABLE "Survey" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "companyName" TEXT,
  "companySize" TEXT,
  "industry" TEXT,
  "role" TEXT,
  "usagePurpose" TEXT,
  "hearAboutUs" TEXT,
  "expectedFeatures" TEXT[],
  "developmentExperience" INTEGER,
  "githubExperience" INTEGER,
  "feedbackFrequency" TEXT,
  "additionalFeedback" TEXT,

  CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Survey_userId_key" ON "Survey"("userId");

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddColumn
ALTER TABLE "User" ADD COLUMN "SurveyDone" BOOLEAN DEFAULT false;
