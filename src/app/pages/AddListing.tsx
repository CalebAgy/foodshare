import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Upload } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

type FormErrors = Partial<Record<'title' | 'description' | 'location' | 'price' | 'expiresIn' | 'contact', string>>;

export default function AddListing() {
  const navigate = useNavigate();
  const [type, setType] = useState<'store' | 'private'>('private');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    contact: '',
    expiresIn: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Field-level validation — every required field gets a specific, actionable message.
  const validate = (data: typeof formData): FormErrors => {
    const e: FormErrors = {};
    if (!data.title.trim()) e.title = 'Bitte gib einen Titel ein.';
    if (!data.description.trim()) e.description = 'Bitte beschreibe dein Angebot.';
    if (!data.location.trim()) e.location = 'Bitte gib einen Standort an.';

    if (!data.expiresIn.trim()) {
      e.expiresIn = 'Bitte gib an, für wie viele Stunden das Angebot gilt.';
    } else {
      const hours = Number(data.expiresIn);
      if (!Number.isFinite(hours) || hours <= 0) {
        e.expiresIn = 'Bitte gib eine Stundenzahl größer als 0 ein.';
      }
    }

    if (data.price.trim()) {
      const price = Number(data.price);
      if (!Number.isFinite(price) || price < 0) {
        e.price = 'Der Preis darf nicht negativ sein.';
      }
    }

    if (!data.contact.trim()) e.contact = 'Bitte gib eine Kontaktmöglichkeit an.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validate(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error('Bitte korrigiere die markierten Felder');
      // Move focus to the first field with an error so keyboard users land on it.
      const firstField = Object.keys(nextErrors)[0];
      document.getElementById(firstField)?.focus();
      return;
    }

    // In a real app, this would save to a database
    toast.success('Angebot erfolgreich erstellt!', {
      description: 'Dein Angebot ist jetzt für andere sichtbar.',
    });

    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  // Clear a field's error as soon as the user starts correcting it.
  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => (prev[field as keyof FormErrors] ? { ...prev, [field]: undefined } : prev));
  };

  return (
    <MobileLayout showBottomNav={false}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate('/')}
            aria-label="Zurück zur Übersicht"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1>Neues Angebot</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 pb-24">
        <p className="text-sm text-muted-foreground mb-6">
          Teile deine Lebensmittel und verhindere Verschwendung
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Selection */}
          <div>
            <Label className="mb-3 block">Art des Angebots *</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(value) => setType(value as 'store' | 'private')}
              className="space-y-3"
            >
              <Card className={`p-4 cursor-pointer transition-colors ${type === 'private' ? 'border-primary' : ''}`}>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="cursor-pointer flex-1">
                    <div>
                      <p>Privatperson</p>
                      <p className="text-xs text-muted-foreground">z.B. vor Urlaub</p>
                    </div>
                  </Label>
                </div>
              </Card>
              
              <Card className={`p-4 cursor-pointer transition-colors ${type === 'store' ? 'border-primary' : ''}`}>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="store" id="store" />
                  <Label htmlFor="store" className="cursor-pointer flex-1">
                    <div>
                      <p>Laden/Geschäft</p>
                      <p className="text-xs text-muted-foreground">z.B. vor Ladenschluss</p>
                    </div>
                  </Label>
                </div>
              </Card>
            </RadioGroup>
          </div>

          {/* Image Upload Placeholder */}
          <div>
            <Label className="mb-2 block">Foto hochladen (optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Foto hinzufügen
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              placeholder="z.B. Frisches Obst abzugeben"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
              className="mt-2"
            />
            {errors.title && (
              <p id="title-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Beschreibung *</Label>
            <Textarea
              id="description"
              placeholder="Beschreibe was du anbietest..."
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'description-error' : undefined}
              className="mt-2"
            />
            {errors.description && (
              <p id="description-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.description}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Standort *</Label>
            <Input
              id="location"
              placeholder="Straße, PLZ, Stadt"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              aria-invalid={!!errors.location}
              aria-describedby={errors.location ? 'location-error' : undefined}
              className="mt-2"
            />
            {errors.location && (
              <p id="location-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.location}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price">Preis (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00 für kostenlos"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? 'price-error' : 'price-hint'}
              className="mt-2"
            />
            {errors.price ? (
              <p id="price-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.price}
              </p>
            ) : (
              <p id="price-hint" className="text-xs text-muted-foreground mt-1">
                0 eingeben für kostenlose Abgabe
              </p>
            )}
          </div>

          {/* Expires In */}
          <div>
            <Label htmlFor="expiresIn">Verfügbar für (Stunden) *</Label>
            <Input
              id="expiresIn"
              type="number"
              min="1"
              placeholder="z.B. 6"
              value={formData.expiresIn}
              onChange={(e) => handleChange('expiresIn', e.target.value)}
              aria-invalid={!!errors.expiresIn}
              aria-describedby={errors.expiresIn ? 'expiresIn-error' : undefined}
              className="mt-2"
            />
            {errors.expiresIn && (
              <p id="expiresIn-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.expiresIn}
              </p>
            )}
          </div>

          {/* Contact */}
          <div>
            <Label htmlFor="contact">Kontakt *</Label>
            <Input
              id="contact"
              placeholder="Telefon oder bevorzugte Methode"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              aria-invalid={!!errors.contact}
              aria-describedby={errors.contact ? 'contact-error' : undefined}
              className="mt-2"
            />
            {errors.contact && (
              <p id="contact-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.contact}
              </p>
            )}
          </div>
        </form>
      </main>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="max-w-md mx-auto flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex-1"
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="flex-1"
          >
            Veröffentlichen
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}