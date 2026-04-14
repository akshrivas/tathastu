"use client";

import { useState } from "react";
import type { Meditation, MeditationProgress } from "../domain/health.types";

type MeditationCardProps = {
  meditation: Meditation;
  progress: MeditationProgress;
  onComplete: () => void;
};

export function MeditationCard({ meditation, progress, onComplete }: MeditationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = progress.completed;

  return (
    <div className={`health-card ${isCompleted ? "is-completed" : ""}`}>
      <div className="card-header">
        <div className="card-info">
          <div className="card-icon">🧘</div>
          <div>
            <h3 className="card-title">Meditation</h3>
            <p className="card-subtitle">{meditation.duration} min</p>
          </div>
        </div>
        <div className="card-status">
          {isCompleted ? (
            <span className="status-badge completed">✓ Done</span>
          ) : (
            <span className="status-badge pending">○ Pending</span>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button
          className="btn-expand"
          onClick={() => setExpanded(!expanded)}
          type="button"
        >
          {expanded ? "Hide Details" : "View Routine"}
        </button>
        <button
          className={`btn-complete ${isCompleted ? "is-done" : ""}`}
          onClick={onComplete}
          type="button"
        >
          {isCompleted ? "Completed" : "Mark Done"}
        </button>
      </div>

      {expanded && (
        <div className="card-details">
          <h4>Steps:</h4>
          <ol className="meditation-steps">
            {meditation.steps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
          {meditation.notes && <p className="detail-notes">{meditation.notes}</p>}
        </div>
      )}
    </div>
  );
}
