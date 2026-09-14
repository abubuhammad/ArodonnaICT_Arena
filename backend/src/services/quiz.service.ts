import { submitQuiz } from './courseProgressService';

export async function createAttemptAndGrade(quizId: string, userId: string, enrollmentId: string, answers: unknown) {
  return submitQuiz(enrollmentId, userId, quizId, answers);
}
