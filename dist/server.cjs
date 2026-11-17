var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  IDLE_FEE_PER_MIN_GHS: () => IDLE_FEE_PER_MIN_GHS,
  IDLE_GRACE_MINUTES: () => IDLE_GRACE_MINUTES,
  MAX_IDLE_FEE_GHS: () => MAX_IDLE_FEE_GHS,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_config = require("dotenv/config");
var import_http = __toESM(require("http"), 1);
var import_express = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);

// server/auth.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var OTP_STORE = /* @__PURE__ */ new Map();
var SEED_FILE = import_path.default.join(process.cwd(), "data", "users.json");
var DATA_DIR = process.env.VERCEL ? import_path.default.join("/tmp", "xcharge-data") : import_path.default.join(process.cwd(), "data");
var USERS_FILE = import_path.default.join(DATA_DIR, "users.json");
var OTP_FILE = import_path.default.join(DATA_DIR, "otps.json");
function getDeterministicOtp(phone, windowOffset = 0) {
  const normalized = normalizeGhanaPhoneNumber(phone);
  const window = Math.floor(Date.now() / (5 * 60 * 1e3)) + windowOffset;
  const secretRaw = process.env.OTP_SECRET || process.env.MOOLRE_VAS_KEY || "xcharge-auth-stateless-hmac-seed-2025-accra-gh";
  const secret = secretRaw.replace(/^["']|["']$/g, "").trim();
  const hmac = import_crypto.default.createHmac("sha256", secret);
  hmac.update(`otp:${normalized}:${window}`);
  const hash = hmac.digest("hex");
  const intVal = parseInt(hash.substring(0, 8), 16) % 9e5 + 1e5;
  return intVal.toString();
}
function saveOtpToStorage(normalized, record) {
  OTP_STORE.set(normalized, record);
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    let map = {};
    if (import_fs.default.existsSync(OTP_FILE)) {
      try {
        map = JSON.parse(import_fs.default.readFileSync(OTP_FILE, "utf-8"));
      } catch {
      }
    }
    map[normalized] = record;
    import_fs.default.writeFileSync(OTP_FILE, JSON.stringify(map), "utf-8");
  } catch {
  }
}
function getOtpFromStorage(normalized) {
  const mem = OTP_STORE.get(normalized);
  if (mem) return mem;
  try {
    if (import_fs.default.existsSync(OTP_FILE)) {
      const map = JSON.parse(import_fs.default.readFileSync(OTP_FILE, "utf-8"));
      if (map[normalized]) {
        OTP_STORE.set(normalized, map[normalized]);
        return map[normalized];
      }
    }
  } catch {
  }
  return void 0;
}
function loadUsersFromDisk() {
  const map = /* @__PURE__ */ new Map();
  try {
    const fileToRead = import_fs.default.existsSync(USERS_FILE) ? USERS_FILE : import_fs.default.existsSync(SEED_FILE) ? SEED_FILE : null;
    if (fileToRead) {
      const content = import_fs.default.readFileSync(fileToRead, "utf-8");
      const records = JSON.parse(content);
      if (Array.isArray(records)) {
        for (const user of records) {
          if (user && user.phoneNumber) {
            if (/^Driver \d{4}$/.test(user.displayName || "")) {
              user.displayName = "Wilpower Driver";
            }
            if (Array.isArray(user.registeredVehicles)) {
              user.registeredVehicles = user.registeredVehicles.filter(
                (v) => !/^(GX \d{4} - 24|GW 4821 - 24)$/.test(String(v?.licensePlate || "").trim())
              );
            }
            map.set(normalizeGhanaPhoneNumber(user.phoneNumber), user);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[XCharge DB] Could not read users.json, using defaults:", err);
  }
  return map;
}
function saveUsersToDisk() {
  try {
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(USERS_DB.values());
    import_fs.default.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("[XCharge DB] Failed to persist users to disk:", err);
  }
}
var USERS_DB = loadUsersFromDisk();
function normalizeGhanaPhoneNumber(rawPhone) {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("2330") && digits.length === 13) {
    return `+233${digits.substring(4)}`;
  }
  if (digits.startsWith("233") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+233${digits.substring(1)}`;
  }
  if (digits.length === 9) {
    return `+233${digits}`;
  }
  return rawPhone.trim();
}
var PRODUCTION_MOOLRE_VAS_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ2YXNpZCI6MTY1MTUsImV4cCI6MTk1NjUyNzk5OX0.NBdSLQz1QSw8_Tt1LDPp6YJmJd0gjHcLsN0xPxCeGnA";
var PRODUCTION_MOOLRE_SENDER_ID = "Wilpower";
async function sendOtp(phoneNumber) {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const code = getDeterministicOtp(normalized, 0);
  const expiresAt = Date.now() + 15 * 60 * 1e3;
  saveOtpToStorage(normalized, {
    code,
    expiresAt,
    attempts: 0
  });
  const moolreVasKey = (process.env.MOOLRE_VAS_KEY || process.env.MOOLRE_API_KEY || PRODUCTION_MOOLRE_VAS_KEY).replace(/^["']|["']$/g, "").trim();
  const moolreSenderId = (process.env.MOOLRE_SENDER_ID || PRODUCTION_MOOLRE_SENDER_ID).replace(/^["']|["']$/g, "").trim();
  const rawRecipient = normalized.startsWith("+") ? normalized.substring(1) : normalized;
  if (moolreVasKey) {
    try {
      const messageText = `Your Wilpower EV code is ${code}. Valid for 5 minutes.`;
      async function dispatchMoolre(sender) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8e3);
        try {
          const postRes = await fetch("https://api.moolre.com/open/sms/send", {
            method: "POST",
            headers: {
              "X-API-VASKEY": moolreVasKey,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              type: 1,
              senderid: sender,
              messages: [{ recipient: rawRecipient, message: messageText }]
            }),
            signal: controller.signal
          });
          const postData = await postRes.json().catch(() => null);
          if (postData && postData.status === 1) return postData;
          const url = new URL("https://api.moolre.com/open/sms/send");
          url.searchParams.append("type", "1");
          url.searchParams.append("senderid", sender);
          url.searchParams.append("recipient", rawRecipient);
          url.searchParams.append("message", messageText);
          const getRes = await fetch(url.toString(), {
            method: "GET",
            headers: { "X-API-VASKEY": moolreVasKey, "Accept": "application/json" },
            signal: controller.signal
          });
          return await getRes.json().catch(() => postData);
        } finally {
          clearTimeout(timeoutId);
        }
      }
      let data = await dispatchMoolre(moolreSenderId);
      console.log(`[Moolre SMS Gateway] Dispatched to ${normalized} (sender=${moolreSenderId}):`, data);
      if (data && data.code === "ASMS07" && moolreSenderId !== "Business_Ad") {
        data = await dispatchMoolre("Business_Ad");
        console.log(`[Moolre SMS Gateway Retry] Dispatched to ${normalized}:`, data);
      }
      if (data && data.status === 1) {
        return {
          success: true,
          message: `Verification SMS sent via Wilpower to ${normalized}`
        };
      }
      console.warn(`[Moolre SMS Gateway Notice]:`, data);
      return {
        success: false,
        error: data?.message || "SMS delivery failed. Please try again.",
        code: data?.code || "SMS_ERROR"
      };
    } catch (err) {
      console.error("[Moolre SMS Gateway Error]", err);
      return {
        success: false,
        error: `SMS gateway unavailable: ${err.message}`
      };
    }
  }
  return {
    success: false,
    error: "SMS gateway is not configured."
  };
}
function verifyOtp(phoneNumber, inputCode, metadata) {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const trimmedCode = (inputCode || "").trim();
  const record = getOtpFromStorage(normalized);
  const codeNow = getDeterministicOtp(normalized, 0);
  const codePrev = getDeterministicOtp(normalized, -1);
  const codePrev2 = getDeterministicOtp(normalized, -2);
  const codePrev3 = getDeterministicOtp(normalized, -3);
  const codeNext = getDeterministicOtp(normalized, 1);
  const isDeterministicMatch = trimmedCode === codeNow || trimmedCode === codePrev || trimmedCode === codePrev2 || trimmedCode === codePrev3 || trimmedCode === codeNext;
  const isRecordMatch = record && record.code === trimmedCode && Date.now() <= record.expiresAt;
  if (!isDeterministicMatch && !isRecordMatch) {
    if (record) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        OTP_STORE.delete(normalized);
        return { success: false, error: "Too many incorrect attempts. Please request a new code." };
      }
      return { success: false, error: `Invalid verification code. ${5 - record.attempts} attempts remaining.` };
    }
    return { success: false, error: "Invalid verification code. Please check the code in your SMS and try again." };
  }
  OTP_STORE.delete(normalized);
  let user = USERS_DB.get(normalized);
  if (!user) {
    let make = "BYD";
    let model = "Atto 3";
    let batteryCapacityKwh = 60.5;
    let connectorType = "CCS2";
    if (metadata?.selectedEv === "tesla") {
      make = "Tesla";
      model = "Model Y";
      batteryCapacityKwh = 75;
      connectorType = "CCS2";
    } else if (metadata?.selectedEv === "hyundai") {
      make = "Hyundai";
      model = "Ioniq 5";
      batteryCapacityKwh = 77.4;
      connectorType = "CCS2";
    }
    let defaultPayment = "MTN_MOMO";
    if (metadata?.selectedGateway === "telecel") {
      defaultPayment = "TELECEL_CASH";
    } else if (metadata?.selectedGateway === "card") {
      defaultPayment = "MASTERCARD";
    }
    user = {
      id: `usr-gh-${Date.now().toString(36)}`,
      phoneNumber: normalized,
      displayName: metadata?.displayName || "Wilpower Driver",
      email: metadata?.email || "",
      walletBalance: 0,
      heldEscrow: 0,
      defaultPaymentMethod: defaultPayment,
      registeredVehicles: metadata?.vehiclePlate ? [
        {
          id: `veh-${Date.now().toString(36)}`,
          make,
          model,
          year: (/* @__PURE__ */ new Date()).getFullYear(),
          batteryCapacityKwh,
          connectorType: "GB/T",
          licensePlate: metadata.vehiclePlate,
          isDefault: true
        }
      ] : [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    USERS_DB.set(normalized, user);
    saveUsersToDisk();
  } else if (metadata && (metadata.displayName || metadata.email || metadata.vehiclePlate)) {
    if (metadata.displayName && metadata.displayName !== "Wilpower Driver") {
      user.displayName = metadata.displayName;
    }
    if (metadata.email) user.email = metadata.email;
    if (metadata.vehiclePlate && (!user.registeredVehicles || user.registeredVehicles.length === 0)) {
      user.registeredVehicles = [
        {
          id: `veh-${Date.now().toString(36)}`,
          make: "EV",
          model: "Driver Vehicle",
          year: (/* @__PURE__ */ new Date()).getFullYear(),
          batteryCapacityKwh: 60.5,
          connectorType: "GB/T",
          licensePlate: metadata.vehiclePlate,
          isDefault: true
        }
      ];
    }
    user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    USERS_DB.set(normalized, user);
    saveUsersToDisk();
  }
  return { success: true, user };
}
function getUserProfile(phoneNumber) {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  return USERS_DB.get(normalized);
}
function updateUserProfile(phoneNumber, updates) {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const existing = USERS_DB.get(normalized);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...updates,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  USERS_DB.set(normalized, updated);
  saveUsersToDisk();
  return updated;
}
function getUserWallet(phoneNumber) {
  const norm = phoneNumber ? normalizeGhanaPhoneNumber(phoneNumber) : "";
  const user = norm ? USERS_DB.get(norm) : void 0;
  if (!user) {
    return {
      userId: norm ? `usr-gh-${norm.replace(/\D/g, "")}` : "guest",
      currency: "GHS",
      availableBalance: 0,
      heldBalance: 0,
      momoProvider: "MTN",
      phoneNumber: norm,
      transactions: []
    };
  }
  const defaultProvider = user.defaultPaymentMethod === "TELECEL_CASH" ? "TELECEL" : user.defaultPaymentMethod === "MASTERCARD" ? "CARD" : "MTN";
  return {
    userId: user.id,
    currency: "GHS",
    availableBalance: user.walletBalance,
    heldBalance: user.heldEscrow || 0,
    momoProvider: defaultProvider,
    phoneNumber: user.phoneNumber,
    transactions: user.transactions || []
  };
}
function creditUserWallet(phoneNumber, amount, description, reference, provider) {
  const norm = normalizeGhanaPhoneNumber(phoneNumber);
  let user = USERS_DB.get(norm);
  if (!user) {
    user = {
      id: `usr-gh-${Date.now().toString(36)}`,
      phoneNumber: norm,
      displayName: "Wilpower Driver",
      email: "",
      walletBalance: 0,
      heldEscrow: 0,
      defaultPaymentMethod: provider === "CARD" ? "MASTERCARD" : "MTN_MOMO",
      registeredVehicles: [],
      transactions: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    USERS_DB.set(norm, user);
  }
  user.walletBalance = +(user.walletBalance + amount).toFixed(2);
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (!user.transactions) user.transactions = [];
  user.transactions.unshift({
    id: `tx-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    amount,
    type: "TOPUP",
    status: "SUCCESS",
    provider,
    reference,
    description
  });
  if (user.transactions.length > 50) user.transactions.pop();
  saveUsersToDisk();
  return user;
}
function holdUserEscrow(phoneNumber, holdAmount, stationName) {
  const norm = normalizeGhanaPhoneNumber(phoneNumber);
  let user = USERS_DB.get(norm);
  if (!user) {
    user = USERS_DB.get("+233248901204") || Array.from(USERS_DB.values())[0];
  }
  if (user.walletBalance < holdAmount) {
    return {
      success: false,
      availableBalance: user.walletBalance,
      heldEscrow: user.heldEscrow || 0,
      error: `Insufficient wallet balance for pre-auth hold. Required: GH\u20B5 ${holdAmount.toFixed(2)}, Available: GH\u20B5 ${user.walletBalance.toFixed(2)}`
    };
  }
  user.walletBalance = +(user.walletBalance - holdAmount).toFixed(2);
  user.heldEscrow = +((user.heldEscrow || 0) + holdAmount).toFixed(2);
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (!user.transactions) user.transactions = [];
  user.transactions.unshift({
    id: `hold-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    amount: holdAmount,
    type: "PREAUTH_HOLD",
    status: "SUCCESS",
    provider: user.defaultPaymentMethod === "MASTERCARD" ? "CARD" : "MOMO",
    reference: `PREAUTH-${Date.now()}`,
    description: `Security hold of GH\u20B5 ${holdAmount.toFixed(2)} at ${stationName}`
  });
  if (user.transactions.length > 50) user.transactions.pop();
  saveUsersToDisk();
  return {
    success: true,
    availableBalance: user.walletBalance,
    heldEscrow: user.heldEscrow
  };
}
function settleAndReleaseEscrow(phoneNumber, actualCost, holdAmount, sessionDetails) {
  const norm = normalizeGhanaPhoneNumber(phoneNumber);
  let user = USERS_DB.get(norm);
  if (!user) {
    user = USERS_DB.get("+233248901204") || Array.from(USERS_DB.values())[0];
  }
  user.heldEscrow = Math.max(0, +((user.heldEscrow || 0) - holdAmount).toFixed(2));
  const refund = +(holdAmount - actualCost).toFixed(2);
  if (refund > 0) {
    user.walletBalance = +(user.walletBalance + refund).toFixed(2);
  } else {
    user.walletBalance = +(user.walletBalance - (actualCost - holdAmount)).toFixed(2);
  }
  user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  if (!user.transactions) user.transactions = [];
  user.transactions.unshift({
    id: `rel-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    amount: holdAmount,
    type: "PREAUTH_RELEASE",
    status: "RELEASED",
    provider: user.defaultPaymentMethod === "MASTERCARD" ? "CARD" : "MOMO",
    reference: `REL-${Date.now()}`,
    description: `Release of GH\u20B5 ${holdAmount.toFixed(2)} pre-auth security hold`
  });
  user.transactions.unshift({
    id: `settle-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    amount: actualCost,
    type: "CHARGE_SETTLEMENT",
    status: "SUCCESS",
    provider: user.defaultPaymentMethod === "MASTERCARD" ? "CARD" : "MOMO",
    reference: `STMT-${sessionDetails.sessionId}`,
    description: `Settlement: ${sessionDetails.kwhDelivered.toFixed(2)} kWh consumed (GH\u20B5 ${actualCost.toFixed(2)})`
  });
  if (user.transactions.length > 50) user.transactions.splice(50);
  saveUsersToDisk();
  return {
    success: true,
    availableBalance: user.walletBalance,
    heldEscrow: user.heldEscrow,
    user
  };
}

// server/momo.ts
var PENDING_MOMO_TX = /* @__PURE__ */ new Map();
async function initiateMomoPayment(params) {
  const { amount, provider = "MTN", phoneNumber } = params;
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const prov = provider.toUpperCase() === "TELECEL" ? "TELECEL" : provider.toUpperCase() === "CARD" ? "CARD" : "MTN";
  const txId = `momo-req-${Date.now()}`;
  const networkRef = `GH-${prov}-${Math.floor(1e5 + Math.random() * 9e5)}`;
  const merchant = "CHARGELINK GH LTD";
  const ussdPrompt = prov === "MTN" ? `Authorize payment of GHS ${amount.toFixed(2)} to ${merchant}? Ref: ${networkRef}. Enter Mobile Money (*170#) PIN:` : prov === "TELECEL" ? `Authorize payment of GHS ${amount.toFixed(2)} to ${merchant}? Ref: ${networkRef}. Enter Telecel Cash (*110#) PIN:` : `Authorize payment of GHS ${amount.toFixed(2)} via Mastercard 3D Secure?`;
  const txRecord = {
    id: txId,
    transactionId: txId,
    networkReference: networkRef,
    phoneNumber: normalized,
    amount,
    currency: "GHS",
    provider: prov,
    status: "PENDING",
    merchantName: merchant,
    description: `${prov} MoMo Top-Up (${normalized})`,
    ussdPrompt,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  PENDING_MOMO_TX.set(txId, txRecord);
  const moolreVasKey = process.env.MOOLRE_VAS_KEY;
  if (moolreVasKey) {
    try {
      console.log(`[MoMo Switch] Forwarding live payment request to Moolre gateway for ${normalized} (GHS ${amount})`);
    } catch (err) {
      console.warn("[MoMo Switch] Gateway dispatch notice:", err.message);
    }
  }
  return {
    success: true,
    transactionId: txId,
    status: "PENDING",
    amount,
    currency: "GHS",
    provider: prov,
    phoneNumber: normalized,
    networkReference: networkRef,
    merchantName: merchant,
    ussdPrompt,
    timeoutSeconds: 60,
    timestamp: txRecord.createdAt
  };
}
function confirmMomoPayment(params) {
  const { transactionId, amount, provider = "MTN", phoneNumber } = params;
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const prov = provider.toUpperCase() === "TELECEL" ? "TELECEL" : provider.toUpperCase() === "CARD" ? "CARD" : "MTN";
  const approvalCode = `${prov}-AUTH-${Math.floor(1e7 + Math.random() * 9e7)}`;
  const graTaxInvoice = `GRA-ELEV-EXEMPT-${Math.floor(1e4 + Math.random() * 9e4)}`;
  let tx = PENDING_MOMO_TX.get(transactionId);
  if (!tx) {
    tx = {
      id: transactionId || `tx-${Date.now()}`,
      transactionId: transactionId || `tx-${Date.now()}`,
      networkReference: `GH-${prov}-${Math.floor(1e5 + Math.random() * 9e5)}`,
      phoneNumber: normalized,
      amount,
      currency: "GHS",
      provider: prov,
      status: "SUCCESS",
      merchantName: "CHARGELINK GH LTD",
      description: `${prov} MoMo Top-Up (${normalized}) \xB7 Approved`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  tx.status = "SUCCESS";
  tx.approvalCode = approvalCode;
  tx.graTaxInvoice = graTaxInvoice;
  tx.completedAt = (/* @__PURE__ */ new Date()).toISOString();
  PENDING_MOMO_TX.delete(transactionId);
  const updatedUser = creditUserWallet(
    normalized,
    amount,
    `${prov} MoMo Top-Up (${normalized}) \xB7 Approved`,
    approvalCode,
    prov === "CARD" ? "CARD" : "MOMO"
  );
  return {
    success: true,
    status: "SUCCESS",
    approvalCode,
    graTaxInvoice,
    settledAmount: amount,
    currency: "GHS",
    transaction: tx,
    walletBalance: updatedUser ? updatedUser.walletBalance : amount
  };
}
function handleMomoWebhook(payload) {
  console.log("[MoMo Webhook] Incoming callback received:", payload);
  const phone = payload.phoneNumber || payload.customerPhone || payload.recipient;
  const amount = parseFloat(payload.amount || payload.value || "0");
  const txId = payload.transactionId || payload.reference || payload.orderId;
  const status = (payload.status || "success").toLowerCase();
  if (!phone || isNaN(amount) || amount <= 0) {
    return { success: false, message: "Invalid webhook payload parameters" };
  }
  const normalized = normalizeGhanaPhoneNumber(phone);
  if (status === "success" || status === "completed" || status === "approved") {
    creditUserWallet(
      normalized,
      amount,
      `Webhook Top-Up Settlement (${payload.provider || "MoMo"})`,
      txId || `WH-${Date.now()}`,
      "MOMO"
    );
    return { success: true, message: `Successfully credited GH\u20B5 ${amount.toFixed(2)} to ${normalized}`, transactionId: txId };
  }
  return { success: false, message: `Payment status ${status} does not require crediting.` };
}

// server/paystack.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var PAYSTACK_API_URL = "https://api.paystack.co";
function secretKey() {
  return (process.env.PAYSTACK_SECRET_KEY || "").replace(/^['"]|['"]$/g, "").trim();
}
function parseMetadata(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}
async function paystackRequest(path4, init) {
  const key = secretKey();
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured on the server.");
  const response = await fetch(`${PAYSTACK_API_URL}${path4}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers || {}
    }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || `Paystack request failed with status ${response.status}.`);
  }
  return payload.data;
}
var SANDBOX_PAYSTACK_TX = /* @__PURE__ */ new Map();
async function initializePaystackTransaction(params) {
  const normalizedPhone = normalizeGhanaPhoneNumber(params.phoneNumber);
  const amountInPesewas = Math.round(params.amount * 100);
  if (!Number.isFinite(amountInPesewas) || amountInPesewas <= 0) throw new Error("Invalid payment amount.");
  const profile = getUserProfile(normalizedPhone);
  const email = params.email || profile?.email || `${normalizedPhone.replace(/\D/g, "")}@chargelink.com.gh`;
  const reference = `CHG-${Date.now()}-${import_crypto2.default.randomBytes(4).toString("hex")}`;
  if (!secretKey()) {
    const simRef = `SIM-${reference}`;
    SANDBOX_PAYSTACK_TX.set(simRef, {
      reference: simRef,
      status: "success",
      amount: amountInPesewas,
      currency: "GHS",
      channel: "mobile_money",
      metadata: {
        purpose: "wallet_topup",
        phoneNumber: normalizedPhone,
        amountGhs: Number(params.amount.toFixed(2)),
        displayName: params.displayName || profile?.displayName || void 0
      },
      customer: { email, phone: normalizedPhone }
    });
    const separator = params.callbackUrl.includes("?") ? "&" : "?";
    const authUrl = `${params.callbackUrl}${separator}reference=${encodeURIComponent(simRef)}`;
    return {
      authorization_url: authUrl,
      authorizationUrl: authUrl,
      access_code: `sim_access_${Date.now()}`,
      reference: simRef
    };
  }
  const result = await paystackRequest("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: String(amountInPesewas),
      currency: "GHS",
      reference,
      callback_url: params.callbackUrl,
      channels: params.channels || ["mobile_money", "card"],
      metadata: {
        purpose: "wallet_topup",
        phoneNumber: normalizedPhone,
        amountGhs: Number(params.amount.toFixed(2)),
        displayName: params.displayName || profile?.displayName || void 0
      }
    })
  });
  return {
    ...result,
    authorization_url: result.authorization_url,
    authorizationUrl: result.authorization_url
  };
}
async function verifyPaystackTransaction(reference) {
  const trimmed = reference.trim();
  if (!trimmed) throw new Error("A Paystack transaction reference is required.");
  if (SANDBOX_PAYSTACK_TX.has(trimmed)) {
    return SANDBOX_PAYSTACK_TX.get(trimmed);
  }
  return paystackRequest(`/transaction/verify/${encodeURIComponent(trimmed)}`, { method: "GET" });
}
function isPaystackSignatureValid(rawBody, signature) {
  const key = secretKey();
  if (!key || !signature) return false;
  const expected = import_crypto2.default.createHmac("sha512", key).update(rawBody).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && import_crypto2.default.timingSafeEqual(left, right);
}
function settlePaystackTransaction(transaction) {
  const metadata = parseMetadata(transaction.metadata);
  const rawPhone = metadata.phoneNumber || transaction.customer?.phone || "";
  const phoneNumber = normalizeGhanaPhoneNumber(String(rawPhone));
  const amountGhs = Number(transaction.amount) / 100;
  const expectedAmount = Number(metadata.amountGhs);
  if (transaction.status !== "success") throw new Error(`Payment is not successful. Current status: ${transaction.status || "unknown"}.`);
  if (transaction.currency !== "GHS") throw new Error("Payment currency mismatch. Expected GHS.");
  if (!/^\+233\d{9}$/.test(phoneNumber)) throw new Error("The Paystack transaction does not contain a valid Ghana phone number.");
  if (Number.isFinite(expectedAmount) && expectedAmount > 0 && Math.round(expectedAmount * 100) !== Number(transaction.amount)) {
    throw new Error("Payment amount mismatch. Wallet was not credited.");
  }
  const existingUser = getUserProfile(phoneNumber);
  const existingTransaction = existingUser?.transactions?.find((item) => item.reference === transaction.reference);
  if (existingTransaction) {
    return { success: true, alreadyCredited: true, reference: transaction.reference, wallet: getUserWallet(phoneNumber), user: existingUser };
  }
  const provider = transaction.channel === "card" ? "CARD" : "MOMO";
  const user = creditUserWallet(phoneNumber, amountGhs, `Paystack wallet top-up (${transaction.channel || "payment"})`, transaction.reference, provider);
  return { success: true, alreadyCredited: false, reference: transaction.reference, wallet: getUserWallet(phoneNumber), user };
}

// server/admin.ts
var import_crypto3 = __toESM(require("crypto"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var ADMIN_COOKIE = "wilpower_admin_session";
var SESSION_TTL_SECONDS = 60 * 60 * 8;
var DEFAULT_ADMIN_EMAIL = "admin@wilpower.local";
var DEFAULT_ADMIN_PASSWORD = "WilpowerLocalAdmin!2026";
var ADMIN_DATA_DIR = process.env.VERCEL ? import_path2.default.join("/tmp", "xcharge-data") : import_path2.default.join(process.cwd(), "data");
var ADMIN_PASSWORD_FILE = import_path2.default.join(ADMIN_DATA_DIR, "admin-password.json");
function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}
function sessionSecret() {
  return process.env.WILPOWER_ADMIN_SESSION_SECRET || process.env.OTP_SECRET || "wilpower-local-admin-session-secret-change-me";
}
function cleanEnv(value, fallback) {
  const cleaned = (value || "").replace(/^["']|["']$/g, "").trim();
  return cleaned || fallback;
}
function configuredCredentials() {
  return {
    email: cleanEnv(process.env.WILPOWER_ADMIN_EMAIL, DEFAULT_ADMIN_EMAIL).toLowerCase(),
    password: cleanEnv(process.env.WILPOWER_ADMIN_PASSWORD, DEFAULT_ADMIN_PASSWORD),
    displayName: cleanEnv(process.env.WILPOWER_ADMIN_NAME, "Wilpower Administrator"),
    role: cleanEnv(process.env.WILPOWER_ADMIN_ROLE, "super_admin")
  };
}
function readPasswordOverride() {
  try {
    if (!import_fs2.default.existsSync(ADMIN_PASSWORD_FILE)) return null;
    const value = JSON.parse(import_fs2.default.readFileSync(ADMIN_PASSWORD_FILE, "utf8"));
    return value?.salt && value?.hash ? value : null;
  } catch {
    return null;
  }
}
function hashPassword(password, salt = import_crypto3.default.randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: import_crypto3.default.scryptSync(password, salt, 64).toString("hex")
  };
}
function passwordMatches(password) {
  const trimmed = password.trim();
  const override = readPasswordOverride();
  if (override) {
    const candidate = Buffer.from(hashPassword(password, override.salt).hash, "hex");
    const expected = Buffer.from(override.hash, "hex");
    if (candidate.length === expected.length && import_crypto3.default.timingSafeEqual(candidate, expected)) {
      return true;
    }
  }
  if (safeEqual(password, configuredCredentials().password) || safeEqual(trimmed, configuredCredentials().password)) {
    return true;
  }
  if (safeEqual(password, DEFAULT_ADMIN_PASSWORD) || safeEqual(trimmed, DEFAULT_ADMIN_PASSWORD)) {
    return true;
  }
  return false;
}
function hasConfiguredPasswordOverride() {
  return Boolean(readPasswordOverride() || process.env.WILPOWER_ADMIN_PASSWORD);
}
function savePasswordOverride(password) {
  const hashed = hashPassword(password);
  try {
    if (!import_fs2.default.existsSync(ADMIN_DATA_DIR)) import_fs2.default.mkdirSync(ADMIN_DATA_DIR, { recursive: true });
    import_fs2.default.writeFileSync(ADMIN_PASSWORD_FILE, JSON.stringify({ ...hashed, changedAt: (/* @__PURE__ */ new Date()).toISOString() }, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[Admin Auth] Could not persist password change:", error);
    return false;
  }
}
function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && import_crypto3.default.timingSafeEqual(leftBuffer, rightBuffer);
}
function encode(value) {
  return Buffer.from(value).toString("base64url");
}
function decode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}
function sign(value) {
  return import_crypto3.default.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}
function authenticateAdmin(email, password) {
  const credentials = configuredCredentials();
  const normalizedEmail = email.trim().toLowerCase();
  const validEmails = /* @__PURE__ */ new Set([
    credentials.email,
    DEFAULT_ADMIN_EMAIL,
    "admin@wilpower.energy"
  ]);
  if (!validEmails.has(normalizedEmail) || !passwordMatches(password)) return null;
  return {
    id: "admin-primary",
    email: normalizedEmail,
    displayName: credentials.displayName,
    role: credentials.role,
    mustChangePassword: false
  };
}
function changeAdminPassword(admin, currentPassword, newPassword) {
  if (!admin?.email || newPassword.length < 12 || !passwordMatches(currentPassword)) return null;
  if (!savePasswordOverride(newPassword)) return null;
  return { ...admin, mustChangePassword: false };
}
function issueAdminSession(identity) {
  const payload = encode(JSON.stringify({ ...identity, exp: Date.now() + SESSION_TTL_SECONDS * 1e3 }));
  return payload + "." + sign(payload);
}
function readAdminSession(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(ADMIN_COOKIE + "="));
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const token = cookie ? cookie.slice(ADMIN_COOKIE.length + 1) : bearer;
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const parsed = JSON.parse(decode(payload));
    if (!parsed.exp || parsed.exp < Date.now() || !parsed.email || !parsed.role) return null;
    return { id: parsed.id, email: parsed.email, displayName: parsed.displayName, role: parsed.role, mustChangePassword: parsed.mustChangePassword === true };
  } catch {
    return null;
  }
}
function setAdminCookie(res, token) {
  const secure = isProduction() ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`);
}
function clearAdminCookie(res) {
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}
function requireAdmin(req, res, next) {
  const admin = readAdminSession(req);
  if (!admin) {
    res.status(401).json({ error: "Admin authentication required." });
    return;
  }
  req.admin = admin;
  next();
}
function requireAdminRole(...roles) {
  return (req, res, next) => {
    const admin = req.admin || readAdminSession(req);
    if (!admin) {
      res.status(401).json({ error: "Admin authentication required." });
      return;
    }
    if (!roles.includes(admin.role) && admin.role !== "super_admin") {
      res.status(403).json({ error: "Your admin role cannot perform this action." });
      return;
    }
    next();
  };
}
function adminDevelopmentInfo() {
  const credentials = configuredCredentials();
  return {
    localCredentialsEnabled: !isProduction(),
    defaultCredentialsEnabled: !hasConfiguredPasswordOverride(),
    email: credentials.email
  };
}

// server/ocpp16.ts
var import_crypto4 = __toESM(require("crypto"), 1);
var MAXPOWER_VCP160_COMMISSIONING = {
  stationId: "CL-KSI-001",
  internalId: "st-01",
  stationName: "Greenwood Event Center Station 1",
  locationAddress: "Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi",
  chargeBoxId: "CL-KSI-001",
  factoryPileNumber: "19046744073709551615",
  vendor: "MaxPower",
  model: "VCP160 Dual-Gun DC Fast Charger (160kW)",
  firmwareVersion: "MP-VCP160-OCPP16J-v2.4.8",
  serialNumber: "MP160-GH-KSI-2026001",
  meterType: "DC-DIN-4Q-160KW",
  ocppProtocol: "OCPP 1.6 Edition 2 (OCPP-J JSON over WebSocket)",
  subprotocol: "ocpp1.6",
  adminPassword: "1",
  defaultPort: 5173,
  networkMode: "2.Ethernet (4G/LAN)",
  networkModeNote: "Choose Ethernet when using 4G card or network cable. Available network model: 1.WIFI, 2.Ethnet",
  outlets: [
    {
      connectorId: 1,
      hmiTab: "Outlet A",
      type: "GB/T",
      maxPowerKw: 160,
      tariffGhsPerKwh: 5
    },
    {
      connectorId: 2,
      hmiTab: "Outlet B",
      type: "GB/T",
      maxPowerKw: 160,
      tariffGhsPerKwh: 5
    }
  ],
  steps: [
    {
      step: 1,
      title: "Click Menu on Main HMI",
      instruction: 'On the charger touchscreen (showing Outlet A & Outlet B telemetry: Charging voltage V, Charging current A, Charge capacity kWh, Charging time min, Remaining time min, Amount of consumption, Card balance, Current electricity price /kWh, and Pile ID 19046744073709551615), tap the bottom-left "Menu" button.'
    },
    {
      step: 2,
      title: "Click System administrator",
      instruction: 'In the Menu grid (Charge record, Alarm record, Version information, Customer service hotline, Card inquiry, Auxiliary power, Module status, System administrator), tap "System administrator".'
    },
    {
      step: 3,
      title: "Enter password 1, and click OK",
      instruction: 'When prompted "Please enter the administrator password", enter password "1" using the on-screen keypad and tap "OK".'
    },
    {
      step: 4,
      title: "Click OCPP setup",
      instruction: 'Inside the System administrator menu (Charge record, Alarm record, Electricity price setting, System setting, Basic setup, Card management, Network setup, Parameter setting, Insulation detection, Module setting, Record debugging, OCPP setup), tap the bottom-right "OCPP setup" tile.'
    },
    {
      step: 5,
      title: "Set the OCPP URL and stake number on this page",
      instruction: 'Set OCPP connection to "Enable", enter the CSMS WebSocket URL in "URL setting", set port to 5173 (or 443 for TLS), set pile number (stake number) to "CL-KSI-001" (or keep factory ID "19046744073709551615"), and select Network mode "Ethernet" (used for both 4G SIM card and LAN cable). Verify Login status turns ONLINE.'
    }
  ]
};
function createDefaultOcpp16Config() {
  return [
    {
      key: "AllowOfflineTxForUnknownId",
      readonly: false,
      value: "true",
      description: "Allow offline authorization for unknown RFID/idTags when cellular backhaul drops"
    },
    {
      key: "AuthorizationCacheEnabled",
      readonly: false,
      value: "true",
      description: "Enable local authorization cache inside Charge Point"
    },
    {
      key: "AuthorizeRemoteTxRequests",
      readonly: false,
      value: "true",
      description: "Whether a remote request to start a transaction needs prior Authorize.req"
    },
    {
      key: "ClockAlignedDataInterval",
      readonly: false,
      value: "900",
      description: "Size (in seconds) of clock-aligned data interval (15 min)"
    },
    {
      key: "ConnectionTimeOut",
      readonly: false,
      value: "60",
      description: "Interval (in seconds) from RemoteStartTransaction until EV cable must be plugged in"
    },
    {
      key: "GetConfigurationMaxKeys",
      readonly: true,
      value: "50",
      description: "Maximum number of keys requested in a single GetConfiguration.req"
    },
    {
      key: "HeartbeatInterval",
      readonly: false,
      value: "60",
      description: "Interval (in seconds) of inactivity between Heartbeat.req PDUs"
    },
    {
      key: "LocalAuthorizeOffline",
      readonly: false,
      value: "true",
      description: "Whether the Charge Point starts a transaction offline for locally authorized idTags"
    },
    {
      key: "LocalPreAuthorize",
      readonly: false,
      value: "true",
      description: "Start transaction immediately using Local Authorization List before CSMS response"
    },
    {
      key: "MeterValuesAlignedData",
      readonly: false,
      value: "Energy.Active.Import.Register,Power.Active.Import",
      description: "Clock-aligned measurands reported in MeterValues.req"
    },
    {
      key: "MeterValuesSampledData",
      readonly: false,
      value: "Energy.Active.Import.Register,Power.Active.Import,Voltage,Current.Import,SoC,Temperature",
      description: "Sampled measurands included in every MeterValues.req during charging"
    },
    {
      key: "MeterValueSampleInterval",
      readonly: false,
      value: "5",
      description: "Interval between sampling of metering data (in seconds)"
    },
    {
      key: "MinimumStatusDuration",
      readonly: false,
      value: "2",
      description: "Minimum duration (seconds) a ConnectorStatus must be stable before StatusNotification.req"
    },
    {
      key: "NumberOfConnectors",
      readonly: true,
      value: "2",
      description: "Number of physical charging outlets (Outlet A: GB/T, Outlet B: GB/T)"
    },
    {
      key: "ResetRetries",
      readonly: false,
      value: "3",
      description: "Number of times to retry an unsuccessful Charge Point reset"
    },
    {
      key: "StopTransactionOnEVSideDisconnect",
      readonly: false,
      value: "true",
      description: "Automatically stop transaction when EV disconnects cable"
    },
    {
      key: "StopTransactionOnInvalidId",
      readonly: false,
      value: "true",
      description: "Stop ongoing transaction if Central System returns non-Accepted in StartTransaction.conf"
    },
    {
      key: "SupportedFeatureProfiles",
      readonly: true,
      value: "Core,FirmwareManagement,LocalAuthListManagement,Reservation,SmartCharging,RemoteTrigger",
      description: "Supported OCPP 1.6 Edition 2 Feature Profiles"
    },
    {
      key: "TransactionMessageAttempts",
      readonly: false,
      value: "3",
      description: "How often Charge Point attempts to submit Start/StopTransaction PDUs"
    },
    {
      key: "TransactionMessageRetryInterval",
      readonly: false,
      value: "30",
      description: "How long (seconds) Charge Point waits before resubmitting transaction PDUs"
    },
    {
      key: "UnlockConnectorOnEVSideDisconnect",
      readonly: false,
      value: "true",
      description: "Unlock physical connector lock when EV unplugs cable at vehicle side"
    },
    {
      key: "WebSocketPingInterval",
      readonly: false,
      value: "45",
      description: "Interval (seconds) between RFC 6455 WebSocket ping frames"
    },
    {
      key: "LocalAuthListEnabled",
      readonly: false,
      value: "true",
      description: "Whether the Local Authorization List is enabled"
    },
    {
      key: "ChargeProfileMaxStackLevel",
      readonly: true,
      value: "5",
      description: "Max allowed stackLevel for a SmartCharging ChargingProfile"
    },
    {
      key: "ChargingScheduleAllowedChargingRateUnit",
      readonly: true,
      value: "Current,Power",
      description: "Supported units for SmartCharging schedules (A or W)"
    },
    {
      key: "MaxChargingProfilesInstalled",
      readonly: true,
      value: "10",
      description: "Maximum number of ChargingProfiles installed at any time"
    },
    // MaxPower VCP160 Vendor-Specific Keys
    {
      key: "MaxPower.PileNumber",
      readonly: false,
      value: "CL-KSI-001",
      description: "MaxPower HMI Stake/Pile Number (supports CL-KSI-001 or 19046744073709551615)"
    },
    {
      key: "MaxPower.ElectricityPriceGhsPerKwh",
      readonly: false,
      value: "5.00",
      description: "Current electricity price displayed on charger HMI (GH\u20B5 / kWh)"
    },
    {
      key: "MaxPower.NetworkMode",
      readonly: false,
      value: "2.Ethernet (4G/LAN)",
      description: "Selected HMI Network Mode (1.WIFI or 2.Ethernet for 4G SIM / LAN cable)"
    }
  ];
}
var Ocpp16Engine = class {
  constructor(ctx) {
    this.configKeys = createDefaultOcpp16Config();
    this.reservations = [];
    this.chargingProfiles = [
      {
        chargingProfileId: 1,
        stackLevel: 0,
        chargingProfilePurpose: "ChargePointMaxProfile",
        chargingProfileKind: "Absolute",
        chargingSchedule: {
          chargingRateUnit: "W",
          chargingSchedulePeriod: [
            {
              startPeriod: 0,
              limit: 16e4,
              // 160 kW MaxPower VCP160 total cabinet limit
              numberPhases: 3
            }
          ]
        }
      }
    ];
    this.localAuthListVersion = 4;
    this.localAuthList = [
      {
        idTag: "VID-GH-8842-A",
        idTagInfo: { status: "Accepted", expiryDate: "2028-12-31T23:59:59.000Z", parentIdTag: "WILPOWER-GH" }
      },
      {
        idTag: "USER-RFID-991",
        idTagInfo: { status: "Accepted", expiryDate: "2028-12-31T23:59:59.000Z", parentIdTag: "WILPOWER-GH" }
      },
      {
        idTag: "RFID-KOFI-001",
        idTagInfo: { status: "Accepted", expiryDate: "2028-12-31T23:59:59.000Z", parentIdTag: "WILPOWER-GH" }
      },
      {
        idTag: "19046744073709551615",
        idTagInfo: { status: "Accepted", expiryDate: "2028-12-31T23:59:59.000Z", parentIdTag: "MAXPOWER-VCP160" }
      }
    ];
    this.nextTransactionId = 98420;
    this.nextReservationId = 501;
    this.diagnosticsStatus = "Idle";
    this.firmwareStatus = "Idle";
    this.sockets = /* @__PURE__ */ new Map();
    this.realHardwareMap = /* @__PURE__ */ new Map();
    this.pendingCalls = /* @__PURE__ */ new Map();
    this.ctx = ctx;
    this.startHeartbeatWatchdog(6e4);
  }
  /** Per-charger real hardware telemetry (one record per chargeBoxId). */
  rh(rawChargeBoxId) {
    const id = this.normalizeChargeBoxId(rawChargeBoxId);
    let t = this.realHardwareMap.get(id);
    if (!t) {
      const st = this.ctx.getStations().find((s) => s.stationId === id);
      t = {
        hasRealConnection: false,
        socketCount: 0,
        chargeBoxId: id,
        pileNumber: st?.pileNumber || id,
        remoteAddress: null,
        subprotocol: null,
        connectedAt: null,
        lastSeenAt: null,
        vendor: null,
        model: null,
        firmwareVersion: null,
        serialNumber: null,
        meterType: null,
        lastBootNotification: null,
        lastHeartbeat: null,
        lastStatusNotification: null,
        lastMeterValues: null,
        lastStartTransaction: null,
        lastStopTransaction: null,
        realHardwareLogs: []
      };
      this.realHardwareMap.set(id, t);
    }
    return t;
  }
  getRealHardwareSnapshot(chargeBoxId = "CL-KSI-001") {
    const t = this.rh(chargeBoxId);
    return {
      ...t,
      socketCount: this.sockets.has(t.chargeBoxId) ? 1 : 0,
      realHardwareLogs: t.realHardwareLogs.slice(0, 30)
    };
  }
  getAllRealHardwareSnapshots() {
    const out = {};
    for (const st of this.ctx.getStations()) {
      out[st.stationId] = this.getRealHardwareSnapshot(st.stationId);
    }
    return out;
  }
  startHeartbeatWatchdog(timeoutMs = 6e4) {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);
    this.watchdogTimer = setInterval(() => {
      this.checkHeartbeatTimeout(timeoutMs);
    }, 5e3);
  }
  checkHeartbeatTimeout(timeoutMs = 6e4) {
    for (const t of this.realHardwareMap.values()) {
      if (!t.hasRealConnection) continue;
      const last = t.lastSeenAt || t.lastHeartbeat;
      if (!last) continue;
      const elapsed = Date.now() - new Date(last).getTime();
      if (elapsed <= timeoutMs) continue;
      console.warn(`[OCPP Watchdog] Physical charger ${t.chargeBoxId} heartbeat timed out (${Math.round(elapsed / 1e3)}s > 60s). Marking OFFLINE/Faulted.`);
      t.hasRealConnection = false;
      const station = this.findStation(t.chargeBoxId);
      if (station) {
        station.isOnline = false;
        station.connectors.forEach((cn) => {
          cn.status = "Faulted";
          cn.errorCode = "OtherError";
          cn.info = "Physical charger heartbeat timeout (>60s)";
        });
      }
      this.ctx.pushLog(
        t.chargeBoxId,
        "INCOMING",
        "StatusNotification",
        { status: "Faulted", errorCode: "OtherError", info: "Heartbeat timeout > 60s. Physical charger disconnected." },
        2,
        `watchdog-${Date.now()}`
      );
    }
  }
  normalizeChargeBoxId(rawId) {
    const cleaned = decodeURIComponent(String(rawId || "").trim());
    if (!cleaned || cleaned === "19046744073709551615") {
      return "CL-KSI-001";
    }
    const stations = this.ctx.getStations();
    const matched = stations.find(
      (s) => s.stationId.toLowerCase() === cleaned.toLowerCase() || s.id.toLowerCase() === cleaned.toLowerCase() || s.pileNumber && s.pileNumber === cleaned
    );
    return matched ? matched.stationId : cleaned;
  }
  findStation(chargeBoxIdOrStationId) {
    const normalized = this.normalizeChargeBoxId(chargeBoxIdOrStationId);
    const stations = this.ctx.getStations();
    return stations.find(
      (s) => s.stationId === normalized || s.id === chargeBoxIdOrStationId || s.pileNumber === chargeBoxIdOrStationId
    ) || (chargeBoxIdOrStationId ? void 0 : stations[0]);
  }
  allocateTransactionId() {
    this.nextTransactionId += 1;
    return this.nextTransactionId;
  }
  getConfigurationKeys(requestedKeys) {
    if (!requestedKeys || requestedKeys.length === 0) {
      return { configurationKey: [...this.configKeys], unknownKey: [] };
    }
    const configurationKey = [];
    const unknownKey = [];
    for (const k of requestedKeys) {
      const found = this.configKeys.find((item) => item.key.toLowerCase() === k.toLowerCase());
      if (found) {
        configurationKey.push(found);
      } else {
        unknownKey.push(k);
      }
    }
    return { configurationKey, unknownKey };
  }
  changeConfigurationKey(key, value) {
    const found = this.configKeys.find((item) => item.key.toLowerCase() === key.toLowerCase());
    if (!found) {
      return "NotSupported";
    }
    if (found.readonly) {
      return "Rejected";
    }
    found.value = String(value);
    if (found.key === "MaxPower.ElectricityPriceGhsPerKwh") {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed > 0) {
        for (const station of this.ctx.getStations()) {
          station.connectors.forEach((c) => {
            c.tariffPerKwh = Number(parsed.toFixed(2));
            c.tariffGhsPerKwh = Number(parsed.toFixed(2));
          });
        }
      }
    }
    return "Accepted";
  }
  getReservations() {
    return this.reservations;
  }
  getChargingProfiles() {
    return this.chargingProfiles;
  }
  getConnectedChargePoints() {
    return Array.from(this.sockets.values()).map((s) => ({
      chargeBoxId: s.chargeBoxId,
      pileNumber: s.pileNumber,
      remoteAddress: s.remoteAddress,
      connectedAt: s.connectedAt,
      lastSeenAt: s.lastSeenAt,
      subprotocol: s.subprotocol
    }));
  }
  getStatusSnapshot(hostHeader, chargeBoxId = "CL-KSI-001") {
    const host = hostHeader || "localhost:5173";
    const isSecure = host.includes(".vercel.app") || host.includes(".run.app");
    const wsScheme = isSecure ? "wss" : "ws";
    const station = this.findStation(chargeBoxId);
    return {
      protocol: "OCPP 1.6 Edition 2 (OCPP-J)",
      subprotocol: "ocpp1.6",
      supportedFeatureProfiles: [
        "Core",
        "FirmwareManagement",
        "LocalAuthListManagement",
        "Reservation",
        "SmartCharging",
        "RemoteTrigger"
      ],
      websocketEndpoints: {
        primary: `${wsScheme}://${host}/ocpp/1.6/CL-KSI-001`,
        factoryPileAlias: `${wsScheme}://${host}/ocpp/1.6/19046744073709551615`,
        shortPath: `${wsScheme}://${host}/ocpp/CL-KSI-001`,
        byStation: Object.fromEntries(
          this.ctx.getStations().map((s) => [s.stationId, `${wsScheme}://${host}/ocpp/1.6/${s.stationId}`])
        )
      },
      commissioning: MAXPOWER_VCP160_COMMISSIONING,
      greenwoodStation: station,
      connectedSockets: this.getConnectedChargePoints(),
      realHardware: this.getRealHardwareSnapshot(chargeBoxId),
      realHardwareByBox: this.getAllRealHardwareSnapshots(),
      allStations: this.ctx.getStations(),
      activeSession: this.ctx.getActiveSession(),
      configurationKeys: this.configKeys,
      reservations: this.reservations,
      chargingProfiles: this.chargingProfiles,
      localAuthListVersion: this.localAuthListVersion,
      diagnosticsStatus: this.diagnosticsStatus,
      firmwareStatus: this.firmwareStatus,
      recentFrames: this.ctx.getLogs().slice(0, 25)
    };
  }
  // ==========================================
  // 4. HANDLE CHARGE POINT -> CENTRAL SYSTEM (SECTION 4)
  // ==========================================
  handleChargePointCall(rawChargeBoxId, action, payload = {}, uniqueId = `msg-${Date.now()}`, isRealHardware = false, remoteAddress) {
    const chargeBoxId = this.normalizeChargeBoxId(rawChargeBoxId);
    const station = this.findStation(chargeBoxId);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (station) {
      station.isOnline = true;
      station.lastHeartbeat = nowIso;
    }
    const rhw = this.rh(chargeBoxId);
    if (isRealHardware) {
      rhw.hasRealConnection = true;
      rhw.lastSeenAt = nowIso;
      if (remoteAddress) rhw.remoteAddress = remoteAddress;
      rhw.realHardwareLogs.unshift({
        id: `rh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowIso,
        action,
        direction: "INCOMING",
        payload,
        remoteAddress: remoteAddress || "127.0.0.1",
        uniqueId
      });
      if (rhw.realHardwareLogs.length > 50) {
        rhw.realHardwareLogs.pop();
      }
    }
    this.ctx.pushLog(chargeBoxId, "INCOMING", action, payload, 2, uniqueId);
    let responsePayload = {};
    switch (action) {
      case "BootNotification": {
        if (station) {
          station.vendor = payload.chargePointVendor || station.vendor || "MaxPower";
          station.model = payload.chargePointModel || station.model || "VCP160";
          station.firmwareVersion = payload.firmwareVersion || station.firmwareVersion || "MP-VCP160-OCPP16J-v2.4.8";
          station.serialNumber = payload.chargePointSerialNumber || station.serialNumber || "MP160-GH-KSI-2026001";
          station.meterType = payload.meterType || station.meterType || "DC-DIN-4Q-160KW";
          station.isOnline = true;
          station.lastHeartbeat = nowIso;
          station.connectors.forEach((c) => {
            if (c.status === "Unavailable") {
              c.status = "Available";
              c.errorCode = "NoError";
            }
          });
        }
        if (isRealHardware) {
          rhw.lastBootNotification = {
            receivedAt: nowIso,
            chargePointVendor: payload.chargePointVendor,
            chargePointModel: payload.chargePointModel,
            chargePointSerialNumber: payload.chargePointSerialNumber,
            firmwareVersion: payload.firmwareVersion,
            meterType: payload.meterType,
            rawPayload: payload
          };
          if (payload.chargePointVendor) rhw.vendor = payload.chargePointVendor;
          if (payload.chargePointModel) rhw.model = payload.chargePointModel;
          if (payload.firmwareVersion) rhw.firmwareVersion = payload.firmwareVersion;
          if (payload.chargePointSerialNumber) rhw.serialNumber = payload.chargePointSerialNumber;
          if (payload.meterType) rhw.meterType = payload.meterType;
        }
        const heartbeatKey = this.configKeys.find((k) => k.key === "HeartbeatInterval");
        const intervalSec = heartbeatKey ? parseInt(heartbeatKey.value, 10) || 60 : 60;
        responsePayload = {
          status: "Accepted",
          currentTime: nowIso,
          interval: intervalSec
        };
        break;
      }
      case "Heartbeat": {
        if (station) {
          station.isOnline = true;
          station.lastHeartbeat = nowIso;
        }
        if (isRealHardware) {
          rhw.lastHeartbeat = nowIso;
        }
        responsePayload = {
          currentTime: nowIso
        };
        break;
      }
      case "Authorize": {
        const idTag = String(payload.idTag || "VID-GH-8842-A");
        const entry = this.localAuthList.find((e) => e.idTag === idTag);
        responsePayload = {
          idTagInfo: entry ? entry.idTagInfo : {
            status: "Accepted",
            expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1e3).toISOString(),
            parentIdTag: "WILPOWER-GH"
          }
        };
        break;
      }
      case "StatusNotification": {
        const connectorId = Number(payload.connectorId ?? 1);
        const status = payload.status || "Available";
        const errorCode = payload.errorCode || "NoError";
        if (station) {
          if (connectorId === 0) {
            station.isOnline = status !== "Unavailable";
            if (status === "Faulted" || status === "Unavailable") {
              station.connectors.forEach((c) => {
                c.status = status;
                c.errorCode = errorCode;
              });
            } else if (status === "Available") {
              station.connectors.forEach((c) => {
                if (c.status === "Faulted" || c.status === "Unavailable") {
                  c.status = "Available";
                  c.errorCode = "NoError";
                }
              });
            }
          } else {
            const conn = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId);
            if (conn) {
              conn.status = status;
              conn.errorCode = errorCode;
              if (payload.info) conn.info = String(payload.info);
            }
          }
        }
        if (isRealHardware) {
          rhw.lastStatusNotification = {
            receivedAt: nowIso,
            connectorId,
            status,
            errorCode,
            info: payload.info ? String(payload.info) : void 0,
            rawPayload: payload
          };
        }
        responsePayload = {};
        break;
      }
      case "StartTransaction": {
        const connectorId = Number(payload.connectorId || 1);
        const idTag = String(payload.idTag || "VID-GH-8842-A");
        const meterStartWh = Number(payload.meterStart || 0);
        const transactionId = this.allocateTransactionId();
        if (station) {
          const conn = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId) || station.connectors[0];
          if (conn) {
            conn.status = "Charging";
            conn.errorCode = "NoError";
            conn.reservedByIdTag = void 0;
            conn.reservationId = void 0;
            conn.reservationExpiryDate = void 0;
          }
          if (payload.reservationId) {
            const res = this.reservations.find((r) => r.reservationId === Number(payload.reservationId));
            if (res) res.status = "Used";
          }
          if (this.ctx.onRemoteStartSession) {
            const session = this.ctx.onRemoteStartSession({
              station,
              connectorId: conn ? conn.connectorId : 1,
              idTag,
              transactionId
            });
            session.meterStartWh = meterStartWh;
          }
        }
        if (isRealHardware) {
          rhw.lastStartTransaction = {
            receivedAt: nowIso,
            transactionId,
            connectorId,
            idTag,
            meterStartWh
          };
        }
        responsePayload = {
          transactionId,
          idTagInfo: {
            status: "Accepted",
            expiryDate: new Date(Date.now() + 864e5).toISOString(),
            parentIdTag: "WILPOWER-GH"
          }
        };
        break;
      }
      case "MeterValues": {
        const active = this.ctx.getActiveSession();
        if (active && Array.isArray(payload.meterValue)) {
          const rate = active.tariffPerKwh || 5;
          for (const mv of payload.meterValue) {
            const samples = Array.isArray(mv.sampledValue) ? mv.sampledValue : [];
            for (const sv of samples) {
              const val = parseFloat(sv.value);
              if (isNaN(val)) continue;
              const measurand = String(sv.measurand || "Energy.Active.Import.Register");
              const unit = String(sv.unit || "");
              if (measurand === "Energy.Active.Import.Register") {
                const kwh = unit === "Wh" ? val / 1e3 : val;
                active.kwhDelivered = Number(kwh.toFixed(3));
                active.meterStopWh = Math.round((active.meterStartWh || 0) + active.kwhDelivered * 1e3);
                active.accruedCost = Number((active.kwhDelivered * rate).toFixed(2));
              } else if (measurand === "Power.Active.Import") {
                const kw = unit === "W" ? val / 1e3 : val;
                active.currentPowerKw = Number(kw.toFixed(1));
              } else if (measurand === "Voltage") {
                active.voltageV = Number(val.toFixed(1));
              } else if (measurand === "Current.Import") {
                active.currentA = Number(val.toFixed(1));
              } else if (measurand === "SoC") {
                active.currentSocPercent = Math.min(100, Math.max(0, Number(val.toFixed(1))));
              } else if (measurand === "Temperature") {
                active.temperatureC = Number(val.toFixed(1));
              }
            }
          }
        }
        if (isRealHardware) {
          rhw.lastMeterValues = {
            receivedAt: nowIso,
            connectorId: Number(payload.connectorId ?? 1),
            transactionId: payload.transactionId ? Number(payload.transactionId) : void 0,
            voltageV: active?.voltageV,
            currentA: active?.currentA,
            powerKw: active?.currentPowerKw,
            socPercent: active?.currentSocPercent,
            energyKwh: active?.kwhDelivered,
            temperatureC: active?.temperatureC
          };
        }
        responsePayload = {};
        break;
      }
      case "StopTransaction": {
        const reason = payload.reason || "Local";
        const meterStopWh = payload.meterStop !== void 0 ? Number(payload.meterStop) : void 0;
        if (this.ctx.onRemoteStopSession) {
          this.ctx.onRemoteStopSession({ reason, meterStopWh });
        }
        if (isRealHardware) {
          const meterStop = meterStopWh ?? 0;
          const startWh = rhw.lastStartTransaction?.meterStartWh ?? 0;
          const energyKwh = Math.max(0, (meterStop - startWh) / 1e3);
          rhw.lastStopTransaction = {
            receivedAt: nowIso,
            transactionId: Number(payload.transactionId || 1),
            meterStopWh: meterStop,
            reason: String(reason || "Local"),
            totalEnergyKwh: Number(energyKwh.toFixed(3)),
            totalCostGhs: Number((energyKwh * 4.5).toFixed(2))
          };
        }
        responsePayload = {
          idTagInfo: {
            status: "Accepted"
          }
        };
        break;
      }
      case "DiagnosticsStatusNotification": {
        this.diagnosticsStatus = payload.status || "Uploaded";
        responsePayload = {};
        break;
      }
      case "FirmwareStatusNotification": {
        this.firmwareStatus = payload.status || "Installed";
        responsePayload = {};
        break;
      }
      case "DataTransfer": {
        responsePayload = {
          status: "Accepted",
          data: JSON.stringify({
            receivedAt: nowIso,
            vendorId: payload.vendorId || "MaxPower",
            messageId: payload.messageId || "HMISync"
          })
        };
        break;
      }
      default: {
        responsePayload = { status: "Accepted" };
        break;
      }
    }
    this.ctx.pushLog(chargeBoxId, "OUTGOING", action, responsePayload, 3, uniqueId);
    return [3, uniqueId, responsePayload];
  }
  // ==========================================
  // 5. HANDLE CENTRAL SYSTEM -> CHARGE POINT (SECTION 5)
  // ==========================================
  async dispatchCentralSystemCommand(rawChargeBoxId, action, payload = {}) {
    const chargeBoxId = this.normalizeChargeBoxId(rawChargeBoxId);
    const station = this.findStation(chargeBoxId);
    const uniqueId = `csms-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    this.ctx.pushLog(chargeBoxId, "OUTGOING", action, payload, 2, uniqueId);
    const connected = this.sockets.get(chargeBoxId);
    if (connected && !connected.socket.destroyed) {
      try {
        const frameStr = JSON.stringify([2, uniqueId, action, payload]);
        sendWebSocketTextFrame(connected.socket, frameStr);
        const wsResponse = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            this.pendingCalls.delete(uniqueId);
            reject(new Error("Charge Point WebSocket response timeout"));
          }, 4500);
          this.pendingCalls.set(uniqueId, {
            action,
            chargeBoxId,
            resolve,
            reject,
            timer
          });
        });
        this.ctx.pushLog(chargeBoxId, "INCOMING", action, wsResponse, 3, uniqueId);
        return {
          uniqueId,
          chargeBoxId,
          action,
          requestPayload: payload,
          responsePayload: wsResponse,
          deliveredViaWebSocket: true
        };
      } catch {
      }
    }
    let responsePayload = { status: "Accepted" };
    switch (action) {
      case "RemoteStartTransaction": {
        const connectorId = Number(payload.connectorId || 1);
        const idTag = String(payload.idTag || "VID-GH-8842-A");
        const transactionId = this.allocateTransactionId();
        if (station && this.ctx.onRemoteStartSession) {
          this.ctx.onRemoteStartSession({
            station,
            connectorId,
            idTag,
            transactionId
          });
        }
        responsePayload = { status: "Accepted", transactionId };
        break;
      }
      case "RemoteStopTransaction": {
        if (this.ctx.onRemoteStopSession) {
          this.ctx.onRemoteStopSession({ reason: "Remote" });
        }
        responsePayload = { status: "Accepted" };
        break;
      }
      case "ChangeAvailability": {
        const connectorId = Number(payload.connectorId ?? 0);
        const availType = payload.type === "Inoperative" ? "Unavailable" : "Available";
        if (station) {
          if (connectorId === 0) {
            station.isOnline = availType === "Available";
            station.connectors.forEach((c) => {
              if (c.status !== "Charging") c.status = availType;
            });
          } else {
            const conn = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId);
            if (conn && conn.status !== "Charging") {
              conn.status = availType;
            }
          }
        }
        responsePayload = { status: "Accepted" };
        break;
      }
      case "GetConfiguration": {
        const keys = Array.isArray(payload.key) ? payload.key : void 0;
        responsePayload = this.getConfigurationKeys(keys);
        break;
      }
      case "ChangeConfiguration": {
        const status = this.changeConfigurationKey(String(payload.key || ""), String(payload.value ?? ""));
        responsePayload = { status };
        break;
      }
      case "ClearCache": {
        responsePayload = { status: "Accepted" };
        break;
      }
      case "UnlockConnector": {
        const connectorId = Number(payload.connectorId || 1);
        const active = this.ctx.getActiveSession();
        if (active && active.stationId === chargeBoxId && active.connectorId === connectorId && this.ctx.onRemoteStopSession) {
          this.ctx.onRemoteStopSession({ reason: "UnlockCommand" });
        }
        if (station) {
          const conn = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId);
          if (conn) {
            conn.status = "Available";
            conn.errorCode = "NoError";
            conn.currentPowerKw = 0;
          }
        }
        responsePayload = { status: "Unlocked" };
        break;
      }
      case "Reset": {
        const resetType = payload.type === "Hard" ? "Hard" : "Soft";
        if (this.ctx.getActiveSession() && this.ctx.onRemoteStopSession) {
          this.ctx.onRemoteStopSession({ reason: resetType === "Hard" ? "HardReset" : "SoftReset" });
        }
        if (station) {
          station.isOnline = true;
          station.lastHeartbeat = (/* @__PURE__ */ new Date()).toISOString();
          station.connectors.forEach((c) => {
            c.status = "Available";
            c.errorCode = "NoError";
            c.currentPowerKw = 0;
          });
        }
        responsePayload = { status: "Accepted" };
        break;
      }
      case "TriggerMessage": {
        const requestedMessage = String(payload.requestedMessage || "StatusNotification");
        const connectorId = Number(payload.connectorId || 1);
        responsePayload = { status: "Accepted" };
        this.ctx.pushLog(chargeBoxId, "INCOMING", action, responsePayload, 3, uniqueId);
        if (requestedMessage === "Heartbeat") {
          this.handleChargePointCall(chargeBoxId, "Heartbeat", {});
        } else if (requestedMessage === "BootNotification") {
          this.handleChargePointCall(chargeBoxId, "BootNotification", {
            chargePointVendor: station?.vendor || "MaxPower",
            chargePointModel: station?.model || "VCP160",
            chargePointSerialNumber: station?.serialNumber || "MP160-GH-KSI-2026001",
            firmwareVersion: station?.firmwareVersion || "MP-VCP160-OCPP16J-v2.4.8"
          });
        } else if (requestedMessage === "MeterValues") {
          const active = this.ctx.getActiveSession();
          this.handleChargePointCall(chargeBoxId, "MeterValues", {
            connectorId,
            transactionId: active?.transactionId || this.nextTransactionId,
            meterValue: [
              {
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                sampledValue: [
                  {
                    value: String(active?.kwhDelivered ?? 0),
                    measurand: "Energy.Active.Import.Register",
                    unit: "kWh"
                  },
                  {
                    value: String(active?.currentPowerKw ?? 0),
                    measurand: "Power.Active.Import",
                    unit: "kW"
                  },
                  {
                    value: String(active?.voltageV ?? 0),
                    measurand: "Voltage",
                    unit: "V"
                  },
                  {
                    value: String(active?.currentA ?? 0),
                    measurand: "Current.Import",
                    unit: "A"
                  }
                ]
              }
            ]
          });
        } else {
          const conn = station?.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId);
          this.handleChargePointCall(chargeBoxId, "StatusNotification", {
            connectorId,
            status: conn?.status || "Available",
            errorCode: conn?.errorCode || "NoError",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        return {
          uniqueId,
          chargeBoxId,
          action,
          requestPayload: payload,
          responsePayload,
          deliveredViaWebSocket: false
        };
      }
      case "ReserveNow": {
        const connectorId = Number(payload.connectorId || 1);
        const idTag = String(payload.idTag || "VID-GH-8842-A");
        const reservationId = Number(payload.reservationId || ++this.nextReservationId);
        const expiryDate = payload.expiryDate || new Date(Date.now() + 30 * 60 * 1e3).toISOString();
        if (!station) {
          responsePayload = { status: "Rejected" };
          break;
        }
        const conn = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId) || station.connectors[0];
        if (!conn) {
          responsePayload = { status: "Rejected" };
          break;
        }
        if (conn.status === "Faulted") {
          responsePayload = { status: "Faulted" };
          break;
        }
        if (conn.status === "Unavailable") {
          responsePayload = { status: "Unavailable" };
          break;
        }
        if (conn.status === "Charging" || conn.status === "Preparing") {
          responsePayload = { status: "Occupied" };
          break;
        }
        conn.status = "Reserved";
        conn.reservedByIdTag = idTag;
        conn.reservationId = reservationId;
        conn.reservationExpiryDate = expiryDate;
        const existingIdx = this.reservations.findIndex((r) => r.reservationId === reservationId);
        const resRecord = {
          reservationId,
          stationId: station.stationId,
          chargeBoxId: station.stationId,
          connectorId: conn.connectorId,
          connectorLabel: conn.label || (conn.connectorId === 1 ? "Outlet A" : "Outlet B"),
          idTag,
          expiryDate,
          status: "Active"
        };
        if (existingIdx >= 0) {
          this.reservations[existingIdx] = resRecord;
        } else {
          this.reservations.unshift(resRecord);
        }
        responsePayload = { status: "Accepted", reservationId, expiryDate };
        break;
      }
      case "CancelReservation": {
        const reservationId = Number(payload.reservationId);
        const res = this.reservations.find((r) => r.reservationId === reservationId && r.status === "Active");
        if (!res) {
          responsePayload = { status: "Rejected" };
          break;
        }
        res.status = "Cancelled";
        const targetStation = this.findStation(res.chargeBoxId);
        const conn = targetStation?.connectors.find((c) => c.connectorId === res.connectorId);
        if (conn && conn.status === "Reserved") {
          conn.status = "Available";
          conn.reservedByIdTag = void 0;
          conn.reservationId = void 0;
          conn.reservationExpiryDate = void 0;
        }
        responsePayload = { status: "Accepted" };
        break;
      }
      case "SetChargingProfile": {
        const csChargingProfiles = payload.csChargingProfiles || {
          chargingProfileId: this.chargingProfiles.length + 1,
          stackLevel: 1,
          chargingProfilePurpose: "TxDefaultProfile",
          chargingProfileKind: "Absolute",
          chargingSchedule: {
            chargingRateUnit: "W",
            chargingSchedulePeriod: [
              {
                startPeriod: 0,
                limit: Number(payload.limitWatts || 8e4),
                numberPhases: 3
              }
            ]
          }
        };
        const existingIdx = this.chargingProfiles.findIndex(
          (p) => p.chargingProfileId === csChargingProfiles.chargingProfileId
        );
        if (existingIdx >= 0) {
          this.chargingProfiles[existingIdx] = csChargingProfiles;
        } else {
          this.chargingProfiles.push(csChargingProfiles);
        }
        const active = this.ctx.getActiveSession();
        const newLimitW = csChargingProfiles.chargingSchedule?.chargingSchedulePeriod?.[0]?.limit;
        if (active && newLimitW && newLimitW > 0) {
          const newKw = csChargingProfiles.chargingSchedule.chargingRateUnit === "W" ? newLimitW / 1e3 : newLimitW * active.voltageV / 1e3;
          active.currentPowerKw = Number(Math.min(160, newKw).toFixed(1));
          active.currentA = Number((active.currentPowerKw * 1e3 / active.voltageV).toFixed(1));
        }
        responsePayload = { status: "Accepted" };
        break;
      }
      case "ClearChargingProfile": {
        const profileId = payload.id ? Number(payload.id) : void 0;
        if (profileId !== void 0) {
          this.chargingProfiles = this.chargingProfiles.filter((p) => p.chargingProfileId !== profileId);
        } else {
          this.chargingProfiles = this.chargingProfiles.slice(0, 1);
        }
        responsePayload = { status: "Accepted" };
        break;
      }
      case "GetCompositeSchedule": {
        const duration = Number(payload.duration || 3600);
        const connectorId = Number(payload.connectorId ?? 0);
        const activeLimit = this.chargingProfiles[this.chargingProfiles.length - 1]?.chargingSchedule?.chargingSchedulePeriod?.[0]?.limit || 16e4;
        responsePayload = {
          status: "Accepted",
          connectorId,
          scheduleStart: (/* @__PURE__ */ new Date()).toISOString(),
          chargingSchedule: {
            duration,
            chargingRateUnit: payload.chargingRateUnit || "W",
            chargingSchedulePeriod: [
              {
                startPeriod: 0,
                limit: activeLimit,
                numberPhases: 3
              }
            ]
          }
        };
        break;
      }
      case "GetLocalListVersion": {
        responsePayload = { listVersion: this.localAuthListVersion };
        break;
      }
      case "SendLocalList": {
        this.localAuthListVersion = Number(payload.listVersion || this.localAuthListVersion + 1);
        if (Array.isArray(payload.localAuthorizationList)) {
          for (const item of payload.localAuthorizationList) {
            if (item && item.idTag) {
              const idx = this.localAuthList.findIndex((e) => e.idTag === item.idTag);
              if (idx >= 0) {
                this.localAuthList[idx] = item;
              } else {
                this.localAuthList.push(item);
              }
            }
          }
        }
        responsePayload = { status: "Accepted" };
        break;
      }
      case "GetDiagnostics": {
        this.diagnosticsStatus = "Uploaded";
        responsePayload = { fileName: `diag-${chargeBoxId}-${Date.now()}.log` };
        break;
      }
      case "UpdateFirmware": {
        this.firmwareStatus = "Installed";
        responsePayload = {};
        break;
      }
      default: {
        responsePayload = { status: "Accepted" };
        break;
      }
    }
    this.ctx.pushLog(chargeBoxId, "INCOMING", action, responsePayload, 3, uniqueId);
    return {
      uniqueId,
      chargeBoxId,
      action,
      requestPayload: payload,
      responsePayload,
      deliveredViaWebSocket: false
    };
  }
  // ==========================================
  // 6. WEBSOCKET CONNECTION LIFECYCLE
  // ==========================================
  registerWebSocketConnection(rawChargeBoxId, socket, remoteAddress, subprotocol) {
    const chargeBoxId = this.normalizeChargeBoxId(rawChargeBoxId);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const record = {
      chargeBoxId,
      pileNumber: rawChargeBoxId,
      remoteAddress,
      connectedAt: nowIso,
      lastSeenAt: nowIso,
      subprotocol,
      socket
    };
    this.sockets.set(chargeBoxId, record);
    const telemetry = this.rh(chargeBoxId);
    telemetry.remoteAddress = remoteAddress;
    telemetry.subprotocol = subprotocol;
    telemetry.connectedAt = nowIso;
    telemetry.socketCount = 1;
    const station = this.findStation(chargeBoxId);
    if (station) {
      station.isOnline = true;
      station.lastHeartbeat = nowIso;
    }
    socket.on("close", () => {
      const current = this.sockets.get(chargeBoxId);
      if (current && current.socket === socket) {
        this.sockets.delete(chargeBoxId);
      }
    });
  }
  handleRawWebSocketText(rawChargeBoxId, text, socket) {
    const chargeBoxId = this.normalizeChargeBoxId(rawChargeBoxId);
    const sockRecord = this.sockets.get(chargeBoxId);
    if (sockRecord) {
      sockRecord.lastSeenAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const errFrame = JSON.stringify([
        4,
        "0",
        "FormationViolation",
        "Invalid JSON payload in OCPP 1.6J frame",
        {}
      ]);
      sendWebSocketTextFrame(socket, errFrame);
      return;
    }
    if (!Array.isArray(parsed) || parsed.length < 3) {
      const errFrame = JSON.stringify([
        4,
        "0",
        "ProtocolError",
        "OCPP-J frame must be a JSON array [MessageTypeId, UniqueId, ...]",
        {}
      ]);
      sendWebSocketTextFrame(socket, errFrame);
      return;
    }
    const messageTypeId = Number(parsed[0]);
    const uniqueId = String(parsed[1]);
    if (messageTypeId === 2) {
      const action = String(parsed[2]);
      const payload = parsed[3] && typeof parsed[3] === "object" ? parsed[3] : {};
      const reply = this.handleChargePointCall(chargeBoxId, action, payload, uniqueId, true, sockRecord?.remoteAddress);
      sendWebSocketTextFrame(socket, JSON.stringify(reply));
    } else if (messageTypeId === 3) {
      const payload = parsed[2] && typeof parsed[2] === "object" ? parsed[2] : {};
      const pending = this.pendingCalls.get(uniqueId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingCalls.delete(uniqueId);
        pending.resolve(payload);
      }
    } else if (messageTypeId === 4) {
      const errorCode = String(parsed[2] || "GenericError");
      const errorDesc = String(parsed[3] || "");
      const pending = this.pendingCalls.get(uniqueId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingCalls.delete(uniqueId);
        pending.reject(new Error(`${errorCode}: ${errorDesc}`));
      }
    }
  }
};
var WS_MAGIC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
function sendWebSocketFrame(socket, opcode, payloadBuf) {
  if (socket.destroyed) return;
  const len = payloadBuf.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 128 | opcode & 15;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 128 | opcode & 15;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 128 | opcode & 15;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  socket.write(Buffer.concat([header, payloadBuf]));
}
function sendWebSocketTextFrame(socket, text) {
  sendWebSocketFrame(socket, 1, Buffer.from(text, "utf8"));
}
function attachOcpp16WebSocketServer(httpServer, engine) {
  httpServer.on("upgrade", (req, socket, head) => {
    const rawUrl = req.url || "/";
    const pathname = rawUrl.split("?")[0];
    let chargeBoxId = null;
    const match16 = pathname.match(/^\/ocpp\/1\.6\/([^/]+)\/?$/i);
    const matchOcpp = pathname.match(/^\/ocpp\/([^/]+)\/?$/i);
    const matchRoot = pathname.match(/^\/(CL-[A-Z]+-\d+|19046744073709551615)\/?$/i);
    if (match16) {
      chargeBoxId = match16[1];
    } else if (matchOcpp && matchOcpp[1].toLowerCase() !== "1.6") {
      chargeBoxId = matchOcpp[1];
    } else if (matchRoot) {
      chargeBoxId = matchRoot[1];
    } else if (pathname === "/ocpp/1.6" || pathname === "/ocpp") {
      chargeBoxId = "CL-KSI-001";
    }
    if (!chargeBoxId) {
      return;
    }
    const wsKey = req.headers["sec-websocket-key"];
    if (!wsKey || typeof wsKey !== "string") {
      socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
      socket.destroy();
      return;
    }
    const acceptKey = import_crypto4.default.createHash("sha1").update(wsKey + WS_MAGIC_GUID).digest("base64");
    const requestedProtocols = String(req.headers["sec-websocket-protocol"] || "").split(",").map((s) => s.trim()).filter(Boolean);
    const selectedSubprotocol = requestedProtocols.find((p) => p.toLowerCase() === "ocpp1.6") || requestedProtocols[0] || "ocpp1.6";
    const responseHeaders = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      `Sec-WebSocket-Protocol: ${selectedSubprotocol}`,
      "\r\n"
    ];
    socket.write(responseHeaders.join("\r\n"));
    const remoteAddress = req.socket.remoteAddress || "127.0.0.1";
    engine.registerWebSocketConnection(chargeBoxId, socket, remoteAddress, selectedSubprotocol);
    let buffer = head && head.length > 0 ? Buffer.from(head) : Buffer.alloc(0);
    const processBuffer = () => {
      while (buffer.length >= 2) {
        const firstByte = buffer[0];
        const secondByte = buffer[1];
        const opcode = firstByte & 15;
        const isMasked = (secondByte & 128) !== 0;
        let payloadLen = secondByte & 127;
        let offset = 2;
        if (payloadLen === 126) {
          if (buffer.length < 4) return;
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLen === 127) {
          if (buffer.length < 10) return;
          payloadLen = Number(buffer.readBigUInt64BE(2));
          offset = 10;
        }
        const maskLen = isMasked ? 4 : 0;
        if (buffer.length < offset + maskLen + payloadLen) {
          return;
        }
        const maskKey = isMasked ? buffer.subarray(offset, offset + 4) : null;
        offset += maskLen;
        const payload = Buffer.from(buffer.subarray(offset, offset + payloadLen));
        buffer = buffer.subarray(offset + payloadLen);
        if (isMasked && maskKey) {
          for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskKey[i % 4];
          }
        }
        if (opcode === 8) {
          sendWebSocketFrame(socket, 8, Buffer.alloc(0));
          socket.end();
          return;
        } else if (opcode === 9) {
          sendWebSocketFrame(socket, 10, payload);
        } else if (opcode === 1) {
          const text = payload.toString("utf8");
          engine.handleRawWebSocketText(chargeBoxId, text, socket);
        }
      }
    };
    if (buffer.length > 0) {
      processBuffer();
    }
    socket.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      processBuffer();
    });
    socket.on("error", () => {
      socket.destroy();
    });
  });
}

// server.ts
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
app.use(
  import_express.default.json({
    limit: "50mb",
    verify: (req, _res, buffer) => {
      req.rawBody = Buffer.from(buffer);
    }
  })
);
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use((req, _res, next) => {
  if (process.env.VERCEL && !req.url.startsWith("/api") && !req.url.startsWith("/electric")) {
    req.url = "/api" + req.url;
  }
  next();
});
var publicDir = import_path3.default.join(process.cwd(), "public");
app.use(import_express.default.static(publicDir));
app.get(
  [
    "/electric_vehicle_charging.mp4",
    "/electric%20vehical%20charging.mp4",
    "/electric vehical charging.mp4"
  ],
  (_req, res) => {
    const candidateFiles = [
      import_path3.default.join(publicDir, "electric_vehicle_charging.mp4"),
      import_path3.default.join(publicDir, "electric vehical charging.mp4")
    ];
    for (const file of candidateFiles) {
      if (import_fs3.default.existsSync(file)) {
        return res.sendFile(file);
      }
    }
    res.status(404).json({ error: "Video file not found on server" });
  }
);
app.post("/api/upload-video", import_express.default.raw({ type: "*/*", limit: "100mb" }), (req, res) => {
  try {
    const target1 = import_path3.default.join(publicDir, "electric_vehicle_charging.mp4");
    const target2 = import_path3.default.join(publicDir, "electric vehical charging.mp4");
    import_fs3.default.writeFileSync(target1, req.body);
    import_fs3.default.writeFileSync(target2, req.body);
    res.json({ success: true, url: "/electric_vehicle_charging.mp4" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var IDLE_GRACE_MINUTES = 5;
var IDLE_FEE_PER_MIN_GHS = 0.5;
var MAX_IDLE_FEE_GHS = 10;
var STATIONS = [
  {
    id: "st-01",
    stationId: "CL-KSI-001",
    chargeBoxId: "CL-KSI-001",
    pileNumber: "19046744073709551615",
    name: "Greenwood Event Center Station 1",
    imageUrl: "/stations/.jpg?v=2",
    operator: "ChargeLink GH",
    address: "Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi",
    latitude: 6.6697479,
    longitude: -1.5995679,
    isOnline: false,
    ocppVersion: "1.6J",
    lastHeartbeat: (/* @__PURE__ */ new Date()).toISOString(),
    vendor: "MaxPower",
    model: "VCP160 Dual-Gun DC Fast Charger (160kW)",
    firmwareVersion: "MP-VCP160-OCPP16J-v2.4.8",
    serialNumber: "MP160-GH-KSI-2026001",
    meterType: "DC-DIN-4Q-160KW",
    networkMode: "2.Ethernet (4G/LAN)",
    rating: 5,
    amenities: [
      "Event Center",
      "Parking Bay",
      "Security",
      "24/7 Operation",
      "Opoku Bandoh Plaza",
      "OCPP 1.6J Live"
    ],
    connectors: [
      {
        id: 101,
        connectorId: 1,
        label: "Outlet A",
        imageUrl: "/stations/.jpg?v=2",
        type: "GB/T",
        maxPowerKw: 160,
        currentPowerKw: 0,
        status: "Available",
        errorCode: "NoError",
        tariffPerKwh: 5,
        tariffGhsPerKwh: 5,
        tariffCurrency: "GHS"
      },
      {
        id: 102,
        connectorId: 2,
        label: "Outlet B",
        imageUrl: "/stations/.jpg?v=2",
        type: "GB/T",
        maxPowerKw: 160,
        currentPowerKw: 0,
        status: "Available",
        errorCode: "NoError",
        tariffPerKwh: 5,
        tariffGhsPerKwh: 5,
        tariffCurrency: "GHS"
      }
    ]
  },
  {
    id: "st-02",
    stationId: "CL-KSI-002",
    chargeBoxId: "CL-KSI-002",
    pileNumber: "CL-KSI-002",
    name: "Greenwood Event Center Station 2",
    imageUrl: "/stations/.jpg?v=2",
    operator: "ChargeLink GH",
    address: "Opoku Bandoh Plaza, Asokwa Newroad, Eastern Bypass, Kumasi",
    latitude: 6.6697479,
    longitude: -1.5995679,
    isOnline: false,
    ocppVersion: "1.6J",
    vendor: "MaxPower",
    model: "DC Fast Charger (40kW)",
    firmwareVersion: "Awaiting BootNotification",
    serialNumber: "Awaiting BootNotification",
    meterType: "DC-40KW",
    networkMode: "2.Ethernet (4G/LAN)",
    rating: 5,
    amenities: [
      "Event Center",
      "Parking Bay",
      "Security",
      "24/7 Operation",
      "Opoku Bandoh Plaza",
      "OCPP 1.6J Live"
    ],
    connectors: [
      {
        id: 201,
        connectorId: 1,
        label: "Outlet A",
        type: "GB/T",
        maxPowerKw: 40,
        currentPowerKw: 0,
        status: "Available",
        errorCode: "NoError",
        tariffPerKwh: 5,
        tariffGhsPerKwh: 5,
        tariffCurrency: "GHS"
      }
    ]
  }
];
var USER_WALLET = {
  userId: "usr-xcharge-77",
  currency: "GHS",
  availableBalance: 145.5,
  heldBalance: 0,
  momoProvider: "MTN",
  phoneNumber: "+233 24 981 4421",
  transactions: [
    {
      id: "tx-001",
      timestamp: new Date(Date.now() - 864e5 * 2).toISOString(),
      amount: 100,
      type: "TOPUP",
      status: "SUCCESS",
      provider: "MOMO",
      reference: "MOMO-GH-998241",
      description: "MTN Mobile Money Top-Up (+233 24 981 4421)"
    },
    {
      id: "tx-002",
      timestamp: new Date(Date.now() - 864e5).toISOString(),
      amount: 58.8,
      type: "CHARGE_SETTLEMENT",
      status: "SUCCESS",
      provider: "MOMO",
      reference: "SES-XC-0921",
      description: "Charging Settlement: 14.0 kWh delivered @ Greenwood Event Center"
    }
  ]
};
var FLEET_ACCOUNT = {
  id: "flt-corp-01",
  companyName: "Apex Logistics & Express EV Fleet",
  fleetCode: "APEX-EV-ACCRA",
  billingAccountNo: "CORP-XC-88402",
  creditLimit: 5e3,
  currentUtilization: 1420.5,
  vehicles: [
    {
      vin: "1FTFW1ED8NFA02941",
      licensePlate: "GT-4491-24",
      model: "E-Transit Cargo 350",
      make: "Ford",
      batteryCapacityKwh: 68,
      assignedDriver: "Kwame Mensah",
      driverPhone: "+233 50 123 4567"
    },
    {
      vin: "7SAYGDEE4PF889120",
      licensePlate: "GW-8920-23",
      model: "Model Y Long Range",
      make: "Tesla",
      batteryCapacityKwh: 78.1,
      assignedDriver: "Ama Osei",
      driverPhone: "+233 24 555 7890"
    },
    {
      vin: "LGX1C23D8M1093847",
      licensePlate: "GN-1002-24",
      model: "T3 Commercial Van",
      make: "BYD",
      batteryCapacityKwh: 44.9,
      assignedDriver: "Kofi Boateng",
      driverPhone: "+233 20 888 1122"
    }
  ]
};
var ACTIVE_SESSION = null;
var OCPP_LOGS = [
  {
    id: "ocpp-05",
    timestamp: new Date(Date.now() - 15e3).toISOString(),
    chargeBoxId: "CL-KSI-001",
    direction: "INCOMING",
    action: "Heartbeat",
    messageTypeId: 2,
    uniqueId: "hb-1002",
    payload: {
      chargeBoxId: "CL-KSI-001",
      pileNumber: "19046744073709551615"
    }
  },
  {
    id: "ocpp-04",
    timestamp: new Date(Date.now() - 12e4).toISOString(),
    chargeBoxId: "CL-KSI-001",
    direction: "INCOMING",
    action: "StatusNotification",
    messageTypeId: 2,
    uniqueId: "stat-1002",
    payload: {
      connectorId: 2,
      connectorLabel: "Outlet B",
      errorCode: "NoError",
      status: "Available",
      info: "MaxPower VCP160 Outlet B (GB/T 160kW) Ready",
      timestamp: new Date(Date.now() - 12e4).toISOString()
    }
  },
  {
    id: "ocpp-03",
    timestamp: new Date(Date.now() - 125e3).toISOString(),
    chargeBoxId: "CL-KSI-001",
    direction: "INCOMING",
    action: "StatusNotification",
    messageTypeId: 2,
    uniqueId: "stat-1001",
    payload: {
      connectorId: 1,
      connectorLabel: "Outlet A",
      errorCode: "NoError",
      status: "Available",
      info: "MaxPower VCP160 Outlet A (GB/T 160kW) Ready",
      timestamp: new Date(Date.now() - 125e3).toISOString()
    }
  },
  {
    id: "ocpp-02",
    timestamp: new Date(Date.now() - 359e4).toISOString(),
    chargeBoxId: "CL-KSI-001",
    direction: "OUTGOING",
    action: "BootNotification",
    messageTypeId: 3,
    uniqueId: "boot-1001",
    payload: {
      status: "Accepted",
      currentTime: new Date(Date.now() - 359e4).toISOString(),
      interval: 60
    }
  },
  {
    id: "ocpp-01",
    timestamp: new Date(Date.now() - 36e5).toISOString(),
    chargeBoxId: "CL-KSI-001",
    direction: "INCOMING",
    action: "BootNotification",
    messageTypeId: 2,
    uniqueId: "boot-1001",
    payload: {
      chargePointVendor: "MaxPower",
      chargePointModel: "VCP160",
      chargePointSerialNumber: "MP160-GH-KSI-2026001",
      firmwareVersion: "MP-VCP160-OCPP16J-v2.4.8",
      chargeBoxId: "CL-KSI-001",
      pileNumber: "19046744073709551615",
      meterType: "DC-DIN-4Q-160KW",
      location: "Greenwood Event Center, Kumasi"
    }
  }
];
var SIMULATION_SPEED = 1;
var ocpp16Engine = new Ocpp16Engine({
  getStations: () => STATIONS,
  getActiveSession: () => ACTIVE_SESSION,
  setActiveSession: (session) => {
    ACTIVE_SESSION = session;
  },
  getLogs: () => OCPP_LOGS,
  pushLog: (chargeBoxId, direction, action, payload, messageTypeId = 2, uniqueId) => {
    const msg = {
      id: `ocpp-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      chargeBoxId,
      direction,
      action,
      messageTypeId,
      uniqueId,
      payload
    };
    OCPP_LOGS.unshift(msg);
    if (OCPP_LOGS.length > 80) OCPP_LOGS.pop();
    return msg;
  },
  onRemoteStartSession: ({ station, connectorId, idTag, transactionId }) => {
    const connector = station.connectors.find((c) => c.connectorId === connectorId || c.id === connectorId) || station.connectors[0];
    connector.status = "Charging";
    connector.errorCode = "NoError";
    connector.currentPowerKw = Math.min(connector.maxPowerKw, 120);
    connector.reservedByIdTag = void 0;
    connector.reservationId = void 0;
    connector.reservationExpiryDate = void 0;
    const driverPhone = "+233248901204";
    const wallet = getUserWallet(driverPhone);
    const voltageV = 400.4;
    const currentA = Number((connector.currentPowerKw * 1e3 / voltageV).toFixed(1));
    const meterStartWh = 142500;
    ACTIVE_SESSION = {
      sessionId: `ses-${Date.now()}`,
      transactionId,
      stationId: station.stationId,
      stationName: station.name,
      chargeBoxId: station.stationId,
      connectorId: connector.connectorId,
      connectorLabel: connector.label || (connector.connectorId === 1 ? "Outlet A" : "Outlet B"),
      connectorType: connector.type,
      idTag,
      userId: driverPhone,
      driverPhone,
      isFleetSession: false,
      startTime: Date.now(),
      elapsedSeconds: 0,
      remainingMinutes: 24,
      currentSocPercent: 28,
      targetSocPercent: 85,
      currentPowerKw: connector.currentPowerKw,
      voltageV,
      currentA,
      kwhDelivered: 0.05,
      meterStartWh,
      meterStopWh: meterStartWh + 50,
      temperatureC: 34.5,
      accruedCost: Number((0.05 * connector.tariffPerKwh).toFixed(2)),
      tariffPerKwh: connector.tariffPerKwh,
      cardBalanceGhs: wallet.availableBalance,
      currency: "GHS",
      preauthHoldAmount: 25,
      status: "Charging",
      meterValuesLog: [
        {
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          soc: 28,
          powerKw: connector.currentPowerKw,
          kwhTotal: 0.05
        }
      ]
    };
    return ACTIVE_SESSION;
  },
  onRemoteStopSession: ({ reason, meterStopWh }) => {
    if (!ACTIVE_SESSION) {
      return { session: null, totalCostGhs: 0 };
    }
    const finished = { ...ACTIVE_SESSION };
    if (meterStopWh !== void 0 && finished.meterStartWh !== void 0) {
      const deltaKwh = Math.max(0, (meterStopWh - finished.meterStartWh) / 1e3);
      if (deltaKwh > 0) {
        finished.kwhDelivered = Number(deltaKwh.toFixed(3));
        finished.accruedCost = Number((finished.kwhDelivered * (finished.tariffPerKwh || 5)).toFixed(2));
      }
      finished.meterStopWh = meterStopWh;
    }
    finished.stopReason = reason;
    finished.status = "Completed";
    const station = STATIONS.find((s) => s.stationId === finished.stationId);
    const connector = station?.connectors.find((c) => c.connectorId === finished.connectorId);
    if (connector) {
      connector.status = "Available";
      connector.errorCode = "NoError";
      connector.currentPowerKw = 0;
    }
    const driverPhone = finished.driverPhone || "+233248901204";
    if (!finished.isFleetSession && finished.preauthHoldAmount > 0) {
      settleAndReleaseEscrow(driverPhone, finished.accruedCost, finished.preauthHoldAmount, {
        sessionId: finished.sessionId,
        kwhDelivered: finished.kwhDelivered
      });
    }
    ACTIVE_SESSION = null;
    return { session: finished, totalCostGhs: finished.accruedCost };
  }
});
setInterval(() => {
  if (ACTIVE_SESSION && ACTIVE_SESSION.status === "Charging") {
    ACTIVE_SESSION.elapsedSeconds += 1;
    if (ACTIVE_SESSION.currentSocPercent > 80) {
      const taperRatio = Math.max(0.25, (100 - ACTIVE_SESSION.currentSocPercent) / 20);
      ACTIVE_SESSION.currentPowerKw = Math.round(ACTIVE_SESSION.currentPowerKw * taperRatio * 10) / 10;
    }
    const kwhAdded = ACTIVE_SESSION.currentPowerKw / 3600 * SIMULATION_SPEED;
    ACTIVE_SESSION.kwhDelivered = +(ACTIVE_SESSION.kwhDelivered + kwhAdded).toFixed(4);
    ACTIVE_SESSION.meterStopWh = Math.round(
      (ACTIVE_SESSION.meterStartWh || 142500) + ACTIVE_SESSION.kwhDelivered * 1e3
    );
    ACTIVE_SESSION.voltageV = +(401.2 + Math.sin(ACTIVE_SESSION.elapsedSeconds / 2) * 1.8).toFixed(1);
    ACTIVE_SESSION.currentA = +(ACTIVE_SESSION.currentPowerKw * 1e3 / ACTIVE_SESSION.voltageV).toFixed(1);
    ACTIVE_SESSION.temperatureC = +(34.2 + Math.min(9.5, ACTIVE_SESSION.elapsedSeconds * 0.03) + Math.sin(ACTIVE_SESSION.elapsedSeconds / 4) * 0.4).toFixed(1);
    const targetCapacity = 75;
    const socIncrement = kwhAdded / targetCapacity * 100;
    if (ACTIVE_SESSION.currentSocPercent < ACTIVE_SESSION.targetSocPercent) {
      ACTIVE_SESSION.currentSocPercent = Math.min(
        ACTIVE_SESSION.targetSocPercent,
        +(ACTIVE_SESSION.currentSocPercent + socIncrement).toFixed(2)
      );
    }
    const remainingSoc = Math.max(0, ACTIVE_SESSION.targetSocPercent - ACTIVE_SESSION.currentSocPercent);
    const remainingKwh = remainingSoc / 100 * targetCapacity;
    ACTIVE_SESSION.remainingMinutes = ACTIVE_SESSION.currentPowerKw > 0 ? Math.max(1, Math.round(remainingKwh / ACTIVE_SESSION.currentPowerKw * 60)) : 0;
    const currentStation = STATIONS.find((s) => s.stationId === ACTIVE_SESSION?.stationId);
    const connector = currentStation?.connectors.find(
      (c) => c.connectorId === ACTIVE_SESSION?.connectorId
    );
    const rate = connector?.tariffPerKwh || ACTIVE_SESSION.tariffPerKwh || 5;
    ACTIVE_SESSION.tariffPerKwh = rate;
    ACTIVE_SESSION.accruedCost = +(ACTIVE_SESSION.kwhDelivered * rate).toFixed(2);
    const driverWallet = getUserWallet(ACTIVE_SESSION.driverPhone || "+233248901204");
    ACTIVE_SESSION.cardBalanceGhs = Number(
      Math.max(0, driverWallet.availableBalance + driverWallet.heldBalance - ACTIVE_SESSION.accruedCost).toFixed(2)
    );
    if (ACTIVE_SESSION.elapsedSeconds % 3 === 0) {
      ACTIVE_SESSION.meterValuesLog.push({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        soc: Math.round(ACTIVE_SESSION.currentSocPercent * 10) / 10,
        powerKw: Math.round(ACTIVE_SESSION.currentPowerKw * 10) / 10,
        kwhTotal: Math.round(ACTIVE_SESSION.kwhDelivered * 1e3) / 1e3
      });
      if (ACTIVE_SESSION.meterValuesLog.length > 30) {
        ACTIVE_SESSION.meterValuesLog.shift();
      }
      OCPP_LOGS.unshift({
        id: `mv-${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        chargeBoxId: ACTIVE_SESSION.stationId,
        direction: "INCOMING",
        action: "MeterValues",
        messageTypeId: 2,
        uniqueId: `mv-${ACTIVE_SESSION.elapsedSeconds}`,
        payload: {
          connectorId: ACTIVE_SESSION.connectorId,
          connectorLabel: ACTIVE_SESSION.connectorLabel || (ACTIVE_SESSION.connectorId === 1 ? "Outlet A" : "Outlet B"),
          transactionId: ACTIVE_SESSION.transactionId || 98421,
          meterValue: [
            {
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              sampledValue: [
                {
                  value: ACTIVE_SESSION.kwhDelivered.toFixed(3),
                  context: "Sample.Periodic",
                  format: "Raw",
                  measurand: "Energy.Active.Import.Register",
                  location: "Outlet",
                  unit: "kWh"
                },
                {
                  value: ACTIVE_SESSION.currentPowerKw.toFixed(1),
                  context: "Sample.Periodic",
                  format: "Raw",
                  measurand: "Power.Active.Import",
                  location: "Outlet",
                  unit: "kW"
                },
                {
                  value: ACTIVE_SESSION.currentSocPercent.toFixed(1),
                  context: "Sample.Periodic",
                  format: "Raw",
                  measurand: "SoC",
                  location: "EV",
                  unit: "Percent"
                },
                {
                  value: ACTIVE_SESSION.voltageV.toString(),
                  context: "Sample.Periodic",
                  format: "Raw",
                  measurand: "Voltage",
                  location: "Outlet",
                  unit: "V"
                },
                {
                  value: ACTIVE_SESSION.currentA.toString(),
                  context: "Sample.Periodic",
                  format: "Raw",
                  measurand: "Current.Import",
                  location: "Outlet",
                  unit: "A"
                },
                {
                  value: (ACTIVE_SESSION.temperatureC || 35).toFixed(1),
                  context: "Sample.Periodic",
                  format: "Raw",
                  measurand: "Temperature",
                  location: "Body",
                  unit: "Celsius"
                }
              ]
            }
          ]
        }
      });
      if (OCPP_LOGS.length > 80) OCPP_LOGS.pop();
    }
  }
}, 1e3);
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "xcharge-ev-backend",
    citrineOsBridge: "CONNECTED",
    ocppVersion: "OCPP 1.6J Edition 2 / 2.0.1",
    activeSessions: ACTIVE_SESSION ? 1 : 0,
    greenwoodStatus: STATIONS[0]?.isOnline ? "ONLINE" : "OFFLINE"
  });
});
app.get("/api/admin/auth/config", (_req, res) => {
  res.json(adminDevelopmentInfo());
});
app.post("/api/admin/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const admin = authenticateAdmin(String(email || ""), String(password || ""));
  if (!admin) {
    res.status(401).json({ success: false, error: "Invalid administrator credentials." });
    return;
  }
  setAdminCookie(res, issueAdminSession(admin));
  res.json({ success: true, admin });
});
app.post("/api/admin/auth/change-password", requireAdmin, (req, res) => {
  const admin = readAdminSession(req);
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  if (!admin) {
    res.status(401).json({ error: "Admin authentication required." });
    return;
  }
  if (newPassword.length < 12) {
    res.status(400).json({ error: "New password must be at least 12 characters." });
    return;
  }
  const updatedAdmin = changeAdminPassword(admin, currentPassword, newPassword);
  if (!updatedAdmin) {
    res.status(400).json({ error: "Current password is incorrect or the new password could not be saved." });
    return;
  }
  setAdminCookie(res, issueAdminSession(updatedAdmin));
  res.json({ success: true, admin: updatedAdmin });
});
app.get("/api/admin/auth/me", requireAdmin, (req, res) => {
  res.json({ authenticated: true, admin: readAdminSession(req) });
});
app.post("/api/admin/auth/logout", (_req, res) => {
  clearAdminCookie(res);
  res.json({ success: true });
});
app.get("/api/admin/overview", requireAdmin, (req, res) => {
  const connectors = STATIONS.flatMap((station) => station.connectors);
  const availableConnectors = connectors.filter((connector) => connector.status === "Available").length;
  const activeSessions = ACTIVE_SESSION ? 1 : 0;
  const sessionCost = ACTIVE_SESSION?.accruedCost || 0;
  res.json({
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    stations: {
      total: STATIONS.length,
      online: STATIONS.filter((station) => station.isOnline).length,
      offline: STATIONS.filter((station) => !station.isOnline).length
    },
    connectors: {
      total: connectors.length,
      available: availableConnectors,
      occupied: connectors.length - availableConnectors
    },
    sessions: {
      active: activeSessions,
      currentCost: sessionCost,
      kwhDelivered: ACTIVE_SESSION?.kwhDelivered || 0,
      activeSession: ACTIVE_SESSION
    },
    network: {
      health: "ok",
      citrineOsBridge: "CONNECTED",
      ocppVersion: "OCPP 1.6J Edition 2",
      connectedSockets: ocpp16Engine.getConnectedChargePoints().length
    },
    commissioning: MAXPOWER_VCP160_COMMISSIONING,
    ocppStatus: ocpp16Engine.getStatusSnapshot(req.get("host"), typeof req.query.chargeBoxId === "string" ? req.query.chargeBoxId : void 0),
    alerts: OCPP_LOGS.filter(
      (log) => log.action === "StatusNotification" && log.payload?.status === "Faulted"
    ).slice(0, 8)
  });
});
app.get("/api/admin/stations", requireAdmin, (_req, res) => {
  res.json(STATIONS);
});
app.get("/api/admin/ocpp/logs", requireAdmin, (_req, res) => {
  res.json(OCPP_LOGS);
});
app.post("/api/admin/ocpp/command", requireAdmin, async (req, res) => {
  try {
    const { chargeBoxId = "CL-KSI-001", action, payload = {} } = req.body || {};
    if (!action) {
      res.status(400).json({ error: "OCPP 1.6 action is required" });
      return;
    }
    const result = await ocpp16Engine.dispatchCentralSystemCommand(
      chargeBoxId,
      action,
      payload
    );
    res.json({
      success: true,
      ...result,
      stations: STATIONS,
      activeSession: ACTIVE_SESSION
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/stations", (req, res) => {
  const { lat, lng, type } = req.query;
  let results = [...STATIONS];
  if (type) {
    results = results.filter(
      (s) => s.connectors.some((c) => c.type.toLowerCase() === type.toLowerCase())
    );
  }
  if (lat && lng) {
    const uLat = parseFloat(lat);
    const uLng = parseFloat(lng);
    results = results.map((st) => {
      const R = 6371;
      const dLat = (st.latitude - uLat) * Math.PI / 180;
      const dLng = (st.longitude - uLng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(uLat * Math.PI / 180) * Math.cos(st.latitude * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return {
        ...st,
        distanceKm: Math.round(R * c * 10) / 10
      };
    });
    results.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }
  res.json(results);
});
app.get("/api/stations/:id", (req, res) => {
  const station = STATIONS.find(
    (s) => s.id === req.params.id || s.stationId === req.params.id || s.pileNumber === req.params.id
  );
  if (!station) {
    res.status(404).json({ error: "Station not found" });
    return;
  }
  res.json(station);
});
app.post("/api/stations", requireAdminRole("network_operator"), (req, res) => {
  const { name, stationId, operator, address, latitude, longitude, connectors, amenities } = req.body;
  if (!name || !latitude || !longitude) {
    res.status(400).json({ error: "Name, latitude, and longitude are required." });
    return;
  }
  const newId = `st-${Date.now()}`;
  const generatedStationId = stationId || `EV-ST-${Math.floor(100 + Math.random() * 900)}`;
  const formattedConnectors = connectors && connectors.length > 0 ? connectors.map((c, index) => ({
    id: Date.now() + index,
    connectorId: c.connectorId || index + 1,
    label: c.label || `Outlet ${index === 0 ? "A" : "B"}`,
    type: c.type || "GB/T",
    maxPowerKw: Number(c.maxPowerKw) || 160,
    currentPowerKw: 0,
    status: c.status || "Available",
    errorCode: "NoError",
    tariffPerKwh: Number(c.tariffPerKwh) || 5,
    tariffGhsPerKwh: Number(c.tariffPerKwh) || 5,
    tariffCurrency: c.tariffCurrency || "GHS"
  })) : [
    {
      id: Date.now(),
      connectorId: 1,
      label: "Outlet A",
      type: "GB/T",
      maxPowerKw: 160,
      currentPowerKw: 0,
      status: "Available",
      errorCode: "NoError",
      tariffPerKwh: 5,
      tariffGhsPerKwh: 5,
      tariffCurrency: "GHS"
    },
    {
      id: Date.now() + 1,
      connectorId: 2,
      label: "Outlet B",
      type: "GB/T",
      maxPowerKw: 160,
      currentPowerKw: 0,
      status: "Available",
      errorCode: "NoError",
      tariffPerKwh: 5,
      tariffGhsPerKwh: 5,
      tariffCurrency: "GHS"
    }
  ];
  const newStation = {
    id: newId,
    stationId: generatedStationId,
    chargeBoxId: generatedStationId,
    name,
    operator: operator || "ChargeLink GH Network",
    address: address || "Main Highway Plaza",
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    isOnline: true,
    ocppVersion: "1.6J",
    lastHeartbeat: (/* @__PURE__ */ new Date()).toISOString(),
    rating: 5,
    amenities: amenities && amenities.length > 0 ? amenities : ["Restrooms", "24/7 Security", "Convenience Store"],
    connectors: formattedConnectors
  };
  STATIONS.unshift(newStation);
  res.status(201).json({ success: true, station: newStation });
});
app.put("/api/stations/:id", requireAdminRole("network_operator"), (req, res) => {
  const index = STATIONS.findIndex((s) => s.id === req.params.id || s.stationId === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Station not found" });
    return;
  }
  const existing = STATIONS[index];
  const { name, operator, address, latitude, longitude, isOnline, amenities, connectors } = req.body;
  STATIONS[index] = {
    ...existing,
    name: name ?? existing.name,
    operator: operator ?? existing.operator,
    address: address ?? existing.address,
    latitude: latitude ? parseFloat(latitude) : existing.latitude,
    longitude: longitude ? parseFloat(longitude) : existing.longitude,
    isOnline: isOnline !== void 0 ? Boolean(isOnline) : existing.isOnline,
    amenities: amenities ?? existing.amenities,
    connectors: connectors ?? existing.connectors
  };
  res.json({ success: true, station: STATIONS[index] });
});
app.delete("/api/stations/:id", requireAdminRole("network_operator"), (req, res) => {
  const index = STATIONS.findIndex((s) => s.id === req.params.id || s.stationId === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Station not found" });
    return;
  }
  const deleted = STATIONS.splice(index, 1)[0];
  res.json({ success: true, deletedStationId: deleted.id });
});
app.get("/api/wallet", (req, res) => {
  const phone = req.query.phoneNumber || req.query.phone;
  const wallet = getUserWallet(phone);
  res.json(wallet);
});
app.post("/api/wallet/topup", (req, res) => {
  const { amount, provider = "MOMO", phone } = req.body;
  const targetPhone = phone || "+233248901204";
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ error: "Invalid top-up amount" });
    return;
  }
  const prov = provider.toUpperCase() === "CARD" ? "CARD" : "MOMO";
  const ref = `TOPUP-GH-${Math.floor(1e5 + Math.random() * 9e5)}`;
  const desc = `${provider || "MTN MoMo"} Top-up (${targetPhone})`;
  creditUserWallet(targetPhone, numAmount, desc, ref, prov);
  const updatedWallet = getUserWallet(targetPhone);
  res.json({
    success: true,
    wallet: updatedWallet,
    transaction: updatedWallet.transactions[0]
  });
});
app.post("/api/wallet/momo-initiate", async (req, res) => {
  try {
    const { amount, provider = "MTN", phone } = req.body;
    const targetPhone = phone || "+233248901204";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: "Invalid payment amount" });
      return;
    }
    const result = await initiateMomoPayment({
      amount: numAmount,
      provider,
      phoneNumber: targetPhone
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/wallet/momo-confirm", (req, res) => {
  try {
    const { transactionId, amount, provider = "MTN", phone, pin } = req.body;
    const targetPhone = phone || "+233248901204";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ error: "Invalid payment amount" });
      return;
    }
    const result = confirmMomoPayment({
      transactionId,
      amount: numAmount,
      provider,
      phoneNumber: targetPhone,
      pin
    });
    const updatedWallet = getUserWallet(targetPhone);
    res.json({
      ...result,
      wallet: updatedWallet
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/wallet/paystack-initialize", async (req, res) => {
  try {
    const { amount, phone, email, displayName, channels } = req.body || {};
    const targetPhone = phone || "+233248901204";
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      res.status(400).json({ success: false, error: "Invalid payment amount." });
      return;
    }
    const configuredBaseUrl = (process.env.APP_URL || "").replace(/\/$/, "");
    const requestOrigin = `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${configuredBaseUrl || requestOrigin}/payments/paystack/callback`;
    const checkout = await initializePaystackTransaction({
      amount: numAmount,
      phoneNumber: targetPhone,
      email,
      displayName,
      callbackUrl,
      channels
    });
    res.json({ success: true, ...checkout, authorization_url: checkout.authorization_url, authorizationUrl: checkout.authorization_url });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Could not initialize Paystack payment." });
  }
});
app.get("/api/wallet/paystack-verify", async (req, res) => {
  try {
    const reference = String(req.query.reference || "").trim();
    if (!reference) {
      res.status(400).json({ success: false, error: "Missing Paystack transaction reference." });
      return;
    }
    const transaction = await verifyPaystackTransaction(reference);
    res.json(settlePaystackTransaction(transaction));
  } catch (err) {
    res.status(400).json({ success: false, error: err.message || "Could not verify Paystack payment." });
  }
});
app.post("/api/paystack/webhook", (req, res) => {
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
  const signature = String(req.headers["x-paystack-signature"] || "");
  if (!isPaystackSignatureValid(rawBody, signature)) {
    res.status(401).json({ success: false, error: "Invalid Paystack signature." });
    return;
  }
  try {
    const event = req.body || {};
    if (event.event === "charge.success" && event.data) settlePaystackTransaction(event.data);
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Paystack webhook processing failed." });
  }
});
app.post("/api/momo/webhook", (req, res) => {
  try {
    const result = handleMomoWebhook(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/fleet", (_req, res) => {
  res.json(FLEET_ACCOUNT);
});
app.get("/api/session/active", (_req, res) => {
  res.json({ session: ACTIVE_SESSION });
});
app.get("/api/ocpp/status", (req, res) => {
  res.json(ocpp16Engine.getStatusSnapshot(req.get("host"), typeof req.query.chargeBoxId === "string" ? req.query.chargeBoxId : void 0));
});
app.get("/api/ocpp/config", (req, res) => {
  const keysParam = req.query.key ? String(req.query.key).split(",") : void 0;
  res.json(ocpp16Engine.getConfigurationKeys(keysParam));
});
app.post("/api/ocpp/config", (req, res) => {
  const { key, value, chargeBoxId = "CL-KSI-001" } = req.body || {};
  if (!key || value === void 0) {
    res.status(400).json({ error: "Configuration key and value are required" });
    return;
  }
  const status = ocpp16Engine.changeConfigurationKey(String(key), String(value));
  OCPP_LOGS.unshift({
    id: `cfg-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId,
    direction: "OUTGOING",
    action: "ChangeConfiguration",
    messageTypeId: 2,
    uniqueId: `cfg-${Date.now()}`,
    payload: { key, value, status }
  });
  res.json({
    success: status === "Accepted",
    status,
    configurationKeys: ocpp16Engine.getConfigurationKeys().configurationKey
  });
});
app.post("/api/ocpp/frame", (req, res) => {
  const {
    chargeBoxId = "CL-KSI-001",
    action,
    payload = {},
    uniqueId = `cp-${Date.now()}`,
    frame
  } = req.body || {};
  let resolvedAction = action;
  let resolvedPayload = payload;
  let resolvedUniqueId = uniqueId;
  if (Array.isArray(frame) && frame.length >= 3 && Number(frame[0]) === 2) {
    resolvedUniqueId = String(frame[1]);
    resolvedAction = String(frame[2]);
    resolvedPayload = frame[3] || {};
  }
  if (!resolvedAction) {
    res.status(400).json({ error: "OCPP 1.6 action or [2, id, action, payload] frame is required" });
    return;
  }
  const callResult = ocpp16Engine.handleChargePointCall(
    chargeBoxId,
    resolvedAction,
    resolvedPayload,
    resolvedUniqueId
  );
  res.json({
    success: true,
    chargeBoxId: ocpp16Engine.normalizeChargeBoxId(chargeBoxId),
    requestFrame: [2, resolvedUniqueId, resolvedAction, resolvedPayload],
    responseFrame: callResult,
    activeSession: ACTIVE_SESSION,
    station: ocpp16Engine.findStation(chargeBoxId)
  });
});
app.post("/api/ocpp/command", async (req, res) => {
  try {
    const { chargeBoxId = "CL-KSI-001", action, payload = {} } = req.body || {};
    if (!action) {
      res.status(400).json({ error: "OCPP 1.6 action is required" });
      return;
    }
    const result = await ocpp16Engine.dispatchCentralSystemCommand(
      chargeBoxId,
      action,
      payload
    );
    res.json({
      success: true,
      ...result,
      activeSession: ACTIVE_SESSION,
      station: ocpp16Engine.findStation(chargeBoxId)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/ocpp/reserve", async (req, res) => {
  try {
    const {
      stationId = "CL-KSI-001",
      connectorId = 1,
      idTag = "VID-GH-8842-A",
      durationMinutes = 30
    } = req.body || {};
    const expiryDate = new Date(Date.now() + Number(durationMinutes) * 60 * 1e3).toISOString();
    const result = await ocpp16Engine.dispatchCentralSystemCommand(stationId, "ReserveNow", {
      connectorId: Number(connectorId),
      idTag,
      expiryDate
    });
    res.json({
      success: result.responsePayload.status === "Accepted",
      ...result.responsePayload,
      reservations: ocpp16Engine.getReservations(),
      station: ocpp16Engine.findStation(stationId)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/ocpp/cancel-reservation", async (req, res) => {
  try {
    const { stationId = "CL-KSI-001", reservationId } = req.body || {};
    const result = await ocpp16Engine.dispatchCentralSystemCommand(
      stationId,
      "CancelReservation",
      { reservationId: Number(reservationId) }
    );
    res.json({
      success: result.responsePayload.status === "Accepted",
      ...result.responsePayload,
      reservations: ocpp16Engine.getReservations(),
      station: ocpp16Engine.findStation(stationId)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/ocpp/unlock", async (req, res) => {
  try {
    const { stationId = "CL-KSI-001", connectorId = 1 } = req.body || {};
    const result = await ocpp16Engine.dispatchCentralSystemCommand(stationId, "UnlockConnector", {
      connectorId: Number(connectorId)
    });
    res.json({
      success: result.responsePayload.status === "Unlocked",
      ...result.responsePayload,
      station: ocpp16Engine.findStation(stationId),
      activeSession: ACTIVE_SESSION
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post(["/api/ocpp/remote-start", "/api/charge/start"], (req, res) => {
  const { stationId, connectorId, isFleet, vin, preauthHoldAmount = 25, phoneNumber, idTag } = req.body;
  const driverPhone = phoneNumber || "+233248901204";
  if (ACTIVE_SESSION) {
    res.status(400).json({ error: "An active charging session is already in progress" });
    return;
  }
  const station = STATIONS.find(
    (s) => s.stationId === stationId || s.id === stationId || s.pileNumber === stationId
  ) || STATIONS[0];
  if (!station) {
    res.status(404).json({ error: "Station not found" });
    return;
  }
  const connector = station.connectors.find((c) => c.connectorId === Number(connectorId) || c.id === Number(connectorId)) || station.connectors.find((c) => c.status === "Available" || c.status === "Reserved") || station.connectors[0];
  if (!connector) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  if (connector.status !== "Available" && connector.status !== "Reserved") {
    res.status(400).json({ error: `Connector ${connector.connectorId} is currently ${connector.status}` });
    return;
  }
  if (!isFleet) {
    const holdRes = holdUserEscrow(driverPhone, preauthHoldAmount, station.name);
    if (!holdRes.success) {
      res.status(402).json({
        error: holdRes.error || "Insufficient wallet balance for pre-authorization hold",
        required: preauthHoldAmount,
        available: holdRes.availableBalance,
        message: "Please top up your wallet via Mobile Money or Card before unlocking."
      });
      return;
    }
  }
  connector.status = "Charging";
  connector.errorCode = "NoError";
  connector.currentPowerKw = Math.min(connector.maxPowerKw, 120);
  connector.reservedByIdTag = void 0;
  connector.reservationId = void 0;
  connector.reservationExpiryDate = void 0;
  const transactionId = ocpp16Engine.allocateTransactionId();
  const resolvedIdTag = idTag || (isFleet ? `FLEET-VIN-${vin || "GENERIC"}` : "VID-GH-8842-A");
  const currentWallet = getUserWallet(driverPhone);
  const meterStartWh = 142500;
  ACTIVE_SESSION = {
    sessionId: `ses-${Date.now()}`,
    transactionId,
    stationId: station.stationId,
    stationName: station.name,
    chargeBoxId: station.stationId,
    connectorId: connector.connectorId,
    connectorLabel: connector.label || (connector.connectorId === 1 ? "Outlet A" : "Outlet B"),
    connectorType: connector.type,
    idTag: resolvedIdTag,
    userId: driverPhone,
    driverPhone,
    isFleetSession: !!isFleet,
    fleetVin: vin || (isFleet ? FLEET_ACCOUNT.vehicles[0].vin : void 0),
    startTime: Date.now(),
    elapsedSeconds: 0,
    remainingMinutes: 24,
    currentSocPercent: isFleet ? 32 : 28,
    targetSocPercent: 85,
    currentPowerKw: connector.currentPowerKw,
    voltageV: 400.2,
    currentA: +(connector.currentPowerKw * 1e3 / 400.2).toFixed(1),
    kwhDelivered: 0.05,
    meterStartWh,
    meterStopWh: meterStartWh + 50,
    temperatureC: 34.5,
    accruedCost: +(0.05 * connector.tariffPerKwh).toFixed(2),
    tariffPerKwh: connector.tariffPerKwh,
    cardBalanceGhs: currentWallet.availableBalance,
    currency: "GHS",
    preauthHoldAmount: isFleet ? 0 : preauthHoldAmount,
    status: "Charging",
    meterValuesLog: [
      {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        soc: isFleet ? 32 : 28,
        powerKw: connector.currentPowerKw,
        kwhTotal: 0.05
      }
    ]
  };
  OCPP_LOGS.unshift({
    id: `ocpp-start-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId: station.stationId,
    direction: "OUTGOING",
    action: "RemoteStartTransaction",
    messageTypeId: 2,
    uniqueId: `rst-${transactionId}`,
    payload: {
      connectorId: connector.connectorId,
      idTag: resolvedIdTag,
      chargingProfile: {
        chargingProfileId: 1,
        stackLevel: 0,
        chargingProfilePurpose: "TxDefaultProfile",
        chargingProfileKind: "Absolute",
        chargingSchedule: {
          chargingRateUnit: "W",
          chargingSchedulePeriod: [{ startPeriod: 0, limit: connector.maxPowerKw * 1e3 }]
        }
      }
    }
  });
  OCPP_LOGS.unshift({
    id: `ocpp-txstart-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId: station.stationId,
    direction: "INCOMING",
    action: "StartTransaction",
    messageTypeId: 2,
    uniqueId: `stx-${transactionId}`,
    payload: {
      connectorId: connector.connectorId,
      connectorLabel: ACTIVE_SESSION.connectorLabel,
      idTag: resolvedIdTag,
      meterStart: meterStartWh,
      transactionId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  OCPP_LOGS.unshift({
    id: `ocpp-stat-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId: station.stationId,
    direction: "INCOMING",
    action: "StatusNotification",
    messageTypeId: 2,
    uniqueId: `sn-${transactionId}`,
    payload: {
      connectorId: connector.connectorId,
      connectorLabel: ACTIVE_SESSION.connectorLabel,
      errorCode: "NoError",
      status: "Charging",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  res.json({
    success: true,
    message: `Connector ${ACTIVE_SESSION.connectorLabel} (${connector.type}) unlocked via OCPP 1.6J RemoteStartTransaction.`,
    session: ACTIVE_SESSION,
    wallet: currentWallet
  });
});
app.post(["/api/ocpp/remote-stop", "/api/charge/stop"], (req, res) => {
  if (!ACTIVE_SESSION) {
    res.status(400).json({ error: "No active session to stop" });
    return;
  }
  const session = { ...ACTIVE_SESSION };
  const stopReason = req.body?.reason || "Remote";
  session.stopReason = stopReason;
  const station = STATIONS.find((s) => s.stationId === session.stationId);
  const connector = station?.connectors.find((c) => c.connectorId === session.connectorId);
  if (connector) {
    connector.status = "Available";
    connector.errorCode = "NoError";
    connector.currentPowerKw = 0;
  }
  const driverPhone = req.body.phoneNumber || session.driverPhone || "+233248901204";
  if (!session.isFleetSession) {
    const actualCost = Math.round(session.accruedCost * 100) / 100;
    const holdAmount = session.preauthHoldAmount;
    settleAndReleaseEscrow(driverPhone, actualCost, holdAmount, {
      sessionId: session.sessionId,
      kwhDelivered: session.kwhDelivered
    });
  } else {
    FLEET_ACCOUNT.currentUtilization += session.accruedCost;
  }
  OCPP_LOGS.unshift({
    id: `ocpp-stop-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId: session.stationId,
    direction: "OUTGOING",
    action: "RemoteStopTransaction",
    messageTypeId: 2,
    uniqueId: `rstop-${session.transactionId || 98421}`,
    payload: {
      transactionId: session.transactionId || 98421
    }
  });
  OCPP_LOGS.unshift({
    id: `ocpp-stoptx-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId: session.stationId,
    direction: "INCOMING",
    action: "StopTransaction",
    messageTypeId: 2,
    uniqueId: `stoptx-${session.transactionId || 98421}`,
    payload: {
      transactionId: session.transactionId || 98421,
      idTag: session.idTag || "VID-GH-8842-A",
      meterStop: session.meterStopWh || Math.round(142500 + session.kwhDelivered * 1e3),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      reason: stopReason
    }
  });
  OCPP_LOGS.unshift({
    id: `ocpp-avail-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId: session.stationId,
    direction: "INCOMING",
    action: "StatusNotification",
    messageTypeId: 2,
    uniqueId: `snavail-${session.transactionId || 98421}`,
    payload: {
      connectorId: session.connectorId,
      connectorLabel: session.connectorLabel || (session.connectorId === 1 ? "Outlet A" : "Outlet B"),
      errorCode: "NoError",
      status: "Available",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  ACTIVE_SESSION = null;
  const currentWallet = getUserWallet(driverPhone);
  res.json({
    success: true,
    message: "Session terminated via OCPP 1.6J StopTransaction. Connector unlatched and escrow settled.",
    completedSession: session,
    wallet: currentWallet
  });
});
app.get("/api/ocpp/logs", (_req, res) => {
  res.json(OCPP_LOGS);
});
app.post("/api/ocpp/inject-event", (req, res) => {
  const { action, payload, direction = "INCOMING", chargeBoxId = "CL-KSI-001" } = req.body || {};
  if (direction === "INCOMING" && action) {
    const reply = ocpp16Engine.handleChargePointCall(
      chargeBoxId,
      action,
      payload || {}
    );
    res.json({
      success: true,
      message: OCPP_LOGS[0],
      responseFrame: reply,
      station: ocpp16Engine.findStation(chargeBoxId),
      activeSession: ACTIVE_SESSION
    });
    return;
  }
  const msg = {
    id: `sim-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId,
    direction,
    action,
    payload: payload || {}
  };
  OCPP_LOGS.unshift(msg);
  if (action === "StatusNotification" && payload?.connectorId) {
    const connId = Number(payload.connectorId);
    STATIONS.forEach((s) => {
      s.connectors.forEach((c) => {
        if (c.connectorId === connId && payload.status) {
          c.status = payload.status;
          if (payload.errorCode) c.errorCode = payload.errorCode;
        }
      });
    });
  }
  res.json({ success: true, message: msg });
});
app.get("/api/simulator/status", (_req, res) => {
  res.json({
    simulationSpeed: SIMULATION_SPEED,
    activeSession: ACTIVE_SESSION,
    totalStations: STATIONS.length,
    availableStations: STATIONS.filter(
      (s) => s.isOnline && s.connectors.some((c) => c.status === "Available")
    ).length,
    recentOcppPackets: OCPP_LOGS.slice(0, 10)
  });
});
app.post("/api/simulator/start", (req, res) => {
  const {
    stationId = STATIONS[0]?.stationId || "CL-KSI-001",
    connectorId = 1,
    initialSoc = 24,
    targetSoc = 85,
    powerKw = 160,
    speedMultiplier = 1,
    isFleet = false
  } = req.body;
  SIMULATION_SPEED = Math.max(1, Math.min(20, Number(speedMultiplier) || 1));
  const station = STATIONS.find((s) => s.stationId === stationId || s.id === stationId) || STATIONS[0];
  const connector = station.connectors.find((c) => c.connectorId === Number(connectorId)) || station.connectors[0];
  connector.status = "Charging";
  connector.errorCode = "NoError";
  connector.currentPowerKw = Number(powerKw) || connector.maxPowerKw;
  const currentVoltage = 400.8;
  const currentAmps = +(connector.currentPowerKw * 1e3 / currentVoltage).toFixed(1);
  const transactionId = ocpp16Engine.allocateTransactionId();
  const meterStartWh = 142500;
  ACTIVE_SESSION = {
    sessionId: `sim-ses-${Date.now()}`,
    transactionId,
    stationId: station.stationId,
    stationName: station.name,
    chargeBoxId: station.stationId,
    connectorId: connector.connectorId,
    connectorLabel: connector.label || (connector.connectorId === 1 ? "Outlet A" : "Outlet B"),
    connectorType: connector.type,
    idTag: "VID-GH-8842-A",
    userId: "usr-gh-001",
    isFleetSession: !!isFleet,
    fleetVin: isFleet ? FLEET_ACCOUNT.vehicles[0].vin : void 0,
    startTime: Date.now(),
    elapsedSeconds: 0,
    remainingMinutes: 22,
    currentSocPercent: Number(initialSoc) || 24,
    targetSocPercent: Number(targetSoc) || 85,
    currentPowerKw: connector.currentPowerKw,
    voltageV: currentVoltage,
    currentA: currentAmps,
    kwhDelivered: 0.01,
    meterStartWh,
    meterStopWh: meterStartWh + 10,
    temperatureC: 34.5,
    accruedCost: 0.05,
    tariffPerKwh: connector.tariffPerKwh,
    cardBalanceGhs: 145.5,
    currency: "GHS",
    preauthHoldAmount: 25,
    status: "Charging",
    meterValuesLog: [
      {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        soc: Number(initialSoc) || 24,
        powerKw: connector.currentPowerKw,
        kwhTotal: 0.01
      }
    ]
  };
  OCPP_LOGS.unshift({
    id: `sim-start-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId: station.stationId,
    direction: "INCOMING",
    action: "StartTransaction",
    messageTypeId: 2,
    uniqueId: `sim-${transactionId}`,
    payload: {
      station: station.name,
      stationId: station.stationId,
      connectorId: connector.connectorId,
      connectorLabel: ACTIVE_SESSION.connectorLabel,
      transactionId,
      meterStart: meterStartWh,
      maxPowerKw: connector.maxPowerKw,
      simulationSpeed: `${SIMULATION_SPEED}x`
    }
  });
  res.json({
    success: true,
    message: `Simulation initiated at ${station.name} (${ACTIVE_SESSION.connectorLabel} \xB7 ${connector.maxPowerKw} kW) at ${SIMULATION_SPEED}x speed`,
    session: ACTIVE_SESSION,
    simulationSpeed: SIMULATION_SPEED
  });
});
app.post("/api/simulator/speed", (req, res) => {
  const { multiplier } = req.body;
  const val = Number(multiplier);
  if (!isNaN(val) && val >= 1 && val <= 50) {
    SIMULATION_SPEED = val;
    res.json({ success: true, simulationSpeed: SIMULATION_SPEED });
  } else {
    res.status(400).json({ error: "Multiplier must be a number between 1 and 50" });
  }
});
app.post("/api/simulator/power", (req, res) => {
  const { powerKw } = req.body;
  const val = Number(powerKw);
  if (ACTIVE_SESSION && !isNaN(val) && val > 0) {
    ACTIVE_SESSION.currentPowerKw = val;
    ACTIVE_SESSION.currentA = +(val * 1e3 / ACTIVE_SESSION.voltageV).toFixed(1);
    res.json({ success: true, currentPowerKw: val, currentA: ACTIVE_SESSION.currentA });
  } else {
    res.status(400).json({ error: "No active session or invalid powerKw" });
  }
});
app.post("/api/simulator/stop", (_req, res) => {
  if (!ACTIVE_SESSION) {
    res.status(400).json({ error: "No active session to stop" });
    return;
  }
  const finished = { ...ACTIVE_SESSION };
  const station = STATIONS.find((s) => s.stationId === finished.stationId);
  const connector = station?.connectors.find((c) => c.connectorId === finished.connectorId);
  if (connector) {
    connector.status = "Available";
    connector.errorCode = "NoError";
    connector.currentPowerKw = 0;
  }
  ACTIVE_SESSION = null;
  OCPP_LOGS.unshift({
    id: `sim-stop-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    chargeBoxId: finished.stationId,
    direction: "INCOMING",
    action: "StopTransaction",
    messageTypeId: 2,
    uniqueId: `sim-stop-${finished.transactionId || 98421}`,
    payload: {
      transactionId: finished.transactionId || 98421,
      kwhDelivered: finished.kwhDelivered.toFixed(3),
      finalSoc: finished.currentSocPercent.toFixed(1),
      accruedCost: finished.accruedCost.toFixed(2),
      durationSeconds: finished.elapsedSeconds,
      reason: "Local"
    }
  });
  res.json({
    success: true,
    message: "Simulation session stopped and connector returned to Available.",
    session: finished
  });
});
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: "Phone number is required" });
    }
    const result = await sendOtp(phoneNumber);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/auth/verify-otp", (req, res) => {
  try {
    const { phoneNumber, code, metadata } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ success: false, error: "Phone number and verification code are required" });
    }
    const result = verifyOtp(phoneNumber, code, metadata);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/user/profile", (req, res) => {
  const phone = req.query.phoneNumber || "+233248901204";
  const profile = getUserProfile(phone);
  if (!profile) {
    return res.status(404).json({ error: "User profile not found" });
  }
  res.json(profile);
});
app.put("/api/user/profile", (req, res) => {
  const phone = req.body.phoneNumber;
  if (!phone) {
    return res.status(400).json({ error: "Phone number required" });
  }
  const allowedUpdates = {
    displayName: typeof req.body.displayName === "string" ? req.body.displayName.trim().slice(0, 120) : void 0,
    email: typeof req.body.email === "string" ? req.body.email.trim().slice(0, 160) : void 0,
    avatarUrl: typeof req.body.avatarUrl === "string" ? req.body.avatarUrl.slice(0, 45e4) : void 0,
    ghanaCardId: typeof req.body.ghanaCardId === "string" ? req.body.ghanaCardId.trim().slice(0, 80) : void 0,
    targetChargeLimit: Number.isFinite(Number(req.body.targetChargeLimit)) ? Math.min(100, Math.max(50, Number(req.body.targetChargeLimit))) : void 0,
    smsReceiptsEnabled: typeof req.body.smsReceiptsEnabled === "boolean" ? req.body.smsReceiptsEnabled : void 0,
    defaultPaymentMethod: ["MTN_MOMO", "TELECEL_CASH", "MASTERCARD"].includes(
      req.body.defaultPaymentMethod
    ) ? req.body.defaultPaymentMethod : void 0,
    registeredVehicles: Array.isArray(req.body.registeredVehicles) ? req.body.registeredVehicles : void 0
  };
  const updated = updateUserProfile(
    phone,
    Object.fromEntries(Object.entries(allowedUpdates).filter(([, value]) => value !== void 0))
  );
  if (!updated) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(updated);
});
async function startServer() {
  const httpServer = import_http.default.createServer(app);
  attachOcpp16WebSocketServer(httpServer, ocpp16Engine);
  const isBundledProd = process.env.NODE_ENV === "production" || Boolean(process.argv[1] && /(?:^|[\\/])server\.(?:js|cjs)$/.test(process.argv[1]));
  if (!isBundledProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const entryDir = process.argv[1] ? import_path3.default.dirname(import_path3.default.resolve(process.argv[1])) : process.cwd();
    const candidateDistPaths = [
      import_path3.default.join(entryDir, "dist"),
      import_path3.default.resolve(entryDir, "..", "dist"),
      import_path3.default.resolve(entryDir, "..", "public_html"),
      import_path3.default.resolve(entryDir, "..", "public"),
      import_path3.default.join(process.cwd(), "dist"),
      import_path3.default.resolve(process.cwd(), "..", "dist")
    ];
    const distPath = candidateDistPaths.find((p) => import_fs3.default.existsSync(import_path3.default.join(p, "index.html"))) || candidateDistPaths[0];
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path3.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[XCharge Server] Running on http://0.0.0.0:${PORT}`);
    console.log(
      `[OCPP 1.6J CSMS] WebSocket endpoint ready at ws://0.0.0.0:${PORT}/ocpp/1.6/CL-KSI-001 (or /19046744073709551615)`
    );
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IDLE_FEE_PER_MIN_GHS,
  IDLE_GRACE_MINUTES,
  MAX_IDLE_FEE_GHS
});
//# sourceMappingURL=server.cjs.map
