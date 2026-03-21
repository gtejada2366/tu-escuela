import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#fef2f2] flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-xl text-[#1e293b] font-semibold mb-2">
              Algo salió mal
            </h1>
            <p className="text-sm text-[#64748b] mb-6">
              Ha ocurrido un error inesperado. Intenta recargar la página.
            </p>
            {this.state.error && (
              <details className="text-left bg-white rounded-lg border border-[#e2e8f0] p-4 mb-6">
                <summary className="text-sm text-[#64748b] cursor-pointer">
                  Detalles del error
                </summary>
                <pre className="mt-2 text-xs text-[#dc2626] whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
