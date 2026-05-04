import { QueryProvider } from "@/app/providers";
import { TripPlanner } from "@/components/planner/trip-planner";

export default function Home() {
  return (
    <QueryProvider>
      <TripPlanner />
    </QueryProvider>
  );
}
