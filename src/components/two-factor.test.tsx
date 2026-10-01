// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { replace, refresh, tf, signIn } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    replace: fn(),
    refresh: fn(),
    signIn: fn(),
    tf: {
      verifyTotp: fn(),
      sendOtp: fn(),
      verifyOtp: fn(),
      verifyBackupCode: fn(),
      enable: fn(),
      disable: fn(),
      generateBackupCodes: fn(),
    },
  };
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: (...a: unknown[]) => signIn(...a) },
    twoFactor: Object.fromEntries(Object.entries(tf).map(([k, fn]) => [k, (...a: unknown[]) => fn(...a)])),
  },
}));

import { AuthForm } from "./auth-form";
import { TwoFactorChallenge } from "./two-factor-challenge";
import { TwoFactorSettings } from "./two-factor-settings";

const ok = { data: {}, error: null };
beforeEach(() => {
  for (const fn of Object.values(tf)) fn.mockResolvedValue(ok);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const type = async (user: ReturnType<typeof userEvent.setup>, label: RegExp | string, value: string) =>
  user.type(screen.getByLabelText(label), value);

describe("TwoFactorChallenge (segunda etapa do login)", () => {
  it("com aplicativo: começa pelo código do app, confere o formato e entra", async () => {
    const user = userEvent.setup();
    render(<TwoFactorChallenge methods={["totp", "otp"]} next="/inicio" onBack={vi.fn()} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/código do aplicativo/);
    expect(tf.sendOtp).not.toHaveBeenCalled(); // não manda e-mail sem a pessoa pedir

    await type(user, /Código de 6 números/, "12ab");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/6 números/);
    expect(tf.verifyTotp).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText(/Código de 6 números/));
    await type(user, /Código de 6 números/, "123 456");
    await user.click(screen.getByLabelText(/Não pedir o código/));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/inicio"));
    expect(tf.verifyTotp).toHaveBeenCalledWith({ code: "123456", trustDevice: true });
  });

  it("código errado mostra mensagem clara e não entra", async () => {
    const user = userEvent.setup();
    tf.verifyTotp.mockResolvedValue({ data: null, error: { status: 401, code: "INVALID_CODE" } });
    render(<TwoFactorChallenge methods={["totp"]} next="/inicio" onBack={vi.fn()} />);
    await type(user, /Código de 6 números/, "000000");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Código incorreto/);
    expect(replace).not.toHaveBeenCalled();
  });

  it("conta bloqueada por erros seguidos explica o bloqueio de 15 minutos", async () => {
    const user = userEvent.setup();
    tf.verifyTotp.mockResolvedValue({ data: null, error: { status: 403, code: "ACCOUNT_TEMPORARILY_LOCKED" } });
    render(<TwoFactorChallenge methods={["totp"]} next="/inicio" onBack={vi.fn()} />);
    await type(user, /Código de 6 números/, "111111");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/15 minutos/);
  });

  it("troca para o código por e-mail: envia o código e confere", async () => {
    const user = userEvent.setup();
    render(<TwoFactorChallenge methods={["totp", "otp"]} next="/inicio" onBack={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Receber um código por e-mail" }));
    await waitFor(() => expect(tf.sendOtp).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("heading", { level: 2 }).textContent).toMatch(/código do e-mail/);
    expect(await screen.findByText(/Código enviado/)).toBeTruthy();
    // não deixa reenviar de imediato (evita e-mail em excesso)
    expect((screen.getByRole("button", { name: /aguarde/ }) as HTMLButtonElement).disabled).toBe(true);

    await type(user, /Código de 6 números/, "654321");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(tf.verifyOtp).toHaveBeenCalledWith({ code: "654321", trustDevice: false }));
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });

  it("código de recuperação: aceita texto e envia como veio", async () => {
    const user = userEvent.setup();
    render(<TwoFactorChallenge methods={["totp"]} next="/glicemia" onBack={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Usar um código de recuperação" }));
    await type(user, "Código de recuperação", "abcde-12345");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(tf.verifyBackupCode).toHaveBeenCalledWith({ code: "abcde-12345", trustDevice: false }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/glicemia"));
  });

  it("só e-mail: envia o código ao abrir e não oferece aplicativo nem recuperação", async () => {
    render(<TwoFactorChallenge methods={["otp"]} next="/inicio" onBack={vi.fn()} />);
    await waitFor(() => expect(tf.sendOtp).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("button", { name: "Usar o aplicativo autenticador" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Usar um código de recuperação" })).toBeNull();
    expect(screen.getByRole("button", { name: "Voltar e entrar de novo" })).toBeTruthy();
  });
});

describe("AuthForm com duas etapas", () => {
  it("senha certa em conta com 2FA abre a segunda etapa em vez de entrar", async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue({ data: { twoFactorRedirect: true, twoFactorMethods: ["totp"] }, error: null });
    render(<AuthForm />);
    await user.type(screen.getByLabelText("E-mail"), "maria@example.com");
    await user.type(screen.getByLabelText("Senha"), "senha-certa-123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Digite o código do aplicativo")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled(); // ainda sem acesso

    await user.click(screen.getByRole("button", { name: "Voltar e entrar de novo" }));
    expect(await screen.findByRole("button", { name: "Entrar" })).toBeTruthy(); // voltou ao formulário
  });
});

describe("TwoFactorSettings (Perfil)", () => {
  it("desativada: oferece e-mail (se disponível) e aplicativo", () => {
    render(<TwoFactorSettings enabled={false} hasTotp={false} emailAvailable />);
    expect(screen.getByText("Desativada")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ativar por e-mail" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Configurar aplicativo" })).toBeTruthy();
    cleanup();
    render(<TwoFactorSettings enabled={false} hasTotp={false} emailAvailable={false} />);
    expect(screen.queryByRole("button", { name: "Ativar por e-mail" })).toBeNull(); // sem e-mail configurado, só aplicativo
  });

  it("ativar por e-mail exige a senha e recarrega o Perfil", async () => {
    const user = userEvent.setup();
    render(<TwoFactorSettings enabled={false} hasTotp={false} emailAvailable />);
    await user.click(screen.getByRole("button", { name: "Ativar por e-mail" }));
    await user.click(screen.getByRole("button", { name: "Ativar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Digite a sua senha/);
    expect(tf.enable).not.toHaveBeenCalled();

    await type(user, "Sua senha", "senha-certa-123");
    await user.click(screen.getByRole("button", { name: "Ativar" }));
    await waitFor(() => expect(tf.enable).toHaveBeenCalledWith({ password: "senha-certa-123", method: "otp" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("senha errada mostra o erro e não ativa", async () => {
    const user = userEvent.setup();
    tf.enable.mockResolvedValue({ data: null, error: { status: 400, code: "INVALID_PASSWORD" } });
    render(<TwoFactorSettings enabled={false} hasTotp={false} emailAvailable />);
    await user.click(screen.getByRole("button", { name: "Ativar por e-mail" }));
    await type(user, "Sua senha", "errada-123456");
    await user.click(screen.getByRole("button", { name: "Ativar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Senha incorreta/);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("aplicativo: senha, QR com chave manual, confirmação do código e códigos de recuperação", async () => {
    const user = userEvent.setup();
    tf.enable.mockResolvedValue({
      data: { method: "totp", totpURI: "otpauth://totp/Glicose%20Tech:maria@example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Glicose%20Tech", backupCodes: ["aaaaa-11111", "bbbbb-22222"] },
      error: null,
    });
    render(<TwoFactorSettings enabled={false} hasTotp={false} emailAvailable />);
    await user.click(screen.getByRole("button", { name: "Configurar aplicativo" }));
    await type(user, "Sua senha", "senha-certa-123");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("Leia o código QR")).toBeTruthy();
    expect(document.querySelector("svg title")?.textContent).toMatch(/Código QR/);
    expect(screen.getByText("JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP")).toBeTruthy(); // chave manual agrupada

    // código errado não ativa
    tf.verifyTotp.mockResolvedValueOnce({ data: null, error: { status: 401, code: "INVALID_CODE" } });
    await type(user, /Código de 6 números do aplicativo/, "000000");
    await user.click(screen.getByRole("button", { name: "Confirmar e ativar" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Código incorreto/);

    // código certo mostra os códigos de recuperação, uma única vez
    await user.clear(screen.getByLabelText(/Código de 6 números do aplicativo/));
    await type(user, /Código de 6 números do aplicativo/, "123456");
    await user.click(screen.getByRole("button", { name: "Confirmar e ativar" }));
    expect(await screen.findByText("Guarde seus códigos de recuperação")).toBeTruthy();
    expect(screen.getByText("Ativada")).toBeTruthy(); // já está ativa, mesmo antes de o Perfil recarregar
    const list = screen.getByRole("list", { name: "Códigos de recuperação" });
    expect(within(list).getAllByRole("listitem").map((l) => l.textContent)).toEqual(["aaaaa-11111", "bbbbb-22222"]);

    const done = screen.getByRole("button", { name: "Concluir" }) as HTMLButtonElement;
    expect(done.disabled).toBe(true); // só depois de confirmar que guardou
    await user.click(screen.getByLabelText(/Guardei meus códigos/));
    expect(done.disabled).toBe(false);
    await user.click(done);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("ativada com aplicativo: gerar novos códigos e desativar pedem a senha", async () => {
    const user = userEvent.setup();
    tf.generateBackupCodes.mockResolvedValue({ data: { backupCodes: ["novo-00001"] }, error: null });
    render(<TwoFactorSettings enabled hasTotp emailAvailable />);
    expect(screen.getByText("Ativada")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Adicionar aplicativo autenticador" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Gerar novos códigos de recuperação" }));
    await type(user, "Sua senha", "senha-certa-123");
    await user.click(screen.getByRole("button", { name: "Gerar novos códigos" }));
    expect(await screen.findByText("novo-00001")).toBeTruthy();
    expect(tf.generateBackupCodes).toHaveBeenCalledWith({ password: "senha-certa-123" });

    cleanup();
    render(<TwoFactorSettings enabled hasTotp emailAvailable />);
    await user.click(screen.getByRole("button", { name: "Desativar a verificação em duas etapas" }));
    await type(user, "Sua senha", "senha-certa-123");
    await user.click(screen.getByRole("button", { name: "Desativar" }));
    await waitFor(() => expect(tf.disable).toHaveBeenCalledWith({ password: "senha-certa-123" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("ativada só por e-mail: oferece adicionar aplicativo (sem códigos de recuperação)", () => {
    render(<TwoFactorSettings enabled hasTotp={false} emailAvailable />);
    expect(screen.getByRole("button", { name: "Adicionar aplicativo autenticador" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Gerar novos códigos de recuperação" })).toBeNull();
  });
});
