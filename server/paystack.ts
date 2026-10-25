import crypto from 'crypto';
import {
  creditUserWallet,
  getUserProfile,
  getUserWallet,
  normalizeGhanaPhoneNumber,
} from './auth';

const PAYSTACK_API_URL = 'https://api.paystack.co';

interface PaystackApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface PaystackTransaction {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  channel?: string;
  metadata?: unknown;
  customer?: { email?: string; phone?: string };
}

function secretKey() {
  return (process.env.PAYSTACK_SECRET_KEY || '').replace(/^['"]|['"]$/g, '').trim();
}

function parseMetadata(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

async function paystackRequest<T>(path: string, init: RequestInit): Promise<T> {
  const key = secretKey();
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not configured on the server.');

  const response = await fetch(`${PAYSTACK_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null) as PaystackApiResponse<T> | null;
  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || `Paystack request failed with status ${response.status}.`);
  }
  return payload.data;
}

const SANDBOX_PAYSTACK_TX = new Map<string, PaystackTransaction>();

export async function initializePaystackTransaction(params: {
  amount: number;
  phoneNumber: string;
  email?: string;
  displayName?: string;
  callbackUrl: string;
}) {
  const normalizedPhone = normalizeGhanaPhoneNumber(params.phoneNumber);
  const amountInPesewas = Math.round(params.amount * 100);
  if (!Number.isFinite(amountInPesewas) || amountInPesewas <= 0) throw new Error('Invalid payment amount.');

  const profile = getUserProfile(normalizedPhone);
  const email = params.email || profile?.email || `${normalizedPhone.replace(/\D/g, '')}@chargelink.com.gh`;
  const reference = `CHG-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  if (!secretKey()) {
    const simRef = `SIM-${reference}`;
    SANDBOX_PAYSTACK_TX.set(simRef, {
      reference: simRef,
      status: 'success',
      amount: amountInPesewas,
      currency: 'GHS',
      channel: 'mobile_money',
      metadata: {
        purpose: 'wallet_topup',
        phoneNumber: normalizedPhone,
        amountGhs: Number(params.amount.toFixed(2)),
        displayName: params.displayName || profile?.displayName || undefined,
      },
      customer: { email, phone: normalizedPhone },
    });
    const separator = params.callbackUrl.includes('?') ? '&' : '?';
    return {
      authorization_url: `${params.callbackUrl}${separator}reference=${encodeURIComponent(simRef)}`,
      access_code: `sim_access_${Date.now()}`,
      reference: simRef,
    };
  }

  return paystackRequest<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: String(amountInPesewas),
      currency: 'GHS',
      reference,
      callback_url: params.callbackUrl,
      metadata: {
        purpose: 'wallet_topup',
        phoneNumber: normalizedPhone,
        amountGhs: Number(params.amount.toFixed(2)),
        displayName: params.displayName || profile?.displayName || undefined,
      },
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  const trimmed = reference.trim();
  if (!trimmed) throw new Error('A Paystack transaction reference is required.');
  if (SANDBOX_PAYSTACK_TX.has(trimmed)) {
    return SANDBOX_PAYSTACK_TX.get(trimmed)!;
  }
  return paystackRequest<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(trimmed)}`, { method: 'GET' });
}

export function isPaystackSignatureValid(rawBody: Buffer | string, signature: string | undefined) {
  const key = secretKey();
  if (!key || !signature) return false;
  const expected = crypto.createHmac('sha512', key).update(rawBody).digest('hex');
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** Fulfil a successful transaction once using the Paystack reference as the idempotency key. */
export function settlePaystackTransaction(transaction: PaystackTransaction) {
  const metadata = parseMetadata(transaction.metadata);
  const rawPhone = metadata.phoneNumber || transaction.customer?.phone || '';
  const phoneNumber = normalizeGhanaPhoneNumber(String(rawPhone));
  const amountGhs = Number(transaction.amount) / 100;
  const expectedAmount = Number(metadata.amountGhs);

  if (transaction.status !== 'success') throw new Error(`Payment is not successful. Current status: ${transaction.status || 'unknown'}.`);
  if (transaction.currency !== 'GHS') throw new Error('Payment currency mismatch. Expected GHS.');
  if (!/^\+233\d{9}$/.test(phoneNumber)) throw new Error('The Paystack transaction does not contain a valid Ghana phone number.');
  if (Number.isFinite(expectedAmount) && expectedAmount > 0 && Math.round(expectedAmount * 100) !== Number(transaction.amount)) {
    throw new Error('Payment amount mismatch. Wallet was not credited.');
  }

  const existingUser = getUserProfile(phoneNumber);
  const existingTransaction = existingUser?.transactions?.find((item) => item.reference === transaction.reference);
  if (existingTransaction) {
    return { success: true, alreadyCredited: true, reference: transaction.reference, wallet: getUserWallet(phoneNumber), user: existingUser };
  }

  const provider = transaction.channel === 'card' ? 'CARD' : 'MOMO';
  const user = creditUserWallet(phoneNumber, amountGhs, `Paystack wallet top-up (${transaction.channel || 'payment'})`, transaction.reference, provider);
  return { success: true, alreadyCredited: false, reference: transaction.reference, wallet: getUserWallet(phoneNumber), user };
}
