import type { Meal, MealStatus, MealStatusMap } from "../domain/nutrition.types";

export interface NutritionRepository {
  getDayMeals(day: string): Promise<Meal[]>;
  getStatus(date: string): Promise<MealStatusMap>;
  updateStatus(date: string, mealId: string, status: MealStatus): Promise<void>;
}
