"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DayMeals, MealStatus } from "../domain/nutrition.types";
import { nutritionService } from "../services/nutrition.service";

export function DietView() {
  const [dayMeals, setDayMeals] = useState<DayMeals | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const highlightMealId = searchParams.get("meal");
  const mealRefs = useRef<Record<string, HTMLLIElement | null>>({});

  useEffect(() => {
    nutritionService
      .getTodayMeals()
      .then((meals) => setDayMeals(meals))
      .catch(() => setError("Unable to load meals."));
  }, []);

  useEffect(() => {
    if (highlightMealId && mealRefs.current[highlightMealId]) {
      setTimeout(() => {
        mealRefs.current[highlightMealId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [highlightMealId, dayMeals]);

  async function handleStatusChange(mealId: string, status: MealStatus) {
    if (!dayMeals) return;

    await nutritionService.updateMealStatus(dayMeals.date, mealId, status);

    setDayMeals({
      ...dayMeals,
      meals: dayMeals.meals.map((meal) =>
        meal.id === mealId ? { ...meal, status } : meal
      ),
    });
  }

  if (error) {
    return <main className="schedule-page">{error}</main>;
  }

  if (!dayMeals) {
    return <main className="schedule-page">Loading...</main>;
  }

  return (
    <main className="schedule-page">
      <header className="app-header">Tathastu</header>

      <section className="schedule-shell" aria-labelledby="diet-title">
        <header className="schedule-header">
          <h1 id="diet-title">Diet Plan</h1>
          <p>Today&apos;s meals</p>
        </header>

        <ul className="meal-list">
          {dayMeals.meals.map((meal) => {
            const isDone = (meal as any).status === "done";
            const isMissed = (meal as any).status === "missed";
            const isHighlighted = meal.id === highlightMealId;

            return (
              <li
                key={meal.id}
                ref={(el) => {
                  mealRefs.current[meal.id] = el;
                }}
                className={`meal-card ${isHighlighted ? "is-highlighted" : ""} ${
                  isDone ? "is-completed" : ""
                } ${isMissed ? "is-missed" : ""}`}
              >
                <div className="meal-header">
                  <div className="meal-info">
                    <h3 className="meal-name">{meal.name}</h3>
                    <p className="meal-time">{meal.timing}</p>
                  </div>
                  <div className="meal-actions">
                    <button
                      className={isDone ? "is-done" : ""}
                      disabled={isDone}
                      onClick={() => handleStatusChange(meal.id, "done")}
                      type="button"
                    >
                      Done
                    </button>
                    <button
                      className={isMissed ? "is-missed" : ""}
                      disabled={isMissed}
                      onClick={() => handleStatusChange(meal.id, "missed")}
                      type="button"
                    >
                      Missed
                    </button>
                  </div>
                </div>

                <ul className="meal-items">
                  {meal.items.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity} {item.name}
                    </li>
                  ))}
                </ul>

                <div className="meal-nutrition">
                  <span>{meal.nutrition.calories} cal</span>
                  <span>{meal.nutrition.protein}g protein</span>
                  <span>{meal.nutrition.carbs}g carbs</span>
                  <span>{meal.nutrition.fats}g fats</span>
                </div>

                {meal.notes && <p className="meal-notes">{meal.notes}</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
