'use client';

import { useState } from 'react';
import type { Workout, WorkoutProgress } from '../domain/health.types';

type WorkoutCardProps = {
  workout: Workout;
  progress: WorkoutProgress;
  onExerciseToggle: (exerciseId: string, completed: boolean) => void;
};

export function WorkoutCard({
  workout,
  progress,
  onExerciseToggle,
}: WorkoutCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = progress.completed === progress.total;
  const isPartial =
    progress.completed > 0 && progress.completed < progress.total;

  return (
    <div
      className={`health-card ${
        isCompleted ? 'is-completed' : isPartial ? 'is-partial' : ''
      }`}
    >
      <div className="card-header">
        <div className="card-info">
          <div className="card-icon">💪</div>
          <div>
            <h3 className="card-title">{workout.name}</h3>
            <p className="card-subtitle">
              {workout.duration} min · {workout.exercises.length} exercises
            </p>
          </div>
        </div>
        <div className="card-status">
          {isCompleted ? (
            <span className="status-badge completed">✓ Done</span>
          ) : isPartial ? (
            <span className="status-badge partial">
              {progress.completed}/{progress.total}
            </span>
          ) : (
            <span className="status-badge pending">○ Not Started</span>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button
          className="btn-expand"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {expanded ? 'Hide Exercises' : 'View Exercises'}
        </button>
      </div>

      {expanded && (
        <div className="card-details">
          <ul className="exercise-list">
            {workout.exercises.map((exercise) => {
              const isDone = progress.exercises[exercise.id] || false;

              return (
                <li
                  key={exercise.id}
                  className={`exercise-item ${isDone ? 'is-done' : ''}`}
                >
                  <label className="exercise-checkbox">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={(e) =>
                        onExerciseToggle(exercise.id, e.target.checked)
                      }
                    />
                    <span className="exercise-name">{exercise.name}</span>
                  </label>
                  <div className="exercise-details">
                    {exercise.sets && (
                      <span>
                        {exercise.sets} sets
                        {Array.isArray(exercise.reps)
                          ? ` × ${exercise.reps.join(', ')} reps`
                          : exercise.reps
                          ? ` × ${exercise.reps} reps`
                          : exercise.duration
                          ? ` × ${exercise.duration}`
                          : ''}
                      </span>
                    )}
                    {exercise.weight && (
                      <span className="exercise-weight">{exercise.weight}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
