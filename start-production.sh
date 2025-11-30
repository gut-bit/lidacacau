#!/bin/bash

echo "[LidaCacau] Iniciando build para producao..."

# Build do Expo Web
echo "[LidaCacau] Exportando Expo Web..."
npx expo export --platform web

# Iniciar servidor em producao
echo "[LidaCacau] Iniciando servidor..."
NODE_ENV=production npx tsx server/index.ts
