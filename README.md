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
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=https://sua-api.onrender.com/auth/google/callback
```

Para evitar o erro `secretOrPrivateKey must have a value`, o backend também aceita aliases comuns usados em hospedagens:
- Access token: `JWT_ACCESS_SECRET`, `JWT_SECRET`, `ACCESS_TOKEN_SECRET`, `JWT_SECRET_KEY` ou `SECRET_KEY`
- Refresh token: `JWT_REFRESH_SECRET`, `REFRESH_TOKEN_SECRET` ou `JWT_REFRESH_TOKEN_SECRET`
- MongoDB: `MONGO_URI` ou `MONGODB_URI`

Se qualquer segredo obrigatório estiver ausente, a aplicação falha ao iniciar com uma mensagem clara nos logs do deploy.

## Autenticação
- `POST /auth/register` cadastra o usuário e já retorna `user`, `accessToken` e `refreshToken`.
- `POST /auth/login` retorna `user`, `accessToken` e `refreshToken`.
- `POST /auth/refresh` valida e rotaciona o refresh token, retornando um novo par de tokens.
- `POST /auth/logout` invalida o refresh token persistido.
- `GET /auth/google?redirect=<url>` inicia login com Google sem sessão persistente.
- `GET /auth/google/callback` recebe o retorno do Google, busca/cria usuário pelo email e redireciona para `redirect` com `?token=<accessToken>&refresh=<refreshToken>`.

## CSRF
Atualmente a API usa tokens JWT no header Authorization (não cookie), reduzindo risco clássico de CSRF. Se migrar para cookie HTTP-only, recomenda-se `csurf`, `sameSite=strict/lax` e token anti-CSRF.

## Instalação
```bash
npm install
cp .env.example .env
npm run dev
```

## Rotas
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/google?redirect=<url>`
- `GET /auth/google/callback`
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

- `GET /wholesale` retorna `{ categories, products, threshold, defaultDiscount }`.
- `PUT /wholesale/category` configura preço por categoria.
- `PUT /wholesale/product` configura preço por produto.
- `DELETE /wholesale/category/:cat` remove preço de categoria.
- `DELETE /wholesale/product/:id` remove override do produto.
- `GET /wholesale/config` e `PUT /wholesale/config` configuram `threshold` e `defaultDiscount`.

O backend recalcula o total do pedido em `POST /orders`: quando a quantidade por categoria atinge `threshold`, aplica o preço de atacado do produto, depois da categoria, ou `price * (1 - defaultDiscount)`.

Para criar/promover o admin com segurança no Render:

```bash
ADMIN_EMAIL="ayla@admin.com" ADMIN_PASSWORD="senha_forte_aqui" npm run seed:admin
```


Configuração pública para o frontend:

- `GET /config/public` retorna `{ whatsapp, address, hours }` usando `WHATSAPP_PHONE`, `STORE_ADDRESS` e `STORE_HOURS`.

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
