// Wilpower / ChargeLink GH — Consolidated Vercel Serverless Wallet Action API
// Handles: momo-initiate, momo-confirm, topup, paystack-initialize, paystack-verify

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const API_ROOT = 'https://api.paystack.co';
const dataDir = process.env.VERCEL ? path.join('/tmp', 'xcharge-data') : path.join(process.cwd(), 'data');
const usersFile = path.join(dataDir, 'users.json');
const seedFile = path.join(process.cwd(), 'data', 'users.json');

function normalizePhone(value: string): string {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('2330') && digits.length === 13) return `+233${digits.slice(4)}`;
  if (digits.startsWith('233') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+233${digits.slice(1)}`;
  if (digits.length === 9) return `+233${digits}`;
  return (value || '').trim();
}

function getSecret(): string {
  return (process.env.PAYSTACK_SECRET_KEY || '').replace(/^['"]|['"]$/g, '').trim();
}

function requestOrigin(req: any): string {
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || 'https').split(',')[0];
  const host = String(req.headers?.host || 'localhost:5173');
  return `${forwardedProto}://${host}`.replace(/\/$/, '');
}

function readUsers(): any[] {
  try {
    const file = fs.existsSync(usersFile) ? usersFile : seedFile;
    if (fs.existsSync(file)) {
      const records = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(records)) return records;
    }
  } catch {}
  return [];
}

function saveUsers(users: any[]) {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf8');
  } catch {}
}

function parseBody(req: any): any {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {}
  } else if (Buffer.isBuffer(body)) {
    try { body = JSON.parse(body.toString('utf8')); } catch {}
  }
  return body || {};
}

