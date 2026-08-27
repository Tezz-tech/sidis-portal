import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950 px-4">
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8 text-center">
          <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">
            An unexpected error occurred. Try reloading the page — if it keeps happening, let us know.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-300 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-400 hover:to-pink-500 text-white shadow-lg shadow-orange-500/30 px-6 py-3"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }
}
