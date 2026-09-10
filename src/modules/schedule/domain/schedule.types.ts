export type ScheduleStatus = "done" | "missed";

export type ScheduleStatusMap = Record<string, ScheduleStatus>;

export type ScheduleBlock = {
  id: string;
  title: string;
  start: string;
  end: string;
  type?: string;
  category?: string;
  weight?: number;
};

export type DaySchedule = {
  day: string;
  mode: string;
  blocks: ScheduleBlock[];
};

export type TodayScheduleView = {
  date: string;
  day: string;
  schedule: DaySchedule;
  status: ScheduleStatusMap;
};
