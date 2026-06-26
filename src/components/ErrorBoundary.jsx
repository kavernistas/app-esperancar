import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          fontFamily: 'monospace',
          background: '#fef2f2',
          minHeight: '100vh',
          color: '#991b1b'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
            ❌ Erro na Aplicação
          </h1>
          <div style={{
            background: '#fff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            marginBottom: '16px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            <strong>Mensagem:</strong> {this.state.error?.message || 'Erro desconhecido'}
          </div>
          {this.state.errorInfo && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                Stack Trace (clique para expandir)
              </summary>
              <pre style={{
                background: '#fff',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #fecaca',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {this.state.error?.stack}
                {'\n\nComponent Stack:'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
