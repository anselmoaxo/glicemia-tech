// @vitest-environment jsdom
// Regressão: formulários não podem apagar o que a pessoa digitou quando a ação devolve um erro.
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useActionState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useFormAction } from "@/lib/use-form-action";

type S = { msg: string };
const act = async (_: S, fd: FormData): Promise<S> => ({ msg: `erro:${fd.get("v")}|botao:${fd.get("acao") ?? "-"}` });

function Nativo() {
  const [state, action] = useActionState(act, { msg: "" });
  return (
    <form action={action}>
      <input aria-label="valor" name="v" defaultValue="" />
      <button>enviar</button>
      <p>{state.msg}</p>
    </form>
  );
}

function Seguro() {
  const [state, onSubmit, pending] = useFormAction(act, { msg: "" });
  return (
    <form onSubmit={onSubmit}>
      <input aria-label="valor" name="v" defaultValue="" />
      <button name="acao" value="salvar" disabled={pending}>enviar</button>
      <p>{state.msg}</p>
    </form>
  );
}

afterEach(cleanup);

describe("reset de formulário do React 19", () => {
  it("(problema) <form action> apaga o campo depois da ação", async () => {
    const user = userEvent.setup();
    render(<Nativo />);
    await user.type(screen.getByLabelText("valor"), "abc");
    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText(/erro:abc/)).toBeTruthy());
    expect((screen.getByLabelText("valor") as HTMLInputElement).value).toBe("");
  });

  it("(correção) useFormAction mantém o que foi digitado e envia o botão clicado", async () => {
    const user = userEvent.setup();
    render(<Seguro />);
    await user.type(screen.getByLabelText("valor"), "abc");
    await user.click(screen.getByRole("button"));
    await waitFor(() => expect(screen.getByText("erro:abc|botao:salvar")).toBeTruthy());
    expect((screen.getByLabelText("valor") as HTMLInputElement).value).toBe("abc");
  });
});
