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
- 2025-11-25 (Latest): Dual-role system, MapHub, and enhanced profiles
  - **Dual-Role Architecture**: Users can be both Produtor and Trabalhador
  - **MapHub Component**: Interactive map centered on "Km 140 Vila Alvorada - Uruara/PA"
    - Radius selector (10km, 25km, 50km, 75km, 100km)
    - Activity markers for jobs and workers
    - Web fallback placeholder (react-native-maps not supported on web)
  - **RoleSwitcher Component**: Easy role switching in header
  - **ProfileStats Component**: Enhanced profile with badges, goals, completion tracking
  - **Home Screens Updated**: Both producer and worker screens have MapHub and RoleSwitcher
- 2025-11-25: Home screen hub com atividade da comunidade
  - ProducerHomeScreen: Feed de "Atividade na Região" com jobs de outros usuários
  - WorkerJobsScreen: Seções "Trabalhando Agora" (live), "Conquistas Recentes", e "Trabalhos Disponíveis"
  - Sample data em data/sampleData.ts para demonstrar funcionalidades
  - Status pills, badges de nível, preços e timestamps em cada card
- 2025-11-25: Integração de gerenciamento de propriedades com GPS e upload de fotos
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

### Legal Contract System - "Empreitada" (2025-11-25)
Sistema de contrato de empreitada totalmente amparado juridicamente:
- **ContractGenerator (utils/contractGenerator.ts)**: Geração automática de contratos
  - Adaptados para cada tipo de serviço e termos de pagamento negociados
  - Baseados em lei brasileira de empreitada
  - Cláusulas completas: Objeto, Período, Pagamento, Obrigações, Segurança, Conclusão, Disposições Gerais
  - Suporte a todos os 7 tipos de pagamento (por unidade, hora, diária, split, etc.)
- **ContractSigningScreen**: Tela para visualizar e assinar contratos
  - Exibe status de assinatura para produtor e trabalhador
  - Visualização completa do contrato em scroll
  - Checkbox de aceitação obrigatório
  - Rastreamento de assinatura com timestamp
  - Feedback visual de assinatura completada
  - Status "Pronto para Começar" quando ambas as partes assinam
- **Fluxo de Assinatura**:
  - Após negociação de pagamento aceita, botão "Assinar Contrato de Empreitada" aparece
  - Ambas as partes assinam digitalmente
  - Contrato armazenado em SignedContract e vinculado ao WorkOrder
  - Ambas as partes podem confirmar assinatura da outra pessoa em tempo real
- **Types adicionados**: SignedContract com campos para nomes, emails, timestamps, texto completo

## New Features (Latest Update)

### Negotiation System with Match Animation (2025-11-25)
Sistema de negociação interativo com animação estilo "Match":
- **NegotiationMatchScreen**: Animação de celebração quando proposta é aceita (estilo Tinder/Uber)
  - Animação de check com haptic feedback
  - Avatares conectados com linha animada
  - Confetti decorativo
  - Transição suave para tela de negociação
- **NegotiationTermsScreen**: Menu de negociação de pagamento com opções:
  - 100% Após Conclusão (Popular)
  - 50% Antes, 50% Depois
  - 30% Antes, 70% Depois
  - Por Unidade (planta, saca, hectare)
  - Por Hora
  - Por Diária
  - Adiantamento Personalizado
- **Fluxo de Negociação**:
  - Produtor aceita proposta → Animação de Match → Menu de Negociação
  - Ambas as partes podem propor termos de pagamento
  - Histórico de propostas salvo no WorkOrder
- **Types adicionados**: PaymentTermType, PaymentTerms, NegotiationProposal, NegotiationStatus

### NFS-e Integration (2025-11-25)
Sistema de acesso rápido à emissão de Nota Fiscal Eletrônica:
- **Tela NFSeScreen**: Acesso direto ao portal ISSIntegra da Prefeitura de Uruará
- **Botão Principal**: Abre o portal em navegador integrado (expo-web-browser)
- **Guia Passo-a-Passo**: 3 etapas para emitir nota fiscal
- **Serviços Concluídos**: Lista de trabalhos que podem precisar de nota fiscal
- **Links Úteis**: Acesso ao site da Prefeitura
- **Info Nota Avulsa**: Informação sobre NFS-e avulsa (R$ 22,90)
- **Acesso via Perfil**: Menu "Nota Fiscal Eletrônica" no perfil do produtor

Portal: https://uruara-pa.issintegra.com.br/usuarios/entrar

### Interactive Tutorial System (2025-11-25)
Novo sistema de onboarding interativo como em jogos, que guia novos usuários através das funcionalidades principais:
- **Tela de Tutorial**: Guia passo-a-passo com 6 etapas diferentes para Produtores e Trabalhadores
- **Design Gamificado**: Ícones visuais, progress bar, dicas úteis em cada etapa
- **Role-Specific**: Diferentes tutoriais adaptados para cada tipo de usuário (Produtor vs Trabalhador)
- **Fácil de Pular**: Usuários podem pular o tutorial ou voltar para etapas anteriores
- **Persistência**: Tutorial só aparece uma vez (rastreado com `tutorialCompleted`)
- **Componentes**: TutorialScreen com FlatList para navegação suave entre etapas

**Tutorial para Produtores (6 etapas)**:
1. Bem-vindo ao Agro work (visão geral)
2. Crie Sua Primeira Demanda (criar jobs)
3. Gerenciar Propriedades (GPS + localização)
4. Receba Propostas (análise de trabalhadores)
5. Acompanhe o Trabalho (GPS tracking)
6. Avalie o Trabalhador (sistema de avaliação)

**Tutorial para Trabalhadores (6 etapas)**:
1. Bem-vindo ao Agro work (ganhar dinheiro)
2. Explore Trabalhos Disponíveis (buscar jobs)
3. Envie Suas Propostas (bidding)
4. Acompanhe Seus Níveis (gamificação N1-N5)
5. Execute e Rastreie (GPS check-in/out)
6. Receba Avaliações (feedback sistema)

### Property Management System
- Produtores podem adicionar propriedades através da tela "Gerenciar Propriedades"
- Localização automática com GPS (reverse geocoding)
- Nome customizável para cada propriedade com modal
- Rename propriedades já existentes via botão Edit
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
