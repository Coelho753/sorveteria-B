# Sorveteria Backend

Backend Node.js + Express + MongoDB com arquitetura MVC, autenticação JWT (access + refresh token), módulos de usuários, produtos, pedidos e financeiro.

## Segurança implementada
- bcrypt para hash de senha
- express-validator para validação/sanitização de entrada
- mongo-sanitize contra NoSQL Injection
- xss-clean contra XSS
- helmet para headers seguros
- express-rate-limit contra brute force
- CORS configurável via variável de ambiente

## Variáveis de ambiente
Configure no Render antes do deploy:

```env
PORT=3000
MONGO_URI=mongodb+srv://usuario:senha@cluster/database
JWT_ACCESS_SECRET=uma_chave_forte_para_access_token
JWT_REFRESH_SECRET=uma_chave_forte_para_refresh_token
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://seu-frontend.com
CORS_ALLOWLIST=https://seu-frontend.com,http://localhost:5173
```

Para evitar o erro `secretOrPrivateKey must have a value`, o backend também aceita aliases comuns usados em hospedagens:
- Access token: `JWT_ACCESS_SECRET`, `JWT_SECRET`, `ACCESS_TOKEN_SECRET`, `JWT_SECRET_KEY` ou `SECRET_KEY`
- Refresh token: `JWT_REFRESH_SECRET`, `REFRESH_TOKEN_SECRET` ou `JWT_REFRESH_TOKEN_SECRET`
- MongoDB: `MONGO_URI` ou `MONGODB_URI`

Se MongoDB ou segredos JWT obrigatórios estiverem ausentes, a aplicação falha ao iniciar com uma mensagem clara nos logs do deploy.

## Autenticação
- `POST /auth/register` cadastra o usuário e já retorna `user`, `accessToken` e `refreshToken`.
- `POST /auth/login` retorna `user`, `accessToken` e `refreshToken`.
- `POST /auth/refresh` valida e rotaciona o refresh token, retornando um novo par de tokens.
- `POST /auth/logout` invalida o refresh token persistido.

## CSRF
Atualmente a API usa tokens JWT no header Authorization (não cookie), reduzindo risco clássico de CSRF. Se migrar para cookie HTTP-only, recomenda-se `csurf`, `sameSite=strict/lax` e token anti-CSRF.

## Instalação
```bash
npm install
cp .env.example .env
npm run dev
```

