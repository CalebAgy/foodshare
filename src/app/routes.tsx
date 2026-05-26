import { createBrowserRouter } from 'react-router';
import Home from './pages/Home';
import ListingDetail from './pages/ListingDetail';
import AddListing from './pages/AddListing';
import Search from './pages/Search';
import Profile from './pages/Profile';
import MapView from './pages/MapView';
import Login from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        Component: Home,
      },
      {
        path: '/search',
        Component: Search,
      },
      {
        path: '/map',
        Component: MapView,
      },
      {
        path: '/listing/:id',
        Component: ListingDetail,
      },
      {
        path: '/add',
        Component: AddListing,
      },
      {
        path: '/profile',
        Component: Profile,
      },
    ],
  },
  {
    path: '*',
    Component: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1>404 - Seite nicht gefunden</h1>
          <p className="text-muted-foreground mt-2">
            Die gesuchte Seite existiert nicht.
          </p>
        </div>
      </div>
    ),
  },
]);