function parseMetadata(value: unknown): Record<string, any> {
  if (value && typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawAction = req.query?.action;
  const actionFromQuery = Array.isArray(rawAction) ? rawAction[0] : rawAction;
  const actionFromUrl = req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '';
  const action = String(actionFromQuery || actionFromUrl || '').toLowerCase();

  // -------------------------------------------------------------
  // 1. MoMo Initiate (POST /api/wallet/momo-initiate, GET health check)
  // -------------------------------------------------------------
  if (action === 'momo-initiate') {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        status: 'ONLINE',
        endpoint: '/api/wallet/momo-initiate',
        currency: 'GHS',
        merchantName: 'CHARGELINK GH LTD',
        supportedProviders: ['MTN', 'TELECEL', 'CARD'],
        message: 'MoMo Payment Initiation Gateway is operational.'
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
      const body = parseBody(req);
      const { amount, provider = 'MTN', phone } = body;
      const targetPhone = phone || '+233248901204';
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid payment amount' });
      }

      const normalized = normalizePhone(targetPhone);
      const provStr = String(provider || 'MTN').toUpperCase();
      const prov = (provStr === 'TELECEL' ? 'TELECEL' : provStr === 'CARD' ? 'CARD' : 'MTN') as 'MTN' | 'TELECEL' | 'CARD';
      const txId = `momo-req-${Date.now()}`;
      const networkRef = `GH-${prov}-${Math.floor(100000 + Math.random() * 900000)}`;
      const merchant = 'CHARGELINK GH LTD';

      const ussdPrompt = prov === 'MTN'
        ? `Authorize payment of GHS ${numAmount.toFixed(2)} to ${merchant}? Ref: ${networkRef}. Enter Mobile Money (*170#) PIN:`
        : prov === 'TELECEL'
        ? `Authorize payment of GHS ${numAmount.toFixed(2)} to ${merchant}? Ref: ${networkRef}. Enter Telecel Cash (*110#) PIN:`
        : `Authorize payment of GHS ${numAmount.toFixed(2)} via Mastercard 3D Secure?`;

      return res.status(200).json({
        success: true,
        transactionId: txId,
        status: 'PENDING',
        amount: numAmount,
        currency: 'GHS',
        provider: prov,
        phoneNumber: normalized,
        networkReference: networkRef,
        merchantName: merchant,
        ussdPrompt,
        timeoutSeconds: 45,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Payment initiation failed' });
    }
  }

  // -------------------------------------------------------------
  // 2. MoMo Confirm (POST /api/wallet/momo-confirm, GET health check)
  // -------------------------------------------------------------
  if (action === 'momo-confirm') {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        status: 'ONLINE',
        endpoint: '/api/wallet/momo-confirm',
        message: 'MoMo Payment Confirmation Gateway is operational.'
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
      const body = parseBody(req);
      const { transactionId, amount, provider = 'MTN', phone } = body;
      const targetPhone = phone || '+233248901204';
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid payment amount' });
      }

      const normalized = normalizePhone(targetPhone);
      const provStr = String(provider || 'MTN').toUpperCase();
      const prov = (provStr === 'TELECEL' ? 'TELECEL' : provStr === 'CARD' ? 'CARD' : 'MTN') as 'MTN' | 'TELECEL' | 'CARD';
      const approvalCode = `${prov}-AUTH-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const graTaxInvoice = `GRA-ELEV-EXEMPT-${Math.floor(10000 + Math.random() * 90000)}`;

      const users = readUsers();
      let user = users.find((u) => normalizePhone(u.phoneNumber) === normalized);
      const now = new Date().toISOString();

      if (!user) {
        user = {
          id: `usr-gh-${normalized.slice(-4)}`,
          phoneNumber: normalized,
          displayName: `Driver ${normalized.slice(-4)}`,
          email: `${normalized.replace(/\D/g, '')}@chargelink.com.gh`,
          walletBalance: 0,
          heldEscrow: 0,
          defaultPaymentMethod: prov === 'TELECEL' ? 'TELECEL_CASH' : prov === 'CARD' ? 'MASTERCARD' : 'MTN_MOMO',
          registeredVehicles: [],
          transactions: [],
          createdAt: now,
          updatedAt: now,
        };
        users.push(user);
      }

      user.walletBalance = Number((Number(user.walletBalance || 0) + numAmount).toFixed(2));
      user.updatedAt = now;
      user.transactions = user.transactions || [];
      user.transactions.unshift({
        id: `tx-${Date.now()}`,
        timestamp: now,
        amount: numAmount,
        type: 'TOPUP',
        status: 'SUCCESS',
        provider: prov === 'CARD' ? 'CARD' : 'MOMO',
        reference: approvalCode,
        description: `${prov} MoMo Top-Up (${normalized}) · Approved`,
      });
      user.transactions = user.transactions.slice(0, 50);

      saveUsers(users);

      const txRecord = {
        id: transactionId || `tx-${Date.now()}`,
        transactionId: transactionId || `tx-${Date.now()}`,
        networkReference: `GH-${prov}-${Math.floor(100000 + Math.random() * 900000)}`,
        phoneNumber: normalized,
        amount: numAmount,
        currency: 'GHS',
        provider: prov,
        status: 'SUCCESS',
        merchantName: 'CHARGELINK GH LTD',
        description: `${prov} MoMo Top-Up (${normalized}) · Approved`,
        approvalCode,
        graTaxInvoice,
        createdAt: now,
        completedAt: now,
      };

      return res.status(200).json({
        success: true,
        status: 'SUCCESS',
        approvalCode,
        graTaxInvoice,
        settledAmount: numAmount,
        currency: 'GHS',
        transaction: txRecord,
        walletBalance: user.walletBalance,
        wallet: {
          userId: user.id,
          currency: 'GHS',
          availableBalance: user.walletBalance,
          heldBalance: user.heldEscrow || 0,
          momoProvider: prov,
          phoneNumber: user.phoneNumber,
          transactions: user.transactions,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Payment confirmation failed' });
    }
  }

  // -------------------------------------------------------------
  // 3. Top-Up (POST /api/wallet/topup, GET health check)
  // -------------------------------------------------------------
  if (action === 'topup') {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        status: 'ONLINE',
        endpoint: '/api/wallet/topup',
        currency: 'GHS',
        message: 'Wallet top-up gateway is active.'
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
      const body = parseBody(req);
      const { amount, provider = 'MOMO', phone } = body;
      const targetPhone = phone || '+233248901204';
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid top-up amount' });
      }

      const normalized = normalizePhone(targetPhone);
      const prov = (String(provider).toUpperCase() === 'CARD' ? 'CARD' : 'MOMO') as 'MOMO' | 'CARD';
      const ref = `TOPUP-GH-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toISOString();

      const users = readUsers();
      let user = users.find((u) => normalizePhone(u.phoneNumber) === normalized);

      if (!user) {
        user = {
          id: `usr-gh-${normalized.slice(-4)}`,
          phoneNumber: normalized,
          displayName: `Driver ${normalized.slice(-4)}`,
          email: `${normalized.replace(/\D/g, '')}@chargelink.com.gh`,
          walletBalance: 0,
          heldEscrow: 0,
          defaultPaymentMethod: prov === 'CARD' ? 'MASTERCARD' : 'MTN_MOMO',
          registeredVehicles: [],
          transactions: [],
          createdAt: now,
          updatedAt: now,
        };
        users.push(user);
      }

      user.walletBalance = Number((Number(user.walletBalance || 0) + numAmount).toFixed(2));
      user.updatedAt = now;
      user.transactions = user.transactions || [];
      const tx = {
        id: `tx-${Date.now()}`,
        timestamp: now,
        amount: numAmount,
        type: 'TOPUP',
        status: 'SUCCESS',
        provider: prov,
        reference: ref,
        description: `${provider || 'MTN MoMo'} Top-up (${normalized})`,
      };
      user.transactions.unshift(tx);
      user.transactions = user.transactions.slice(0, 50);

      saveUsers(users);

      return res.status(200).json({
        success: true,
        wallet: {
          userId: user.id,
          currency: 'GHS',
          availableBalance: user.walletBalance,
          heldBalance: user.heldEscrow || 0,
          momoProvider: user.defaultPaymentMethod === 'TELECEL_CASH' ? 'TELECEL' : user.defaultPaymentMethod === 'MASTERCARD' ? 'CARD' : 'MTN',
          phoneNumber: user.phoneNumber,
          transactions: user.transactions,
        },
        transaction: tx,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Top-up failed' });
    }
  }

  // -------------------------------------------------------------
  // 4. Paystack Initialize (POST /api/wallet/paystack-initialize, GET health check)
  // -------------------------------------------------------------
  if (action === 'paystack-initialize') {
    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        status: 'ONLINE',
        endpoint: '/api/wallet/paystack-initialize',
        currency: 'GHS',
        message: 'Paystack initialization gateway is active.'
      });
    }
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
      const body = parseBody(req);
      const amount = Number(body.amount);
      const phone = normalizePhone(body.phone || '+233248901204');

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid payment amount.' });
      }
      if (!/^\+233\d{9}$/.test(phone)) {
        return res.status(400).json({ success: false, error: 'Enter a valid Ghana phone number before paying.' });
      }

      const baseUrl = (process.env.APP_URL || requestOrigin(req)).replace(/\/$/, '');
      const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${baseUrl}/payments/paystack/callback`;
      const reference = `CHG-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const email = body.email?.trim() || `${phone.replace(/\D/g, '')}@chargelink.com.gh`;

      const key = getSecret();
      if (!key) {
        return res.status(500).json({
          success: false,
          error: 'PAYSTACK_SECRET_KEY is missing from environment variables. Please configure it in Vercel project settings.'
        });
      }

      const paystackRes = await fetch(`${API_ROOT}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: String(Math.round(amount * 100)),
          currency: 'GHS',
          reference,
          callback_url: callbackUrl,
          metadata: {
            purpose: 'wallet_topup',
            phoneNumber: phone,
            amountGhs: Number(amount.toFixed(2)),
            displayName: body.displayName || undefined,
          },
        }),
      });

      const result = await paystackRes.json().catch(() => null) as any;
      if (!paystackRes.ok || !result?.status) {
        return res.status(400).json({
          success: false,
          error: result?.message || `Paystack returned HTTP ${paystackRes.status}.`
        });
      }

      return res.status(200).json({
        success: true,
        authorization_url: result.data.authorization_url,
        access_code: result.data.access_code,
        reference: result.data.reference,
      });
    } catch (err: any) {
      console.error('[Paystack initialize error]', err?.message || err);
      return res.status(500).json({ success: false, error: err.message || 'Could not initialize Paystack payment.' });
    }
  }

  // -------------------------------------------------------------
  // 5. Paystack Verify (GET /api/wallet/paystack-verify?reference=...)
  // -------------------------------------------------------------
  if (action === 'paystack-verify') {
    if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
      const reference = String(req.query?.reference || '').trim();
      if (!reference) {
        return res.status(200).json({
          success: true,
          status: 'ONLINE',
          endpoint: '/api/wallet/paystack-verify',
          message: 'Provide a ?reference=... query parameter to verify a payment transaction.'
        });
      }

      const key = getSecret();
      if (!key) {
        return res.status(500).json({
          success: false,
          error: 'PAYSTACK_SECRET_KEY is missing from environment variables.'
        });
      }

      const verifyRes = await fetch(`${API_ROOT}/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await verifyRes.json().catch(() => null) as any;
      if (!verifyRes.ok || !result?.status || !result.data) {
        return res.status(400).json({
          success: false,
          error: result?.message || `Paystack verification returned HTTP ${verifyRes.status}.`
        });
      }

      const tx = result.data;
      if (tx.status !== 'success') {
        return res.status(400).json({
          success: false,
          error: `Payment has not succeeded (status: ${tx.status || 'unknown'}).`
        });
      }

      const metadata = parseMetadata(tx.metadata);
      const phone = normalizePhone(String(metadata.phoneNumber || tx.customer?.phone || ''));
      const amount = Number(tx.amount) / 100;

      const users = readUsers();
      let user = users.find((record) => normalizePhone(record.phoneNumber) === phone);
      const now = new Date().toISOString();

      if (!user) {
        user = {
          id: `usr-gh-${Date.now().toString(36)}`,
          phoneNumber: phone || '+233248901204',
          displayName: String(metadata.displayName || `Driver ${phone ? phone.slice(-4) : 'User'}`),
          email: tx.customer?.email || `${(phone || 'driver').replace(/\D/g, '')}@chargelink.com.gh`,
          walletBalance: 0,
          heldEscrow: 0,
          defaultPaymentMethod: 'MTN_MOMO',
          registeredVehicles: [],
          transactions: [],
          createdAt: now,
          updatedAt: now,
        };
        users.push(user);
      }

      user.transactions = user.transactions || [];
      const previous = user.transactions.find((entry: any) => entry.reference === tx.reference);

      if (!previous) {
        user.walletBalance = Number((Number(user.walletBalance || 0) + amount).toFixed(2));
        user.updatedAt = now;
        user.transactions.unshift({
          id: `tx-${Date.now()}`,
          timestamp: now,
          amount,
          type: 'TOPUP',
          status: 'SUCCESS',
          provider: tx.channel === 'card' ? 'CARD' : 'MOMO',
          reference: tx.reference,
          description: `Paystack wallet top-up (${tx.channel || 'payment'})`,
        });
        user.transactions = user.transactions.slice(0, 50);
        saveUsers(users);
      }

      return res.status(200).json({
        success: true,
        alreadyCredited: Boolean(previous),
        reference: tx.reference,
        wallet: {
          userId: user.id,
          currency: 'GHS',
          availableBalance: Number(user.walletBalance || 0),
          heldBalance: Number(user.heldEscrow || 0),
          momoProvider: user.defaultPaymentMethod === 'TELECEL_CASH' ? 'TELECEL' : user.defaultPaymentMethod === 'MASTERCARD' ? 'CARD' : 'MTN',
          phoneNumber: user.phoneNumber,
          transactions: user.transactions,
        },
        user,
      });
    } catch (err: any) {
      console.error('[Paystack verify error]', err?.message || err);
      return res.status(400).json({ success: false, error: err.message || 'Could not verify Paystack payment.' });
    }
  }

  return res.status(404).json({ error: `Wallet route /api/wallet/${action} not found.` });
}
