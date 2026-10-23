import React from 'react';
import { AlertTriangle, RefreshCcw, Home, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error);
    console.error('Component Stack:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { children } = this.props;

    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return children;
  }
}

const ErrorFallback = ({ error, onReset }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div
      role="alert"
      className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle size={36} />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        عذراً، حدث خطأ غير متوقع!
      </h2>

      <p className="mb-6 max-w-md text-sm text-gray-600">
        حدث خلل أثناء تحميل هذه الصفحة. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
      </p>

      {/* تفاصيل الخطأ تظهر فقط في وضع التطوير */}
      {import.meta.env?.DEV && error && (
        <pre className="mb-6 max-w-lg overflow-x-auto rounded-lg bg-gray-100 p-3 text-left text-xs text-red-700">
          {error.toString()}
        </pre>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-xl bg-[#2DB4A0] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#249181]"
        >
          <RotateCcw size={16} />
          إعادة المحاولة
        </button>

        <button
          type="button"
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCcw size={16} />
          تحديث الصفحة
        </button>

        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <Home size={16} />
          الرئيسية
        </button>
      </div>
    </div>
  );
};

ErrorBoundary.displayName = 'ErrorBoundary';
ErrorFallback.displayName = 'ErrorFallback';

export default ErrorBoundary;