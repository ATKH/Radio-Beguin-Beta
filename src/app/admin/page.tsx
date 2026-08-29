// @ts-nocheck
import { getSchedule } from "@/lib/schedule";
import AdminScheduleForm from "@/components/AdminScheduleForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const schedule = await getSchedule();

  return (
    <div className="min-h-screen bg-background text-foreground max-w-4xl mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Édition du planning</h1>
      <AdminScheduleForm initialSchedule={schedule} />
    </div>
  );
}