
// Страницы ошибок (Error Pages)
// 401 - UnauthorizedPage - Требуется авторизация (сессия истекла)
// 403 - ForbiddenPage - Доступ запрещен (нет прав)
// 404 - NotFoundPage - Страница не найдена
// 503 - ServiceUnavailablePage - Сервис недоступен (технические работы)

export { ScrapPage } from './ScrapPage';
export { ProfilePage } from './ProfilePage';
export { NotFoundPage } from './NotFoundPage'; // 404 - Страница не найдена
export { ForbiddenPage } from './ForbiddenPage'; // 403 - Доступ запрещен
export { UnauthorizedPage } from './UnauthorizedPage'; // 401 - Требуется авторизация
export { ServiceUnavailablePage } from './ServiceUnavailablePage'; // 503 - Сервис недоступен
export { AdminPanel } from './AdminPanel';
export { default as UsersList } from './UsersList';


