export type BootStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface BootState {
  status: BootStatus;
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  initialRoute: string | null;
  deepLinkIntent: null | {
    route: string;
    params?: any;
  };
}
