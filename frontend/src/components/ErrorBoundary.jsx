import React from 'react';
import api from '@/api/axios';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

/**
 * ErrorBoundary - компонент для перехвата и обработки ошибок в React-приложении
 * 
 * Функционал:
 * - Получает конфиг с сервера (/config/) для определения режима работы (debug/production)
 * - При ошибке отправляет лог на сервер (/logs/errors/) - "тихий режим"
 * - Показывает детали ошибки только если debug: true
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      appConfig: { debug: false },
      isLoadingConfig: true
    };
  }

  async componentDidMount() {
    // При загрузке приложения узнаем режим работы у сервера
    try {
      const res = await api.get('/config');
      this.setState({ 
        appConfig: res.data, 
        isLoadingConfig: false 
      });
    } catch (e) {
      console.error("Не удалось загрузить конфиг", e);
      this.setState({ isLoadingConfig: false });
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    this.sendErrorToBackend(error, errorInfo);
  }

  sendErrorToBackend = async (error, errorInfo) => {
    try {
      // Используем нативный fetch или axios
      await api.post('/errors/log/', {
        message: error.toString(),
        stack_trace: errorInfo.componentStack,
        url: window.location.href
      });
    } catch (e) {
      // Если даже логгер упал, тогда просто пишем в консоль
      console.error("Critical: Could not send error report", e);
    }
  };

  render() {
    if (this.state.hasError) {
      const isDebug = this.state.appConfig.debug;

      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-slate-200">
          <div className="max-w-3xl w-full bg-[#1e293b] border border-slate-800 rounded-2xl shadow-2xl p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Критическая ошибка</h1>
                <p className="text-sm text-slate-400">Данные об инциденте уже переданы разработчикам.</p>
              </div>
            </div>

            {/* Если DEBUG=True, вываливаем всё мясо сразу */}
            {isDebug ? (
              <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-red-900/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 mb-2 font-mono text-sm">
                    <Terminal size={14} /> <span>Exception:</span>
                  </div>
                  <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                </div>
                
                <div className="p-4 bg-black/20 border border-slate-700 rounded-lg">
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Stack Trace (React):</p>
                  <pre className="text-[11px] text-slate-500 font-mono overflow-auto max-h-60 custom-scrollbar">
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            ) : (
              /* В продакшене просто вежливое сообщение */
              <div className="py-10 text-center border-y border-slate-800 my-6">
                <p className="text-slate-300">Пожалуйста, попробуйте обновить страницу или обратитесь в IT-отдел.</p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-blue-900/20"
              >
                <RefreshCw size={18} /> Перезагрузить систему
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

