import { describe, expect, it } from "vitest";
import { parseAdminIds } from "./admin-ids";

describe("parseAdminIds", () => {
  it("separa por vírgula e ignora espaços e vazios", () => {
    expect([...parseAdminIds(" a1 , b2,, ")]).toEqual(["a1", "b2"]);
  });
  it("sem configuração, ninguém é administrador", () => {
    expect(parseAdminIds(undefined).size).toBe(0);
    expect(parseAdminIds("").size).toBe(0);
  });
});
