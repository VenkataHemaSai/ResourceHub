-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ(3) NOT NULL,
    "endTime" TIMESTAMPTZ(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_organizationId_userId_idx" ON "Reservation"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "Reservation_resourceId_startTime_idx" ON "Reservation"("resourceId", "startTime");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable btree_gist for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Ensure end time is strictly after start time
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_endTime_check"
CHECK ("endTime" > "startTime");

-- Prevent overlapping confirmed reservations for the same resource
-- We use [) to allow back-to-back bookings where one ends exactly when the next begins
ALTER TABLE "Reservation" ADD CONSTRAINT "exclude_overlapping_reservations"
EXCLUDE USING gist (
  "resourceId" WITH =,
  tstzrange("startTime", "endTime", '[)') WITH &&
)
WHERE (status = 'CONFIRMED');
