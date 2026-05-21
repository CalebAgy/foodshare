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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.description || !formData.location) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    // In a real app, this would save to a database
    toast.success('Angebot erfolgreich erstellt!', {
      description: 'Dein Angebot ist jetzt für andere sichtbar.',
    });
    
    // Navigate back to home
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              required
              className="mt-2"
            />
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
              required
              className="mt-2"
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Standort *</Label>
            <Input
              id="location"
              placeholder="Straße, PLZ, Stadt"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price">Preis (€)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="0.00 für kostenlos"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              0 eingeben für kostenlose Abgabe
            </p>
          </div>

          {/* Expires In */}
          <div>
            <Label htmlFor="expiresIn">Verfügbar für (Stunden) *</Label>
            <Input
              id="expiresIn"
              type="number"
              placeholder="z.B. 6"
              value={formData.expiresIn}
              onChange={(e) => handleChange('expiresIn', e.target.value)}
              required
              className="mt-2"
            />
          </div>

          {/* Contact */}
          <div>
            <Label htmlFor="contact">Kontakt *</Label>
            <Input
              id="contact"
              placeholder="Telefon oder bevorzugte Methode"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              required
              className="mt-2"
            />
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