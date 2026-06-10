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
  | 'returning_user_session'
  | 'pwa_prompt_shown'
  | 'pwa_install_accepted'
  | 'pwa_install_dismissed'
  | 'pwa_installed'
  | 'pwa_launch_standalone'
  | 'view_memory'
  | 'complete_memory'
  | 'click_create_cta'
  | 'replay_memory'
  | 'send_reaction'
  | 'view_universe_feed'
  | 'universe_reaction'
  | 'toggle_universe_share';

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
