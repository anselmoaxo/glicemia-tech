import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InsulinForm } from "@/components/insulin-form";
import { dateToLocalInputs } from "@/lib/datetime";
import { uuidSchema } from "@/lib/glucose/validation";
import { getInsulinLog, listInsulinTypes } from "@/lib/insulin/queries";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { updateInsulinLog } from "../../actions";

export const metadata: Metadata = { title: "Editar insulina" };

export default async function EditarInsulinaPage({ params }: PageProps<"/insulina/[id]/editar">) {
  const user = await requireUser();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const [log, types, { timezone }] = await Promise.all([
    getInsulinLog(user.id, id),
    listInsulinTypes(user.id),
    getProfile(user.id),
  ]);
  if (!log) notFound();
  const { date, time } = dateToLocalInputs(log.appliedAt, timezone);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Editar insulina</h1>
      <InsulinForm
        action={updateInsulinLog.bind(null, id)}
        types={types}
        submitLabel="Salvar alterações"
        defaults={{
          units: String(Number(log.units)),
          typeId: log.typeId,
          newType: "",
          date,
          time,
          mealRelation: log.mealRelation,
          site: log.site ?? "",
          notes: log.notes ?? "",
        }}
      />
    </section>
  );
}
