# Padrão visual AnselmoTech

Referência: <https://agenda.anselmotech.com.br/> (AgendaTech). Os valores abaixo foram lidos do CSS publicado do AgendaTech
(índigo 600/500, slate 900/50, Plus Jakarta Sans + Inter) e já estão aplicados no Glicose Tech (`src/app/globals.css`).

## Tokens

| Token | Valor | Uso |
| --- | --- | --- |
| `primary` / brand-600 | `#4f46e5` | botões, links, foco de marca, ícones ativos |
| brand-500 | `#6366f1` | fim do degradê, anel de foco (`ring`) |
| `foreground` | `#0f172a` | texto principal (slate-900) |
| `muted-foreground` | `#475569` | texto secundário (slate-600) |
| `background` | `#f8fafc` | fundo da página (slate-50) |
| `card` | `#ffffff` | cartões e painéis |
| `border` | `#e2e8f0` | bordas (slate-200) |
| `input` | `#7c8aa5` | borda de campos (contraste ≥ 3:1) |
| `secondary` / `accent` | `#eef2ff` / `#e0e7ff` | fundos suaves e item ativo (texto `#312e81`) |
| `muted` | `#f1f5f9` | fundos neutros |
| escuro de marca | `#1e1b4b` (indigo-950) / `#312e81` | painéis de destaque, rodapés, e-mail escuro |
| sucesso | `#047857` sobre `#d1fae5` | estado ok |
| atenção | `#b45309` sobre `#fef3c7` | aviso (não indica gravidade clínica) |
| informação | `#0369a1` sobre `#e0f2fe` | neutro/informativo |
| erro | `#b91c1c` | falha e ações destrutivas |

- **Degradê da marca:** `from-brand-600 to-brand-500` (logo, botão de destaque), com sombra `shadow-brand-600/30`.
- **Fontes:** títulos em **Plus Jakarta Sans** (500–800), texto em **Inter**. Mantida a Atkinson Mono só nos números de glicemia.
- **Formas:** cartões `rounded-2xl`, botões e campos `rounded-xl`, avatares e chips `rounded-full`; sombras suaves.
- **Cores semânticas** sempre acompanhadas de texto/ícone, nunca só a cor.

## Prompt para padronizar todos os projetos

```text
Atue como engenheiro front-end sênior. Padronize a identidade visual deste projeto com o padrão AnselmoTech
(referência: https://agenda.anselmotech.com.br/). Siga as regras abaixo, sem trocar a stack nem reescrever módulos.

1. Inspecione primeiro: stack (Tailwind/shadcn/CSS próprio), onde ficam cores, fontes e componentes, e liste cores
   hardcoded (hex/rgb) em componentes, e-mails, PDFs, ícones, manifest e metadados de tema.
2. Centralize a paleta em tokens (variáveis CSS e/ou tema do Tailwind) em um único arquivo. Valores:
   - primário #4f46e5 (indigo-600); secundário/degradê #6366f1 (indigo-500); escuro de marca #1e1b4b e #312e81
   - texto #0f172a; texto secundário #475569; fundo #f8fafc; cartão #ffffff; borda #e2e8f0; campo (borda) #7c8aa5
   - fundos suaves #eef2ff, #e0e7ff e #f1f5f9; item ativo com texto #312e81
   - sucesso #047857 (fundo #d1fae5); atenção #b45309 (fundo #fef3c7); informação #0369a1 (fundo #e0f2fe); erro #b91c1c
   Troque todas as cores hardcoded por tokens. Não invente cores novas nem mantenha a paleta antiga.
3. Fontes: Plus Jakarta Sans (500–800) nos títulos e Inter no texto, carregadas via next/font ou Google Fonts com
   display=swap. Se o projeto tiver uma fonte de acessibilidade específica, preserve-a só onde for essencial e informe.
4. Estilo: degradê de marca (from #4f46e5 to #6366f1) no logo e no botão de destaque; cartões rounded-2xl com borda
   slate-200; botões e campos rounded-xl; sombras suaves (shadow-sm/md, e shadow com a cor da marca a 20–30%).
   Cabeçalho e rodapé claros ou em #1e1b4b com texto branco. Ícones de um único conjunto (lucide).
5. Reaproveite o logotipo do próprio projeto; nunca use o logo de outro projeto como se fosse deste. Cor de marca no
   favicon, no ícone PWA, em theme_color/themeColor, no manifest e nos e-mails transacionais (incluindo modo escuro).
6. Estados: sucesso, atenção, erro e informação com a mesma paleta, sempre com texto ou ícone além da cor. Cores de
   alerta não podem sugerir diagnóstico ou gravidade; o texto explica o motivo e o próximo passo.
7. Acessibilidade: contraste mínimo WCAG AA (4,5:1 no texto, 3:1 em bordas de campos e ícones), foco visível com anel
   #6366f1, alvos de toque de pelo menos 44 px, respeito a prefers-reduced-motion.
8. Responsividade (mobile primeiro): valide em ~390, ~820 e ~1280 px. Sem rolagem horizontal, textos cortados ou botões
   apertados; navegação simples no celular. Corrija o que encontrar em vez de apenas declarar que é responsivo.
9. Valide: lint, checagem de tipos, testes e build; tire capturas nas três larguras (ex.: Edge/Chrome headless) e
   confira login, painel principal, formulários e área administrativa. Não altere regras de negócio nem dados.
10. Entrega: resumo curto do que mudou, arquivos alterados, o que ficou de fora e por quê. Ao final, faça commit com
    mensagem descritiva e push para a branch principal.
```
