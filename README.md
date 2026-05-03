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
- `GET /users/me`
- `PUT /users/me`
- `GET /products/ativos` (público)
- `GET /products` (admin)
- `POST /products` (admin)
- `PUT /products/:id` (admin)
- `DELETE /products/:id` (admin)
- `POST /orders`
- `GET /orders/me`
- `GET /orders` (admin)
- `GET /finance?startDate=2026-01-01&endDate=2026-12-31` (admin)

## Deploy no Render
- Criar Web Service Node
- Build command: `npm install`
- Start command: `npm start`
- Configurar variáveis de ambiente do `.env.example`
