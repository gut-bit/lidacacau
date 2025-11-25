# Design Guidelines - Plataforma de Serviços Rurais do Cacau

## Architecture Decisions

### Authentication
**Auth Required** - Multi-user marketplace with:
- **Email/Password Authentication** (rural context may have limited SSO adoption)
- Login and cadastro screens for Produtor and Trabalhador
- Admin bootstrap via configuração inicial
- Profile screens with:
  - Avatar personalizável (gerar 3 avatars relacionados ao tema rural/cacau)
  - Nome de exibição
  - Configurações de notificações
- Logout com confirmação
- Excluir conta (em Settings > Conta > Excluir com dupla confirmação)

### Navigation
**Tab Navigation** (4 tabs para Produtor, 4 tabs para Trabalhador):

**Produtor:**
1. Início (demandas ativas)
2. Criar (floating action button - criar nova demanda)
3. Histórico (serviços concluídos)
4. Perfil (configurações e avaliações)

**Trabalhador:**
1. Trabalhos (demandas disponíveis)
2. Criar (floating action button - serviço ativo/check-in)
3. Histórico (serviços concluídos)
4. Perfil (nível, estatísticas, configurações)

**Admin:** Stack-only navigation (lista usuários → detalhes, gerenciar serviços)

## Screen Specifications

### 1. Login/Cadastro
- **Purpose:** Autenticação de produtor ou trabalhador
- **Layout:**
  - Header: Sem navegação, apenas logo ou título da plataforma
  - Content: ScrollView com formulário centralizado
  - Top inset: insets.top + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components:**
  - Toggle segmentado: "Produtor" / "Trabalhador"
  - Campos de formulário (email, senha, nome completo para cadastro)
  - Botão principal "Entrar" ou "Criar Conta"
  - Link "Esqueci minha senha"
  - Checkbox com links de política de privacidade e termos

### 2. Início (Produtor) / Trabalhos (Trabalhador)
- **Purpose:** Lista de demandas ativas ou disponíveis
- **Layout:**
  - Header: Transparente com título "Minhas Demandas" ou "Trabalhos Disponíveis"
    - Right button: Ícone de filtro/pesquisa
  - Content: FlatList com cards de demandas
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - Card de demanda mostrando:
    - Tipo de serviço (ícone + nome)
    - Quantidade e unidade
    - Localização (texto resumido)
    - Preço/oferta destacado
    - Badge de status (Aberto, Atribuído, etc.)
    - Para trabalhador: badge de nível mínimo se aplicável
  - Empty state quando não há demandas

### 3. Detalhes da Demanda
- **Purpose:** Ver detalhes completos e propostas (produtor) ou enviar proposta (trabalhador)
- **Layout:**
  - Header: Padrão com botão voltar, título "Detalhes do Serviço"
  - Content: ScrollView
  - Top inset: Spacing.xl (header não-transparente)
  - Bottom inset: 0 (botões fixos no bottom)
- **Components:**
  - Seção de informações: tipo, quantidade, local, janela de tempo, notas
  - Mapa pequeno se lat/lng disponível
  - **Para Produtor:** Lista de propostas recebidas com card por trabalhador (nome, nível, preço, mensagem)
  - **Para Trabalhador:** Formulário de proposta (campo preço, campo mensagem opcional)
  - Botões fixos no bottom:
    - Produtor: "Aceitar Proposta" (quando selecionar uma)
    - Trabalhador: "Enviar Proposta" ou "Atualizar Proposta"

### 4. Criar Demanda (Produtor)
- **Purpose:** Criar nova demanda de serviço
- **Layout:**
  - Header: Título "Nova Demanda", left button "Cancelar", right button "Publicar"
  - Content: ScrollView com formulário
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components:**
  - Dropdown: Tipo de serviço
  - Input numérico: Quantidade
  - Input texto: Localização (com botão "Usar minha localização atual")
  - Date picker: Data início e fim (opcional)
  - Input monetário: Oferta (R$)
  - TextArea: Notas/padrão desejado
  - Validação inline

### 5. Ordem de Serviço Ativa (Trabalhador)
- **Purpose:** Check-in/out e upload de evidências
- **Layout:**
  - Header: "Serviço em Andamento", right button ícone de ajuda
  - Content: ScrollView com status cards
  - Floating button: "Check-in" ou "Check-out" (tamanho grande, cor primária)
    - Shadow: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl + 80 (espaço para floating button)
- **Components:**
  - Card de informações do serviço
  - Timeline de status: Atribuído → Check-in → Check-out → Concluído
  - Após check-in: mostrar hora e coordenadas
  - Antes de check-out: botões para adicionar fotos (antes/depois)
  - Galeria de fotos adicionadas (thumbnails)

### 6. Avaliação Bilateral
- **Purpose:** Avaliar a outra parte após conclusão
- **Layout:**
  - Header: "Avaliar Serviço", left button "Cancelar", right button "Enviar"
  - Content: ScrollView
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components:**
  - Avatar e nome da outra parte
  - 5 critérios com estrelas (1-5):
    - Qualidade
    - Segurança
    - Pontualidade
    - Comunicação
    - Justiça/Preço
  - TextArea: Comentário opcional
  - Preview da média calculada

