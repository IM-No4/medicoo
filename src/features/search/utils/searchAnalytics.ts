type SearchEvent =
  | {
      name: 'search_executed';
      query: string;
      length: number;
    }
  | {
      name: 'search_result_tapped';
      query: string;
      domain: string;
      title: string;
    };

export function trackSearchEvent(event: SearchEvent) {
  // 🔌 Replace this with Firebase / Segment later
  // For now, keep it side-effect safe
  if (__DEV__) {
    console.log('[SearchAnalytics]', event);
  }
}
