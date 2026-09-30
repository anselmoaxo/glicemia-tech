// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signUp = vi.fn();
const completeSignup = vi.fn();
const replace = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signUp: { email: (...a: unknown[]) => signUp(...a) } } }));
vi.mock("@/components/recaptcha", () => ({
  Recaptcha: ({ onChange, ref }: { onChange: (t: string | null) => void; ref?: { current: unknown } }) => {
    if (ref) ref.current = { reset: () => onChange(null) };
    return <button type="button" onClick={() => onChange("token-abc")}>marcar captcha</button>;
  },
}));
vi.mock("@/app/(auth)/actions", () => ({ completeSignup: (...a: unknown[]) => completeSignup(...a) }));

import { SignupWizard } from "./signup-wizard";

const summary = () => within(document.querySelector("dl") as HTMLElement);
const heading = () => screen.getByRole("heading", { level: 2 }).textContent;

beforeEach(() => {
  signUp.mockResolvedValue({ error: null });
  completeSignup.mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function fillStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome"), "Maria Silva");
  await user.type(screen.getByLabelText("E-mail"), "maria@example.com");
  await user.type(screen.getByLabelText(/Senha/), "senha-segura-1");
}

describe("SignupWizard", () => {
  it("começa no passo 1 e não avança com dados inválidos", async () => {
    const user = userEvent.setup();
    render(<SignupWizard />);
    expect(screen.getByText("Passo 1 de 4")).toBeTruthy();
    expect(heading()).toBe("Crie seu acesso");

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("alert").textContent).toMatch(/nome/i);
    expect(screen.getByText("Passo 1 de 4")).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("percorre os 4 passos, mostra o resumo e só cria a conta no final", async () => {
    const user = userEvent.setup();
    render(<SignupWizard next="/inicio" />);

    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(heading()).toBe("Sobre você");
    expect(signUp).not.toHaveBeenCalled(); // ainda não criou nada

    await user.type(screen.getByLabelText("Data de nascimento"), "1960-03-10");
    await user.selectOptions(screen.getByLabelText("Sexo"), "feminino");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(heading()).toBe("Sobre o diabetes");

    await user.selectOptions(screen.getByLabelText("Tipo de diabetes"), "tipo2");
    await user.type(screen.getByLabelText("Há quantos anos tem diabetes?"), "8");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(heading()).toBe("Quase lá");
    for (const v of ["Maria Silva", "maria@example.com", "10/03/1960", "Feminino", "Tipo 2", "8 anos"]) {
      expect(summary().getByText(v)).toBeTruthy();
    }

    // sem aceitar os termos, não cria
    await user.click(screen.getByRole("button", { name: /Criar minha conta/ }));
    expect(screen.getByRole("alert").textContent).toMatch(/aceitar/i);
    expect(signUp).not.toHaveBeenCalled();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/ }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/inicio"));
    expect(signUp).toHaveBeenCalledWith(
      { name: "Maria Silva", email: "maria@example.com", password: "senha-segura-1" },
      { headers: undefined }, // sem chave do captcha configurada
    );
    expect(completeSignup).toHaveBeenCalledWith({
      birthDate: "1960-03-10",
      sex: "feminino",
      diabetesType: "tipo2",
      yearsWithDiabetes: "8",
    });
  });

  it("permite pular os passos opcionais e voltar sem perder o que foi digitado", async () => {
    const user = userEvent.setup();
    render(<SignupWizard />);
    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await user.click(screen.getByRole("button", { name: "Pular este passo" }));
    expect(heading()).toBe("Sobre o diabetes");
    await user.click(screen.getByRole("button", { name: "Pular este passo" }));
    expect(heading()).toBe("Quase lá");
    expect(summary().getAllByText("Não informado")).toHaveLength(2); // nascimento e tempo
    expect(summary().getAllByText("Prefiro não informar")).toHaveLength(2); // sexo e tipo

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(heading()).toBe("Crie seu acesso");
    expect((screen.getByLabelText("Nome") as HTMLInputElement).value).toBe("Maria Silva");
  });

  it("valida a data de nascimento no passo 2 e volta ao passo 1 se o e-mail já existir", async () => {
    const user = userEvent.setup();
    signUp.mockResolvedValue({ error: { message: "exists" } });
    render(<SignupWizard />);
    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    await user.type(screen.getByLabelText("Data de nascimento"), "2999-01-01");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("alert").textContent).toMatch(/futuro/i);
    expect(heading()).toBe("Sobre você");

    await user.clear(screen.getByLabelText("Data de nascimento"));
    await user.click(screen.getByRole("button", { name: "Pular este passo" }));
    await user.click(screen.getByRole("button", { name: "Pular este passo" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/ }));

    await waitFor(() => expect(heading()).toBe("Crie seu acesso"));
    expect(screen.getByRole("alert").textContent).toMatch(/já tem cadastro/i);
    expect(completeSignup).not.toHaveBeenCalled();
  });

  it("com captcha: exige marcar no último passo e envia o token", async () => {
    const user = userEvent.setup();
    render(<SignupWizard siteKey="pub" />);
    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Pular este passo" }));
    await user.click(screen.getByRole("button", { name: "Pular este passo" }));
    await user.click(screen.getByRole("checkbox"));

    await user.click(screen.getByRole("button", { name: /Criar minha conta/ }));
    expect(screen.getByRole("alert").textContent).toMatch(/Não sou um robô/);
    expect(signUp).not.toHaveBeenCalled();

    await user.click(screen.getByText("marcar captcha"));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/ }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/inicio"));
    expect(signUp.mock.calls[0][1]).toEqual({ headers: { "x-captcha-response": "token-abc" } });
  });

  it("falha de captcha no cadastro fica no último passo (não volta ao início)", async () => {
    const user = userEvent.setup();
    signUp.mockResolvedValue({ error: { status: 403, code: "VERIFICATION_FAILED" } });
    render(<SignupWizard siteKey="pub" />);
    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(screen.getByRole("button", { name: "Pular este passo" }));
    await user.click(screen.getByRole("button", { name: "Pular este passo" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByText("marcar captcha"));
    await user.click(screen.getByRole("button", { name: /Criar minha conta/ }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/robô/));
    expect(heading()).toBe("Quase lá");
  });
});
