import { createBrowserRouter } from 'react-router';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import BoardPage from '../pages/BoardPage.jsx';
import BoardsPage from '../pages/BoardsPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './guards.jsx';

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <BoardsPage /> },
          { path: '/b/:boardId', element: <BoardPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
