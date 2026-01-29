---
description: Re-deploys the LidaCacau API and Web frontend to Google Cloud Run
---

Esta workflow realiza o deploy completo da versão mais recente do código (incluindo o build da web) para o Google Cloud Run.

// turbo
1. Execute o deploy:
```powershell
gcloud run deploy lidacacau-api --source . --region us-central1 --quiet
```

2. Verifique o status no console do Google Cloud se necessário.
3. O app estará disponível em https://www.lidacacau.com (ou na URL do Cloud Run).
