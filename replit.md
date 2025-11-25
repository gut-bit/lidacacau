# Agro work - Marketplace de Serviços Rurais para Cacau

## Overview
Agro work é um aplicativo mobile (Expo React Native) de marketplace que conecta produtores de cacau com trabalhadores rurais em Uruará/PA, Brasil. O app permite publicação de demandas de serviço, sistema de propostas, rastreamento GPS de trabalho, upload de fotos e avaliações bilaterais.

## Project Status: MVP Completo
- Autenticação com 3 perfis: Produtor, Trabalhador e Admin
- Sistema de criação de demandas e propostas
- Rastreamento GPS com check-in/check-out
- Sistema de avaliação bilateral (5 critérios)
- Gamificação de trabalhadores (níveis N1-N5)
- Interface 100% em Português (PT-BR)

## Recent Changes
- 2025-11-25 (Latest): Integração de gerenciamento de propriedades com GPS (expo-location) e upload de múltiplas fotos para demandas
  - ProducerPropertiesScreen: Tela para adicionar/remover propriedades com localização automática
  - Enhanced CreateJobScreen: Upload de até 5 fotos com preview e descrição incentivada
  - Property management no perfil do produtor
- 2025-11-25: Criação completa do MVP com todas as telas e funcionalidades

## Project Architecture

### Data Flow
```
Produtor -> Cria Demanda -> Trabalhador Envia Proposta
-> Produtor Aceita -> Ordem de Serviço Criada
-> Trabalhador Check-in (GPS) -> Executa Serviço -> Check-out (GPS + Fotos)
-> Produtor Confirma Conclusão -> Avaliações Bilaterais
```

### Directory Structure
```
/App.tsx                 # Entry point with ErrorBoundary
/screens/
  /auth/LoginScreen.tsx  # Login e cadastro com seleção de perfil
  /producer/            # Telas do produtor (Início, Criar Demanda, Histórico, Perfil)
  /worker/              # Telas do trabalhador (Trabalhos, Ativo, Histórico, Perfil)
  /admin/               # Telas do admin (Dashboard, Usuários, Serviços)
  /shared/              # Telas compartilhadas (Detalhes, Avaliação)
/navigation/
  RootNavigator.tsx     # Navegação principal com autenticação
  ProducerTabNavigator.tsx
  WorkerTabNavigator.tsx
  AdminStackNavigator.tsx
/contexts/
  AuthContext.tsx       # Contexto de autenticação
/types/
  index.ts              # Tipos TypeScript (User, Job, Bid, WorkOrder, Review)
/utils/
  storage.ts            # Persistência com AsyncStorage
  format.ts             # Formatação de moeda, datas, status
/data/
  serviceTypes.ts       # Tipos de serviço (Poda, Enxertia, Colheita, etc.)
/constants/
  theme.ts              # Sistema de design com cores do cacau
```

### Key Features

#### 1. Tipos de Serviço
- Poda (N1+, R$0.50/planta)
- Enxertia (N2+, R$2.00/enxerto)
- Colheita (N1+, R$15.00/saca)
- Roçagem (N1+, R$150.00/hectare)
- Aplicação (N2+, R$80.00/hectare)
- Trator (N3+, R$180.00/hora)
- Motorista (N4+, R$250.00/dia)

#### 2. Sistema de Níveis (Gamificação)
- N1 (Iniciante): Novos trabalhadores
- N2 (Experiente): 5+ avaliações, média 3.5+
- N3 (Profissional): 10+ avaliações, média 4.0+
- N4 (Especialista): 15+ avaliações, média 4.3+
- N5 (Mestre): 20+ avaliações, média 4.5+

#### 3. Critérios de Avaliação
- Qualidade do trabalho
- Segurança
- Pontualidade
- Comunicação
- Justiça/Preço

## Design Guidelines

### Color Palette
- Primary (Verde Mata): #2D5016
- Secondary (Marrom Cacau): #8B4513
- Accent (Amarelo Fruto): #FFB800
- Success: #22C55E
- Error: #EF4444
- Warning: #F59E0B

### Level Colors
- N1: #78716C (Cinza)
- N2: #22C55E (Verde)
- N3: #3B82F6 (Azul)
- N4: #8B5CF6 (Roxo)
- N5: #FFB800 (Dourado)

## User Preferences
- Idioma: Português (PT-BR)
- Foco: Android (via Expo Go)
- Design: iOS 26 Liquid Glass style
- Sem emojis na interface

## Technical Notes
- Persistência: AsyncStorage (offline-first)
- Localização: expo-location (check-in/check-out GPS + gerenciamento de propriedades)
- Fotos: expo-image-picker (criação de demandas com até 5 fotos + antes/depois do serviço)
- Navegação: React Navigation 7+
- Tema: Suporte dark/light mode

## New Features (Latest Update)

### Property Management System
- Produtores podem adicionar propriedades através da tela "Gerenciar Propriedades"
- Localização automática com GPS (reverse geocoding)
- Nome customizável para cada propriedade
- Removê-las quando necessário
- Acessível via menu do Perfil do Produtor

### Enhanced Job Creation
- Upload de múltiplas fotos (até 5) para melhorar visibilidade da demanda
- Preview em miniatura com opção de remoção
- Campo de descrição obrigatório com dicas:
  - Incentiva descrição detalhada
  - Sugere incluir: padrão desejado, requisitos especiais, urgência, contatos
  - Dica visual com ícone de lightbulb
- Validação de descrição não-vazia
- Fotos armazenadas com a demanda
