import type {
  Workout,
  Meditation,
  ExerciseProgressMap,
  MeditationProgress,
} from "../domain/health.types";

export interface HealthRepository {
  getWorkout(day: string): Promise<Workout>;
  getMeditation(day: string): Promise<Meditation>;
  getWorkoutProgress(date: string): Promise<ExerciseProgressMap>;
  getMeditationProgress(date: string): Promise<MeditationProgress>;
  updateExerciseProgress(
    date: string,
    exerciseId: string,
    completed: boolean,
  ): Promise<void>;
  updateMeditationProgress(
    date: string,
    completed: boolean,
    duration?: number,
  ): Promise<void>;
}
