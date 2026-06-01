-- CreateTable
CREATE TABLE "CourseAttendance" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "note" TEXT,
    "markedById" TEXT,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseAttendance_courseId_date_idx" ON "CourseAttendance"("courseId", "date");

-- CreateIndex
CREATE INDEX "CourseAttendance_studentId_idx" ON "CourseAttendance"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseAttendance_courseId_studentId_date_key" ON "CourseAttendance"("courseId", "studentId", "date");

-- AddForeignKey
ALTER TABLE "CourseAttendance" ADD CONSTRAINT "CourseAttendance_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAttendance" ADD CONSTRAINT "CourseAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
