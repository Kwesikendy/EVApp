#!/usr/bin/env bash
# ==============================================================================
# XCharge EV Platform - Backend Initialization Script (Task 2)
# Initializes Node.js/Express + TypeScript, ESLint, Prettier, and Folder Structure
# ==============================================================================

set -e

echo "🚀 [XCharge Architecture] Initializing Custom API Layer (Node.js/Express + TypeScript)..."

# 1. Create project directories
mkdir -p xcharge-api/src/{controllers,models,routes,services,middlewares,config,utils,websockets}

cd xcharge-api

# 2. Initialize package.json
cat << 'EOF' > package.json
{
  "name": "xcharge-api-server",
  "version": "1.0.0",
  "description": "XCharge EV Platform API - Business logic, Wallets, CitrineOS OCPP Bridge, and Telemetry Engine",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write 'src/**/*.ts'"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "ws": "^8.18.0",
    "@prisma/client": "^5.22.0",
    "zod": "^3.23.8",
    "axios": "^1.7.9"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^22.10.0",
    "@types/ws": "^8.5.13",
    "typescript": "^5.7.2",
    "tsx": "^4.19.2",
    "prisma": "^5.22.0",
    "eslint": "^9.16.0",
    "prettier": "^3.4.2"
  }
}
EOF

# 3. Write tsconfig.json
cat << 'EOF' > tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 4. Write .env
cat << 'EOF' > .env
PORT=3000
DATABASE_URL="postgresql://xcharge_admin:xcharge_local_password123@localhost:5432/xcharge_ev_db?schema=public"
CITRINEOS_API_URL="http://localhost:8081"
CITRINEOS_WS_URL="ws://localhost:8080/ocpp"
MOMO_API_KEY="test_momo_secret_key"
MOMO_PREAUTH_HOLD_AMOUNT=20.00
EOF

# 5. Scaffold Telemetry Service (WebSocket broadcaster)
cat << 'EOF' > src/services/telemetry.service.ts
import { WebSocketServer, WebSocket } from 'ws';

export interface TelemetryBroadcastPacket {
  sessionId: string;
  stationId: string;
  connectorId: number;
  socPercent: number;
  powerKw: number;
  kwhDelivered: number;
  accruedCost: number;
  elapsedSeconds: number;
}

export class TelemetryService {
  private static instance: TelemetryService;
  private wss: WebSocketServer | null = null;
  private activeClients: Set<WebSocket> = new Set();

  private constructor() {}

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public initialize(server: any): void {
    this.wss = new WebSocketServer({ server, path: '/ws/telemetry' });
    this.wss.on('connection', (ws: WebSocket) => {
      this.activeClients.add(ws);
      ws.on('close', () => this.activeClients.delete(ws));
    });
  }

  public broadcast(packet: TelemetryBroadcastPacket): void {
    const payload = JSON.stringify({ type: 'METER_VALUES_STREAM', data: packet });
    for (const client of this.activeClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}
EOF

echo "✅ [XCharge Architecture] Node.js backend files initialized successfully."
