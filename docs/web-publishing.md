# LidaCacau - Guia de Publicacao Web

Este documento explica como publicar o LidaCacau como um aplicativo web acessivel por link.

## Sumario

1. [Preparacao para Publicacao](#preparacao)
2. [Desabilitar Auto-Login](#desabilitar-auto-login)
3. [Configurar Dados de Demonstracao](#configurar-dados-demo)
4. [Publicar no Replit](#publicar-no-replit)
5. [Dominio Personalizado](#dominio-personalizado)
6. [Monitoramento](#monitoramento)

---

## Preparacao para Publicacao

### Checklist Pre-Publicacao

- [ ] Remover auto-login de desenvolvimento
- [ ] Configurar dados mock (opcional para demo)
- [ ] Testar fluxo de registro completo
- [ ] Testar fluxo de login
- [ ] Verificar que tutorial aparece para novos usuarios
- [ ] Testar funcionalidades principais
- [ ] Verificar responsive design em diferentes telas

### Arquivo de Configuracao

Antes de publicar, revise `config/app.config.ts`:

```typescript
// config/app.config.ts

export const AppConfiguration: EnvironmentConfig = {
  // IMPORTANTE: Mude para 'production' antes de publicar
  environment: 'production',  // 'development' | 'staging' | 'production'
  
  features: {
    // IMPORTANTE: Desabilite para producao real
    // Mantenha true se quiser dados de demonstracao disponiveis
    enableMockData: false,
    
    // Analytics sempre habilitado em producao
    enableAnalytics: true,
    
    // Modo offline para areas rurais
    enableOfflineMode: true,
    
    // Logs de debug desabilitados em producao
    enableDebugLogs: false,
  },
  
  api: {
    // URL do seu servidor (vazio para MVP com AsyncStorage)
    baseUrl: '',
    timeout: 30000,
  },
  
  storage: {
    prefix: '@lidacacau_',
    encryptSensitive: false,
  },
};
```

---

## Desabilitar Auto-Login

O modo de desenvolvimento usa auto-login para facilitar testes. Para publicacao, isso deve ser desabilitado.

### Passo 1: Atualizar App.tsx

Localize o useEffect que faz auto-login e desabilite:

```typescript
// App.tsx

// ANTES (desenvolvimento):
useEffect(() => {
  if (__DEV__ && AppConfiguration.features.enableMockData) {
    devAutoLogin().then(() => {
      // ...
    });
  }
}, []);

// DEPOIS (producao):
useEffect(() => {
  // Auto-login desabilitado para producao
  // Usuarios devem criar conta ou fazer login manual
  
  // Opcional: Carregar sessao existente
  loadExistingSession();
}, []);
```

### Passo 2: Verificar AuthContext

Certifique-se que o AuthContext nao inicializa com usuario logado:

```typescript
// contexts/AuthContext.tsx

const initialState: AuthState = {
  user: null,           // Deve ser null, nao usuario mock
  isAuthenticated: false,
  isLoading: true,      // True para verificar sessao existente
};
```

### Passo 3: Verificar Navegacao

O RootNavigator deve mostrar tela de login quando nao autenticado:

```typescript
// navigation/RootNavigator.tsx

function RootNavigator() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <SplashScreen />;
  }
  
  if (!user) {
    // Usuario nao logado: mostrar AuthStack (Login/Registro)
    return <AuthStack />;
  }
  
  // Usuario logado: mostrar MainStack
  return <MainStack />;
}
```

---

## Configurar Dados de Demonstracao

### Opcao 1: Sem Dados Mock (Producao Limpa)

Para uma publicacao limpa sem dados de demonstracao:

```typescript
// config/app.config.ts
features: {
  enableMockData: false,
}
```

Usuarios criam suas proprias contas e dados.

### Opcao 2: Com Dados Mock (Demonstracao)

Para manter dados de exemplo para demonstracao:

```typescript
// config/app.config.ts
features: {
  enableMockData: true,
}
```

**Importante:** Atualize as credenciais de demo para algo mais seguro:

```typescript
// data/MockDataProvider.ts

const DEMO_USERS = {
  producer: {
    email: 'demo.produtor@lidacacau.com.br',
    password: 'Demo@LidaCacau2024',  // Senha mais segura
    name: 'Produtor Demo',
  },
  worker: {
    email: 'demo.trabalhador@lidacacau.com.br',
    password: 'Demo@LidaCacau2024',
    name: 'Trabalhador Demo',
  },
};
```

### Exibir Credenciais de Demo na Tela de Login

Para ajudar usuarios a testarem, adicione um banner na tela de login:

```typescript
// screens/auth/LoginScreen.tsx

function DemoCredentialsBanner() {
  if (!AppConfiguration.features.enableMockData) {
    return null;
  }
  
  return (
    <View style={styles.demoBanner}>
      <ThemedText style={styles.demoTitle}>
        Contas de Demonstracao
      </ThemedText>
      <ThemedText style={styles.demoText}>
        Produtor: demo.produtor@lidacacau.com.br
      </ThemedText>
      <ThemedText style={styles.demoText}>
        Trabalhador: demo.trabalhador@lidacacau.com.br
      </ThemedText>
      <ThemedText style={styles.demoText}>
        Senha: Demo@LidaCacau2024
      </ThemedText>
    </View>
  );
}
```

---

## Publicar no Replit

### Passo 1: Verificar que o App Esta Funcionando

```bash
npm run dev
```

Acesse a URL do Replit e verifique:
- Tela de login aparece
- Registro funciona
- Login funciona
- Navegacao funciona

### Passo 2: Publicar

1. Clique no botao "Publish" no Replit
2. Escolha o nome do subdominio (ex: `lidacacau`)
3. Configure opcoes de publicacao
4. Clique em "Publish"

### Passo 3: Verificar URL Publicada

Apos publicacao, acesse:
- `https://lidacacau.replit.app` (ou seu subdominio)

Verifique:
- App carrega corretamente
- Sem erros no console
- Fluxos funcionam

---

## Compartilhar o Link

### Link Padrao do Replit

```
https://seu-projeto.replit.app
```

### QR Code para Dispositivos Moveis

Gere um QR Code para facilitar acesso:

1. Use um gerador de QR Code online
2. Insira a URL do app
3. Baixe e compartilhe o QR Code

### Mensagem de Convite

```
Ola! Conheca o LidaCacau - o marketplace que conecta 
produtores e trabalhadores rurais em Uruara/PA.

Acesse: https://lidacacau.replit.app

Crie sua conta e comece a usar!

Para testar, use as contas de demonstracao:
- Email: demo.produtor@lidacacau.com.br
- Senha: Demo@LidaCacau2024
```

---

## Dominio Personalizado

### Configurar Dominio no Replit

1. Acesse as configuracoes do Repl
2. Va em "Domains"
3. Adicione seu dominio (ex: `app.lidacacau.com.br`)
4. Configure DNS no seu provedor

### Configuracao DNS

Adicione um registro CNAME:

```
Tipo: CNAME
Nome: app (ou @)
Valor: seu-projeto.replit.app
TTL: 3600
```

### SSL/HTTPS

O Replit fornece SSL automaticamente para dominios personalizados.

---

## Monitoramento

### Logs do App

Verifique logs no Replit:
1. Abra o console do Repl
2. Veja logs em tempo real
3. Filtre por erros

### Analytics (Se Habilitado)

Os eventos de analytics sao armazenados localmente e podem ser exportados:

```typescript
// Para exportar eventos de analytics
import { getAnalyticsEvents, clearAnalyticsEvents } from '@/utils/analytics';

// Obter todos os eventos
const events = await getAnalyticsEvents();
console.log(events);

// Limpar apos exportar
await clearAnalyticsEvents();
```

### Metricas a Monitorar

1. **Usuarios Ativos**
   - Registros por dia
   - Logins por dia
   - Usuarios unicos

2. **Engajamento**
   - Demandas criadas
   - Propostas enviadas
   - Trabalhos concluidos

3. **Erros**
   - Crashes do app
   - Erros de API
   - Problemas de GPS

---

## Problemas Comuns

### App Nao Carrega

1. Verifique se o workflow esta rodando
2. Reinicie o workflow: `npm run dev`
3. Verifique erros no console

### Usuarios Nao Conseguem Registrar

1. Verifique se AsyncStorage esta funcionando
2. Verifique validacoes de formulario
3. Verifique logs de erro

### Tela Branca

1. Verifique erros no console do navegador (F12)
2. Verifique se todos os componentes estao exportados
3. Verifique se nao ha texto solto fora de `<Text>`

### GPS Nao Funciona no Web

Isso e esperado. GPS funciona melhor no app nativo (Expo Go).
Na web, solicite permissao e use fallback para localizacao manual.

---

## Atualizacoes

### Como Atualizar o App Publicado

1. Faca as alteracoes no codigo
2. Teste localmente com `npm run dev`
3. O Replit atualiza automaticamente

### Rollback

Se algo der errado:
1. Use o historico de versoes do Replit
2. Ou reverta manualmente as mudancas
3. Reinicie o workflow

---

## Suporte

Para problemas com publicacao:
1. Verifique a documentacao do Replit
2. Consulte os logs de erro
3. Teste localmente primeiro
