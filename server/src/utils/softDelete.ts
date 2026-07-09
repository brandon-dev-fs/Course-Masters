import { PrismaClient } from '@prisma/client';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Cascade soft-delete a Course and all of its Units, Lessons, and Assessments.
 * All operations are performed within the provided transaction client.
 *
 * Cascade order (bottom-up by FK dependency, batch updateMany to avoid N+1):
 * 1. Soft-delete course-level Assessment
 * 2. Collect non-deleted Unit IDs
 * 3. Collect non-deleted Lesson IDs for those Units
 * 4. Soft-delete unit-level and lesson-level Assessments
 * 5. Soft-delete Lessons and Units
 * 6. Soft-delete Course
 */
export async function softDeleteCourse(tx: TransactionClient, courseId: string): Promise<void> {
  const now = new Date();

  // 1. Soft-delete course-level assessment
  await tx.assessment.updateMany({
    where: { courseId, deletedAt: null },
    data: { deletedAt: now },
  });

  // 2. Collect non-deleted unit IDs for this course
  const units = await tx.unit.findMany({
    where: { courseId, deletedAt: null },
    select: { id: true },
  });
  const unitIds = units.map(u => u.id);

  if (unitIds.length > 0) {
    // 3. Collect non-deleted lesson IDs for those units
    const lessons = await tx.lesson.findMany({
      where: { unitId: { in: unitIds }, deletedAt: null },
      select: { id: true },
    });
    const lessonIds = lessons.map(l => l.id);

    // 4. Soft-delete unit-level assessments
    await tx.assessment.updateMany({
      where: { unitId: { in: unitIds }, deletedAt: null },
      data: { deletedAt: now },
    });

    if (lessonIds.length > 0) {
      // 4b. Soft-delete lesson-level assessments
      await tx.assessment.updateMany({
        where: { lessonId: { in: lessonIds }, deletedAt: null },
        data: { deletedAt: now },
      });

      // 5a. Soft-delete lessons
      await tx.lesson.updateMany({
        where: { id: { in: lessonIds } },
        data: { deletedAt: now },
      });
    }

    // 5b. Soft-delete units
    await tx.unit.updateMany({
      where: { id: { in: unitIds } },
      data: { deletedAt: now },
    });
  }

  // 6. Soft-delete the course
  await tx.course.update({
    where: { id: courseId },
    data: { deletedAt: now },
  });
}

/**
 * Cascade soft-delete a Unit and all of its Lessons and Assessments.
 *
 * Cascade order:
 * 1. Soft-delete unit-level Assessment
 * 2. Collect non-deleted Lesson IDs
 * 3. Soft-delete lesson-level Assessments
 * 4. Soft-delete Lessons
 * 5. Soft-delete Unit
 */
export async function softDeleteUnit(tx: TransactionClient, unitId: string): Promise<void> {
  const now = new Date();

  // 1. Soft-delete unit-level assessment
  await tx.assessment.updateMany({
    where: { unitId, deletedAt: null },
    data: { deletedAt: now },
  });

  // 2. Collect non-deleted lesson IDs
  const lessons = await tx.lesson.findMany({
    where: { unitId, deletedAt: null },
    select: { id: true },
  });
  const lessonIds = lessons.map(l => l.id);

  if (lessonIds.length > 0) {
    // 3. Soft-delete lesson-level assessments
    await tx.assessment.updateMany({
      where: { lessonId: { in: lessonIds }, deletedAt: null },
      data: { deletedAt: now },
    });

    // 4. Soft-delete lessons
    await tx.lesson.updateMany({
      where: { id: { in: lessonIds } },
      data: { deletedAt: now },
    });
  }

  // 5. Soft-delete the unit
  await tx.unit.update({
    where: { id: unitId },
    data: { deletedAt: now },
  });
}

/**
 * Cascade soft-delete a Lesson and its Assessment (if any).
 *
 * Cascade order:
 * 1. Soft-delete lesson-level Assessment
 * 2. Soft-delete Lesson
 */
export async function softDeleteLesson(tx: TransactionClient, lessonId: string): Promise<void> {
  const now = new Date();

  // 1. Soft-delete lesson-level assessment
  await tx.assessment.updateMany({
    where: { lessonId, deletedAt: null },
    data: { deletedAt: now },
  });

  // 2. Soft-delete the lesson
  await tx.lesson.update({
    where: { id: lessonId },
    data: { deletedAt: now },
  });
}

/**
 * Cascade soft-delete a CourseSpec and all of its AgentSession children.
 * AgentSession uses hard deletes (no deletedAt); CourseSpec uses soft delete.
 *
 * Cascade order:
 * 1. Hard-delete all AgentSession rows for this CourseSpec
 * 2. Soft-delete the CourseSpec
 *
 * All operations are performed within the provided transaction client.
 */
export async function softDeleteCourseSpec(tx: TransactionClient, id: string): Promise<void> {
  // 1. Hard-delete AgentSession children (no soft delete on this model)
  await tx.agentSession.deleteMany({
    where: { courseSpecId: id },
  });

  // 2. Soft-delete the CourseSpec
  await tx.courseSpec.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Cascade soft-delete a User and all of their Courses (and transitively all
 * Units, Lessons, and Assessments belonging to those Courses).
 *
 * Cascade order:
 * 1. Collect non-deleted Course IDs for the user
 * 2. For each course, execute course cascade within the same transaction
 * 3. Soft-delete the User
 */
export async function softDeleteUser(tx: TransactionClient, userId: string): Promise<void> {
  const now = new Date();

  // 1. Collect non-deleted courses for this user
  const courses = await tx.course.findMany({
    where: { authorId: userId, deletedAt: null },
    select: { id: true },
  });

  // 2. Cascade soft-delete each course
  for (const course of courses) {
    await softDeleteCourse(tx, course.id);
  }

  // 3. Soft-delete the user
  await tx.user.update({
    where: { id: userId },
    data: { deletedAt: now },
  });
}
