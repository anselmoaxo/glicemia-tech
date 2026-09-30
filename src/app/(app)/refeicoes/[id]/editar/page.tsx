import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MealForm } from "@/components/meal-form";
import { dateToLocalInputs } from "@/lib/datetime";
import { uuidSchema } from "@/lib/glucose/validation";
import { getMeal } from "@/lib/meals/queries";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { updateMeal } from "../../actions";

export const metadata: Metadata = { title: "Editar refeição" };

export default async function EditarRefeicaoPage({ params }: PageProps<"/refeicoes/[id]/editar">) {
  const user = await requireUser();
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const [meal, { timezone }] = await Promise.all([getMeal(user.id, id), getProfile(user.id)]);
  if (!meal) notFound();
  const { date, time } = dateToLocalInputs(meal.eatenAt, timezone);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Editar refeição</h1>
      <MealForm
        action={updateMeal.bind(null, id)}
        submitLabel="Salvar alterações"
        defaults={{
          mealType: meal.mealType,
          customType: meal.customType ?? "",
          date,
          time,
          description: meal.description,
        }}
      />
    </section>
  );
}
