# Pack N1 – Poda de Limpeza do Cacaueiro (Híbrido e Clonal)
Data: 25/11/2025

Este pack complementa o "Teaser" e adiciona o N1 completo com:
- Rubrica do mentor (0–3) com pesos e falhas críticas
- Checklists (pré-início, execução, check-out)
- Protocolo de evidências (fotos antes/depois + amostragem)
- Modelo de Ordem de Serviço (OS)
- Regras de XP e progressão

## Como usar no App (MVP)
1) Importe o JSON: `pack_n1_poda_limpeza_cacau.json`
2) Crie uma tabela/coleção `skills`, `courses`, `checklists`, `rubrics`, `os_templates`, `evidence_protocols`.
3) No fluxo da OS:
   - Antes de iniciar: exigir checklist pré-início OK
   - Durante: permitir registrar evidências e notas do mentor
   - No check-out: checklist final + amostragem + avaliação

## Scoring (sugestão)
- Cada dimensão (segurança/qualidade/produtividade/postura) recebe nível 0–3.
- Nota final = soma(nível * peso).
- Aprova se: sem falha crítica e nota >= 1.8.

## Evidências (MVP)
- Fotos antes/depois em 5% do lote (mínimo 4 plantas) + 1 foto por planta auditada.
- Padronize ângulos (2 antes + 2 depois) para reduzir conflito.

Arquivos complementares:
- PDF do teaser (para o trabalhador): `Curso_MVP_Light_Poda_de_Limpeza_Cacaueiro_Teaser.pdf`
- Imagens PNG (para telas do app)
