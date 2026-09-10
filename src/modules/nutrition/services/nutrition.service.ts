import { LocalStorageAdapter } from "@/core/storage/localStorage.adapter";
import type { DayMeals, MealStatus } from "../domain/nutrition.types";
import { LocalNutritionRepository } from "../repositories/local.nutrition.repository";
import type { NutritionRepository } from "../repositories/nutrition.repository.interface";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export class NutritionService {
  constructor(private readonly repository: NutritionRepository) {}

  async getTodayMeals(date = new Date()): Promise<DayMeals> {
    const day = this.getDayName(date);
    const formattedDate = this.formatDate(date);
    const [meals, status] = await Promise.all([
      this.repository.getDayMeals(day),
      this.repository.getStatus(formattedDate),
    ]);

    // Attach status to meals
    const mealsWithStatus = meals.map((meal) => ({
      ...meal,
      status: status[meal.id],
    }));

    return {
      date: formattedDate,
      day,
      meals: mealsWithStatus,
    };
  }

  async updateMealStatus(
    date: string,
    mealId: string,
    status: MealStatus,
  ): Promise<void> {
    await this.repository.updateStatus(date, mealId, status);
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

export const nutritionService = new NutritionService(
  new LocalNutritionRepository(new LocalStorageAdapter()),
);
