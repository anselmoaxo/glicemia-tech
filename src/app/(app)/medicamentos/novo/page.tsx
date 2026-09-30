import type { Metadata } from "next";
import { MedicationForm } from "@/components/medication-form";
import { requireUser } from "@/lib/session";
import { createMedication } from "../actions";

export const metadata: Metadata = { title: "Novo medicamento" };

export default async function NovoMedicamentoPage() {
  await requireUser();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Novo medicamento</h1>
      <MedicationForm
        action={createMedication}
        submitLabel="Salvar"
        defaults={{ name: "", dose: "", unit: "mg", notes: "", times: [], days: [0, 1, 2, 3, 4, 5, 6] }}
      />
    </section>
  );
}
