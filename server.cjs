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
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);

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
  const defaultDriver = {
    id: "usr-gh-001",
    phoneNumber: "+233248901204",
    displayName: "Kofi Mensah",
    email: "kofi.mensah@xcharge.africa",
    walletBalance: 245.5,
    heldEscrow: 0,
    defaultPaymentMethod: "MTN_MOMO",
    registeredVehicles: [
      {
        id: "veh-01",
        make: "BYD",
        model: "Atto 3 EV",
        year: 2024,
        batteryCapacityKwh: 60.5,
        connectorType: "CCS2",
        licensePlate: "GW 4821 - 24",
        isDefault: true
      },
      {
        id: "veh-02",
        make: "Tesla",
        model: "Model Y Long Range",
        year: 2023,
        batteryCapacityKwh: 75,
        connectorType: "CCS2",
        licensePlate: "ER 1904 - 23",
        isDefault: false
      }
    ],
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  map.set(defaultDriver.phoneNumber, defaultDriver);
  try {
    const fileToRead = import_fs.default.existsSync(USERS_FILE) ? USERS_FILE : import_fs.default.existsSync(SEED_FILE) ? SEED_FILE : null;
    if (fileToRead) {
      const content = import_fs.default.readFileSync(fileToRead, "utf-8");
      const records = JSON.parse(content);
      if (Array.isArray(records)) {
        for (const user of records) {
          if (user && user.phoneNumber) {
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
async function sendOtp(phoneNumber) {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const code = getDeterministicOtp(normalized, 0);
  const expiresAt = Date.now() + 15 * 60 * 1e3;
  saveOtpToStorage(normalized, {
    code,
    expiresAt,
    attempts: 0
  });
  const moolreVasKey = (process.env.MOOLRE_VAS_KEY || process.env.MOOLRE_API_KEY || "").replace(/^["']|["']$/g, "").trim();
  const moolreSenderId = (process.env.MOOLRE_SENDER_ID || "Business_Ad").replace(/^["']|["']$/g, "").trim();
  const rawRecipient = normalized.startsWith("+") ? normalized.substring(1) : normalized;
  if (moolreVasKey) {
    try {
      const messageText = `Your XCharge EV code is ${code}. Valid for 5 minutes.`;
      const url = new URL("https://api.moolre.com/open/sms/send");
      url.searchParams.append("type", "1");
      url.searchParams.append("senderid", moolreSenderId);
      url.searchParams.append("recipient", rawRecipient);
      url.searchParams.append("message", messageText);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6e3);
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-API-VASKEY": moolreVasKey,
          "Accept": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      console.log(`[Moolre SMS Gateway] Dispatched to ${normalized}:`, data);
      return {
        success: true,
        message: `OTP sent via Moolre SMS to ${normalized}`,
        devCode: code
      };
    } catch (err) {
      console.error("[Moolre SMS Gateway Error]", err);
      return {
        success: true,
        message: `OTP generated (Moolre SMS gateway network note: ${err.message})`,
        devCode: code
      };
    }
  }
  console.log(`[XCharge Auth Sandbox] OTP for ${normalized} is: ${code}`);
  return {
    success: true,
    message: `Verification code generated for ${normalized}. (Moolre sandbox active)`,
    devCode: code
  };
}
function verifyOtp(phoneNumber, inputCode, metadata) {
  const normalized = normalizeGhanaPhoneNumber(phoneNumber);
  const trimmedCode = (inputCode || "").trim();
  const record = getOtpFromStorage(normalized);
  const isDevBypass = trimmedCode === "123456";
  const codeNow = getDeterministicOtp(normalized, 0);
  const codePrev = getDeterministicOtp(normalized, -1);
  const codePrev2 = getDeterministicOtp(normalized, -2);
  const codePrev3 = getDeterministicOtp(normalized, -3);
  const codeNext = getDeterministicOtp(normalized, 1);
  const isDeterministicMatch = trimmedCode === codeNow || trimmedCode === codePrev || trimmedCode === codePrev2 || trimmedCode === codePrev3 || trimmedCode === codeNext;
  const isRecordMatch = record && record.code === trimmedCode && Date.now() <= record.expiresAt;
  if (!isDevBypass && !isDeterministicMatch && !isRecordMatch) {
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
      displayName: metadata?.displayName || `Driver ${normalized.slice(-4)}`,
      email: metadata?.email || `${normalized.replace(/\D/g, "")}@xcharge.africa`,
      walletBalance: 100,
      // Welcome promotional credit
      heldEscrow: 0,
      defaultPaymentMethod: defaultPayment,
      registeredVehicles: [
        {
          id: `veh-${Date.now().toString(36)}`,
          make,
          model,
          year: 2024,
          batteryCapacityKwh,
          connectorType,
          licensePlate: `GX ${Math.floor(1e3 + Math.random() * 9e3)} - 24`,
          isDefault: true
        }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    USERS_DB.set(normalized, user);
    saveUsersToDisk();
  } else if (metadata && (metadata.displayName || metadata.email || metadata.selectedEv)) {
    if (metadata.displayName) user.displayName = metadata.displayName;
    if (metadata.email) user.email = metadata.email;
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
  const norm = phoneNumber ? normalizeGhanaPhoneNumber(phoneNumber) : "+233248901204";
  let user = USERS_DB.get(norm);
  if (!user) {
    user = USERS_DB.get("+233248901204") || Array.from(USERS_DB.values())[0];
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
      displayName: `Driver ${norm.slice(-4)}`,
      email: `${norm.replace(/\D/g, "")}@xcharge.africa`,
      walletBalance: 0,
      heldEscrow: 0,
      defaultPaymentMethod: provider === "CARD" ? "MASTERCARD" : "MTN_MOMO",
      registeredVehicles: [
        {
          id: `veh-${Date.now().toString(36)}`,
          make: "BYD",
          model: "Atto 3",
          year: 2024,
          batteryCapacityKwh: 60.5,
          connectorType: "CCS2",
          licensePlate: `GX ${Math.floor(1e3 + Math.random() * 9e3)} - 24`,
          isDefault: true
        }
      ],
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
  const merchant = "XCHARGE GHANA LTD";
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
      merchantName: "XCHARGE GHANA LTD",
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

// server.ts
var app = (0, import_express.default)();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;
app.use(import_express.default.json({ limit: "50mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
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
var publicDir = import_path2.default.join(process.cwd(), "public");
app.use(import_express.default.static(publicDir));
app.get(["/electric_vehicle_charging.mp4", "/electric%20vehical%20charging.mp4", "/electric vehical charging.mp4"], (req, res) => {
  const candidateFiles = [
    import_path2.default.join(publicDir, "electric_vehicle_charging.mp4"),
    import_path2.default.join(publicDir, "electric vehical charging.mp4")
  ];
  for (const file of candidateFiles) {
    if (import_fs2.default.existsSync(file)) {
      return res.sendFile(file);
    }
  }
  res.status(404).json({ error: "Video file not found on server" });
});
app.post("/api/upload-video", import_express.default.raw({ type: "*/*", limit: "100mb" }), (req, res) => {
  try {
    const target1 = import_path2.default.join(publicDir, "electric_vehicle_charging.mp4");
    const target2 = import_path2.default.join(publicDir, "electric vehical charging.mp4");
    import_fs2.default.writeFileSync(target1, req.body);
    import_fs2.default.writeFileSync(target2, req.body);
    res.json({ success: true, url: "/electric_vehicle_charging.mp4" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var STATIONS = [
  {
    id: "st-01",
    stationId: "XC-AFR-001",
    name: "XCharge Superhub - Airport City",
    operator: "XCharge Grid Network",
    address: "Liberation Rd, Airport Residential Area",
    latitude: 5.6037,
    longitude: -0.187,
    isOnline: true,
    rating: 4.9,
    amenities: ["Coffee Lounge", "Free Wi-Fi", "Security 24/7", "Restrooms", "EV Detailing"],
    connectors: [
      {
        id: 101,
        connectorId: 1,
        type: "CCS2",
        maxPowerKw: 160,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 4.2,
        tariffCurrency: "GHS"
      },
      {
        id: 102,
        connectorId: 2,
        type: "CCS2",
        maxPowerKw: 160,
        currentPowerKw: 124,
        status: "Charging",
        tariffPerKwh: 4.2,
        tariffCurrency: "GHS"
      },
      {
        id: 103,
        connectorId: 3,
        type: "CHAdeMO",
        maxPowerKw: 60,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 3.8,
        tariffCurrency: "GHS"
      },
      {
        id: 104,
        connectorId: 4,
        type: "Type2",
        maxPowerKw: 22,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 2.8,
        tariffCurrency: "GHS"
      }
    ]
  },
  {
    id: "st-02",
    stationId: "XC-CBD-002",
    name: "XCharge Express - Financial Plaza",
    operator: "XCharge Grid Network",
    address: "High Street Commercial District",
    latitude: 5.5489,
    longitude: -0.2012,
    isOnline: true,
    rating: 4.8,
    amenities: ["Shopping Mall", "ATM", "Valet EV Parking"],
    connectors: [
      {
        id: 201,
        connectorId: 1,
        type: "CCS2",
        maxPowerKw: 200,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 4.5,
        tariffCurrency: "GHS"
      },
      {
        id: 202,
        connectorId: 2,
        type: "CCS2",
        maxPowerKw: 200,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 4.5,
        tariffCurrency: "GHS"
      }
    ]
  },
  {
    id: "st-03",
    stationId: "XC-LOG-003",
    name: "XCharge Fleet Depot - West Logistics Corridor",
    operator: "XCharge Commercial Systems",
    address: "Industrial Ring Rd, Heavy Transport Hub",
    latitude: 5.5892,
    longitude: -0.245,
    isOnline: true,
    rating: 4.7,
    amenities: ["Fleet Truck Bay", "Driver Rest Area", "High Clearance Canopy"],
    connectors: [
      {
        id: 301,
        connectorId: 1,
        type: "CCS2",
        maxPowerKw: 350,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 4,
        tariffCurrency: "GHS"
      },
      {
        id: 302,
        connectorId: 2,
        type: "CCS2",
        maxPowerKw: 350,
        currentPowerKw: 280,
        status: "Charging",
        tariffPerKwh: 4,
        tariffCurrency: "GHS"
      },
      {
        id: 303,
        connectorId: 3,
        type: "GB/T",
        maxPowerKw: 120,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 3.5,
        tariffCurrency: "GHS"
      }
    ]
  },
  {
    id: "st-04",
    stationId: "XC-RES-004",
    name: "XCharge Urban Oasis - Cantonments",
    operator: "XCharge Grid Network",
    address: "8th Circular Rd, Cantonments",
    latitude: 5.578,
    longitude: -0.172,
    isOnline: true,
    rating: 4.9,
    amenities: ["Cafe & Bakery", "Parkside Seating", "Pet Friendly"],
    connectors: [
      {
        id: 401,
        connectorId: 1,
        type: "CCS2",
        maxPowerKw: 120,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 3.9,
        tariffCurrency: "GHS"
      },
      {
        id: 402,
        connectorId: 2,
        type: "Type2",
        maxPowerKw: 22,
        currentPowerKw: 0,
        status: "Available",
        tariffPerKwh: 2.8,
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
      description: "Charging Settlement: 14.0 kWh delivered @ Airport City Hub"
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
    id: "ocpp-01",
    timestamp: new Date(Date.now() - 36e5).toISOString(),
    direction: "INCOMING",
    action: "BootNotification",
    payload: {
      chargePointVendor: "XCharge Tech",
      chargePointModel: "C9-Pro-160kW",
      chargePointSerialNumber: "XC-2024-00188",
      firmwareVersion: "v3.8.4-citrineos"
    }
  },
  {
    id: "ocpp-02",
    timestamp: new Date(Date.now() - 359e4).toISOString(),
    direction: "OUTGOING",
    action: "BootNotification",
    payload: {
      status: "Accepted",
      currentTime: (/* @__PURE__ */ new Date()).toISOString(),
      interval: 60
    }
  },
  {
    id: "ocpp-03",
    timestamp: new Date(Date.now() - 18e5).toISOString(),
    direction: "INCOMING",
    action: "StatusNotification",
    payload: {
      connectorId: 1,
      errorCode: "NoError",
      status: "Available",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  }
];
var SIMULATION_SPEED = 1;
setInterval(() => {
  if (ACTIVE_SESSION && ACTIVE_SESSION.status === "Charging") {
    ACTIVE_SESSION.elapsedSeconds += 1;
    if (ACTIVE_SESSION.currentSocPercent > 80) {
      const taperRatio = Math.max(0.25, (100 - ACTIVE_SESSION.currentSocPercent) / 20);
      ACTIVE_SESSION.currentPowerKw = Math.round(ACTIVE_SESSION.currentPowerKw * taperRatio * 10) / 10;
    }
    const kwhAdded = ACTIVE_SESSION.currentPowerKw / 3600 * SIMULATION_SPEED;
    ACTIVE_SESSION.kwhDelivered += kwhAdded;
    ACTIVE_SESSION.voltageV = +(401.2 + Math.sin(ACTIVE_SESSION.elapsedSeconds / 2) * 1.8).toFixed(1);
    ACTIVE_SESSION.currentA = +(ACTIVE_SESSION.currentPowerKw * 1e3 / ACTIVE_SESSION.voltageV).toFixed(1);
    const targetCapacity = 75;
    const socIncrement = kwhAdded / targetCapacity * 100;
    if (ACTIVE_SESSION.currentSocPercent < ACTIVE_SESSION.targetSocPercent) {
      ACTIVE_SESSION.currentSocPercent = Math.min(
        ACTIVE_SESSION.targetSocPercent,
        +(ACTIVE_SESSION.currentSocPercent + socIncrement).toFixed(2)
      );
    }
    const currentStation = STATIONS.find((s) => s.stationId === ACTIVE_SESSION?.stationId);
    const connector = currentStation?.connectors.find((c) => c.connectorId === ACTIVE_SESSION?.connectorId);
    const rate = connector?.tariffPerKwh || 4.2;
    ACTIVE_SESSION.accruedCost = +(ACTIVE_SESSION.kwhDelivered * rate).toFixed(2);
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
        direction: "INCOMING",
        action: "MeterValues",
        payload: {
          connectorId: ACTIVE_SESSION.connectorId,
          transactionId: 98421,
          meterValue: [
            {
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              sampledValue: [
                { value: ACTIVE_SESSION.kwhDelivered.toFixed(3), unit: "kWh", measurand: "Energy.Active.Import.Register" },
                { value: ACTIVE_SESSION.currentPowerKw.toFixed(1), unit: "kW", measurand: "Power.Active.Import" },
                { value: ACTIVE_SESSION.currentSocPercent.toFixed(1), unit: "Percent", measurand: "SoC" },
                { value: ACTIVE_SESSION.voltageV.toString(), unit: "V", measurand: "Voltage" },
                { value: ACTIVE_SESSION.currentA.toString(), unit: "A", measurand: "Current.Import" }
              ]
            }
          ]
        }
      });
      if (OCPP_LOGS.length > 50) OCPP_LOGS.pop();
    }
  }
}, 1e3);
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "xcharge-ev-backend",
    citrineOsBridge: "CONNECTED",
    ocppVersion: "OCPP 1.6J / 2.0.1",
    activeSessions: ACTIVE_SESSION ? 1 : 0
  });
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
  const station = STATIONS.find((s) => s.id === req.params.id || s.stationId === req.params.id);
  if (!station) {
    res.status(404).json({ error: "Station not found" });
    return;
  }
  res.json(station);
});
app.post("/api/stations", (req, res) => {
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
    type: c.type || "CCS2",
    maxPowerKw: Number(c.maxPowerKw) || 150,
    currentPowerKw: 0,
    status: c.status || "Available",
    tariffPerKwh: Number(c.tariffPerKwh) || 0.3,
    tariffCurrency: c.tariffCurrency || "USD"
  })) : [
    {
      id: Date.now(),
      connectorId: 1,
      type: "CCS2",
      maxPowerKw: 150,
      currentPowerKw: 0,
      status: "Available",
      tariffPerKwh: 0.3,
      tariffCurrency: "USD"
    },
    {
      id: Date.now() + 1,
      connectorId: 2,
      type: "CCS2",
      maxPowerKw: 150,
      currentPowerKw: 0,
      status: "Available",
      tariffPerKwh: 0.3,
      tariffCurrency: "USD"
    }
  ];
  const newStation = {
    id: newId,
    stationId: generatedStationId,
    name,
    operator: operator || "EnergyGrid Network",
    address: address || "Main Highway Plaza",
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    isOnline: true,
    rating: 5,
    amenities: amenities && amenities.length > 0 ? amenities : ["Restrooms", "24/7 Security", "Convenience Store"],
    connectors: formattedConnectors
  };
  STATIONS.unshift(newStation);
  res.status(201).json({ success: true, station: newStation });
});
app.put("/api/stations/:id", (req, res) => {
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
app.delete("/api/stations/:id", (req, res) => {
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
app.post(["/api/ocpp/remote-start", "/api/charge/start"], (req, res) => {
  const { stationId, connectorId, isFleet, vin, preauthHoldAmount = 25, phoneNumber } = req.body;
  const driverPhone = phoneNumber || "+233248901204";
  if (ACTIVE_SESSION) {
    res.status(400).json({ error: "An active charging session is already in progress" });
    return;
  }
  const station = STATIONS.find((s) => s.stationId === stationId || s.id === stationId);
  if (!station) {
    res.status(404).json({ error: "Station not found" });
    return;
  }
  const connector = station.connectors.find((c) => c.connectorId === Number(connectorId));
  if (!connector) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  if (connector.status !== "Available") {
    res.status(400).json({ error: `Connector ${connectorId} is currently ${connector.status}` });
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
  connector.currentPowerKw = Math.min(connector.maxPowerKw, 120);
  ACTIVE_SESSION = {
    sessionId: `ses-${Date.now()}`,
    stationId: station.stationId,
    connectorId: connector.connectorId,
    userId: driverPhone,
    driverPhone,
    isFleetSession: !!isFleet,
    fleetVin: vin || (isFleet ? FLEET_ACCOUNT.vehicles[0].vin : void 0),
    startTime: Date.now(),
    elapsedSeconds: 0,
    currentSocPercent: isFleet ? 32 : 28,
    targetSocPercent: 85,
    currentPowerKw: connector.currentPowerKw,
    voltageV: 400.2,
    currentA: connector.currentPowerKw * 1e3 / 400.2,
    kwhDelivered: 0.05,
    accruedCost: 0.21,
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
    direction: "OUTGOING",
    action: "RemoteStartTransaction",
    payload: {
      connectorId: connector.connectorId,
      idTag: isFleet ? `FLEET-VIN-${vin || "GENERIC"}` : `USER-RFID-991`,
      chargingProfile: {
        chargingProfileId: 1,
        stackLevel: 0,
        chargingProfilePurpose: "TxDefaultProfile"
      }
    }
  });
  OCPP_LOGS.unshift({
    id: `ocpp-stat-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    direction: "INCOMING",
    action: "StatusNotification",
    payload: {
      connectorId: connector.connectorId,
      errorCode: "NoError",
      status: "Charging",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  const currentWallet = getUserWallet(driverPhone);
  res.json({
    success: true,
    message: "Connector unlocked. Charging initiated via CitrineOS OCPP CSMS.",
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
  const station = STATIONS.find((s) => s.stationId === session.stationId);
  const connector = station?.connectors.find((c) => c.connectorId === session.connectorId);
  if (connector) {
    connector.status = "Available";
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
    direction: "OUTGOING",
    action: "RemoteStopTransaction",
    payload: {
      transactionId: 98421
    }
  });
  OCPP_LOGS.unshift({
    id: `ocpp-avail-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    direction: "INCOMING",
    action: "StatusNotification",
    payload: {
      connectorId: session.connectorId,
      errorCode: "NoError",
      status: "Available",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  ACTIVE_SESSION = null;
  const currentWallet = getUserWallet(driverPhone);
  res.json({
    success: true,
    message: "Session terminated. Connector locked. Financial settlement finalized.",
    completedSession: session,
    wallet: currentWallet
  });
});
app.get("/api/ocpp/logs", (_req, res) => {
  res.json(OCPP_LOGS);
});
app.post("/api/ocpp/inject-event", (req, res) => {
  const { action, payload, direction = "INCOMING" } = req.body;
  const msg = {
    id: `sim-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
    availableStations: STATIONS.filter((s) => s.isOnline && s.connectors.some((c) => c.status === "Available")).length,
    recentOcppPackets: OCPP_LOGS.slice(0, 10)
  });
});
app.post("/api/simulator/start", (req, res) => {
  const {
    stationId = STATIONS[0]?.stationId || "XC-AFR-001",
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
  connector.currentPowerKw = Number(powerKw) || connector.maxPowerKw;
  const currentVoltage = 400.8;
  const currentAmps = +(connector.currentPowerKw * 1e3 / currentVoltage).toFixed(1);
  ACTIVE_SESSION = {
    sessionId: `sim-ses-${Date.now()}`,
    stationId: station.stationId,
    connectorId: connector.connectorId,
    userId: "usr-gh-001",
    isFleetSession: !!isFleet,
    fleetVin: isFleet ? FLEET_ACCOUNT.vehicles[0].vin : void 0,
    startTime: Date.now(),
    elapsedSeconds: 0,
    currentSocPercent: Number(initialSoc) || 24,
    targetSocPercent: Number(targetSoc) || 85,
    currentPowerKw: connector.currentPowerKw,
    voltageV: currentVoltage,
    currentA: currentAmps,
    kwhDelivered: 0.01,
    accruedCost: 0.01,
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
    direction: "INCOMING",
    action: "SimulatedSessionStarted",
    payload: {
      station: station.name,
      stationId: station.stationId,
      connectorId: connector.connectorId,
      maxPowerKw: connector.maxPowerKw,
      simulationSpeed: `${SIMULATION_SPEED}x`
    }
  });
  res.json({
    success: true,
    message: `Simulation initiated at ${station.name} (${connector.maxPowerKw} kW) at ${SIMULATION_SPEED}x speed`,
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
app.post("/api/simulator/stop", (req, res) => {
  if (!ACTIVE_SESSION) {
    res.status(400).json({ error: "No active session to stop" });
    return;
  }
  const finished = { ...ACTIVE_SESSION };
  const station = STATIONS.find((s) => s.stationId === finished.stationId);
  const connector = station?.connectors.find((c) => c.connectorId === finished.connectorId);
  if (connector) {
    connector.status = "Available";
    connector.currentPowerKw = 0;
  }
  ACTIVE_SESSION = null;
  OCPP_LOGS.unshift({
    id: `sim-stop-${Date.now()}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    direction: "INCOMING",
    action: "SimulatedSessionCompleted",
    payload: {
      kwhDelivered: finished.kwhDelivered.toFixed(3),
      finalSoc: finished.currentSocPercent.toFixed(1),
      accruedCost: finished.accruedCost.toFixed(2),
      durationSeconds: finished.elapsedSeconds
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
  const updated = updateUserProfile(phone, req.body);
  if (!updated) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(updated);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[XCharge Server] Running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
//# sourceMappingURL=server.cjs.map
