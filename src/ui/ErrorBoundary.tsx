import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="book-shell flex items-center justify-center p-8"
          role="alert"
          aria-live="assertive"
        >
          <div
            className="max-w-md w-full p-8 text-center"
            style={{
              background: '#f4ecd8',
              border: '1px solid #7a5a30',
              boxShadow: '0 0 40px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: '#1a1008', letterSpacing: '0.2em', textIndent: 0 }}
            >
              书页破损了
            </h2>
            <p className="text-sm italic mb-6" style={{ color: '#5a4220', textIndent: 0 }}>
              某处出了差错，故事无法继续。
            </p>
            {this.state.error && (
              <p
                className="text-xs mb-6 p-3 text-left"
                style={{
                  color: '#8a4030',
                  background: 'rgba(138, 64, 48, 0.08)',
                  border: '1px solid rgba(138, 64, 48, 0.3)',
                  textIndent: 0,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="px-6 py-2 text-sm transition-all"
              style={{
                color: '#1a1008',
                border: '1px solid #7a5a30',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textIndent: 0,
              }}
            >
              重新翻开
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
