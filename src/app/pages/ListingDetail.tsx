import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Clock, MapPin, Euro, Tag, Share2, Heart,
  MessageCircle, Phone, CheckCircle2, Loader2, X,
} from 'lucide-react';
import { mockListings } from '../data/mockListings';
import { MobileLayout } from '../components/MobileLayout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useGeolocation } from '../hooks/useGeolocation';
import { haversineDistance } from '../utils/haversineDistance';
import { useUserBehavior } from '../hooks/useUserBehavior';

// ---------------------------------------------------------------------------
// Order state machine:  idle → requesting → pending | confirmed
// ---------------------------------------------------------------------------
type OrderState = 'idle' | 'requesting' | 'pending' | 'confirmed';

// Stable mock pickup code — derived from listing id so it stays consistent
function pickupCode(id: string) {
  return `FD-${id.padStart(4, '0')}`;
}

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { latitude, longitude, requestLocation } = useGeolocation();
  const { recordView } = useUserBehavior();

  const [orderState, setOrderState] = useState<OrderState>('idle');

  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const listing = mockListings.find((l) => l.id === id);

  useEffect(() => {
    if (!listing) return;
    const dist =
      latitude !== null && longitude !== null
        ? haversineDistance(latitude, longitude, listing.latitude, listing.longitude)
        : listing.distance;
    recordView({
      listingId: listing.id,
      distance: dist,
      categories: listing.category,
      type: listing.type,
      price: listing.price,
    });
  }, [listing?.id, latitude, longitude]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const getTimeRemaining = () => {
    const diff = listing.expiresAt.getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 0 || minutes < 0) return 'Abgelaufen';
    if (hours === 0) return `${minutes} Min`;
    if (hours < 24) return `${hours}h ${minutes}m`;
    return `${Math.floor(hours / 24)} ${Math.floor(hours / 24) === 1 ? 'Tag' : 'Tage'}`;
  };

  const isUrgent = listing.expiresAt.getTime() - Date.now() < 3 * 60 * 60 * 1000;
  const dist = latitude !== null && longitude !== null
    ? haversineDistance(latitude, longitude, listing.latitude, listing.longitude)
    : listing.distance;

  // ---------------------------------------------------------------------------
  // Order action
  // ---------------------------------------------------------------------------
  const handleRequest = () => {
    setOrderState('requesting');
    // Simulate network latency, then resolve based on confirmation type
    setTimeout(() => {
      setOrderState(listing.confirmationType === 'auto' ? 'confirmed' : 'pending');
    }, 900);
  };

  // ---------------------------------------------------------------------------
  // Contact preference labels
  // ---------------------------------------------------------------------------
  const contactLabel = {
    chat: 'Bevorzugt Chat-Nachrichten',
    call: 'Bevorzugt Telefonanrufe',
    both: 'Erreichbar per Chat & Anruf',
  }[listing.contactMethod];

  const confirmLabel =
    listing.confirmationType === 'auto'
      ? '⚡ Sofortbestätigung'
      : '⏳ Manuelle Bestätigung';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <MobileLayout showBottomNav={false}>
      {/* Image with floating header */}
      <div className="relative">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-80 object-cover"
        />

        <Button
          size="icon"
          variant="secondary"
          className="absolute top-4 left-4 rounded-full shadow-lg"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-5" />
        </Button>

        <div className="absolute top-4 right-4 flex gap-2">
          <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
            <Share2 className="size-5" />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
            <Heart className="size-5" />
          </Button>
        </div>

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
      <div className="px-4 py-6 space-y-4 pb-52">
        {/* Title */}
        <div>
          <h1 className="mb-1">{listing.title}</h1>
          <p className="text-sm text-muted-foreground">von {listing.createdBy}</p>
        </div>

        {/* Quick info cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Clock className={`size-5 ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Noch</p>
                <p className={`text-sm font-medium ${isUrgent ? 'text-red-600' : ''}`}>
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
                <p className="text-sm font-medium">{dist.toFixed(1)} km</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Price */}
        {listing.price > 0 && (
          <Card className="p-4 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Euro className="size-5 text-muted-foreground" />
                <span className="text-muted-foreground">Preis</span>
              </div>
              <span className="text-2xl font-semibold">{listing.price.toFixed(2)} €</span>
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
              <Badge key={cat} variant="outline">{cat}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Contact preferences — informs user before they commit */}
        <div>
          <h2 className="mb-3">Kontakt & Abholung</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {listing.contactMethod === 'chat' && <MessageCircle className="size-4 shrink-0" />}
              {listing.contactMethod === 'call' && <Phone className="size-4 shrink-0" />}
              {listing.contactMethod === 'both' && (
                <span className="flex gap-1">
                  <MessageCircle className="size-4 shrink-0" />
                  <Phone className="size-4 shrink-0" />
                </span>
              )}
              <span>{contactLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{confirmLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Fixed bottom action bar — changes with order state                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
        <div className="max-w-md mx-auto p-4 space-y-3">

          {/* IDLE — primary request action */}
          {orderState === 'idle' && (
            <>
              <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" onClick={handleRequest}>
                Abholung anfragen
              </Button>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{confirmLabel}</span>
                <span className="flex items-center gap-1">
                  {(listing.contactMethod === 'chat' || listing.contactMethod === 'both') && (
                    <MessageCircle className="size-3.5" />
                  )}
                  {(listing.contactMethod === 'call' || listing.contactMethod === 'both') && (
                    <Phone className="size-3.5" />
                  )}
                  {listing.contactMethod === 'chat' ? 'Chat' : listing.contactMethod === 'call' ? 'Anruf' : 'Chat & Anruf'}
                </span>
              </div>
            </>
          )}

          {/* REQUESTING — loading */}
          {orderState === 'requesting' && (
            <Button className="w-full" size="lg" disabled>
              <Loader2 className="size-5 mr-2 animate-spin" />
              Anfrage wird gesendet…
            </Button>
          )}

          {/* PENDING — waiting for offerer confirmation */}
          {orderState === 'pending' && (
            <>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="text-amber-600 text-lg mt-0.5">⏳</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900">Anfrage gesendet</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Warte auf Bestätigung von {listing.createdBy}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <ContactButton listing={listing} className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setOrderState('idle')}
                >
                  <X className="size-4 mr-1" />
                  Abbrechen
                </Button>
              </div>
            </>
          )}

          {/* CONFIRMED */}
          {orderState === 'confirmed' && (
            <>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle2 className="size-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-900">Abholung bestätigt!</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Zeige diesen Code bei der Abholung:
                    <span className="ml-1 font-mono font-bold tracking-widest">
                      {pickupCode(listing.id)}
                    </span>
                  </p>
                </div>
              </div>
              <ContactButton listing={listing} className="w-full" />
            </>
          )}

        </div>
      </div>
    </MobileLayout>
  );
}

// ---------------------------------------------------------------------------
// Small helper — renders the right contact button based on listing preference
// ---------------------------------------------------------------------------
import type { Listing } from '../types/listing';

function ContactButton({ listing, className }: { listing: Listing; className?: string }) {
  const showChat = listing.contactMethod === 'chat' || listing.contactMethod === 'both';
  const showCall = listing.contactMethod === 'call' || listing.contactMethod === 'both';

  if (showChat && showCall) {
    return (
      <div className={`flex gap-2 ${className ?? ''}`}>
        <Button variant="outline" className="flex-1" size="sm">
          <MessageCircle className="size-4 mr-1.5" />
          Chat
        </Button>
        <Button variant="outline" className="flex-1" size="sm">
          <Phone className="size-4 mr-1.5" />
          Anrufen
        </Button>
      </div>
    );
  }

  if (showCall) {
    return (
      <Button variant="outline" className={className} size="lg">
        <Phone className="size-5 mr-2" />
        Jetzt anrufen
      </Button>
    );
  }

  return (
    <Button variant="outline" className={className} size="lg">
      <MessageCircle className="size-5 mr-2" />
      Nachricht senden
    </Button>
  );
}
