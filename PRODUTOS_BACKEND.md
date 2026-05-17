# Produtos no backend

O frontend consome `GET /products` e espera uma lista de produtos usando campos em inglês.
O backend também aceita os nomes antigos em português para manter compatibilidade com o painel/admin existente.

## Schema público retornado

```json
{
  "id": "ObjectId",
  "name": "Ninho Trufado",
  "description": "Cremoso leitinho com pedaços de trufa.",
  "price": 12,
  "image": "https://...",
  "imageUrl": "https://...",
  "category": "cup",
  "size": "300ml",
  "stock": 0,
  "active": true
}
```

## Campos aceitos ao criar/editar

O `POST /products` e o `PUT /products/:id` aceitam estes campos:

- `name` ou `nome`
- `description` ou `descricao`
- `price` ou `preco`
- `image`, `imageUrl` ou `imagem`
- `category` ou `categoria`
- `size` ou `tamanho`
- `stock` ou `estoque`
- `active` ou `ativo`

Categorias válidas:

- `tub` (`pote` também é aceito e normalizado para `tub`)
- `cup` (`copo` também é aceito e normalizado para `cup`)
- `popsicle` (`picole`/`picolé` também são aceitos e normalizados para `popsicle`)
- `acai` (`açaí` também é aceito e normalizado para `acai`)

## Endpoints

- `GET /products` — público, lista apenas produtos ativos.
- `GET /products/ativos` — público, alias para produtos ativos.
- `GET /products/admin/todos` — admin, lista todos os produtos.
- `POST /products` — admin, cria produto.
- `PUT /products/:id` — admin, edita produto.
- `DELETE /products/:id` — admin, remove produto.

## Popular com seed

O arquivo `scripts/seed-products.json` contém os 41 produtos atuais do frontend.

Simular sem enviar:

```bash
DRY_RUN=1 npm run seed:products
```

Enviar para o backend em produção:

```bash
export ADMIN_TOKEN="seu_accessToken_de_admin"
export API_URL="https://sorveteria-b.onrender.com"
npm run seed:products
```

## 6. Admin, usuários e fidelidade

Campos adicionados em `users` para o Clube Ayla:

```json
{
  "telefone": "(11) 99999-9999",
  "phone": "(11) 99999-9999",
  "loyaltyStamps": 4,
  "loyaltyCredits": 1
}
```

Endpoints administrativos:

- `GET /users` — admin, lista usuários. Aceita `?search=` para buscar por nome, email ou telefone.
- `PUT /users/:id` — admin, edita usuário com `name`, `nome`, `phone`, `telefone`, `role`, `address`, `endereco`, `loyaltyStamps`, `loyaltyCredits`.
- `GET /orders?userId=<id>` — admin, lista pedidos de um usuário específico.
- `PUT /orders/:id` — admin, altera status do pedido.

Status aceitos no pedido:

- `pendente`
- `preparando`
- `saiu_entrega`
- `entregue`
- `cancelado`
- `concluido`

## 7. Regras do Clube Ayla

Campos adicionados em `orders`:

```json
{
  "loyaltyCreditsUsed": 1,
  "loyaltyStampsEarned": 2,
  "loyaltyApplied": false,
  "loyaltyReversed": false
}
```

Fluxo implementado:

1. `POST /orders` aceita `loyaltyCreditsUsed` e valida se o usuário tem créditos suficientes.
2. Ao criar o pedido, os créditos usados são debitados do usuário.
3. `PUT /orders/:id` com status `entregue` ou `concluido` aplica os selos (`loyaltyStampsEarned`) uma única vez.
4. A cada 10 selos, o backend converte automaticamente em 1 crédito de fidelidade.
5. `PUT /orders/:id` com status `cancelado` reverte selos aplicados e devolve créditos usados no pedido.

## 8. Criar admin Ayla com segurança

Não armazene senha em texto plano no repositório. Para criar/promover `ayla@admin.com`, execute no ambiente seguro do Render:

```bash
ADMIN_EMAIL="ayla@admin.com" ADMIN_PASSWORD="senha_forte_aqui" npm run seed:admin
```

O script cria ou atualiza o usuário com `role: "admin"` e salva a senha com hash bcrypt.

## 9. Imagens de produtos e pedidos do WhatsApp

### Imagens de produtos

O campo `image`/`imageUrl` continua opcional em `POST /products` e `PUT /products/:id`.
Quando o backend não receber imagem, ele salva `imagem: ""`; o frontend usa fallback local pelo nome/categoria.
Quando houver upload público (Cloudinary, S3, Render Disk ou CDN), envie a URL pública em `image`, `imageUrl` ou `imagem`.

### Pedido público via WhatsApp

Endpoint público para integradores/bots de WhatsApp:

```http
POST /orders/whatsapp
x-webhook-secret: <WHATSAPP_WEBHOOK_SECRET>
Content-Type: application/json
```

Body aceito:

```json
{
  "customerName": "Maria",
  "customerPhone": "5511965474023",
  "source": "whatsapp",
  "status": "pendente",
  "items": [
    { "name": "Pote Chocolate", "price": 35, "quantity": 1, "category": "tub" }
  ],
  "total": 35
}
```

O backend salva `source: "whatsapp"`, `customerName`, `customerPhone`, itens, total e status. Configure a variável `WHATSAPP_WEBHOOK_SECRET` no Render e use o mesmo valor no integrador (Z-API, Twilio, WhatsApp Cloud API ou n8n).

### Filtros para admin

- `GET /orders?source=whatsapp` lista somente pedidos vindos do WhatsApp.
- `GET /orders?source=site` lista pedidos do site.
- `GET /orders?userId=<id>` lista pedidos de um usuário.
- `GET /finance?source=whatsapp&period=7d` calcula KPIs apenas de pedidos do WhatsApp.

### Fidelidade: 1 selo por pote

A pontuação padrão agora considera somente itens com categoria `tub`/`pote`.
Cada unidade de pote gera 1 selo quando o admin muda o status para `entregue` ou `concluido` via `PUT /orders/:id`.
