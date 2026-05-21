import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Clock, MapPin, Euro, Tag, Phone, MessageCircle, Share2, Heart } from 'lucide-react';
import { mockListings } from '../data/mockListings';
import { MobileLayout } from '../components/MobileLayout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const listing = mockListings.find((l) => l.id === id);

  if (!listing) {
    return (
      <MobileLayout showBottomNav={false}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h2>Angebot nicht gefunden</h2>
            <Button onClick={() => navigate('/')} className="mt-4">
              Zurück zur Übersicht
            </Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const getTimeRemaining = () => {
    const now = new Date();
    const diff = listing.expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 0 || minutes < 0) return 'Abgelaufen';
    if (hours === 0) return `${minutes} Min`;
    if (hours < 24) return `${hours}h ${minutes}m`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'Tag' : 'Tage'}`;
  };

  const isUrgent = listing.expiresAt.getTime() - new Date().getTime() < 3 * 60 * 60 * 1000;

  return (
    <MobileLayout showBottomNav={false}>
      {/* Image with floating header */}
      <div className="relative">
        <img 
          src={listing.imageUrl} 
          alt={listing.title}
          className="w-full h-80 object-cover"
        />
        
        {/* Floating Back Button */}
        <Button 
          size="icon"
          variant="secondary"
          className="absolute top-4 left-4 rounded-full shadow-lg"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="size-5" />
        </Button>

        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg"
          >
            <Share2 className="size-5" />
          </Button>
          <Button 
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg"
          >
            <Heart className="size-5" />
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Badge 
            variant={listing.type === 'store' ? 'default' : 'secondary'}
            className="text-sm py-1 px-3"
          >
            {listing.type === 'store' ? 'Laden' : 'Privat'}
          </Badge>
          {listing.price === 0 && (
            <Badge className="text-sm py-1 px-3 bg-green-600 hover:bg-green-700">
              Kostenlos
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-4">
        {/* Title and Info */}
        <div>
          <h1 className="mb-1">{listing.title}</h1>
          <p className="text-sm text-muted-foreground">
            von {listing.createdBy}
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className={`size-5 ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Noch</p>
                <p className={`text-sm ${isUrgent ? 'text-red-600' : ''}`}>
                  {getTimeRemaining()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Entfernung</p>
                <p className="text-sm">{listing.distance} km</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Price if applicable */}
        {listing.price > 0 && (
          <Card className="p-4 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">Preis</span>
              </div>
              <span className="text-2xl">{listing.price.toFixed(2)} €</span>
            </div>
          </Card>
        )}

        <Separator />

        {/* Description */}
        <div>
          <h2 className="mb-2">Beschreibung</h2>
          <p className="text-muted-foreground">{listing.description}</p>
        </div>

        <Separator />

        {/* Location */}
        <div>
          <h2 className="mb-2">Standort</h2>
          <div className="flex items-start gap-2">
            <MapPin className="size-5 text-muted-foreground mt-0.5" />
            <p className="text-muted-foreground">{listing.location}</p>
          </div>
        </div>

        <Separator />

        {/* Categories */}
        <div>
          <h2 className="mb-3">Kategorien</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="size-4 text-muted-foreground" />
            {listing.category.map((cat) => (
              <Badge key={cat} variant="outline">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg">
        <div className="max-w-md mx-auto space-y-2">
          {listing.contact.startsWith('Tel:') ? (
            <Button className="w-full" size="lg">
              <Phone className="size-5 mr-2" />
              Jetzt anrufen
            </Button>
          ) : (
            <Button className="w-full" size="lg">
              <MessageCircle className="size-5 mr-2" />
              Nachricht senden
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground">
            {listing.contact}
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}