## Rotas
As rotas estão disponíveis tanto sem prefixo quanto com `/api` para evitar 404 quando o frontend usa uma base URL como `/api` (ex.: `POST /auth/login` e `POST /api/auth/login`).

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`
- `PUT /users/me`
- `GET /products` (público, lista ativos)
- `GET /products/ativos` (público, lista ativos)
- `GET /products/admin/todos` (admin, lista todos)
- `POST /products` (admin)
- `PUT /products/:id` (admin)
- `DELETE /products/:id` (admin)
- `GET /cart`
- `PUT /cart`
- `DELETE /cart`
- `POST /orders`
- `GET /orders/me`
- `GET /orders` (admin)
- `GET /finance?startDate=2026-01-01&endDate=2026-12-31` (admin)


## Produtos

`GET /products` é público e retorna somente produtos ativos com campos em inglês para o frontend (`name`, `description`, `price`, `image`, `imageUrl`, `category`, `size`, `stock`, `active`). O backend também aceita os aliases antigos em português (`nome`, `descricao`, `preco`, `imagem`, `categoria`, `tamanho`, `estoque`, `ativo`) em `POST /products` e `PUT /products/:id`.

Categorias válidas: `tub`, `cup`, `popsicle` e `acai`. Também são aceitos aliases como `pote`, `copo`, `picole`, `picolé` e `açaí`, que são normalizados automaticamente.

Para popular os 41 produtos atuais do frontend:

```bash
DRY_RUN=1 npm run seed:products
export ADMIN_TOKEN="seu_accessToken_de_admin"
npm run seed:products
```

Veja mais detalhes em `PRODUTOS_BACKEND.md`.


## Administração, atacado e financeiro

O backend expõe endpoints para o painel administrativo do frontend:

- `GET /users` lista usuários para admins e aceita `?search=`.
- `PUT /users/:id` permite editar `name`, `phone`, `role` e `address`.
- `GET /orders?userId=<id>` filtra pedidos por usuário.
- `PUT /orders/:id` atualiza status.
- `GET /finance?period=7d` retorna KPIs, série diária (`vendasPorDia`/`salesByDay`) e produtos mais vendidos.

Preços de atacado são configurados no backend:

- `GET /wholesale` é público e retorna `{ categories, products, threshold, defaultDiscount, default_discount }`.
- `PUT /wholesale/category` configura preço por categoria.
- `PUT /wholesale/product` configura preço por produto.
- `DELETE /wholesale/category/:cat` remove preço de categoria.
- `DELETE /wholesale/product/:id` remove override do produto.
- `GET /wholesale/config` e `PUT /wholesale/config` configuram `threshold` e `defaultDiscount`/`default_discount`.

O backend recalcula o total do pedido em `POST /orders`: quando a quantidade por categoria atinge `threshold`, aplica o preço de atacado do produto, depois da categoria, ou `price * (1 - defaultDiscount)`.

Para criar/promover o admin com segurança no Render:

```bash
ADMIN_EMAIL="ayla@admin.com" ADMIN_PASSWORD="senha_forte_aqui" npm run seed:admin
```


Configuração pública para o frontend:

- `GET /config/public` retorna `{ whatsappPhone, whatsapp, address, hours }` usando `WHATSAPP_PHONE`, `STORE_ADDRESS` e `STORE_HOURS`.

## WhatsApp e imagens de produtos

Produtos aceitam `image`, `imageUrl` ou `imagem` como URL pública opcional. Se o campo vier vazio, o frontend usa fallback local por nome/categoria.

Para receber pedidos de WhatsApp por integradores como Z-API, Twilio, WhatsApp Cloud API ou n8n:

```http
POST /orders/whatsapp
x-webhook-secret: <WHATSAPP_WEBHOOK_SECRET>
```

Body mínimo:

```json
{
  "customerName": "Cliente",
  "customerPhone": "5511965474023",
  "source": "whatsapp",
  "status": "pendente",
  "items": [{ "name": "Pote Chocolate", "price": 35, "quantity": 1, "category": "tub" }],
  "total": 35
}
```

O painel admin pode filtrar com `GET /orders?source=whatsapp`; o financeiro também aceita `source`, por exemplo `GET /finance?source=whatsapp&period=7d`.

## Deploy no Render
- Criar Web Service Node
- Build command: `npm install`
- Start command: `npm start`
- Configurar variáveis de ambiente do `.env.example`
- Após alterar variáveis, executar Manual Deploy → Clear build cache & deploy


## Hardening de segurança
- JWT access/refresh com rotação de refresh token e armazenamento do refresh como hash no banco.
- `Authorization: Bearer` é aceito pelo backend para compatibilidade com o frontend atual.
- Rate limit reforçado em `/auth/login`, `/auth/register`, `/auth/refresh` e `/orders`.
- CORS com allowlist (`CORS_ALLOWLIST`), suporte ao frontend atual `https://ayla-sorvetes-yfbk.onrender.com`, previews `.lovable.app`, Render e localhost.
- Webhook WhatsApp protegido por HMAC SHA-256 no header `x-ayla-signature`.
- Backend recalcula preço de atacado em `POST /orders` e `POST /orders/whatsapp` (não confia em `price` do cliente).
- Erros internos retornam mensagem genérica para o cliente.
- Arquivos reais de ambiente e chaves locais são bloqueados por `.gitignore`; apenas `.env.example` com placeholders deve ficar versionado.


## Correções de estabilidade e acesso
- `src/config/env.js` define `parseOrigins()` antes de montar `CORS_ALLOWLIST`, evitando o erro `ReferenceError: parseOrigins is not defined` na inicialização.
- CORS permite o frontend atual `https://ayla-sorvetes-yfbk.onrender.com`, localhost e domínios hospedados em `.onrender.com`/`.lovable.app` via HTTPS, com headers `Authorization`, `Content-Type`, `x-ayla-signature` e `x-webhook-secret`.
- Entradas de `body`, `query` e `params` passam por sanitização extra contra chaves Mongo perigosas (`$` e `.`), além de `mongo-sanitize`.
- Mongoose usa `sanitizeFilter` e `strictQuery` para reduzir risco de NoSQL injection em filtros.
- `GET /health` e `GET /api/health` retornam `{ "status": "ok" }` para checagem de conexão/deploy.
- Logs HTTP registram método, rota sem query string, status e `Origin`, permitindo confirmar no Render se o frontend chegou ao backend sem expor tokens ou dados sensíveis de query.
- Rotas duplicadas com prefixo `/api` reduzem falhas 404 quando o frontend está configurado com `VITE_API_URL`, `API_URL` ou proxy apontando para `/api`.
- Login externo via Google OAuth foi removido; a autenticação suportada é por email/senha com JWT.
