import paypal from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error('PayPal environment variables (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) are missing');
}

// Sandbox in development, Live in production
const environment =
  process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);

const client = new paypal.core.PayPalHttpClient(environment);

export default client;