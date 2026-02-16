type EventName =
  | 'view_home'
  | 'click_usecase_tile'
  | 'view_usecase_page'
  | 'start_create'
  | 'complete_create'
  | 'view_preview'
  | 'start_checkout'
  | 'payment_success'
  | 'payment_fail'
  | 'share_link_click'
  | 'copy_link'
  | 'returning_user_session';

interface EventParams {
  use_case?: string;
  theme?: string;
  memory_id?: string;
  source?: string;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export function trackEvent(event: EventName, params?: EventParams) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params);
  }
}
