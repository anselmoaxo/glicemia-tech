import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MedicationForm } from "@/components/medication-form";
import { uuidSchema } from "@/lib/glucose/validation";
import { getMedication } from "@/lib/medications/queries";
import { requireUser } from "@/lib/session";
import { updateMedication } from "../../actions";

export const metadata: Metadata = { title: "Editar medicamento" };

export default async function EditarMedicamentoPage({ params }: PageProps<"/medicamentos/[id]/editar">) {
  const user = await requireUser();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const med = await getMedication(user.id, id);
  if (!med) notFound();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Editar medicamento</h1>
      <MedicationForm
        action={updateMedication.bind(null, id)}
        submitLabel="Salvar alterações"
        defaults={{
          name: med.name,
          dose: med.dose,
          unit: med.unit,
          notes: med.notes ?? "",
          times: med.schedules.map((s) => s.time.slice(0, 5)).sort(),
          days: med.schedules[0]?.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
        }}
      />
    </section>
  );
}
