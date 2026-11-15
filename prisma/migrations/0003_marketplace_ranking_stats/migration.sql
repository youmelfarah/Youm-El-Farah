-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "rankScore" DOUBLE PRECISION NOT NULL DEFAULT 4;

-- CreateTable
CREATE TABLE "ProviderDailyStat" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
    "callClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProviderDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderDailyStat_date_idx" ON "ProviderDailyStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderDailyStat_providerId_date_key" ON "ProviderDailyStat"("providerId", "date");

-- CreateIndex
CREATE INDEX "Provider_rankScore_idx" ON "Provider"("rankScore");

-- AddForeignKey
ALTER TABLE "ProviderDailyStat" ADD CONSTRAINT "ProviderDailyStat_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
