import { describe, expect, it } from "vitest";
import { shouldUpdate, statusFromEvent, statusFromLastEvent } from "./email-status";

describe("status de e-mail", () => {
  it("só marca entregue com o evento de entrega", () => {
    expect(statusFromEvent("email.sent")).toBe("sent");
    expect(statusFromEvent("email.delivered")).toBe("delivered");
    expect(statusFromEvent("email.bounced")).toBe("rejected");
    expect(statusFromEvent("email.opened")).toBeNull();
    expect(statusFromLastEvent("delivery_delayed")).toBe("delayed");
  });
  it("não regride quando os eventos chegam fora de ordem", () => {
    expect(shouldUpdate("delivered", "sent")).toBe(false);
    expect(shouldUpdate("sent", "delivered")).toBe(true);
    expect(shouldUpdate("delivered", "delivered")).toBe(false);
  });
});
