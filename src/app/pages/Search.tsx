import { useState } from 'react';
import { Search as SearchIcon, MapPin, SlidersHorizontal } from 'lucide-react';
import { MobileLayout } from '../components/MobileLayout';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { mockListings } from '../data/mockListings';
import { ListingCard } from '../components/ListingCard';
import { toast } from 'sonner';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Berlin');

  const categories = [
    'Backwaren',
    'Obst',
    'Gemüse',
    'Milchprodukte',
    'Fleisch',
    'Verschiedenes',
  ];

  const filteredListings = mockListings.filter((listing) =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.category.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="px-4 py-4">
          <h1 className="mb-4">Suchen</h1>
          
          {/* Location */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Standort"
                className="pl-10"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              aria-label="Filter"
              onClick={() => toast('Weitere Filter sind bald verfügbar.')}
            >
              <SlidersHorizontal className="size-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Wonach suchst du?"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {/* Categories */}
        {!searchQuery && (
          <div className="mb-6">
            <h2 className="mb-3">Kategorien</h2>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => setSearchQuery(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {!searchQuery && (
          <div className="mb-6">
            <h2 className="mb-3">Kürzliche Suchen</h2>
            <div className="space-y-2">
              {['Brot', 'Gemüse', 'Kostenlos'].map((term) => (
                <Card
                  key={term}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSearchQuery(term)}
                >
                  <div className="flex items-center gap-3">
                    <SearchIcon className="size-4 text-muted-foreground" />
                    <span className="text-sm">{term}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchQuery && (
          <div>
            <h2 className="mb-3">
              {filteredListings.length} {filteredListings.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
            </h2>
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Keine Ergebnisse für "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </MobileLayout>
  );
}
