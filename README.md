# CineSearch

Aplicação responsiva para descobrir filmes e séries usando dados do TMDB.

## Recursos

- filmes, séries, tendências e busca unificada;
- filtros por ano, nota, gênero e ordenação;
- trailers, gêneros e provedores disponíveis no Brasil;
- favoritos persistentes, compartilhamento e carregamento progressivo;
- PWA instalável com cache do aplicativo;
- SEO, acessibilidade básica e layout responsivo;
- proxy serverless que mantém a chave do TMDB fora do navegador.

## Desenvolvimento

1. Instale o Node.js 20 ou superior.
2. Execute `npm install`.
3. Copie `.env.example` para `.env.local`.
4. Preencha `TMDB_API_KEY`.
5. Execute `npm run dev`.

O endereço local será informado pela Vercel CLI. Abrir apenas o HTML sem o servidor não disponibiliza a rota segura `/api/tmdb`.

## Testes

Execute `npm test` para verificar a sintaxe e os testes da função serverless.

## Publicação

Importe o repositório na Vercel e cadastre `TMDB_API_KEY` em Settings > Environment Variables. O arquivo `vercel.json` configura cabeçalhos de segurança.

## Segurança

Nunca envie `.env.local` ao Git. Se a chave antiga já foi publicada anteriormente, gere uma nova no painel do TMDB antes do deploy.
