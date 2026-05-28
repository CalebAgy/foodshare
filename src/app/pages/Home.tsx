import { useState, useMemo, useEffect, useCallback } from 'react';
import { Bell, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { mockListings } from '../data/mockListings';
import { ListingCard } from '../components/ListingCard';
import { FilterBar, FilterType } from '../components/FilterBar';
import { LocationPermissionBanner } from '../components/LocationPermissionBanner';
import { LocationFallback } from '../components/LocationFallback';
import { MobileLayout } from '../components/MobileLayout';
import { useGeolocation } from '../hooks/useGeolocation';
import { useUserBehavior } from '../hooks/useUserBehavior';
import { useRecommendationModel } from '../hooks/useRecommendationModel';
import { scoreListings } from '../utils/recommendationEngine';
import { haversineDistance } from '../utils/haversineDistance';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function Home() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { latitude, longitude, permissionState, requestLocation } = useGeolocation();
  const { behavior, recordView } = useUserBehavior();

  // Request location automatically on first mount
  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const userLocation =
    latitude !== null && longitude !== null
      ? { latitude, longitude }
      : null;

  useRecommendationModel(mockListings, behavior.views, latitude, longitude);

  const scores = useMemo(
    () => scoreListings(mockListings, behavior.views, latitude, longitude),
    [behavior.views, latitude, longitude],
  );

  const filteredListings = useMemo(() => {
    const base = mockListings.filter((listing) => {
      const matchesFilter = filter === 'all' || listing.type === filter;
      const matchesSearch =
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.category.some((cat) =>
          cat.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesFilter && matchesSearch;
    });

    // Once the model has enough data, sort by learned score; otherwise by distance
    if (scores.size > 0) {
      return [...base].sort(
        (a, b) => (scores.get(b.id)?.score ?? 0) - (scores.get(a.id)?.score ?? 0),
      );
    }

    if (userLocation) {
      return [...base].sort(
        (a, b) =>
          haversineDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) -
          haversineDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude)
      );
    }

    return base;
  }, [filter, searchQuery, userLocation, scores]);

  const handleCardClick = useCallback((listing: typeof mockListings[0]) => {
    recordView({
      listingId: listing.id,
      distance: userLocation
        ? haversineDistance(userLocation.latitude, userLocation.longitude, listing.latitude, listing.longitude)
        : listing.distance,
      categories: listing.category,
      type: listing.type,
      price: listing.price,
    });
  }, [recordView, userLocation]);

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-green-600">FoodShare</h1>
              <p className="text-sm text-muted-foreground">Lebensmittel retten</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Benachrichtigungen"
              onClick={() => toast('Du hast keine neuen Benachrichtigungen.')}
            >
              <Bell className="size-5" />
            </Button>
          </div>

          <Input
            placeholder="Suche..."
            className="w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <LocationPermissionBanner
          permissionState={permissionState}
          onRequestLocation={requestLocation}
        />
        <LocationFallback permissionState={permissionState} onRetry={requestLocation} />
      </header>

      {/* Main Content */}
      <main className="px-4 pb-6">
        <FilterBar
          activeFilter={filter}
          onFilterChange={setFilter}
          resultCount={filteredListings.length}
        />

        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Keine Angebote gefunden.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                userLocation={userLocation ?? undefined}
                recommendationTier={scores.get(listing.id)?.tier}
                recommendationReason={scores.get(listing.id)?.reason}
                onClick={() => handleCardClick(listing)}
              />
            ))}
          </div>
        )}
      </main>

      <Link
        to="/llm"
        className="fixed bottom-[90px] right-4 z-50 inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <Sparkles className="size-4" /> KI-Assistent
      </Link>
    </MobileLayout>
  );
}
