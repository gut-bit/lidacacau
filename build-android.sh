#!/bin/bash

# ============================================
# Empleitapp - Script de Build Android
# ============================================
# Execute este script no seu computador local
# apos baixar o projeto do Replit
# ============================================

set -e

echo ""
echo "=========================================="
echo "   EMPLEITAPP - Build Android (Play Store)"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Passo 1: Verificar Node.js
echo -e "${BLUE}[1/5]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js nao encontrado. Por favor instale: https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}Node.js encontrado: $(node -v)${NC}"
echo ""

# Passo 2: Instalar dependencias
echo -e "${BLUE}[2/5]${NC} Instalando dependencias do projeto..."
npm install
echo -e "${GREEN}Dependencias instaladas!${NC}"
echo ""

# Passo 3: Instalar EAS CLI
echo -e "${BLUE}[3/5]${NC} Instalando EAS CLI..."
npm install -g eas-cli
echo -e "${GREEN}EAS CLI instalado: $(npx eas-cli --version)${NC}"
echo ""

# Passo 4: Login no Expo
echo -e "${BLUE}[4/5]${NC} Fazendo login no Expo..."
echo -e "${YELLOW}Se ja estiver logado, pressione Ctrl+C e execute o passo 5 manualmente${NC}"
npx eas-cli login
echo -e "${GREEN}Login realizado!${NC}"
echo ""

# Passo 5: Executar Build
echo -e "${BLUE}[5/5]${NC} Iniciando build de producao Android..."
echo ""
echo -e "${YELLOW}IMPORTANTE:${NC}"
echo "- O build leva aproximadamente 15-20 minutos"
echo "- Quando perguntado sobre Keystore, responda 'Yes' para gerar novo"
echo "- O arquivo .aab sera disponibilizado para download no final"
echo ""
read -p "Pressione ENTER para iniciar o build..."
echo ""

npx eas-cli build --platform android --profile production

echo ""
echo "=========================================="
echo -e "${GREEN}   BUILD CONCLUIDO!${NC}"
echo "=========================================="
echo ""
echo "Proximos passos:"
echo "1. Acesse https://expo.dev para baixar o arquivo .aab"
echo "2. Faca upload no Google Play Console"
echo "3. Preencha a ficha da loja (descricoes em PLAY_STORE_GUIDE.md)"
echo ""
echo "Duvidas? Consulte PLAY_STORE_GUIDE.md"
echo ""
