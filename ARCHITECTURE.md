# LidaCacau - Arquitetura do Sistema

Este documento descreve a arquitetura do aplicativo LidaCacau e como migrar para um servidor de produção.

## Visao Geral

LidaCacau é um marketplace mobile (Expo React Native) que conecta proprietários rurais e trabalhadores na região de Uruará/PA, Brasil.

### Stack Tecnológico
- **Frontend**: React Native (Expo SDK 52)
- **Navegacao**: React Navigation 7
- **Armazenamento Local**: AsyncStorage
- **UI**: iOS 26 Liquid Glass + LidaCacau Brand System

## Estado Atual (MVP)

### Serviços Implementados

| Serviço | Status | Localização |
|---------|--------|-------------|
| Autenticação | Interface | `services/mock/MockAuthService.ts` |
| Jobs/Demandas | Legacy | `utils/storage.ts` |
| Propriedades | Legacy | `utils/storage.ts` |
| Social (Chat, Amigos) | Legacy | `utils/storage.ts` |
| Comércio (LidaShop) | Não impl. | N/A |

### Limitações Atuais e Plano de Evolução
1. **Injeção de Dependência**:
   - **Status**: [EM PROGRESSO] Implementado `ServiceFactory` e `ApiJobService`.
   - As telas do domínio de Demandas (`Job`) já utilizam a `ServiceFactory`.
   - Próximos passos: Migrar domínios de `Auth`, `WorkOrder` e `Social`.

2. **Configuração Estática**:
   - **Status**: [RESOLVIDO] Utiliza detecção em tempo de execução via `AppConfiguration.ts` e `ServiceFactory`.
   - Web: Detecta `window.location.hostname`.
   - Native: Usa flag `__DEV__` ou configuração de build.

3. **Dependência do `storage.ts`**:
   - **Status**: [EM PROGRESSO] Código legado sendo substituído gradualmente por interfaces de serviço.

## Estrutura de Diretórios

```
/
├── App.tsx                 # Ponto de entrada
├── config/                 # Configurações
│   ├── app.config.ts      # Configurações por ambiente
│   ├── ConfigContext.tsx  # Provider (para uso futuro)
│   └── index.ts
├── services/              # Camada de serviços
│   ├── interfaces/        # Contratos de serviço
│   │   └── IAuthService.ts
│   ├── mock/              # Implementações AsyncStorage
│   │   └── MockAuthService.ts
│   └── ServiceFactory.ts  # Factory central
├── data/
│   └── MockDataProvider.ts # Dados de demonstração
├── utils/
│   └── storage.ts         # Funções legacy (maioria dos serviços)
├── navigation/
│   └── routes.ts          # Definições de rotas tipadas
├── screens/
├── components/
├── types/
└── constants/
```

## Configuração

### Arquivo: config/app.config.ts

```typescript
export const AppConfiguration: EnvironmentConfig = {
  environment: 'development',  // 'development' | 'staging' | 'production'
  features: {
    enableMockData: true,      // Dados mock para desenvolvimento
    enableAnalytics: true,
    enableOfflineMode: true,
    enableDebugLogs: true,
  },
  api: {
    baseUrl: '',               // URL do servidor quando em produção
    timeout: 30000,
  },
  storage: {
    prefix: '@lidacacau_',
    encryptSensitive: false,
  },
};
```

### Para Desabilitar Dados Mock

Edite `config/app.config.ts`:
```typescript
features: {
  enableMockData: false,  // Desabilita seeding de dados demo
}
```

## Usando Serviços

### AuthService (Interface Completa)

```typescript
import { serviceFactory } from '@/services/ServiceFactory';

// Login
const authService = serviceFactory.getAuthService();
const result = await authService.login('email@example.com', 'password');

// Registro
const result = await authService.register({
  name: 'Nome',
  email: 'email@example.com',
  password: 'senha123',
  phone: '(93) 99999-0000',
});

// Logout
await authService.logout();
```

### Serviços Legacy (utils/storage.ts)

Para Jobs, Propriedades e Social, use as funções diretamente:

```typescript
import { 
  createJob, 
  getJobs, 
  createProperty,
  getPropertiesByOwner,
  sendFriendRequest,
  getChatRooms,
} from '@/utils/storage';

// Criar um job
await createJob({
  producerId: 'user-id',
  title: 'Colheita de Cacau',
  // ...
});

// Buscar propriedades
const properties = await getPropertiesByOwner('user-id');
```

## Plano de Ação para Migração

### Fase 1: Preparação (Atual)
O MVP usa configuração estática e serviços legacy. Esta abordagem é intencional para:
- Permitir publicação rápida para testes com usuários reais
- Simplificar desenvolvimento inicial sem complexidade de DI

### Fase 2: Abstrair Serviços Legacy
Criar interfaces e adapters para serviços em `utils/storage.ts`:

```typescript
// services/interfaces/IJobService.ts
export interface IJobService {
  createJob(data: CreateJobData): Promise<Job>;
  getJobs(filters?: JobFilters): Promise<Job[]>;
  getJobById(id: string): Promise<Job | null>;
  // ...
}

// services/mock/MockJobService.ts (wrapper das funções legacy)
import * as storage from '@/utils/storage';

export class MockJobService implements IJobService {
  async createJob(data: CreateJobData): Promise<Job> {
    return storage.createJob(data);
  }
  async getJobs(filters?: JobFilters): Promise<Job[]> {
    return storage.getJobs();
  }
  // ...
}
```

