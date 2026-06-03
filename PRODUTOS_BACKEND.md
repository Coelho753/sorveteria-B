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

- `pote`
- `tub` (legado)
- `cup` (`copo` também é aceito e normalizado para `cup`)
- `pic_agua`
- `pic_leite`
- `pic_premium`
- `pic_ski`
- `popsicle` (legado; `picole`/`picolé` também são aceitos e normalizados para `popsicle`)
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

## 6. Admin, usuários e atacado

Endpoints administrativos:

- `GET /users` — admin, lista usuários. Aceita `?search=` para buscar por nome, email ou telefone.
- `PUT /users/:id` — admin, edita usuário com `name`, `nome`, `phone`, `telefone`, `role`, `email`, `password`, `senha`, `address`, `endereco`.
- `DELETE /users/:id` — admin, remove usuário e desvincula pedidos antigos.
- `GET /orders?userId=<id>` — admin, lista pedidos de um usuário específico.
- `PUT /orders/:id` — admin, altera status do pedido.
- `DELETE /orders/:id` — admin, remove pedido.

Status aceitos no pedido:

- `pendente`
- `pago`
- `separando`
- `saiu_para_entrega`
- `entregue`
- `cancelado`
- `novo` (legado)
- `preparando` (legado)
- `enviado` (legado)
- `saiu_entrega` (legado; normalizado para `saiu_para_entrega` em novas atualizações)
- `concluido` (legado)

## 7. Preços de atacado

Campos e coleções:

- `products.wholesalePrice` — preço de atacado opcional por produto. Também é exposto como `wholesale_price`.
- `wholesale_category_prices` — preço por categoria (`pote`, `tub`, `cup`, `pic_agua`, `pic_leite`, `pic_premium`, `pic_ski`, `popsicle`, `acai`).
- `wholesale_configs` — configuração global com `threshold` default `3` e `defaultDiscount` default `0.35`.

Endpoints:

- `GET /wholesale` — público → `{ categories, products, threshold, defaultDiscount, default_discount }`
- `PUT /wholesale/category` body `{ category, price }`
- `PUT /wholesale/product` body `{ productId, price }`
- `DELETE /wholesale/category/:cat`
- `DELETE /wholesale/product/:id`
- `GET /wholesale/config`
- `PUT /wholesale/config` body `{ threshold, defaultDiscount }` ou `{ threshold, default_discount }`

Regra do pedido:

1. O backend conta quantidade por categoria.
2. Se `count(category) >= threshold`, aplica preço de atacado.
3. Prioridade: `wholesalePrice` do produto → preço da categoria → `price * (1 - defaultDiscount)`.
4. O cliente não define o desconto final; `POST /orders` sempre recalcula `subtotal`, `wholesaleDiscount` e `valorTotal`.

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


### Configuração pública

`GET /config/public` retorna:

```json
{
  "whatsappPhone": "5511965474023",
  "whatsapp": "5511965474023",
  "address": "Rua exemplo, 123",
  "hours": "Seg a Dom, 10h às 22h"
}
```

Esses valores vêm de `WHATSAPP_PHONE`, `STORE_ADDRESS` e `STORE_HOURS`.

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
    { "name": "Pote Chocolate", "price": 35, "quantity": 1, "category": "pote" }
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

