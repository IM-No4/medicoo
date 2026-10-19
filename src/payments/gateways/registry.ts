import type { GatewayName, PaymentGateway } from '../types';
import { CashfreeGateway } from './CashfreeGateway';
import { RazorpayGateway } from './RazorpayGateway';

// The ONLY place the app picks a gateway implementation. UI and business
// logic ask for a gateway by the name the backend returned and use it through
// the PaymentGateway interface.
const instances: Partial<Record<GatewayName, PaymentGateway>> = {};

export const getGateway = (name: GatewayName): PaymentGateway => {
  if (!instances[name]) {
    instances[name] = name === 'razorpay' ? new RazorpayGateway() : new CashfreeGateway();
  }
  return instances[name] as PaymentGateway;
};
