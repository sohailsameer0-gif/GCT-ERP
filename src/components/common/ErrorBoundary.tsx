import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  isolateScope?: boolean; // If true, renders a compact container-friendly card instead of full-page
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoToDashboard = () => {
    window.location.hash = '#/app/dashboard';
    this.handleReset();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleCopyDiagnostics = () => {
    const { error, errorInfo } = this.state;
    const payload = [
      `GCT Peshawar ERP - Error Diagnostic Report`,
      `Timestamp: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `Error Name: ${error?.name || 'Unknown'}`,
      `Error Message: ${error?.message || 'No message provided'}`,
      `\nStack Trace:\n${error?.stack || 'No stack trace available'}`,
      `\nComponent Stack:\n${errorInfo?.componentStack || 'No component stack available'}`,
    ].join('\n');

    navigator.clipboard
      .writeText(payload)
      .then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      })
      .catch((err) => {
        console.warn('Failed to copy diagnostics to clipboard:', err);
      });
  };

  private handleClearCorruptedState = () => {
    try {
      localStorage.removeItem('gct_erp_v14');
      localStorage.removeItem('gct_active_user');
      localStorage.removeItem('gct_remember_me');
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  public render() {
    const { hasError, error, errorInfo, copied, showDetails } = this.state;
    const {
      children,
      fallbackTitle = 'Something went wrong',
      fallbackMessage = 'An unexpected error occurred while rendering this section of the portal.',
      isolateScope = false,
    } = this.props;

    if (!hasError) {
      return children;
    }

    // Compact Card View for isolated sectional errors (keeps sidebar intact)
    if (isolateScope) {
      return (
        <div className="w-full my-4 p-6 sm:p-8 rounded-2xl bg-white border border-rose-200/80 shadow-lg text-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-3xs uppercase tracking-wider">
                  Module Interrupted
                </span>
                <span className="text-2xs text-slate-400">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {fallbackTitle}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {fallbackMessage} {error?.message && <span className="font-semibold text-rose-700 font-mono text-[11px] block mt-1">Reason: {error.message}</span>}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={this.handleGoToDashboard}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Dashboard
                </button>
                <button
                  type="button"
                  onClick={this.handleCopyDiagnostics}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Error Details</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1"
                >
                  {showDetails ? 'Hide Stack' : 'Show Stack'}
                  {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Expandable Technical Details */}
              {showDetails && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800 max-h-60 scrollbar-thin">
                  <div className="text-rose-400 font-bold mb-1">
                    {error?.name}: {error?.message}
                  </div>
                  {error?.stack && (
                    <div className="text-slate-400 whitespace-pre-wrap">
                      {error.stack}
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div className="mt-2 text-indigo-300 whitespace-pre-wrap border-t border-slate-800 pt-2">
                      <div className="text-2xs font-bold text-slate-400 mb-1">Component Hierarchy:</div>
                      {errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Full Page Error Screen for Top-level or Critical App Failures
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-indigo-900 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-3xs uppercase tracking-wider mb-1">
                  Application Error Boundary
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                  {fallbackTitle}
                </h2>
                <p className="text-xs text-rose-100/90 mt-0.5">
                  Government College of Technology Peshawar ERP
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-5">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {fallbackMessage}
            </p>

            {error?.message && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs font-mono">
                <span className="font-bold text-rose-700 uppercase tracking-wider text-2xs block mb-0.5">
                  Caught Exception:
                </span>
                {error.message}
              </div>
            )}

            {/* Main Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                Recover Session
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Portal
              </button>
            </div>

            {/* Secondary Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={this.handleCopyDiagnostics}
                className="text-slate-600 hover:text-indigo-600 font-medium inline-flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Diagnostic Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Error Diagnostics</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={this.handleClearCorruptedState}
                className="text-rose-600 hover:text-rose-700 hover:underline font-semibold"
              >
                Clear Corrupted State & Reset
              </button>
            </div>

            {/* Technical Stack Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => this.setState({ showDetails: !showDetails })}
                className="text-2xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
              >
                {showDetails ? 'Hide Stack Trace' : 'View Developer Stack Trace'}
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showDetails && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-56 scrollbar-thin border border-slate-800">
                  <div className="text-rose-400 font-bold mb-1">
                    {error?.name}: {error?.message}
                  </div>
                  {error?.stack && (
                    <div className="text-slate-400 whitespace-pre-wrap">
                      {error.stack}
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div className="mt-2 text-indigo-300 whitespace-pre-wrap border-t border-slate-800 pt-2">
                      <div className="text-2xs font-bold text-slate-400 mb-1">Component Stack:</div>
                      {errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Government College of Technology, Peshawar · Academic Directorate
        </p>
      </div>
    );
  }
}
