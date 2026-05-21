export interface Listing {
  id: string;
  type: 'store' | 'private';
  title: string;
  description: string;
  location: string;
  distance: number; // in km
  price: number; // 0 for free
  expiresAt: Date;
  imageUrl: string;
  contact: string;
  category: string[];
  createdBy: string;
  createdAt: Date;
}
