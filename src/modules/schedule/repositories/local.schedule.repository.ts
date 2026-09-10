import scheduleData from "@/data/schedule.json";
import type { StorageAdapter } from "@/core/storage/localStorage.adapter";
import type {
  DaySchedule,
  ScheduleStatus,
  ScheduleStatusMap,
} from "../domain/schedule.types";
import type { ScheduleRepository } from "./schedule.repository.interface";

const STATUS_KEY_PREFIX = "schedule-status";

type WeeklyScheduleData = {
  week: Record<string, RawDaySchedule>;
};

type RawDaySchedule = {
  mode?: string;
  blocks?: RawScheduleBlock[];
  same_as?: string;
  $ref?: string;
};

type RawScheduleBlock = {
  id?: string;
  title: string;
  start: string;
  end: string;
  type?: string;
  category?: string;
  weight?: number;
};

export class LocalScheduleRepository implements ScheduleRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async getDaySchedule(day: string): Promise<DaySchedule> {
    const normalizedDay = day.toLowerCase();
    const weeklySchedule = scheduleData as unknown as WeeklyScheduleData;
    const daySchedule = this.resolveDaySchedule(weeklySchedule, normalizedDay);

    if (!daySchedule) {
      throw new Error(`Schedule not found for day: ${day}`);
    }

    return {
      day: normalizedDay,
      mode: daySchedule.mode ?? "",
      blocks: this.toScheduleBlocks(daySchedule.blocks ?? []),
    };
  }

  async getStatus(date: string): Promise<ScheduleStatusMap> {
    const status = this.storage.get<ScheduleStatusMap>(this.getStatusKey(date));
    return status ?? {};
  }

  async updateStatus(
    date: string,
    blockId: string,
    status: ScheduleStatus,
  ): Promise<void> {
    const currentStatus = await this.getStatus(date);

    this.storage.set(this.getStatusKey(date), {
      ...currentStatus,
      [blockId]: status,
    });
  }

  private getStatusKey(date: string): string {
    return `${STATUS_KEY_PREFIX}-${date}`;
  }

  private resolveDaySchedule(
    weeklySchedule: WeeklyScheduleData,
    day: string,
  ): RawDaySchedule | undefined {
    const daySchedule = weeklySchedule.week[day];

    const referenceDay = daySchedule?.same_as ?? daySchedule?.$ref;

    if (!referenceDay) {
      return daySchedule;
    }

    const sourceSchedule = weeklySchedule.week[referenceDay];

    if (!sourceSchedule) {
      return daySchedule;
    }

    return {
      ...sourceSchedule,
      mode: daySchedule.mode ?? sourceSchedule.mode,
    };
  }

  private toScheduleBlocks(blocks: RawScheduleBlock[]): DaySchedule["blocks"] {
    return blocks.map((block, index) => ({
      id: block.id ?? this.createBlockId(block, index),
      title: block.title,
      start: block.start,
      end: block.end,
      type: block.type,
      category: block.category,
      weight: block.weight,
    }));
  }

  private createBlockId(block: RawScheduleBlock, index: number): string {
    const title = block.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return `${index}-${block.start}-${block.end}-${title}`;
  }
}
