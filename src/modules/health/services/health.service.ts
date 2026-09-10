import { LocalStorageAdapter } from "@/core/storage/localStorage.adapter";
import type {
  DayHealth,
  WorkoutProgress,
  MeditationProgress,
} from "../domain/health.types";
import { LocalHealthRepository } from "../repositories/local.health.repository";
import type { HealthRepository } from "../repositories/health.repository.interface";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export class HealthService {
  constructor(private readonly repository: HealthRepository) {}

  async getTodayHealth(date = new Date()): Promise<DayHealth> {
    const day = this.getDayName(date);
    const formattedDate = this.formatDate(date);
    
    const [workout, meditation] = await Promise.all([
      this.repository.getWorkout(day),
      this.repository.getMeditation(day),
    ]);

    return {
      date: formattedDate,
      day,
      workout,
      meditation,
    };
  }

  async getWorkoutProgress(date: string): Promise<WorkoutProgress> {
    const day = this.getDayNameFromDate(date);
    const workout = await this.repository.getWorkout(day);
    const progress = await this.repository.getWorkoutProgress(date);

    const total = workout.exercises.length;
    const completed = Object.values(progress).filter(Boolean).length;

    return {
      completed,
      total,
      exercises: progress,
    };
  }

  async getMeditationProgress(date: string): Promise<MeditationProgress> {
    return this.repository.getMeditationProgress(date);
  }

  async updateExerciseProgress(
    date: string,
    exerciseId: string,
    completed: boolean,
  ): Promise<void> {
    await this.repository.updateExerciseProgress(date, exerciseId, completed);
  }

  async updateMeditationProgress(
    date: string,
    completed: boolean,
    duration?: number,
  ): Promise<void> {
    await this.repository.updateMeditationProgress(date, completed, duration);
  }

  async getWorkoutStatus(
    date: string,
  ): Promise<"done" | "partial" | undefined> {
    const progress = await this.getWorkoutProgress(date);

    if (progress.completed === 0) {
      return undefined;
    }

    if (progress.completed === progress.total) {
      return "done";
    }

    return "partial";
  }

  async getMeditationStatus(
    date: string,
  ): Promise<"done" | undefined> {
    const progress = await this.getMeditationProgress(date);
    return progress.completed ? "done" : undefined;
  }

  private getDayName(date: Date): string {
    return DAY_NAMES[date.getDay()];
  }

  private getDayNameFromDate(dateStr: string): string {
    const date = new Date(`${dateStr}T00:00:00`);
    return DAY_NAMES[date.getDay()];
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}

export const healthService = new HealthService(
  new LocalHealthRepository(new LocalStorageAdapter()),
);
