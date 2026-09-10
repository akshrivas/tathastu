import type { StorageAdapter } from "@/core/storage/localStorage.adapter";
import type { Meal, MealStatus, MealStatusMap } from "../domain/nutrition.types";
import type { NutritionRepository } from "./nutrition.repository.interface";
import nutritionData from "@/data/nutrition.json";

const STORAGE_KEY = "meal_status";

export class LocalNutritionRepository implements NutritionRepository {
  constructor(private readonly storage: StorageAdapter) {}

  async getDayMeals(day: string): Promise<Meal[]> {
    const mealIds = nutritionData.weekPlan[day as keyof typeof nutritionData.weekPlan];
    
    if (!mealIds) {
      return [];
    }

    return mealIds.map((mealId) => {
      const meal = nutritionData.meals[mealId as keyof typeof nutritionData.meals];
      return meal as Meal;
    });
  }

  async getStatus(date: string): Promise<MealStatusMap> {
    const allStatus = this.storage.get<Record<string, MealStatusMap>>(STORAGE_KEY);
    return allStatus?.[date] ?? {};
  }

  async updateStatus(
    date: string,
    mealId: string,
    status: MealStatus,
  ): Promise<void> {
    const allStatus = this.storage.get<Record<string, MealStatusMap>>(STORAGE_KEY) ?? {};
    const dateStatus = allStatus[date] ?? {};

    allStatus[date] = {
      ...dateStatus,
      [mealId]: status,
    };

    this.storage.set(STORAGE_KEY, allStatus);
  }
}
