// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const saveTargets = vi.fn();
vi.mock("@/app/(app)/metas/actions", () => ({ saveTargets: (...a: unknown[]) => saveTargets(...a) }));

import { TargetsForm } from "./targets-form";

beforeEach(() => saveTargets.mockResolvedValue({ ok: true, values: {} }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const field = (label: RegExp, group: string) =>
  within(screen.getByRole("group", { name: group })).getByLabelText(label) as HTMLInputElement;

describe("TargetsForm", () => {
  it("mostra as três faixas, vazias quando não há metas, com exemplos só como dica", () => {
    render(<TargetsForm targets={{}} />);
    for (const g of ["Geral (todos os contextos)", "Jejum", "Pós-refeição (1h e 2h)"]) {
      expect(screen.getByRole("group", { name: g })).toBeTruthy();
    }
    expect(field(/Mínimo/, "Jejum").value).toBe("");
    expect(field(/Mínimo/, "Jejum").placeholder).toBe("ex.: 70");
  });

  it("carrega as metas já salvas", () => {
    render(<TargetsForm targets={{ geral: { min: 70, max: 180 }, jejum: { min: 65, max: 99 } }} />);
    expect(field(/Mínimo/, "Geral (todos os contextos)").value).toBe("70");
    expect(field(/Máximo/, "Jejum").value).toBe("99");
    expect(field(/Mínimo/, "Pós-refeição (1h e 2h)").value).toBe("");
  });

  it("erro na faixa certa, foco no campo e sem perder o que foi digitado; servidor não é chamado", async () => {
    const user = userEvent.setup();
    render(<TargetsForm targets={{}} />);

    await user.type(field(/Mínimo/, "Geral (todos os contextos)"), "70");
    await user.type(field(/Máximo/, "Geral (todos os contextos)"), "180");
    await user.type(field(/Mínimo/, "Jejum"), "100");
    await user.type(field(/Máximo/, "Jejum"), "70"); // min maior que max
    await user.click(screen.getByRole("button", { name: "Salvar metas" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/menor que o máximo/);
    expect(within(screen.getByRole("group", { name: "Jejum" })).getByRole("alert")).toBe(alert);

    await waitFor(() => expect(document.activeElement).toBe(field(/Mínimo/, "Jejum")));
    expect(field(/Mínimo/, "Jejum").getAttribute("aria-invalid")).toBe("true");
    // nada foi apagado
    expect(field(/Mínimo/, "Jejum").value).toBe("100");
    expect(field(/Máximo/, "Jejum").value).toBe("70");
    expect(field(/Máximo/, "Geral (todos os contextos)").value).toBe("180");
    expect(saveTargets).not.toHaveBeenCalled();
  });

  it("faixa pela metade e número com vírgula são barrados com mensagem clara", async () => {
    const user = userEvent.setup();
    render(<TargetsForm targets={{}} />);
    await user.type(field(/Mínimo/, "Geral (todos os contextos)"), "70");
    await user.click(screen.getByRole("button", { name: "Salvar metas" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/mínimo e o máximo/);

    await user.type(field(/Máximo/, "Geral (todos os contextos)"), "1,5");
    await user.click(screen.getByRole("button", { name: "Salvar metas" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/inteiros/));
  });

  it("envia ao servidor quando está válido e confirma o salvamento", async () => {
    const user = userEvent.setup();
    render(<TargetsForm targets={{}} />);
    await user.type(field(/Mínimo/, "Geral (todos os contextos)"), "70");
    await user.type(field(/Máximo/, "Geral (todos os contextos)"), "180");
    await user.click(screen.getByRole("button", { name: "Salvar metas" }));

    await waitFor(() => expect(saveTargets).toHaveBeenCalledTimes(1));
    const fd = saveTargets.mock.calls[0][1] as FormData;
    expect(fd.get("geral_min")).toBe("70");
    expect(fd.get("geral_max")).toBe("180");
    expect(fd.get("jejum_min")).toBe("");

    expect((await screen.findByRole("status")).textContent).toMatch(/Metas salvas/);
    expect(field(/Máximo/, "Geral (todos os contextos)").value).toBe("180"); // continua na tela
  });

  it("deixar tudo em branco é permitido (remove as faixas)", async () => {
    const user = userEvent.setup();
    render(<TargetsForm targets={{ geral: { min: 70, max: 180 } }} />);
    await user.clear(field(/Mínimo/, "Geral (todos os contextos)"));
    await user.clear(field(/Máximo/, "Geral (todos os contextos)"));
    await user.click(screen.getByRole("button", { name: "Salvar metas" }));
    await waitFor(() => expect(saveTargets).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
