import { useEffect } from 'react';
import { loadSavedModel, trainOnBehavior, resetModel } from '../utils/recommendationEngine';
import type { ViewEvent } from './useUserBehavior';
import type { Listing } from '../types/listing';

export function useRecommendationModel(
  listings: Listing[],
  views: ViewEvent[],
  userLat: number | null,
  userLng: number | null,
) {
  // Restore previously trained weights from localStorage on first mount
  useEffect(() => {
    loadSavedModel();
  }, []);

  // Retrain whenever the user accumulates a new view (min 3 needed)
  useEffect(() => {
    if (views.length >= 3) {
      trainOnBehavior(listings, views, userLat, userLng);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [views.length, userLat, userLng]);

  return { resetModel };
}
