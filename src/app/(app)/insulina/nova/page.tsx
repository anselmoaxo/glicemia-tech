import type { Metadata } from "next";
import { InsulinForm } from "@/components/insulin-form";
import { dateToLocalInputs } from "@/lib/datetime";
import { listInsulinTypes } from "@/lib/insulin/queries";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { createInsulinLog } from "../actions";

export const metadata: Metadata = { title: "Registrar insulina" };

export default async function NovaInsulinaPage() {
  const user = await requireUser();
  const [types, { timezone }] = await Promise.all([listInsulinTypes(user.id), getProfile(user.id)]);
  const { date, time } = dateToLocalInputs(new Date(), timezone);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Registrar insulina</h1>
      <InsulinForm
        action={createInsulinLog}
        types={types}
        submitLabel="Salvar"
        defaults={{ units: "", typeId: "", newType: "", date, time, mealRelation: "", site: "", notes: "" }}
      />
    </section>
  );
}
