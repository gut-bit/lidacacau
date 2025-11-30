#!/bin/bash
export NODE_ENV=production
export PORT=3001
echo "[LidaCacau] Starting API server on port $PORT..."
npx tsx server/index.ts
