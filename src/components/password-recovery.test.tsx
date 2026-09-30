// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const requestPasswordReset = vi.fn();
const resetPassword = vi.fn();
const reset = vi.fn();

vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: (...a: unknown[]) => requestPasswordReset(...a),
    resetPassword: (...a: unknown[]) => resetPassword(...a),
  },
}));
vi.mock("@/components/recaptcha", () => ({
  Recaptcha: ({ onChange, ref }: { onChange: (t: string | null) => void; ref?: { current: unknown } }) => {
    if (ref) ref.current = { reset: () => { reset(); onChange(null); } };
    return <button type="button" onClick={() => onChange("token-abc")}>marcar captcha</button>;
  },
}));

import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";

beforeEach(() => {
  requestPasswordReset.mockResolvedValue({ error: null });
  resetPassword.mockResolvedValue({ error: null });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ForgotPasswordForm", () => {
  it("valida o e-mail antes de enviar", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText("E-mail"), "isso-nao-e-email");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/E-mail inválido/);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("pede o link e responde igual, exista a conta ou não (não revela cadastros)", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText("E-mail"), "maria@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/Se existir uma conta/));
    expect(requestPasswordReset.mock.calls[0][0]).toEqual({ email: "maria@example.com", redirectTo: "/redefinir-senha" });

    // mesmo quando o servidor devolve erro "de negócio" (ex.: usuário não encontrado), a tela é a mesma
    cleanup();
    requestPasswordReset.mockResolvedValue({ error: { status: 400, code: "USER_NOT_FOUND" } });
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText("E-mail"), "fantasma@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/Se existir uma conta/));
  });

  it("com captcha: exige marcar, envia o token e reinicia depois de usar", async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm siteKey="pub" />);
    await user.type(screen.getByLabelText("E-mail"), "maria@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Não sou um robô/);
    expect(requestPasswordReset).not.toHaveBeenCalled();

    await user.click(screen.getByText("marcar captcha"));
    await user.click(screen.getByRole("button", { name: "Enviar link" }));
    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledTimes(1));
    expect(requestPasswordReset.mock.calls[0][1]).toEqual({ headers: { "x-captcha-response": "token-abc" } });
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("limite de pedidos aparece como erro (429)", async () => {
    const user = userEvent.setup();
    requestPasswordReset.mockResolvedValue({ error: { status: 429, message: "Too many requests" } });
    render(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText("E-mail"), "maria@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar link" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Muitas tentativas/);
  });
});

describe("ResetPasswordForm", () => {
  it("confere tamanho e confirmação antes de chamar o servidor", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="tok" />);
    await user.type(screen.getByLabelText(/Nova senha/), "curta");
    await user.type(screen.getByLabelText(/Repita/), "curta");
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/ao menos 8/);

    await user.clear(screen.getByLabelText(/Nova senha/));
    await user.type(screen.getByLabelText(/Nova senha/), "senha-nova-123");
    await user.clear(screen.getByLabelText(/Repita/));
    await user.type(screen.getByLabelText(/Repita/), "senha-diferente");
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/não é igual/));
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("troca a senha com o token do link e mostra o caminho para entrar", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="tok-123" />);
    await user.type(screen.getByLabelText(/Nova senha/), "senha-nova-123");
    await user.type(screen.getByLabelText(/Repita/), "senha-nova-123");
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/Senha alterada/));
    expect(resetPassword).toHaveBeenCalledWith({ newPassword: "senha-nova-123", token: "tok-123" });
    expect(screen.getByRole("link", { name: "Entrar" }).getAttribute("href")).toBe("/login");
  });

  it("link vencido: explica e oferece pedir outro", async () => {
    const user = userEvent.setup();
    resetPassword.mockResolvedValue({ error: { status: 400, code: "INVALID_TOKEN" } });
    render(<ResetPasswordForm token="velho" />);
    await user.type(screen.getByLabelText(/Nova senha/), "senha-nova-123");
    await user.type(screen.getByLabelText(/Repita/), "senha-nova-123");
    await user.click(screen.getByRole("button", { name: "Salvar nova senha" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/inválido ou já expirou/);
    expect(screen.getByRole("link", { name: "Pedir um novo link" }).getAttribute("href")).toBe("/esqueci-senha");
  });
});
