import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GlucoseForm } from "@/components/glucose-form";
import { dateToLocalInputs } from "@/lib/datetime";
import { getReading } from "@/lib/glucose/queries";
import { uuidSchema } from "@/lib/glucose/validation";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { updateReading } from "../../actions";

export const metadata: Metadata = { title: "Editar glicemia" };

export default async function EditarGlicemiaPage({ params }: PageProps<"/glicemia/[id]/editar">) {
  const user = await requireUser();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const [reading, { timezone }] = await Promise.all([getReading(user.id, id), getProfile(user.id)]);
  if (!reading) notFound();
  const { date, time } = dateToLocalInputs(reading.measuredAt, timezone);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Editar glicemia</h1>
      <GlucoseForm
        action={updateReading.bind(null, id)}
        submitLabel="Salvar alterações"
        defaults={{
          value: String(reading.value),
          date,
          time,
          contextKey: reading.contextKey,
          customContext: reading.customLabel ?? "",
          notes: reading.notes ?? "",
          symptoms: reading.symptoms ?? "",
          activity: reading.activity ?? "",
        }}
      />
    </section>
  );
}
