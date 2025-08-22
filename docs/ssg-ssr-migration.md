# Migração parcial para SSG/SSR

Este documento avalia uma migração parcial do projeto para **Next.js** ou **Astro** com foco em pré-renderização de páginas e revalidação incremental.

## Objetivos
- Pré-renderizar a página inicial e as notícias mais acessadas.
- Usar SSG/SSR para reduzir tempo de carregamento.
- Configurar revalidação incremental para manter o conteúdo fresco.

## Next.js
### Estratégia
1. Criar um aplicativo Next.js reutilizando os componentes React existentes.
2. Pré-renderizar a página inicial e as páginas de notícias populares com `getStaticProps` e `getStaticPaths`.
3. Definir a propriedade `revalidate` para habilitar a regeneração estática incremental (ISR).

```tsx
// pages/index.tsx
export async function getStaticProps() {
  const news = await fetchTopNews();
  return {
    props: { news },
    revalidate: 60 // revalida a cada minuto
  };
}
```

### Vantagens
- Ecossistema maduro e suporte nativo a ISR.
- Fácil integração com APIs e middlewares.

## Astro
### Estratégia
1. Adicionar um projeto Astro e importar componentes React conforme necessário.
2. Utilizar `getStaticPaths` para gerar as páginas de notícias mais acessadas.
3. Habilitar a propriedade `prerender` e definir `revalidate` para controlar a revalidação incremental.

```astro
---
export async function getStaticPaths() {
  const news = await fetchTopNews();
  return news.map((n) => ({ params: { slug: n.slug }, props: { news: n } }));
}
export const prerender = true;
export const revalidate = 60; // segundos
---
```

### Vantagens
- Foco em performance com carregamento mínimo de JavaScript.
- Permite combinar diferentes frameworks no mesmo projeto.

## Revalidação incremental
- **Next.js**: configurar `revalidate` em `getStaticProps` ou usar revalidação sob demanda via API Route.
- **Astro**: definir `revalidate` em páginas pré-renderizadas e, em deploys serverless, utilizar revalidação sob demanda.

A migração pode começar pelas páginas mais acessadas, mantendo o restante no ambiente atual. Dessa forma obtemos melhorias de performance sem reescrever todo o projeto de uma vez.
