import { describe, it, expect } from "vitest";
import { isValidEmail, isValidPhone, validatePassword } from "./validation";

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("name.last@school.edu.pe")).toBe(true);
    expect(isValidEmail("test+tag@gmail.com")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@no-user.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("trims whitespace before validating", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });
});

describe("isValidPhone", () => {
  it("accepts valid phone numbers", () => {
    expect(isValidPhone("+51 987 654 321")).toBe(true);
    expect(isValidPhone("987654321")).toBe(true);
    expect(isValidPhone("+1-555-123-4567")).toBe(true);
  });

  it("allows empty phone (optional field)", () => {
    expect(isValidPhone("")).toBe(true);
    expect(isValidPhone("   ")).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    expect(isValidPhone("abc")).toBe(false);
    expect(isValidPhone("123")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("returns null for a strong password", () => {
    expect(validatePassword("Director2026!")).toBeNull();
    expect(validatePassword("Str0ng@Pass")).toBeNull();
    expect(validatePassword("Abc12345!")).toBeNull();
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(validatePassword("Ab1!")).toBe("La contraseña debe tener al menos 8 caracteres");
  });

  it("rejects passwords without lowercase", () => {
    expect(validatePassword("ABCDEFG1!")).toBe("La contraseña debe contener al menos una letra minúscula");
  });

  it("rejects passwords without uppercase", () => {
    expect(validatePassword("abcdefg1!")).toBe("La contraseña debe contener al menos una letra mayúscula");
  });

  it("rejects passwords without a number", () => {
    expect(validatePassword("Abcdefgh!")).toBe("La contraseña debe contener al menos un número");
  });

  it("rejects passwords without a special character", () => {
    expect(validatePassword("Abcdefg1")).toBe("La contraseña debe contener al menos un carácter especial");
  });
});
