import { Home, Search, PlusCircle, User, Map } from 'lucide-react';
import { Link, useLocation } from 'react-router';

interface BottomNavProps {
  /** 'fixed' (default) overlays content; 'inline' flows inside a flex layout */
  variant?: 'fixed' | 'inline';
}

export function BottomNav({ variant = 'fixed' }: BottomNavProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Suchen' },
    { path: '/map', icon: Map, label: 'Karte' },
    { path: '/add', icon: PlusCircle, label: 'Erstellen' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  const navClass = variant === 'inline'
    ? 'bg-background border-t z-50'
    : 'fixed bottom-0 left-0 right-0 bg-background border-t z-50 safe-area-inset-bottom';

  return (
    <nav className={navClass}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-2 px-2 rounded-lg transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`size-5 ${active ? 'fill-current' : ''}`} />
                <span className="text-xs mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
