import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function ThrowingComponent({ message }: { message: string }) {
  throw new Error(message);
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <p>Hello world</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingComponent message="Test error" />
      </ErrorBoundary>
    );

    expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByText("Recargar página")).toBeInTheDocument();

    spy.mockRestore();
  });
});
