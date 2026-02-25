const AppLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Загрузка страницы...</p>
    </div>
  </div>
);

export default AppLoader;

