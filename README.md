# UbaNews

## Propósito

UbaNews é um portal de notícias desenvolvido com React e Vite. O projeto tem como objetivo disponibilizar um feed de notícias dinâmico utilizando Supabase para armazenamento e consulta de dados.

## Requisitos

- Node.js ≥ 20
- npm ≥ 10

```bash
npm install
```

## Scripts principais

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento com recarregamento automático. |
| `npm run build` | Gera o build de produção na pasta `dist/`. |
| `npm run preview` | Executa uma instância local para visualizar o build de produção. |
| `npm run lint` | Roda o ESLint para verificar problemas de estilo e qualidade. |
| `npm test` | Executa a suíte de testes com Vitest. |
| `npm run check` | Executa lint e testes em sequência. |

## Arquitetura

- `src/`: código principal da aplicação React, incluindo páginas, componentes e utilitários.
- `src/admin/`: módulos relacionados à interface administrativa (autenticação, contextos, layout e páginas restritas).
- `src/services/`: camada de serviços para integração com APIs e acessos a dados, como `newsService` para buscar notícias no Supabase.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto e defina as seguintes variáveis:

```bash
VITE_SUPABASE_URL=<URL do seu projeto Supabase>
VITE_SUPABASE_ANON_KEY=<Chave anônima do Supabase>
```

## Deploy

1. Defina as variáveis de ambiente em `.env` ou na plataforma de hospedagem.
2. Instale as dependências com `npm install`.
3. Gere os arquivos de produção com `npm run build`.
4. Publique o conteúdo da pasta `dist/` em um serviço de hospedagem estático (Vercel, Netlify, etc.).
5. Opcionalmente, utilize `npm run preview` para validar o build antes do deploy.

