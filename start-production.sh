#!/bin/bash
set -e

echo "[LidaCacau] Iniciando ambiente de producao..."

# Rodar migracoes do banco de dados
echo "[LidaCacau] Rodando migracoes do banco de dados..."
npm run db:migrate || echo "[LidaCacau] AVISO: Falha na migracao (o banco pode estar offline ou ja atualizado)"

# Iniciar servidor em producao
echo "[LidaCacau] Iniciando servidor..."
NODE_ENV=production npx tsx server/index.ts
