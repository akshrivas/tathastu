"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ScheduleStatus,
  TodayScheduleView,
} from "../domain/schedule.types";
import { scheduleService } from "../services/schedule.service";

function formatDay(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function isCurrentBlock(start: string, end: string, date: Date): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  if (endMinutes <= startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function TodaySchedule() {
  const [todaySchedule, setTodaySchedule] =
    useState<TodayScheduleView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const currentBlockRef = useRef<HTMLLIElement | null>(null);
  const hasScrolledToCurrentBlock = useRef(false);

  useEffect(() => {
    scheduleService
      .getTodaySchedule()
      .then(setTodaySchedule)
      .catch(() => setError("Unable to load today's schedule."));
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!todaySchedule || hasScrolledToCurrentBlock.current) {
      return;
    }

    currentBlockRef.current?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
    hasScrolledToCurrentBlock.current = true;
  }, [todaySchedule]);

  async function handleStatusChange(blockId: string, status: ScheduleStatus) {
    if (!todaySchedule) {
      return;
    }

    await scheduleService.updateBlockStatus(todaySchedule.date, blockId, status);

    setTodaySchedule({
      ...todaySchedule,
      status: {
        ...todaySchedule.status,
        [blockId]: status,
      },
    });
  }

  if (error) {
    return <main className="schedule-page">{error}</main>;
  }

  if (!todaySchedule) {
    return <main className="schedule-page">Loading...</main>;
  }

  return (
    <main className="schedule-page">
      <header className="app-header">Tathastu</header>

      <section className="schedule-shell" aria-labelledby="schedule-title">
        <header className="schedule-header">
          <h1 id="schedule-title">
            {formatDay(todaySchedule.day)} ({todaySchedule.schedule.mode})
          </h1>
          <p>{formatDate(todaySchedule.date)}</p>
        </header>

        <ul className="schedule-list">
          {todaySchedule.schedule.blocks.map((block) => {
            const selectedStatus = todaySchedule.status[block.id];
            const isActive = isCurrentBlock(block.start, block.end, now);

            return (
              <li
                className={`schedule-row${isActive ? " is-current" : ""}`}
                key={block.id}
                ref={isActive ? currentBlockRef : null}
              >
                <span className="schedule-time" aria-label={`${block.start} to ${block.end}`}>
                  <span>{block.start}</span>
                  <span>{block.end}</span>
                </span>
                <span className="schedule-title">{block.title}</span>
                <span className="schedule-actions">
                  <button
                    aria-pressed={selectedStatus === "done"}
                    className={[
                      selectedStatus === "done" ? "is-done" : "",
                      selectedStatus === "missed" ? "is-dimmed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={selectedStatus === "done"}
                    onClick={() => handleStatusChange(block.id, "done")}
                    type="button"
                  >
                    Done
                  </button>
                  <button
                    aria-pressed={selectedStatus === "missed"}
                    className={[
                      selectedStatus === "missed" ? "is-missed" : "",
                      selectedStatus === "done" ? "is-dimmed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={selectedStatus === "missed"}
                    onClick={() => handleStatusChange(block.id, "missed")}
                    type="button"
                  >
                    Missed
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
