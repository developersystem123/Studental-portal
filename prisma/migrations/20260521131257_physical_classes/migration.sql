-- CreateEnum
CREATE TYPE "PhysicalClassStatus" AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PhysicalEnrollmentStatus" AS ENUM ('active', 'completed', 'dropped');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused');

-- CreateTable
CREATE TABLE "PhysicalClass" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "campus" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "batch" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysOfWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PhysicalClassStatus" NOT NULL DEFAULT 'upcoming',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalClassEnrollment" (
    "id" TEXT NOT NULL,
    "physicalClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "applicationId" TEXT,
    "status" "PhysicalEnrollmentStatus" NOT NULL DEFAULT 'active',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicalClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalAttendance" (
    "id" TEXT NOT NULL,
    "physicalClassId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "note" TEXT,
    "markedById" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhysicalAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhysicalClass_courseId_idx" ON "PhysicalClass"("courseId");

-- CreateIndex
CREATE INDEX "PhysicalClass_instructorId_idx" ON "PhysicalClass"("instructorId");

-- CreateIndex
CREATE INDEX "PhysicalClass_status_idx" ON "PhysicalClass"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalClassEnrollment_applicationId_key" ON "PhysicalClassEnrollment"("applicationId");

-- CreateIndex
CREATE INDEX "PhysicalClassEnrollment_studentId_idx" ON "PhysicalClassEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "PhysicalClassEnrollment_physicalClassId_idx" ON "PhysicalClassEnrollment"("physicalClassId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalClassEnrollment_physicalClassId_studentId_key" ON "PhysicalClassEnrollment"("physicalClassId", "studentId");

-- CreateIndex
CREATE INDEX "PhysicalAttendance_physicalClassId_date_idx" ON "PhysicalAttendance"("physicalClassId", "date");

-- CreateIndex
CREATE INDEX "PhysicalAttendance_studentId_idx" ON "PhysicalAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalAttendance_physicalClassId_studentId_date_key" ON "PhysicalAttendance"("physicalClassId", "studentId", "date");

-- AddForeignKey
ALTER TABLE "PhysicalClass" ADD CONSTRAINT "PhysicalClass_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalClass" ADD CONSTRAINT "PhysicalClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalClassEnrollment" ADD CONSTRAINT "PhysicalClassEnrollment_physicalClassId_fkey" FOREIGN KEY ("physicalClassId") REFERENCES "PhysicalClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalClassEnrollment" ADD CONSTRAINT "PhysicalClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalClassEnrollment" ADD CONSTRAINT "PhysicalClassEnrollment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "PhysicalApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalAttendance" ADD CONSTRAINT "PhysicalAttendance_physicalClassId_fkey" FOREIGN KEY ("physicalClassId") REFERENCES "PhysicalClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalAttendance" ADD CONSTRAINT "PhysicalAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
