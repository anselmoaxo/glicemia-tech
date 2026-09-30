import { logDose } from "@/app/(app)/medicamentos/actions";

type Props = {
  scheduleId: string;
  date: string;
  time: string;
  name: string;
  dose: string;
  unit: string;
  status?: "taken" | "skipped";
};

const base =
  "min-h-14 flex-1 rounded-lg border-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function DoseRow({ scheduleId, date, time, name, dose, unit, status }: Props) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4">
      <div>
        <p className="text-xl font-semibold">{name}</p>
        <p className="text-base text-muted-foreground">
          {time} · {dose} {unit}
        </p>
      </div>
      <form action={logDose} className="flex gap-3">
        <input type="hidden" name="scheduleId" value={scheduleId} />
        <input type="hidden" name="date" value={date} />
        <button
          name="status"
          value="taken"
          aria-pressed={status === "taken"}
          className={`${base} ${status === "taken" ? "border-green-700 bg-green-700 text-white" : "border-input"}`}
        >
          {status === "taken" ? "✓ Tomei" : "Tomei"}
        </button>
        <button
          name="status"
          value="skipped"
          aria-pressed={status === "skipped"}
          className={`${base} ${status === "skipped" ? "border-foreground bg-foreground text-background" : "border-input"}`}
        >
          {status === "skipped" ? "✓ Não tomei" : "Não tomei"}
        </button>
      </form>
    </li>
  );
}
