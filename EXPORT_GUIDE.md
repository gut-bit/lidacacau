# Guia de Exportação - Empleitapp

Este guia explica como gerar o APK do Empleitapp para testar no seu celular Android e como preparar para a Play Store.

---

## Passo 1: Criar Conta no Expo (Grátis)

1. Acesse [expo.dev](https://expo.dev)
2. Clique em **Sign Up**
3. Crie sua conta (pode usar Google ou email)

---

## Passo 2: Instalar EAS CLI

Abra o terminal (Shell) no Replit e execute:

```bash
npm install -g eas-cli
```

---

## Passo 3: Fazer Login no Expo

No terminal, execute:

```bash
eas login
```

Digite seu email e senha do Expo quando solicitado.

---

## Passo 4: Configurar o Projeto

Execute este comando para vincular o projeto à sua conta:

```bash
eas build:configure
```

Quando perguntar sobre plataformas, escolha **Android** (ou ambas se quiser iOS também).

---

## Passo 5: Gerar APK (Para Testar)

Este comando gera um APK que você pode instalar diretamente no celular:

```bash
eas build --profile preview --platform android
```

**O que acontece:**
- O Expo compila seu app na nuvem (leva 10-20 minutos)
- Quando terminar, você recebe um link para baixar o APK
- Baixe e instale no seu celular Android

**Dica:** O Android pode pedir para "Permitir instalação de fontes desconhecidas" - é normal, basta permitir.

---

## Passo 6: Instalar no Celular

1. Baixe o APK no seu celular (pelo link do Expo)
2. Abra o arquivo APK
3. Permita a instalação
4. Pronto! O Empleitapp está instalado!

---

## Para Play Store (Quando Estiver Pronto)

### Pré-requisitos
- Conta de desenvolvedor Google Play ($25 - pagamento único)
- Política de privacidade online

### Gerar AAB para Play Store

```bash
eas build --profile production --platform android
```

Isso gera um arquivo `.aab` otimizado para a Play Store.

### Enviar para Play Store

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo app
3. Faça upload do arquivo `.aab`
4. Preencha as informações do app
5. Envie para revisão

---

## Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `eas login` | Fazer login no Expo |
| `eas whoami` | Ver qual conta está logada |
| `eas build:list` | Ver histórico de builds |
| `eas build --profile preview --platform android` | Gerar APK para teste |
| `eas build --profile production --platform android` | Gerar AAB para Play Store |

---

## Limites do Plano Gratuito

- **15 builds por mês** (suficiente para testes)
- Builds na fila podem demorar mais
- Para builds prioritários, considere o plano pago

---

## Solução de Problemas

### "Build failed"
- Verifique os logs no site do Expo
- Geralmente é problema de dependências

### "Cannot install APK"
- Permita instalação de fontes desconhecidas nas configurações do Android
- Verifique se o APK é compatível com seu Android (versão mínima: Android 6.0)

### "EAS CLI not found"
- Execute novamente: `npm install -g eas-cli`

---

## Informações do App

- **Nome:** Empleitapp
- **Bundle ID:** com.empleitapp.app
- **Versão:** 1.0.0
- **Android Mínimo:** 6.0 (API 23)

---

## Próximos Passos

1. Gere o APK preview e teste todas as funcionalidades
2. Corrija qualquer bug encontrado
3. Quando estiver satisfeito, gere o AAB e envie para a Play Store

Boa sorte! 🚀
