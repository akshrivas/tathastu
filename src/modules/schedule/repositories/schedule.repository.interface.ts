import type {
  DaySchedule,
  ScheduleStatus,
  ScheduleStatusMap,
} from "../domain/schedule.types";

export interface ScheduleRepository {
  getDaySchedule(day: string): Promise<DaySchedule>;
  getStatus(date: string): Promise<ScheduleStatusMap>;
  updateStatus(
    date: string,
    blockId: string,
    status: ScheduleStatus,
  ): Promise<void>;
}
