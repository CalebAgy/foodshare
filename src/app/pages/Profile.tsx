import { useNavigate } from 'react-router';
import { User, Settings, Heart, Package, ChevronRight, LogOut, RotateCcw } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../hooks/useAuth';
import { useUserBehavior } from '../hooks/useUserBehavior';
import { resetModel } from '../utils/recommendationEngine';

export default function Profile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { clearBehavior } = useUserBehavior();

  const handleResetRecommendations = () => {
    clearBehavior();
    resetModel();
  };

  const menuItems = [
    { icon: Package, label: 'Meine Angebote', count: 3 },
    { icon: Heart, label: 'Favoriten', count: 5 },
    { icon: Settings, label: 'Einstellungen' },
  ];

  return (
    <MobileLayout>
      {/* Header */}
      <header className="px-4 py-6 bg-gradient-to-b from-primary/10 to-background">
        <div className="flex items-center gap-4">
          <Avatar className="size-20">
            <AvatarFallback className="text-2xl">
              <User className="size-10" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2>Max Mustermann</h2>
            <p className="text-sm text-muted-foreground">
              max@example.com
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mitglied seit März 2024
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 pb-6">
        <Card className="p-4">
          <div className="grid grid-cols-3 divide-x">
            <div className="text-center px-2">
              <p className="text-2xl mb-1">8</p>
              <p className="text-xs text-muted-foreground">Gerettet</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl mb-1">3</p>
              <p className="text-xs text-muted-foreground">Aktiv</p>
            </div>
            <div className="text-center px-2">
              <p className="text-2xl mb-1">12</p>
              <p className="text-xs text-muted-foreground">Geholfen</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card 
              key={index}
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="size-5 text-muted-foreground" />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.count && (
                    <span className="text-sm text-muted-foreground">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Separator className="my-6 mx-4" />

      {/* Info Section */}
      <div className="px-4 space-y-4 pb-6">
        <div>
          <h3 className="mb-2">Über FoodShare</h3>
          <p className="text-sm text-muted-foreground">
            Gemeinsam gegen Lebensmittelverschwendung. Hilf mit, wertvolle 
            Ressourcen zu retten und teile, was du nicht brauchst.
          </p>
        </div>

        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
          <p className="text-sm">
            🌱 Du hast bereits <span className="font-semibold">12 kg</span> Lebensmittel 
            vor der Tonne gerettet!
          </p>
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResetRecommendations}
        >
          <RotateCcw className="size-4 mr-2" />
          Empfehlungen zurücksetzen
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
        >
          <LogOut className="size-4 mr-2" />
          Abmelden
        </Button>
      </div>
    </MobileLayout>
  );
}
