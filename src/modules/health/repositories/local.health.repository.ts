import type { StorageAdapter } from '@/core/storage/localStorage.adapter';
import type {
  Workout,
  Meditation,
  ExerciseProgressMap,
  MeditationProgress,
} from '../domain/health.types';
import type { HealthRepository } from './health.repository.interface';
import healthData from '@/data/health.json';

const WORKOUT_PROGRESS_KEY = 'workout_progress';
const MEDITATION_PROGRESS_KEY = 'meditation_progress';

export class LocalHealthRepository implements HealthRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async getWorkout(day: string): Promise<Workout> {
    const workoutId =
      healthData.weekPlan[day as keyof typeof healthData.weekPlan]?.workout;

    if (!workoutId) {
      throw new Error(`No workout found for ${day}`);
    }

    const workout =
      healthData.workouts[workoutId as keyof typeof healthData.workouts];
    return workout as Workout;
  }

  async getMeditation(day: string): Promise<Meditation> {
    // Access meditation.daily directly
    const meditationData = (healthData as any).meditation?.daily;

    if (!meditationData) {
      throw new Error(`No meditation found`);
    }

    return meditationData as Meditation;
  }

  async getWorkoutProgress(date: string): Promise<ExerciseProgressMap> {
    const allProgress =
      this.storage.get<Record<string, ExerciseProgressMap>>(
        WORKOUT_PROGRESS_KEY
      );
    return allProgress?.[date] ?? {};
  }

  async getMeditationProgress(date: string): Promise<MeditationProgress> {
    const allProgress = this.storage.get<Record<string, MeditationProgress>>(
      MEDITATION_PROGRESS_KEY
    );
    return allProgress?.[date] ?? { completed: false };
  }

  async updateExerciseProgress(
    date: string,
    exerciseId: string,
    completed: boolean
  ): Promise<void> {
    const allProgress =
      this.storage.get<Record<string, ExerciseProgressMap>>(
        WORKOUT_PROGRESS_KEY
      ) ?? {};
    const dateProgress = allProgress[date] ?? {};

    allProgress[date] = {
      ...dateProgress,
      [exerciseId]: completed,
    };

    this.storage.set(WORKOUT_PROGRESS_KEY, allProgress);
  }

  async updateMeditationProgress(
    date: string,
    completed: boolean,
    duration?: number
  ): Promise<void> {
    const allProgress =
      this.storage.get<Record<string, MeditationProgress>>(
        MEDITATION_PROGRESS_KEY
      ) ?? {};

    allProgress[date] = {
      completed,
      duration,
    };

    this.storage.set(MEDITATION_PROGRESS_KEY, allProgress);
  }
}
