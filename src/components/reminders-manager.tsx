"use client";

import { useState } from "react";
import {
  deleteReminder,
  saveReminder,
  setReminderEnabled,
  type ReminderState,
} from "@/app/(app)/alertas/actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALL_DAYS, DAYS, daysSummary, TIMEZONES } from "@/lib/alerts/reminders";
import { useFormAction } from "@/lib/use-form-action";

export type ReminderRow = { id: string; time: string; daysMask: number; timezone: string; enabled: boolean };

const tzLabel = (tz: string) => TIMEZONES.find((t) => t.value === tz)?.label ?? tz;

function ReminderForm({
  reminder,
  defaultTimezone,
  onDone,
}: {
  reminder?: ReminderRow;
  defaultTimezone: string;
  onDone: () => void;
}) {
  const id = reminder?.id ?? "new";
  const [state, onSubmit, pending] = useFormAction<ReminderState>(async (prev, fd) => {
    const res = await saveReminder(reminder?.id ?? null, prev, fd);
    if (res.ok) onDone();
    return res;
  }, {});
  const mask = reminder?.daysMask ?? ALL_DAYS;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={reminder ? "Editar lembrete" : "Novo lembrete"}
      className="flex flex-col gap-5 rounded-2xl border-2 border-primary/40 bg-card p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`time-${id}`} className="text-base">Horário</Label>
        <Input
          id={`time-${id}`}
          name="time"
          type="time"
          defaultValue={reminder?.time ?? ""}
          required
          className="h-14 max-w-48 text-2xl font-bold"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-base font-medium">Em quais dias?</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <label key={d.bit} className="relative">
              <input
                type="checkbox"
                name="day"
                value={d.bit}
                defaultChecked={!!(mask & d.bit)}
                aria-label={d.label}
                className="peer sr-only"
              />
              <span className="flex min-h-12 min-w-14 cursor-pointer items-center justify-center rounded-lg border-2 border-input px-3 text-base font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                {d.short}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`tz-${id}`} className="text-base">Fuso horário</Label>
        <select
          id={`tz-${id}`}
          name="timezone"
          defaultValue={reminder?.timezone ?? defaultTimezone}
          className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring"
        >
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">O lembrete chega no horário local do fuso escolhido.</p>
      </div>

      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={pending} className="h-14 px-6 text-lg">
          {pending ? "Salvando..." : reminder ? "Salvar alterações" : "Adicionar lembrete"}
        </Button>
        <button
          type="button"
          onClick={onDone}
          className="flex min-h-14 items-center justify-center px-4 text-base underline underline-offset-4"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function RemindersManager({ reminders, defaultTimezone }: { reminders: ReminderRow[]; defaultTimezone: string }) {
  const [editing, setEditing] = useState<string | null>(null); // id do lembrete, "new" ou null

  return (
    <div className="flex flex-col gap-4">
      {reminders.length === 0 && editing !== "new" && (
        <p className="text-base text-muted-foreground">Você ainda não criou nenhum lembrete.</p>
      )}

      <ul className="flex flex-col gap-3">
        {reminders.map((r) => (
          <li key={r.id}>
            {editing === r.id ? (
              <ReminderForm reminder={r} defaultTimezone={defaultTimezone} onDone={() => setEditing(null)} />
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-3xl font-bold tabular-nums">{r.time}</p>
                  <p
                    className={`rounded-full px-3 py-1 text-base font-semibold ${
                      r.enabled ? "bg-secondary text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.enabled ? "Ativo" : "Pausado"}
                  </p>
                </div>
                <p className="text-base">{daysSummary(r.daysMask)}</p>
                <p className="text-sm text-muted-foreground">{tzLabel(r.timezone)}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setEditing(r.id)}
                    className="flex min-h-12 items-center justify-center rounded-lg border-2 border-input text-base font-medium focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Editar
                  </button>
                  <form action={setReminderEnabled}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="enabled" value={r.enabled ? "false" : "true"} />
                    <button className="flex min-h-12 w-full items-center justify-center rounded-lg border-2 border-input text-base font-medium focus-visible:outline-2 focus-visible:outline-ring">
                      {r.enabled ? "Pausar" : "Reativar"}
                    </button>
                  </form>
                  <form action={deleteReminder}>
                    <input type="hidden" name="id" value={r.id} />
                    <ConfirmDeleteButton message="Excluir este lembrete? Essa ação não pode ser desfeita." />
                  </form>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <ReminderForm defaultTimezone={defaultTimezone} onDone={() => setEditing(null)} />
      ) : (
        <Button type="button" onClick={() => setEditing("new")} className="h-14 text-lg">
          Novo lembrete
        </Button>
      )}
    </div>
  );
}
