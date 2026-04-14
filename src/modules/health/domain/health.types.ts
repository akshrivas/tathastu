export type Exercise = {
  id: string;
  name: string;
  type: "warmup" | "strength" | "cardio" | "core";
  sets: number;
  reps?: number | number[];
  duration?: number | string;
  weight?: string;
  restTime?: string;
  targetMuscle?: string;
  notes?: string;
};

export type Workout = {
  id: string;
  name: string;
  duration: number;
  timing: string;
  focusAreas?: string[];
  exercises: Exercise[];
  type?: string;
  notes?: string;
};

export type MeditationStep = string;

export type Meditation = {
  id: string;
  name: string;
  duration: number;
  timing: string;
  type: string;
  steps: MeditationStep[];
  notes?: string;
};

export type DayHealth = {
  date: string;
  day: string;
  workout: Workout;
  meditation: Meditation;
};

export type ExerciseProgressMap = Record<string, boolean>;

export type WorkoutProgress = {
  completed: number;
  total: number;
  exercises: ExerciseProgressMap;
};

export type MeditationProgress = {
  completed: boolean;
  duration?: number;
};
