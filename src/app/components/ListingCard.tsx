import { Clock, MapPin, Euro, Tag } from 'lucide-react';
import { Listing } from '../types/listing';
import { haversineDistance } from '../utils/haversineDistance';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Link } from 'react-router';

interface ListingCardProps {
  listing: Listing;
  userLocation?: { latitude: number; longitude: number };
}

export function ListingCard({ listing, userLocation }: ListingCardProps) {
  const getTimeRemaining = () => {
    const now = new Date();
    const diff = listing.expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 0 || minutes < 0) return 'Abgelaufen';
    if (hours === 0) return `${minutes} Min`;
    return `${hours}h ${minutes}m`;
  };

  const timeRemaining = getTimeRemaining();
  const isUrgent = listing.expiresAt.getTime() - new Date().getTime() < 3 * 60 * 60 * 1000;

  const displayDistance = userLocation
    ? haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        listing.latitude,
        listing.longitude
      )
    : listing.distance;

  return (
    <Link to={`/listing/${listing.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <div className="relative">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-48 object-cover"
          />
          <Badge
            className="absolute top-2 right-2"
            variant={listing.type === 'store' ? 'default' : 'secondary'}
          >
            {listing.type === 'store' ? 'Laden' : 'Privat'}
          </Badge>
          {listing.price === 0 && (
            <Badge className="absolute top-2 left-2 bg-green-600 hover:bg-green-700">
              Kostenlos
            </Badge>
          )}
        </div>

        <div className="p-4">
          <h3 className="mb-2 line-clamp-2">{listing.title}</h3>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {listing.description}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">{listing.location}</span>
              <span
                data-testid="listing-distance"
                className="text-sm text-muted-foreground"
              >
                {displayDistance.toFixed(1)} km
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`size-4 ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${isUrgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {timeRemaining}
                </span>
              </div>

              {listing.price > 0 && (
                <div className="flex items-center gap-1">
                  <Euro className="size-4 text-muted-foreground" />
                  <span className="text-sm">{listing.price.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-1 flex-wrap">
              <Tag className="size-4 text-muted-foreground mt-0.5" />
              {listing.category.slice(0, 3).map((cat) => (
                <Badge key={cat} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
