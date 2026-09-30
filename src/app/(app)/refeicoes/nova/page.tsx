import type { Metadata } from "next";
import { MealForm } from "@/components/meal-form";
import { dateToLocalInputs } from "@/lib/datetime";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { createMeal } from "../actions";

export const metadata: Metadata = { title: "Registrar refeição" };

export default async function NovaRefeicaoPage() {
  const user = await requireUser();
  const { timezone } = await getProfile(user.id);
  const { date, time } = dateToLocalInputs(new Date(), timezone);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Registrar refeição</h1>
      <MealForm
        action={createMeal}
        submitLabel="Salvar"
        defaults={{ mealType: "", customType: "", date, time, description: "" }}
      />
    </section>
  );
}
