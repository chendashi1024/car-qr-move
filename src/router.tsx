import { createBrowserRouter } from 'react-router-dom';
import Home from './pages/Home';
import OwnerSetup from './pages/OwnerSetup';
import VisitorMessage from './pages/VisitorMessage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/:uuid/setup',
    element: <OwnerSetup />,
  },
  {
    path: '/:uuid',
    element: <VisitorMessage />,
  },
]);