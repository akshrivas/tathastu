"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { healthService } from "@/modules/health/services/health.service";
import type { DayHealth, WorkoutProgress } from "@/modules/health/domain/health.types";

export default function WorkoutSessionPage() {
  const router = useRouter();
  const [dayHealth, setDayHealth] = useState<DayHealth | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    loadWorkoutData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeElapsed((time) => time + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  async function loadWorkoutData() {
    const health = await healthService.getTodayHealth();
    const progress = await healthService.getWorkoutProgress(health.date);
    setDayHealth(health);
    setWorkoutProgress(progress);
  }

  async function handleExerciseComplete(exerciseId: string) {
    if (!dayHealth) return;
    
    await healthService.updateExerciseProgress(dayHealth.date, exerciseId, true);
    const updatedProgress = await healthService.getWorkoutProgress(dayHealth.date);
    setWorkoutProgress(updatedProgress);
    
    // Move to next exercise
    if (currentExerciseIndex < dayHealth.workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!dayHealth || !workoutProgress) {
    return <main className="schedule-page">Loading...</main>;
  }

  const currentExercise = dayHealth.workout.exercises[currentExerciseIndex];
  const isCurrentDone = workoutProgress.exercises[currentExercise.id] || false;
  const allCompleted = workoutProgress.completed === workoutProgress.total;

  return (
    <main className="schedule-page">
      <header className="app-header">
        <button onClick={() => router.back()} className="back-button">← Back</button>
        Workout Session
      </header>

      <section className="schedule-shell workout-session">
        <div className="workout-timer">
          <h1>{formatTime(timeElapsed)}</h1>
          <p className="workout-name">{dayHealth.workout.name}</p>
          <p className="workout-progress">
            {workoutProgress.completed} / {workoutProgress.total} exercises completed
          </p>
        </div>

        {!allCompleted ? (
          <div className="current-exercise">
            <h2>Exercise {currentExerciseIndex + 1} of {dayHealth.workout.exercises.length}</h2>
            <div className="exercise-card">
              <h3>{currentExercise.name}</h3>
              <div className="exercise-specs">
                {currentExercise.sets && (
                  <p>
                    {currentExercise.sets} sets
                    {Array.isArray(currentExercise.reps) 
                      ? ` × ${currentExercise.reps.join(", ")} reps`
                      : currentExercise.reps 
                      ? ` × ${currentExercise.reps} reps`
                      : currentExercise.duration 
                      ? ` × ${currentExercise.duration}`
                      : ""
                    }
                  </p>
                )}
                {currentExercise.weight && (
                  <p className="weight">{currentExercise.weight}</p>
                )}
              </div>
            </div>

            <div className="session-controls">
              {!isActive ? (
                <button 
                  className="btn-primary btn-large"
                  onClick={() => setIsActive(true)}
                >
                  Start Timer
                </button>
              ) : (
                <button 
                  className="btn-secondary btn-large"
                  onClick={() => setIsActive(false)}
                >
                  Pause Timer
                </button>
              )}

              <button 
                className={`btn-complete btn-large ${isCurrentDone ? 'completed' : ''}`}
                onClick={() => handleExerciseComplete(currentExercise.id)}
                disabled={isCurrentDone}
              >
                {isCurrentDone ? '✓ Completed' : 'Mark Complete'}
              </button>

              <div className="navigation-buttons">
                <button 
                  className="btn-nav"
                  onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
                  disabled={currentExerciseIndex === 0}
                >
                  ← Previous
                </button>
                <button 
                  className="btn-nav"
                  onClick={() => setCurrentExerciseIndex(Math.min(dayHealth.workout.exercises.length - 1, currentExerciseIndex + 1))}
                  disabled={currentExerciseIndex === dayHealth.workout.exercises.length - 1}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="workout-complete">
            <div className="completion-message">
              <h2>🎉 Workout Complete!</h2>
              <p>Great job! You completed all {workoutProgress.total} exercises.</p>
              <p className="time-stat">Total time: {formatTime(timeElapsed)}</p>
            </div>
            <button 
              className="btn-primary btn-large"
              onClick={() => router.back()}
            >
              Back to Health
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
