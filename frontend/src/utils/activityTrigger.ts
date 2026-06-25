export type ActivityType =
  | 'orderCreated'
  | 'cookingStarted'
  | 'orderReady'
  | 'orderServed'
  | 'tableOccupied'
  | 'tableAvailable'
  | 'paymentSuccess'
  | 'inventoryAlert'
  | 'analyticsCounter'
  | 'aiInsightsReveal'
  | 'notificationsBadge';

export interface ActivityData {
  type: ActivityType;
  title?: string;
  message?: string;
  data?: any;
}

export function triggerLiveActivity(type: ActivityType, data?: any) {
  const event = new CustomEvent('liveActivityEvent', {
    detail: { type, data }
  });
  window.dispatchEvent(event);
}
