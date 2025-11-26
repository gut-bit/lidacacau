# Guia de Publicacao - Empleitapp no Google Play Store

## Resumo do App
- **Nome**: Empleitapp
- **Package**: com.empleitapp.app
- **Versao**: 1.0.0
- **Plataforma**: Android (Expo React Native)

---

## Pre-requisitos

### 1. Conta Google Play Developer
- Acesse: https://play.google.com/console
- Taxa unica: $25 USD
- Pode levar 24-48h para aprovacao da conta

### 2. Conta Expo (Gratuita)
- Acesse: https://expo.dev/signup
- Crie uma conta ou faca login

---

## Passo a Passo para Build Android

### Passo 1: Instalar EAS CLI (no terminal)
```bash
npm install -g eas-cli
```

### Passo 2: Fazer Login no Expo
```bash
eas login
```
Digite seu email e senha da conta Expo.

### Passo 3: Inicializar o Projeto EAS
```bash
eas build:configure
```
Isso vai criar/atualizar os arquivos de configuracao.

### Passo 4: Gerar o Build de Producao (AAB)
```bash
eas build --platform android --profile production
```

**Importante**: 
- O build demora aproximadamente 10-20 minutos
- O arquivo gerado sera um `.aab` (Android App Bundle)
- Este e o formato exigido pelo Play Store

### Passo 5: Baixar o Arquivo AAB
Apos o build completar:
```bash
eas build:list
```
Ou acesse: https://expo.dev/accounts/[seu-usuario]/projects/empleitapp/builds

Clique no build mais recente e faca download do arquivo `.aab`.

---

## Publicacao no Google Play Console

### 1. Criar Novo App
1. Acesse https://play.google.com/console
2. Clique em "Criar app"
3. Preencha:
   - Nome: Empleitapp
   - Idioma padrao: Portugues (Brasil)
   - App ou jogo: App
   - Gratis ou pago: Gratis

### 2. Configurar Ficha da Loja
- **Titulo**: Empleitapp - Empreitadas Rurais
- **Descricao curta** (80 caracteres):
  ```
  Conecte produtores de cacau com trabalhadores rurais em Uruara/PA
  ```
- **Descricao completa** (4000 caracteres):
  ```
  Empleitapp e o marketplace de empreitadas rurais que conecta produtores de cacau com trabalhadores qualificados na regiao de Uruara/PA.

  PARA PRODUTORES:
  - Publique demandas de servico (poda, enxertia, colheita, rocagem)
  - Receba propostas de trabalhadores verificados
  - Acompanhe o progresso com GPS em tempo real
  - Avalie trabalhadores apos cada servico
  - Gerencie suas propriedades com localizacao GPS

  PARA TRABALHADORES:
  - Encontre oportunidades de trabalho na sua regiao
  - Envie propostas e negocie valores
  - Registre check-in/check-out com localizacao
  - Construa sua reputacao com avaliacoes
  - Acesse cursos de capacitacao e ganhe XP
  - Suba de nivel (N1 a N5) e desbloqueie servicos

  RECURSOS:
  - Sistema de verificacao de identidade
  - Contratos digitais legalmente validos
  - Clube de beneficios com parceiros locais
  - Portfolio de trabalhos realizados
  - Programa de indicacao com recompensas
  - Mapa interativo com raio de 0-100km

  Desenvolvido para a comunidade cacaueira de Uruara e regiao.
  ```

### 3. Upload dos Assets
Voce precisara:
- **Icone**: 512x512 PNG (usar assets/images/icon.png)
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: Minimo 2 (recomendado 8)
  - Telefone: 1080x1920 ou 1080x2400
  
### 4. Classificacao de Conteudo
Preencha o questionario de classificacao. Para este app:
- Violencia: Nenhuma
- Conteudo sexual: Nenhum
- Linguagem: Nenhuma
- Substancias controladas: Nenhuma

Classificacao esperada: Livre

### 5. Politica de Privacidade
Crie uma pagina web com sua politica de privacidade e adicione o link.
Exemplo de URL: https://empleitapp.com/privacidade

### 6. Upload do AAB
1. Va em "Producao" > "Criar nova versao"
2. Faca upload do arquivo `.aab`
3. Adicione notas da versao em portugues
4. Clique em "Revisar versao"
5. Envie para revisao

---

## Configuracoes do App

### Arquivo app.json (ja configurado)
```json
{
  "expo": {
    "name": "Empleitapp",
    "slug": "empleitapp",
    "version": "1.0.0",
    "android": {
      "package": "com.empleitapp.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

### Arquivo eas.json (ja configurado)
```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

---

## Submissao Automatica (Opcional)

### Configurar EAS Submit
```bash
eas submit --platform android --latest
```

Voce precisara:
1. Chave de conta de servico do Google Play Console
2. Configurar em eas.json

---

## Checklist Final

- [ ] Conta Google Play Developer ativa
- [ ] Conta Expo criada
- [ ] EAS CLI instalado
- [ ] Build AAB gerado com sucesso
- [ ] Icone 512x512 PNG
- [ ] Feature Graphic 1024x500 PNG
- [ ] Minimo 2 screenshots
- [ ] Descricao curta (80 caracteres)
- [ ] Descricao completa
- [ ] Classificacao de conteudo preenchida
- [ ] Politica de privacidade publicada
- [ ] AAB enviado ao Play Console

---

## Suporte

Para duvidas sobre EAS Build:
- Documentacao: https://docs.expo.dev/build/introduction/
- Forum: https://forums.expo.dev/

Para duvidas sobre Play Console:
- Central de Ajuda: https://support.google.com/googleplay/android-developer

---

## Proximas Versoes

Para atualizar o app:
1. Incremente a versao em app.json
2. Execute `eas build --platform android --profile production`
3. Faca upload do novo AAB no Play Console
