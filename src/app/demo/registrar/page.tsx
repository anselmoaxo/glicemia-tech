import { GlucoseForm } from "@/components/glucose-form";
import type { ReadingState } from "@/app/(app)/glicemia/actions";

// Formulário real, mas o envio não grava nada.
async function demoSubmit(): Promise<ReadingState> {
  "use server";
  return { error: "Demonstração: nada é salvo. Entre com uma conta para registrar de verdade." };
}

export default function DemoRegistrar() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Registrar glicemia</h1>
      <GlucoseForm
        action={demoSubmit}
        submitLabel="Salvar"
        defaults={{ value: "", date: "2026-03-10", time: "07:30", contextKey: "", customContext: "", notes: "", symptoms: "", activity: "" }}
      />
    </section>
  );
}
