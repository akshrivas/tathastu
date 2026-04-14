"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ScheduleBlock,
  ScheduleStatus,
  ScheduleStatusMap,
  TodayScheduleView,
} from "../domain/schedule.types";
import { scheduleService } from "../services/schedule.service";

type TaskSectionKey = "active" | "upcoming" | "delayed" | "completed";

type ClassifiedBlock = {
  block: ScheduleBlock;
  section: TaskSectionKey;
};

type TaskSection = {
  key: TaskSectionKey;
  title: string;
  blocks: ClassifiedBlock[];
};

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

function isFutureBlock(start: string, date: Date): boolean {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  return toMinutes(start) > currentMinutes;
}

function getRowClassName({
  isIgnored,
  section,
}: {
  isIgnored: boolean;
  section: TaskSectionKey;
}): string {
  return [
    "schedule-row",
    section === "active" ? "is-current" : "",
    section === "completed" ? "is-completed" : "",
    section === "upcoming" ? "is-future" : "",
    section === "delayed" ? "is-delayed" : "",
    isIgnored ? "is-ignored" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getBlockSection(
  block: ScheduleBlock,
  selectedStatus: ScheduleStatus | undefined,
  date: Date,
): TaskSectionKey {
  if (selectedStatus === "done") {
    return "completed";
  }

  if (isFutureBlock(block.start, date)) {
    return "upcoming";
  }

  if (isCurrentBlock(block.start, block.end, date)) {
    return "active";
  }

  return "delayed";
}

function getTaskSections(
  blocks: ScheduleBlock[],
  status: ScheduleStatusMap,
  date: Date,
): TaskSection[] {
  const sections: TaskSection[] = [
    { key: "active", title: "ACTIVE NOW", blocks: [] },
    { key: "upcoming", title: "UPCOMING", blocks: [] },
    { key: "delayed", title: "DELAYED", blocks: [] },
    { key: "completed", title: "COMPLETED", blocks: [] },
  ];

  blocks.forEach((block) => {
    const section = getBlockSection(block, status[block.id], date);
    const taskSection = sections.find(({ key }) => key === section);

    taskSection?.blocks.push({ block, section });
  });

  return sections;
}

function calculateScore(
  blocks: ScheduleBlock[],
  status: ScheduleStatusMap,
): {
  coreDoneWeight: number;
  coreTotalWeight: number;
  doneWeight: number;
  totalWeight: number;
} {
  return blocks.reduce(
    (score, block) => {
      if (block.category === "ignore") {
        return score;
      }

      const weight = block.weight ?? 0;
      const isDone = status[block.id] === "done";
      const isCore = block.category === "core";

      return {
        totalWeight: score.totalWeight + weight,
        doneWeight: isDone ? score.doneWeight + weight : score.doneWeight,
        coreTotalWeight: isCore
          ? score.coreTotalWeight + weight
          : score.coreTotalWeight,
        coreDoneWeight: isCore && isDone
          ? score.coreDoneWeight + weight
          : score.coreDoneWeight,
      };
    },
    { coreDoneWeight: 0, coreTotalWeight: 0, doneWeight: 0, totalWeight: 0 },
  );
}

function getDayRating(score: number): string {
  if (score >= 90) {
    return "great";
  }

  if (score >= 70) {
    return "good";
  }

  if (score >= 50) {
    return "average";
  }

  return "poor";
}

function shouldShowReflection(
  blocks: ScheduleBlock[],
  status: ScheduleStatusMap,
  date: Date,
): boolean {
  const isEndOfDay = date.getHours() >= 22;
  const allBlocksHaveStatus = blocks.every((block) => Boolean(status[block.id]));

  return isEndOfDay || allBlocksHaveStatus;
}

function getSavedReflectionNote(date: string): string {
  if (typeof window === "undefined") {
    return "";
  }

  const rawReflection = window.localStorage.getItem("daily_reflection");

  if (!rawReflection) {
    return "";
  }

  try {
    const reflection = JSON.parse(rawReflection) as Record<
      string,
      { note?: string }
    >;

    return reflection[date]?.note ?? "";
  } catch {
    return "";
  }
}

export function TodaySchedule() {
  const router = useRouter();
  const [todaySchedule, setTodaySchedule] =
    useState<TodayScheduleView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reflectionNote, setReflectionNote] = useState("");
  const currentBlockRef = useRef<HTMLLIElement | null>(null);
  const hasScrolledToCurrentBlock = useRef(false);

  useEffect(() => {
    scheduleService
      .getTodaySchedule()
      .then((schedule) => {
        setTodaySchedule(schedule);
        setReflectionNote(getSavedReflectionNote(schedule.date));
      })
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

  function handleBlockClick(block: ScheduleBlock) {
    if (block.type === "diet") {
      router.push(`/diet?meal=${block.id}`);
    } else if (block.type === "health") {
      router.push("/health");
    }
  }

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

  function handleSaveReflection() {
    if (!todaySchedule) {
      return;
    }

    const score = calculateScore(
      todaySchedule.schedule.blocks,
      todaySchedule.status,
    );
    const rawReflection = window.localStorage.getItem("daily_reflection");
    let reflection: Record<string, unknown> = {};

    if (rawReflection) {
      try {
        reflection = JSON.parse(rawReflection) as Record<string, unknown>;
      } catch {
        reflection = {};
      }
    }

    reflection[todaySchedule.date] = {
      score: score.doneWeight,
      coreScore: score.coreDoneWeight,
      rating: getDayRating(score.doneWeight),
      note: reflectionNote,
    };

    window.localStorage.setItem("daily_reflection", JSON.stringify(reflection));
  }

  if (error) {
    return <main className="schedule-page">{error}</main>;
  }

  if (!todaySchedule) {
    return <main className="schedule-page">Loading...</main>;
  }

  const score = calculateScore(
    todaySchedule.schedule.blocks,
    todaySchedule.status,
  );
  const dayRating = getDayRating(score.doneWeight);
  const showReflection = shouldShowReflection(
    todaySchedule.schedule.blocks,
    todaySchedule.status,
    now,
  );
  const taskSections = getTaskSections(
    todaySchedule.schedule.blocks,
    todaySchedule.status,
    now,
  );

  return (
    <main className="schedule-page">
      <header className="app-header">Tathastu</header>

      <section className="schedule-shell" aria-labelledby="schedule-title">
        <header className="schedule-header">
          <h1 id="schedule-title">
            {formatDay(todaySchedule.day)} ({todaySchedule.schedule.mode})
          </h1>
          <p>{formatDate(todaySchedule.date)}</p>
          <p className="schedule-score">
            Score: {score.doneWeight} / {score.totalWeight}
          </p>
        </header>

        {taskSections.map((section) => (
          <section className="task-section" key={section.key}>
            <h2>{section.title}</h2>

            <ul className="schedule-list">
              {section.blocks.map(({ block, section: blockSection }) => {
                const selectedStatus = todaySchedule.status[block.id];
                const isDone = selectedStatus === "done";
                const isFuture = blockSection === "upcoming";
                const isIgnored = block.category === "ignore";
                const isMissed = selectedStatus === "missed";
                const isClickable = block.type === "diet" || block.type === "health";
                const shouldShowDoneState = isDone && !isIgnored;
                const shouldShowMissedState = isMissed && !isIgnored;
                const shouldShowIgnoredDoneState = isDone && isIgnored;
                const shouldShowIgnoredMissedState = isMissed && isIgnored;
                const doneButtonClassName = [
                  shouldShowDoneState ? "is-done" : "",
                  shouldShowIgnoredDoneState ? "is-neutral-active" : "",
                  isMissed || isFuture || (isIgnored && !isDone)
                    ? "is-dimmed"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const missedButtonClassName = [
                  shouldShowMissedState ? "is-missed" : "",
                  shouldShowIgnoredMissedState ? "is-neutral-active" : "",
                  isDone || isFuture || (isIgnored && !isMissed)
                    ? "is-dimmed"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <li
                    className={getRowClassName({
                      isIgnored,
                      section: blockSection,
                    })}
                    key={block.id}
                    ref={blockSection === "active" ? currentBlockRef : null}
                    onClick={() => isClickable && handleBlockClick(block)}
                    style={{ cursor: isClickable ? "pointer" : "default" }}
                  >
                    <span
                      className="schedule-time"
                      aria-label={`${block.start} to ${block.end}`}
                    >
                      <span>{block.start}</span>
                      <span>{block.end}</span>
                    </span>
                    <span className="schedule-title">{block.title}</span>
                    <span className="schedule-actions">
                      <button
                        aria-pressed={isDone}
                        className={doneButtonClassName}
                        disabled={isFuture || isDone}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(block.id, "done");
                        }}
                        type="button"
                      >
                        Done
                      </button>
                      <button
                        aria-pressed={isMissed}
                        className={missedButtonClassName}
                        disabled={isFuture || isMissed}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(block.id, "missed");
                        }}
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
        ))}

        {showReflection ? (
          <section className="reflection-section">
            <h2>Today Summary</h2>
            <p>
              Score: {score.doneWeight} / {score.totalWeight}
            </p>
            <p>
              Core: {score.coreDoneWeight} / {score.coreTotalWeight}
            </p>
            <p>Day Rating: {dayRating}</p>
            <input
              onChange={(event) => setReflectionNote(event.target.value)}
              placeholder="One line reflection..."
              type="text"
              value={reflectionNote}
            />
            <button onClick={handleSaveReflection} type="button">
              Save
            </button>
          </section>
        ) : null}
      </section>
    </main>
  );
}
