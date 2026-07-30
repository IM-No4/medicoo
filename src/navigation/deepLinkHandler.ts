import { executeAction } from '@/src/actions/ActionExecutor';

export function handleDeepLink(url: string) {
  if (url.includes('/add-address') || url.includes('://add-address')) {
    try {
      const parsedUrl = new URL(url);
      const params: Record<string, string> = {};
      parsedUrl.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      executeAction('OPEN_ADD_ADDRESS', {
        fullAddress: params.fullAddress,
        houseNo: params.houseNo,
        landmark: params.landmark,
        tag: params.tag || params.label,
        receiverName: params.receiverName,
        receiverPhone: params.receiverPhone,
        latitude: params.latitude,
        longitude: params.longitude,
      });
    } catch (e) {
      console.warn('Failed to parse add-address deep link query params:', e);
    }
    return;
  }

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
