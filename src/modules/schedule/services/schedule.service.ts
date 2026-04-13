import { LocalStorageAdapter } from "@/core/storage/localStorage.adapter";
import type {
  ScheduleStatus,
  TodayScheduleView,
} from "../domain/schedule.types";
import { LocalScheduleRepository } from "../repositories/local.schedule.repository";
import type { ScheduleRepository } from "../repositories/schedule.repository.interface";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export class ScheduleService {
  constructor(private readonly repository: ScheduleRepository) {}

  async getTodaySchedule(date = new Date()): Promise<TodayScheduleView> {
    const day = this.getDayName(date);
    const formattedDate = this.formatDate(date);
    const [schedule, status] = await Promise.all([
      this.repository.getDaySchedule(day),
      this.repository.getStatus(formattedDate),
    ]);

    return {
      date: formattedDate,
      day,
      schedule,
      status,
    };
  }

  async updateBlockStatus(
    date: string,
    blockId: string,
    status: ScheduleStatus,
  ): Promise<void> {
    await this.repository.updateStatus(date, blockId, status);
  }

  private getDayName(date: Date): string {
    return DAY_NAMES[date.getDay()];
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}

export const scheduleService = new ScheduleService(
  new LocalScheduleRepository(new LocalStorageAdapter()),
);
