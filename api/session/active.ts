import fs from 'fs';

const OCPP_STATE_FILE = '/tmp/xcharge-data/ocpp-state.json';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (fs.existsSync(OCPP_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(OCPP_STATE_FILE, 'utf8'));
      if (state.activeSession && state.activeSession.status === 'Charging') {
        const s = state.activeSession;
        const now = Date.now();
        const elapsedSec = Math.max(1, Math.floor((now - (s.startTime || now)) / 1000));
        const powerKw = Number(s.currentPowerKw || 120);
        const kwhDelivered = Number(Math.max(s.kwhDelivered || 0.05, (powerKw / 3600) * elapsedSec).toFixed(3));
        const rate = Number(s.tariffPerKwh || 4.5);
        const accruedCost = Number((kwhDelivered * rate).toFixed(2));
        const voltageV = Number((401.2 + Math.sin(elapsedSec / 2) * 1.8).toFixed(1));
        const currentA = Number(((powerKw * 1000) / voltageV).toFixed(1));
        const soc = Math.min(s.targetSocPercent || 85, Number((28 + (kwhDelivered / 75) * 100).toFixed(1)));
        const remainingSoc = Math.max(0, (s.targetSocPercent || 85) - soc);
        const remainingMinutes = powerKw > 0 ? Math.max(1, Math.round((((remainingSoc / 100) * 75) / powerKw) * 60)) : 0;

        s.elapsedSeconds = elapsedSec;
        s.kwhDelivered = kwhDelivered;
        s.meterStopWh = Math.round((s.meterStartWh || 142500) + kwhDelivered * 1000);
        s.accruedCost = accruedCost;
        s.voltageV = voltageV;
        s.currentA = currentA;
        s.currentSocPercent = soc;
        s.remainingMinutes = remainingMinutes;
        s.temperatureC = Number((34.5 + Math.min(8, elapsedSec * 0.02)).toFixed(1));

        fs.writeFileSync(OCPP_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
        return res.status(200).json({ session: s });
      }
      return res.status(200).json({ session: state.activeSession || null });
    }
  } catch {
    // Ignore file read errors
  }

  return res.status(200).json({ session: null });
}
