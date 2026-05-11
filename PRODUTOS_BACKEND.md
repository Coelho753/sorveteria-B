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
