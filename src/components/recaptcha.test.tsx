// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Recaptcha, type RecaptchaHandle } from "./recaptcha";

type Opts = { sitekey: string; size: string; callback: (t: string) => void; "expired-callback": () => void; "error-callback": () => void };
const render_ = vi.fn<(el: HTMLElement, o: Opts) => number>(() => 7);
const reset = vi.fn();
(window as unknown as { grecaptcha: unknown }).grecaptcha = { ready: (cb: () => void) => cb(), render: render_, reset };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Recaptcha", () => {
  it("desenha o widget com a chave pública e devolve o token ao marcar", async () => {
    const onChange = vi.fn();
    render(<Recaptcha siteKey="chave-publica" onChange={onChange} />);
    await waitFor(() => expect(render_).toHaveBeenCalledTimes(1));
    const opts = render_.mock.calls[0][1];
    expect(opts.sitekey).toBe("chave-publica");

    opts.callback("token-123");
    expect(onChange).toHaveBeenLastCalledWith("token-123");
    opts["expired-callback"]();
    expect(onChange).toHaveBeenLastCalledWith(null);
    opts["error-callback"]();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("reset() reinicia o widget e limpa o token", async () => {
    const onChange = vi.fn();
    const ref = createRef<RecaptchaHandle>();
    render(<Recaptcha ref={ref} siteKey="k" onChange={onChange} />);
    await waitFor(() => expect(render_).toHaveBeenCalled());
    ref.current!.reset();
    expect(reset).toHaveBeenCalledWith(7);
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
