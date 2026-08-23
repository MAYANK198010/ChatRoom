import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in CipherChat:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#f0f2f5] text-[#1c1e21] flex items-center justify-center p-4 font-sans select-none">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-2">CipherChat Recovery Mode</h1>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              An unexpected render issue occurred while initializing the interface. You can recover instantly by reloading or clearing local cache.
            </p>

            {this.state.error && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 mb-6 text-left overflow-auto max-h-32">
                <p className="text-[11px] font-mono font-bold text-red-600 mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-[9px] font-mono text-gray-400 whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-[#0084ff] hover:bg-[#0073e6] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleResetData}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Cache & Safe Restart</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-400">
              <span>Hosting on GitHub Pages? Ensure </span>
              <code className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded font-mono text-[10px]">base: './'</code>
              <span> is built into dist.</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
