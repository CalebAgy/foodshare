import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { MobileLayout } from '../components/MobileLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setForgotMessage('Bitte gib zuerst deine E-Mail-Adresse ein.');
      return;
    }

    setForgotMessage(`Ein Reset-Link wurde an ${email.trim()} gesendet.`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password.trim());
      navigate('/', { replace: true });
    } catch (e) {
      setError('Login fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout showBottomNav={false}>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="px-4 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-green-600">FoodShare</h1>
                <p className="text-sm text-muted-foreground">Lebensmittel retten leicht gemacht.</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-88px)] items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md border border-green-200 bg-white/95 p-6 shadow-xl">
            <div className="mb-6 space-y-3 text-center">
              <p className="text-sm uppercase tracking-[0.2em] text-green-600">Login</p>
              <h2 className="text-2xl font-semibold">Willkommen zurück</h2>
              <p className="text-sm text-muted-foreground">
                Melde dich an und rette gemeinsam Lebensmittel in deiner Nähe.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="max@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Passwort vergessen?
                </button>
                <span className="text-xs text-muted-foreground">
                  {forgotMessage || 'Noch keinen Zugriff?'}
                </span>
              </div>

              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? 'Anmeldung...' : 'Anmelden'}
              </Button>
            </form>
          </Card>
        </main>
      </div>
    </MobileLayout>
  );
}
