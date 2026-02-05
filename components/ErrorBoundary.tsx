import React, { Component, ReactNode, ErrorInfo } from 'react';

// Fictional Sentry import for demonstration. In a real setup, you would install the Sentry SDK.
// import * as Sentry from "@sentry/react"; 

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // FIX: Initialized state in the constructor to resolve errors about missing 'state' and 'props' properties.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error("Uncaught error:", error, errorInfo);
    // Di aplikasi production, Anda akan melaporkan ini ke Sentry
    // Sentry.captureException(error, { extra: errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#F8F9FA' }}>
          <h1 style={{ color: '#DC2626', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>Terjadi Kesalahan Kritis</h1>
          <p style={{ color: '#4B5563', fontSize: '14px', textAlign: 'center', marginTop: '10px' }}>
            Aplikasi mengalami error yang tidak dapat dipulihkan. Tim teknis kami telah diberitahu.
            <br />
            Silakan coba muat ulang halaman atau hubungi administrator.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: '#065F46', color: 'white', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;