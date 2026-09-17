import React, { useState } from 'react';
import { Copy, Check, Terminal, Database, Server, Smartphone, Cpu, ShieldAlert, Layers } from 'lucide-react';

export const DevSetupDocs: React.FC = () => {
  const [activeTask, setActiveTask] = useState<'task1' | 'task2' | 'task3' | 'task4' | 'expo'>('task1');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-slate-950 font-sans">
      {/* Task Selector Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-4">
        {[
          { id: 'task1', label: 'Task 1: Local Architecture & Ports', icon: Layers },
          { id: 'task2', label: 'Task 2: Node.js/Express Backend', icon: Server },
          { id: 'task3', label: 'Task 3: PostgreSQL Schema (PostGIS/Prisma)', icon: Database },
          { id: 'task4', label: 'Task 4: Hardware Simulator & Telemetry', icon: Cpu },
          { id: 'expo', label: 'Mobile: React Native / Expo Go App', icon: Smartphone }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTask === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTask(t.id as any)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Task 1 Content */}
      {activeTask === 'task1' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <span>Task 1: Local Environmental Architecture & Network Routing Plan</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              To achieve sub-second real-time telemetry while avoiding cloud subscription costs during development, all hardware protocol layers, database queries, and client mobile traffic run on your local network loopback.
            </p>

            {/* Network Topology Port Map */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4 font-mono text-xs">
              <div className="text-sky-400 font-bold mb-2">📌 Exact Local Machine Port Mapping:</div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-emerald-400 font-semibold">Port 8080 (WS/WSS):</span>
                  <span>CitrineOS CSMS Central System (OCPP 1.6J/2.0.1 WebSocket endpoint)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-emerald-400 font-semibold">Port 8081 (HTTP):</span>
                  <span>CitrineOS REST API (Node.js API fires RemoteStart/RemoteStop here)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-sky-400 font-semibold">Port 3000 (HTTP/WS):</span>
                  <span>Custom Node.js/Express API Server (Wallets, MoMo, App Gateway)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-purple-400 font-semibold">Port 5432 (TCP):</span>
                  <span>PostgreSQL 15 + PostGIS (Spatial indexing for XCharge map)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-amber-400 font-semibold">Port 1883 (MQTT):</span>
                  <span>Eclipse Mosquitto (CitrineOS inter-module event bus)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-rose-400 font-semibold">Port 8081 / 19000:</span>
                  <span>Metro Bundler for Expo Go Mobile App development</span>
                </div>
              </div>
            </div>

            {/* Docker commands */}
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Step-by-Step CitrineOS Spin-up (Docker Desktop)
            </h3>
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200">
              <button
                onClick={() =>
                  handleCopy(
                    'cmd-citrineos',
                    `# 1. Clone CitrineOS community CSMS\ngit clone https://github.com/citrineos/citrineos-core.git\ncd citrineos-core\n\n# 2. Run infrastructure with Docker Compose\ndocker compose -f docker-compose.citrineos.yml up -d\n\n# 3. Verify health\ncurl http://localhost:8081/health\n# Response: {"status":"ok","csms":"CitrineOS"}`
                  )
                }
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
              >
                {copiedId === 'cmd-citrineos' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="whitespace-pre-wrap">
{`# 1. Clone CitrineOS community CSMS
git clone https://github.com/citrineos/citrineos-core.git
cd citrineos-core

# 2. Run infrastructure with Docker Compose
docker compose -f docker-compose.citrineos.yml up -d

# 3. Verify health
curl http://localhost:8081/health
# Response: {"status":"ok","csms":"CitrineOS"}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Task 2 Content */}
      {activeTask === 'task2' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Server className="w-5 h-5 text-sky-400" />
              <span>Task 2: Custom Back-End Initialization (Node.js/Express + TypeScript)</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              We structure the backend with a distinct separation of concerns: models for type safety, controllers for REST input validation, routes for clean endpoints, and an explicit telemetry WebSocket service that broadcasts live meter values directly to mobile clients.
            </p>

            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 mb-4">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                <span className="text-emerald-400 font-bold">Terminal Script: Complete Backend Scaffolding</span>
                <button
                  onClick={() =>
                    handleCopy(
                      'task2-script',
                      `mkdir -p xcharge-api/src/{controllers,models,routes,services,middlewares,config,utils}\ncd xcharge-api\nnpm init -y\nnpm install express cors dotenv ws @prisma/client zod axios\nnpm install -D typescript tsx @types/node @types/express @types/cors @types/ws prisma eslint prettier`
                    )
                  }
                  className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  {copiedId === 'task2-script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="whitespace-pre-wrap">
{`mkdir -p xcharge-api/src/{controllers,models,routes,services,middlewares,config,utils}
cd xcharge-api
npm init -y
npm install express cors dotenv ws @prisma/client zod axios
npm install -D typescript tsx @types/node @types/express @types/cors @types/ws prisma eslint prettier`}
              </pre>
            </div>

            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Telemetry WebSocket Service Layer (`src/services/telemetry.service.ts`)
            </h3>
            <p className="text-xs text-slate-400 mb-2">
              This service manages persistent WebSocket client connections and broadcasts incoming CitrineOS `MeterValues` packets in real time:
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300">
              <pre className="whitespace-pre-wrap">
{`export class TelemetryService {
  private static instance: TelemetryService;
  private wss: WebSocketServer | null = null;
  private activeClients: Set<WebSocket> = new Set();

  public broadcast(packet: TelemetryBroadcastPacket): void {
    const payload = JSON.stringify({ type: 'METER_VALUES_STREAM', data: packet });
    for (const client of this.activeClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Task 3 Content */}
      {activeTask === 'task3' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <span>Task 3: XCharge PostgreSQL + PostGIS & Prisma Schema Setup</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              XCharge relies heavily on geospatial nearest-neighbor queries to dynamically cluster fast chargers. We use PostGIS with spatial GIST indexes and create normalized tables with explicit pre-authorization hold ledgers.
            </p>

            {/* Tables Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-xs font-bold text-sky-400 uppercase">1. Users & Fleet Accounts</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Handles individual driver accounts, phone numbers, and corporate fleet matching vehicle VINs (`fleet_accounts` with credit limits).
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-xs font-bold text-amber-400 uppercase">2. Wallets & Pre-Auth Ledgers</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tracks `available_balance`, `held_balance` ($20 hold during active charging), and full MoMo top-up logs.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-xs font-bold text-emerald-400 uppercase">3. Stations & Connectors</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Stores lat/long with `GEOMETRY(Point, 4326)` for PostGIS ST_DWithin radius lookups, plus live connector status conditions.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-xs font-bold text-purple-400 uppercase">4. Telemetry Sessions</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Timeseries storage for `charge_speed_kw`, `kwh_delivered`, `accrued_cost`, voltage, and amperage.
                </p>
              </div>
            </div>

            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                <span className="text-emerald-400 font-bold">SQL / Prisma migration files available</span>
                <span className="text-xs text-slate-400">Stored in /backend-template/</span>
              </div>
              <p className="text-slate-400 text-xs">
                Run <code>npx prisma db push</code> or execute <code>/backend-template/migrations.sql</code> in PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task 4 Content */}
      {activeTask === 'task4' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span>Task 4: Local Hardware Mocking & Telemetry Integration Guide</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              To test the complete EV charging loop without a physical $30,000 DC Fast Charger, we use <strong>Ocpp-Charge-Point-Simulator</strong> or <strong>MicroOCPP</strong> to broadcast raw OCPP 1.6-J JSON packets over WebSockets to CitrineOS on <code>ws://localhost:8080/ocpp/XC-AFR-001</code>.
            </p>

            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Hardware Simulator Setup (Ocpp-Charge-Point-Simulator)
            </h3>
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 mb-4">
              <pre className="whitespace-pre-wrap">
{`# 1. Install free open-source simulator
git clone https://github.com/chargepoint/ocpp-charge-point-simulator.git
cd ocpp-charge-point-simulator
npm install

# 2. Configure endpoint to CitrineOS
export CENTRAL_SYSTEM_URL="ws://localhost:8080/ocpp/XC-AFR-001"
npm start`}
              </pre>
            </div>

            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Precise Console Logs to Watch For
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-sky-400 font-mono font-bold">1. [BootNotification]</span>
                <p className="text-slate-400 mt-1">
                  Sent on startup. Watch for <code>{'[2, "msg-001", "BootNotification", {"chargePointModel": "C9-Pro"}]'}</code> and CSMS response <code>{'[3, "msg-001", {"status": "Accepted"}]'}</code>.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-blue-400 font-mono font-bold">2. [StatusNotification: Available → Preparing → Charging]</span>
                <p className="text-slate-400 mt-1">
                  Fired when the driver initiates MoMo pre-auth hold and plug is locked into vehicle EV inlet.
                </p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <span className="text-emerald-400 font-mono font-bold">3. [MeterValues Ticker]</span>
                <p className="text-slate-400 mt-1">
                  Broadcasting every 5–10s with <code>measurand: "Energy.Active.Import.Register"</code> (kWh) and <code>"Power.Active.Import"</code> (kW) to fuel the app's ticking countdown.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expo Mobile Content */}
      {activeTask === 'expo' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <span>React Native + Expo Go Mobile App Foundation</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              The mobile application is built using <strong>Expo SDK 52 + React Native + NativeWind (Tailwind CSS)</strong>. You can run it on your physical phone with the Expo Go app or an iOS/Android simulator.
            </p>

            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 mb-4">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                <span className="text-emerald-400 font-bold">Initialize Local Expo Project</span>
                <button
                  onClick={() =>
                    handleCopy(
                      'expo-init',
                      `npx create-expo-app xcharge-mobile --template blank-typescript\ncd xcharge-mobile\nnpm install nativewind tailwindcss react-native-safe-area-context lucide-react-native axios react-native-maps\nnpx expo start`
                    )
                  }
                  className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  {copiedId === 'expo-init' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <pre className="whitespace-pre-wrap">
{`npx create-expo-app xcharge-mobile --template blank-typescript
cd xcharge-mobile
npm install nativewind tailwindcss react-native-safe-area-context lucide-react-native axios react-native-maps
npx expo start`}
              </pre>
            </div>

            <p className="text-xs text-slate-400">
              The full, production-ready <code>App.tsx</code>, <code>tailwind.config.js</code>, and <code>package.json</code> have been written to the <code>/expo-mobile/</code> folder in this project!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
