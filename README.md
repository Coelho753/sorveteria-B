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

## Deploy no Render
- Criar Web Service Node
- Build command: `npm install`
- Start command: `npm start`
- Configurar variáveis de ambiente do `.env.example`
- Após alterar variáveis, executar Manual Deploy → Clear build cache & deploy
