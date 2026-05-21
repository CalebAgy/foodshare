export interface Listing {
  id: string;
  type: 'store' | 'private';
  title: string;
  description: string;
  location: string;
  /** Full street address, used for display */
  address: string;
  /** WGS-84 latitude */
  latitude: number;
  /** WGS-84 longitude */
  longitude: number;
  /** Stored fallback distance in km (used when user location is unavailable) */
  distance: number;
  price: number; // 0 for free
  expiresAt: Date;
  imageUrl: string;
  contact: string;
  category: string[];
  createdBy: string;
  createdAt: Date;
  /** How the offerer prefers to be contacted */
  contactMethod: 'chat' | 'call' | 'both';
  /** Whether pickups are confirmed instantly or require offerer approval */
  confirmationType: 'auto' | 'manual';
}
