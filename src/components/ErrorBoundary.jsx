import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Оновлюємо стан, щоб наступний рендер показав запасний UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Можна також відправити помилку в службу аналітики
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Ви можете відрендерити будь-який запасний UI
      return (
        <div className="p-8 bg-red-50 rounded-lg max-w-xl mx-auto mt-10 border border-red-200">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Щось пішло не так.</h1>
          <div className="bg-white p-4 rounded overflow-auto max-h-96 mb-4">
            <p className="text-red-600 font-mono text-sm mb-2">{this.state.error && this.state.error.toString()}</p>
            <pre className="text-gray-700 font-mono text-xs overflow-auto">
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button
            onClick={() => {
              // Очищаємо всі локальні сховища
              localStorage.clear();
              sessionStorage.clear();
              
              // Видаляємо всі куки
              document.cookie.split(";").forEach(function(c) {
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
              });
              
              // Перезавантажуємо сторінку
              window.location.href = '/login';
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Очистити дані та перезавантажити
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;