export type MealItem = {
  name: string;
  quantity: string;
  category: string;
};

export type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

export type Meal = {
  id: string;
  name: string;
  timing: string;
  items: MealItem[];
  nutrition: NutritionInfo;
  notes?: string;
};

export type DayMeals = {
  date: string;
  day: string;
  meals: Meal[];
};

export type MealStatus = "done" | "missed";

export type MealStatusMap = Record<string, MealStatus>;
