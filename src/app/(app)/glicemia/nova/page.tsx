import type { Metadata } from "next";
import { GlucoseForm } from "@/components/glucose-form";
import { dateToLocalInputs } from "@/lib/datetime";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { createReading } from "../actions";

export const metadata: Metadata = { title: "Registrar glicemia" };

export default async function NovaGlicemiaPage() {
  const user = await requireUser();
  const { timezone } = await getProfile(user.id);
  const { date, time } = dateToLocalInputs(new Date(), timezone);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Registrar glicemia</h1>
      <GlucoseForm
        action={createReading}
        submitLabel="Salvar"
        defaults={{ value: "", date, time, contextKey: "", customContext: "", notes: "", symptoms: "", activity: "" }}
      />
    </section>
  );
}
