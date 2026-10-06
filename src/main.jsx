import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('ILA crashed:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100dvh', background: '#0f0f0f',
          color: '#fff', padding: 24, fontFamily: 'system-ui, sans-serif', gap: 16,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ff4b2b' }}>ILA</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Something went wrong</div>
          <pre style={{
            background: '#1a1a1a', padding: '12px 16px', borderRadius: 8,
            fontSize: '0.72rem', color: '#ff6b6b', maxWidth: 340,
            overflow: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              background: '#ff4b2b', color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px 28px',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
