import { Store, User, SlidersHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export type FilterType = 'all' | 'store' | 'private';

interface FilterBarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  resultCount: number;
}

export function FilterBar({ activeFilter, onFilterChange, resultCount }: FilterBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <SlidersHorizontal className="size-4 text-muted-foreground flex-shrink-0" />
        
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('all')}
        >
          Alle
        </Button>
        
        <Button
          variant={activeFilter === 'store' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('store')}
        >
          <Store className="size-3 mr-1" />
          Läden
        </Button>
        
        <Button
          variant={activeFilter === 'private' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('private')}
        >
          <User className="size-3 mr-1" />
          Privat
        </Button>
      </div>
      
      <Badge variant="secondary" className="flex-shrink-0">
        {resultCount}
      </Badge>
    </div>
  );
}