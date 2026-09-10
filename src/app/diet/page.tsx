import { Suspense } from "react";
import { DietView } from "@/modules/nutrition/ui/DietView";

function DietPageContent() {
  return <DietView />;
}

export default function DietPage() {
  return (
    <Suspense fallback={<main className="schedule-page">Loading...</main>}>
      <DietPageContent />
    </Suspense>
  );
}
