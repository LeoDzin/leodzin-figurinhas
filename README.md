# Troca de Figurinhas - Copa 2026

Site estatico para comparar listas de figurinhas da Copa do Mundo FIFA 2026 da Panini Brasil.

## Como rodar localmente

Na pasta do projeto:

```powershell
python -m http.server 5173
```

Depois abra:

```text
http://localhost:5173
```

## Como atualizar suas listas

Edite `data/collection.json`.

Campos principais:

```json
{
  "owned": "FWC1 BRA2 BRA3",
  "missing": "BRA15 FWC1 MAR3",
  "duplicates": {
    "BRA1": 2,
    "RSA13": 1
  },
  "reserved": "RSA13"
}
```

Tambem da para abrir a area "Editar meu JSON" no site, colar as listas exportadas pelo app Sticker Album e baixar um novo `collection.json`.

Use `owned` para a lista "STICKERS I HAVE" do app e `missing` para "MISSING STICKERS". Use `duplicates` apenas para figurinhas repetidas/disponiveis para troca. O editor entende repetidas no formato `BRA1 (x2), FWC16 (x1)`.

## Hospedagem gratis

- GitHub Pages: bom para site 100% estatico, simples e gratuito.
- Vercel: tambem gratuito para esse uso e mais flexivel se depois voce quiser transformar em app com backend.

Para este projeto, GitHub Pages resolve bem enquanto os dados ficarem em JSON.

## Fontes usadas para a estrutura inicial

- Panini Brasil: https://panini.com.br/colecionaveis/fifa-world-cup-2026
  - Pagina oficial da colecao; informa 980 cromos, 68 especiais e envelopes com 7 cromos.
- Checklist Insider: https://www.checklistinsider.com/2026-panini-fifa-world-cup-sticker
  - Checklist publica com `00`, `FWC1` a `FWC19` e 48 selecoes com 20 cromos por selecao. A propria pagina marca a checklist como sujeita a mudancas.
