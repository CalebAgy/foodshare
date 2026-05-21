import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function MobileLayout({ children, showBottomNav = true }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-md relative">
        <div className={showBottomNav ? 'pb-20' : ''}>
          {children}
        </div>
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}
