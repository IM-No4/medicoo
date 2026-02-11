import { executeAction } from '@/src/actions/ActionExecutor';

export function handleDeepLink(url: string) {
  if (url.includes('/search')) {
    const q = new URL(url).searchParams.get('q');
    if (q) {
      executeAction('OPEN_GLOBAL_SEARCH');
      // SearchScreen already hydrates query from state
    }
    return;
  }

  const match = url.match(/\/(doctor|medicine|lab-test|pharmacy)\/(.+)$/);
  if (!match) return;

  const [, type, id] = match;

  switch (type) {
    case 'doctor':
      executeAction('OPEN_DOCTOR_DETAIL', { doctorId: id });
      break;

    case 'lab-test':
      executeAction('OPEN_LAB_TESTS', { testId: id });
      break;

    case 'pharmacy':
      executeAction('OPEN_PHARMACY', { pharmacyId: id });
      break;
  }
}