### 7. Perfil (Trabalhador com Gamificação)
- **Purpose:** Mostrar estatísticas, nível e configurações
- **Layout:**
  - Header: Transparente, título "Perfil"
  - Content: ScrollView
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: tabBarHeight + Spacing.xl
- **Components:**
  - Header section: Avatar, nome, nível atual (badge destaque)
  - Barra de progresso: próximo nível com texto explicativo
  - Cards de estatísticas: Total de serviços, média de avaliações, taxa de conclusão
  - Lista de configurações: Notificações, Editar perfil, Ajuda, Sair
  - Seção "Minhas Avaliações" (lista resumida)

### 8. Painel Admin
- **Purpose:** Gerenciar usuários, serviços e ver estatísticas
- **Layout:**
  - Stack navigation com drawer opcional para seções
  - Screens: Dashboard, Usuários, Tipos de Serviço, Estatísticas
- **Components:**
  - Cards de métricas resumidas
  - Listas filtráveis
  - Formulários de criação/edição de tipos de serviço

## Design System

### Color Palette
- **Primary:** #2D5016 (verde escuro cacau/floresta)
- **Primary Light:** #4A7C2C
- **Secondary:** #8B4513 (marrom cacau)
- **Accent:** #FFB800 (amarelo/dourado - fruto do cacau maduro)
- **Success:** #28A745
- **Warning:** #FFC107
- **Error:** #DC3545
- **Background:** #F5F5F5
- **Card Background:** #FFFFFF
- **Text Primary:** #212529
- **Text Secondary:** #6C757D
- **Border:** #DEE2E6

### Typography
- **Font Family:** System default (Roboto para Android)
- **Heading 1:** 28sp, Bold, cor Text Primary
- **Heading 2:** 22sp, SemiBold, cor Text Primary
- **Heading 3:** 18sp, SemiBold, cor Text Primary
- **Body:** 16sp, Regular, cor Text Primary
- **Caption:** 14sp, Regular, cor Text Secondary
- **Label:** 14sp, Medium, cor Text Primary

### Spacing Scale
- xs: 4dp
- sm: 8dp
- md: 16dp
- lg: 24dp
- xl: 32dp
- xxl: 48dp

### Component Specifications

**Touchable Elements:**
- Minimum touch target: 48dp × 48dp
- Active state: reduzir opacity para 0.7
- Ripple effect para Android (Material Design)

**Buttons:**
- Primary: Background Primary, texto branco, border radius 8dp, padding vertical 12dp
- Secondary: Background transparent, texto Primary, border 1.5dp Primary, border radius 8dp
- Floating Action Button: 56dp × 56dp, circular, background Accent, ícone branco, elevation 6dp
  - Shadow: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2

**Cards:**
- Background branco, border radius 12dp, padding 16dp
- Subtle shadow: elevation 2dp para Android
- Margin entre cards: 12dp

**Input Fields:**
- Border radius 8dp, border 1dp cor Border
- Padding 12dp horizontal, 14dp vertical
- Focus: border 2dp cor Primary
- Error: border cor Error, helper text vermelho abaixo

**Badges (Níveis):**
- N1: Cinza (#6C757D)
- N2: Verde (#28A745)
- N3: Azul (#007BFF)
- N4: Roxo (#6610F2)
- N5: Dourado (#FFD700)
- Formato: pill shape, padding 4dp horizontal 8dp vertical, texto 12sp Bold

## Visual Design

### Icons
- **Biblioteca:** Feather icons (@expo/vector-icons)
- **Tamanho padrão:** 24dp
- **Cor padrão:** Text Primary ou Primary (contexto)
- **Ícones por serviço:**
  - Poda: scissors
  - Enxertia: activity
  - Colheita: shopping-bag
  - Roçagem: wind
  - Aplicação: droplet
  - Trator: truck
  - Motorista: navigation

### Assets Necessários
1. **Avatares para Perfil** (3 opções):
   - Avatar 1: Trabalhador rural com chapéu de palha (estilo ilustração plana)
   - Avatar 2: Produtor com cacau (estilo ilustração plana)
   - Avatar 3: Genérico profissional (estilo ilustração plana)
   - Paleta: tons terrosos (verde, marrom, amarelo) consistentes com tema cacau

2. **Logo/Splash:**
   - Ícone representando cacau + ferramentas rurais
   - Estilo: minimalista, 2-3 cores máximo

3. **Empty States:**
   - Ilustração simples para "Nenhum trabalho disponível" (trabalhador olhando mapa)
   - Ilustração para "Nenhuma demanda criada" (produtor com checklist vazio)

### Accessibility
- Contraste mínimo WCAG AA (4.5:1 para texto normal)
- Labels descritivos para screen readers
- Touch targets ≥ 48dp
- Suporte a tamanhos de fonte do sistema Android
- Feedback visual claro para todas ações (loading states, confirmações)

### Offline Considerations
- Indicador visual de status da conexão no header
- Mensagens claras quando ações requerem internet
- Cache de dados críticos para visualização offline
- Sincronização automática quando conexão restaurada