### Fase 3: Migrar Telas
Atualizar telas para usar ServiceFactory em vez de importar `utils/storage` diretamente:

```typescript
// Antes (legacy)
import { createJob } from '@/utils/storage';
await createJob(data);

// Depois (abstração)
import { serviceFactory } from '@/services/ServiceFactory';
const jobService = serviceFactory.getJobService();
await jobService.createJob(data);
```

### Fase 4: Implementar API Real
Substituir MockServices por ApiServices quando o backend estiver pronto.

---

## Migrando para Produção

### Passo 1: Implementar Serviços de API

Crie implementações em `services/api/`:

```typescript
// services/api/ApiAuthService.ts
import { IAuthService, AuthResult, RegisterData } from '../interfaces/IAuthService';
import { AppConfiguration } from '@/config';

export class ApiAuthService implements IAuthService {
  private baseUrl = AppConfiguration.api.baseUrl;

  async login(email: string, password: string): Promise<AuthResult> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }
    
    const data = await response.json();
    return { success: true, user: data.user, token: data.token };
  }
  
  // Implementar demais métodos...
}
```

### Passo 2: Atualizar ServiceFactory

```typescript
// services/ServiceFactory.ts
import { ApiAuthService } from './api/ApiAuthService';

getAuthService(): IAuthService {
  if (!this.authService) {
    if (AppConfiguration.environment === 'production') {
      this.authService = new ApiAuthService();
    } else {
      this.authService = new MockAuthService();
    }
  }
  return this.authService;
}
```

### Passo 3: Migrar Serviços Legacy

Para cada serviço em `utils/storage.ts`:

1. Crie a interface em `services/interfaces/`
2. Implemente versão API em `services/api/`
3. Atualize as telas para usar `serviceFactory.get*Service()`

### Passo 4: Configurar Ambiente

```typescript
// config/app.config.ts
export const AppConfiguration = {
  environment: 'production',
  features: {
    enableMockData: false,
    enableDebugLogs: false,
  },
  api: {
    baseUrl: 'https://api.lidacacau.com.br',
  },
};
```

## Chaves de Armazenamento

Todas as chaves usam o prefixo `@lidacacau_`:

| Chave | Descrição |
|-------|-----------|
| `current_user` | Usuário logado (sessão) |
| `users` | Lista de usuários (mock) |
| `jobs` | Demandas de trabalho |
| `bids` | Propostas |
| `workorders` | Ordens de serviço |
| `properties` | Propriedades rurais |
| `friends` | Conexões de amizade |
| `chatrooms` | Salas de chat |
| `messages_{roomId}` | Mensagens por sala |
| `analytics` | Eventos de analytics |

## Endpoints de API Sugeridos

### Autenticação
```
POST /auth/login         - Login (email, password)
POST /auth/register      - Registro
POST /auth/logout        - Logout
GET  /auth/me            - Usuário atual
POST /auth/refresh       - Refresh token
```

### Usuários
```
GET    /users/:id        - Perfil do usuário
PUT    /users/:id        - Atualizar perfil
GET    /users/search     - Buscar usuários
POST   /users/:id/verify - Submeter verificação
```

### Trabalhos
```
GET    /jobs             - Listar demandas
POST   /jobs             - Criar demanda
GET    /jobs/:id         - Detalhes
POST   /jobs/:id/bids    - Enviar proposta
```

### Propriedades
```
GET    /properties       - Listar propriedades
POST   /properties       - Criar
PUT    /properties/:id   - Atualizar
DELETE /properties/:id   - Remover
```

### Social
```
GET    /friends          - Listar amigos
POST   /friends/:id/request - Enviar convite
POST   /friends/:id/accept  - Aceitar
DELETE /friends/:id      - Remover
GET    /chat/rooms       - Salas de chat
GET    /chat/rooms/:id/messages - Mensagens
POST   /chat/rooms/:id/messages - Enviar mensagem
```

## Segurança

### Considerações para Produção

1. **Senhas**: O MockAuthService armazena senhas em texto puro para simplificar desenvolvimento. Em produção, NUNCA armazene senhas - use hash bcrypt no backend.

2. **Tokens**: Implemente JWT com refresh tokens no backend.

3. **HTTPS**: Todas as chamadas de API devem usar HTTPS.

4. **Validação**: Valide todos os inputs no backend, não confie no frontend.

5. **Storage seguro**: Para dados sensíveis, considere usar `expo-secure-store` em vez de `AsyncStorage`.

## Testes

- **Web**: `npm run dev` - Funcional mas com limitações de recursos nativos
- **Expo Go**: Scan QR code para testar em dispositivo físico
- **Build nativo**: `eas build` para builds nativos

## Credenciais de Demo

Em modo desenvolvimento (`enableMockData: true`):

- **Maria da Silva** (Produtor): maria@demo.lidacacau.com / demo123
- **Joao Pereira** (Trabalhador): joao@demo.lidacacau.com / demo123

Ambos têm verificação aprovada e são amigos com sala de chat ativa.
