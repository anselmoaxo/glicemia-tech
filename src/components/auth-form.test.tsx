// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signIn = vi.fn();
const replace = vi.fn();
const reset = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signIn: { email: (...a: unknown[]) => signIn(...a) } } }));
// caixa do Google substituída por um botão que entrega um token
vi.mock("@/components/recaptcha", () => ({
  Recaptcha: ({ onChange, ref }: { onChange: (t: string | null) => void; ref?: { current: unknown } }) => {
    if (ref) ref.current = { reset: () => { reset(); onChange(null); } };
    return <button type="button" onClick={() => onChange("token-abc")}>marcar captcha</button>;
  },
}));

import { AuthForm } from "./auth-form";

beforeEach(() => signIn.mockResolvedValue({ error: null }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("E-mail"), "maria@example.com");
  await user.type(screen.getByLabelText("Senha"), "senha-errada");
}

describe("AuthForm com captcha", () => {
  it("sem chave configurada: não mostra captcha e não envia cabeçalho", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);
    expect(screen.queryByText("marcar captcha")).toBeNull();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1));
    expect(signIn.mock.calls[0][1].headers).toBeUndefined();
  });

  it("com chave: exige marcar antes de entrar", async () => {
    const user = userEvent.setup();
    render(<AuthForm siteKey="pub" />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Não sou um robô/);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("com chave marcada: envia o token no cabeçalho e segue para a próxima página", async () => {
    const user = userEvent.setup();
    render(<AuthForm siteKey="pub" next="/inicio" />);
    await fill(user);
    await user.click(screen.getByText("marcar captcha"));
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/inicio"));
    expect(signIn.mock.calls[0][1].headers).toEqual({ "x-captcha-response": "token-abc" });
  });

  it("senha errada: mostra erro genérico e pede novo captcha (token é de uso único)", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ error: { status: 401, code: "INVALID_EMAIL_OR_PASSWORD", message: "x" } });
    render(<AuthForm siteKey="pub" />);
    await fill(user);
    await user.click(screen.getByText("marcar captcha"));
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/e-mail e senha/);
    expect(reset).toHaveBeenCalledTimes(1);
    // sem novo token, não tenta de novo
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Não sou um robô/));
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it("conta bloqueada: mostra o aviso do servidor com os minutos", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ error: { status: 429, message: "Muitas tentativas de entrada. Por segurança, aguarde 15 minutos e tente de novo." } });
    render(<AuthForm />);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/aguarde 15 minutos/);
  });
});
