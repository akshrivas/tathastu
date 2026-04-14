"use client";

import { useEffect, useState } from "react";
import type { DayHealth, WorkoutProgress, MeditationProgress } from "../domain/health.types";
import { healthService } from "../services/health.service";
import { WorkoutCard } from "./WorkoutCard";
import { MeditationCard } from "./MeditationCard";

export function HealthView() {
  const [dayHealth, setDayHealth] = useState<DayHealth | null>(null);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress | null>(null);
  const [meditationProgress, setMeditationProgress] = useState<MeditationProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealthData();
  }, []);

  async function loadHealthData() {
    try {
      const health = await healthService.getTodayHealth();
      console.log("Health data loaded:", health);
      
      if (!health.meditation) {
        console.error("Meditation is undefined in health data");
        setError("Meditation data not found");
        return;
      }
      
      const wProgress = await healthService.getWorkoutProgress(health.date);
      const mProgress = await healthService.getMeditationProgress(health.date);
      
      setDayHealth(health);
      setWorkoutProgress(wProgress);
      setMeditationProgress(mProgress);
    } catch (err) {
      console.error("Error loading health data:", err);
      setError(`Unable to load health data: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleExerciseToggle(exerciseId: string, completed: boolean) {
    if (!dayHealth) return;

    await healthService.updateExerciseProgress(dayHealth.date, exerciseId, completed);
    const updatedProgress = await healthService.getWorkoutProgress(dayHealth.date);
    setWorkoutProgress(updatedProgress);
  }

  async function handleMeditationComplete() {
    if (!dayHealth) return;

    const newStatus = !meditationProgress?.completed;
    await healthService.updateMeditationProgress(dayHealth.date, newStatus, dayHealth.meditation.duration);
    const updatedProgress = await healthService.getMeditationProgress(dayHealth.date);
    setMeditationProgress(updatedProgress);
  }

  if (error) {
    return (
      <main className="schedule-page">
        <header className="app-header">Tathastu</header>
        <div className="schedule-shell">
          <p style={{ color: '#ff5f57' }}>{error}</p>
        </div>
      </main>
    );
  }

  if (!dayHealth || !workoutProgress || !meditationProgress) {
    return <main className="schedule-page">Loading...</main>;
  }

  return (
    <main className="schedule-page">
      <header className="app-header">Tathastu</header>

      <section className="schedule-shell" aria-labelledby="health-title">
        <header className="schedule-header">
          <h1 id="health-title">Health</h1>
          <p>Today&apos;s workout and meditation</p>
        </header>

        <div className="health-cards">
          <MeditationCard
            meditation={dayHealth.meditation}
            progress={meditationProgress}
            onComplete={handleMeditationComplete}
          />

          <WorkoutCard
            workout={dayHealth.workout}
            progress={workoutProgress}
            onExerciseToggle={handleExerciseToggle}
          />
        </div>
      </section>
    </main>
  );
}
