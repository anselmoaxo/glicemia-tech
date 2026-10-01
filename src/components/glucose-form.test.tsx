// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GlucoseForm } from "./glucose-form";
import { RANGE_NOTICE } from "@/lib/alerts/range";

afterEach(cleanup);

const defaults = {
  value: "", date: "2026-09-30", time: "08:00", contextKey: "", customContext: "", notes: "", symptoms: "", activity: "",
};

async function submit(action: () => Promise<{ outOfRange?: boolean; error?: string }>) {
  render(<GlucoseForm action={action} defaults={{ ...defaults, contextKey: "jejum" }} submitLabel="Salvar" />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Glicemia/), "150");
  await user.click(screen.getByRole("button", { name: "Salvar" }));
}

describe("aviso de medição fora da faixa", () => {
  it("mostra a mensagem neutra, sem classificar nem sugerir conduta", async () => {
    await submit(vi.fn(async () => ({ outOfRange: true })));
    const note = await screen.findByRole("status");
    expect(note.textContent).toContain(RANGE_NOTICE);
    expect(note.textContent).not.toMatch(/hipoglicemia|hiperglicemia|urgên|emergên|dose|insulina/i);
  });

  it("não mostra aviso quando a ação não sinaliza fora da faixa", async () => {
    await submit(vi.fn(async () => ({ error: "Valor muito alto" })));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
