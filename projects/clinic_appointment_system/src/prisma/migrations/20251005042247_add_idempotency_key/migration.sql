-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "notes" TEXT;

-- CreateIndex
CREATE INDEX "appointments_idempotency_key_idx" ON "appointments"("idempotency_key");
