# Auditoria de tipos TypeScript/Node

Este repositório está implementado em JavaScript CommonJS (`.js`) e não possui `tsconfig.json`, componentes React, `interface`, `type` ou uso explícito de `any`. Por isso, os riscos de tipagem aparecem principalmente como ausência de tipos estáticos em requests/responses, modelos Mongoose, serviços e middlewares.

## 1. Uso excessivo de `any`

Não há ocorrências explícitas de `any`, mas a ausência de TypeScript faz com que os seguintes pontos sejam tratados de forma equivalente a `any` em tempo de desenvolvimento:

- `req.body`, `req.query`, `req.params` e `req.user` em controllers e middlewares.
- Documentos Mongoose retornados por `User`, `Product`, `Order`, `Cart`, `WholesaleConfig` e demais models.
- Payloads de JWT e objetos públicos retornados por serviços como `publicUser()` e `issueTokens()`.
- Objetos genéricos como `payload` em auditoria administrativa.

Melhoria sugerida: migrar gradualmente para TypeScript ou habilitar checagem via JSDoc com `// @ts-check`, criando tipos como `AuthenticatedRequest`, `JwtPayload`, `PublicUser`, `Address`, `ProductCategory`, `OrderStatus`, `OrderSource`, `CartItem` e DTOs de entrada/saída para cada rota.

## 2. Props de componentes sem interface/tipo

Não há componentes de frontend neste repositório; portanto não foram encontrados props React sem interface/tipo definido. Se o frontend estiver em outro repositório, recomenda-se tipar props com `interface` para objetos extensíveis de componentes e exportar tipos de DTOs compartilhados da API para evitar divergência entre frontend e backend.

## 3. Inconsistências entre `interface` e `type`

Não há uso de `interface` nem `type`, pois o projeto ainda não está em TypeScript. Para uma futura migração, recomenda-se:

- Usar `interface` para contratos de objetos extensíveis, como props React, documentos públicos de usuário e formatos de request/response.
- Usar `type` para unions, aliases e composições, como `type UserRole = 'user' | 'admin'`, `type OrderStatus = 'novo' | 'pendente' | ...` e `type ProductCategory = 'tub' | 'cup' | 'popsicle' | 'acai'`.
- Manter esta convenção documentada para evitar alternância sem critério entre `interface` e `type`.

## 4. Tipos que poderiam ser mais específicos/restritivos

- Categorias de produto aparecem como enum Mongoose e deveriam ser também uma union TypeScript compartilhada (`ProductCategory`).
- Status e origem de pedidos deveriam ser unions (`OrderStatus`, `OrderSource`) em vez de strings livres nas funções de controller.
- Roles de usuário deveriam ser uma union (`UserRole`) usada em JWT, modelos, middlewares e respostas públicas.
- Campos monetários deveriam ter alias nominal ou validação centralizada para evitar confundir centavos, reais e números já arredondados.
- `AdminAudit.payload` foi ajustado para `mongoose.Schema.Types.Mixed`; em uma migração TypeScript, o próximo passo é substituir o payload genérico por tipos restritivos por ação administrativa.
- `req.user` deve ser tipado em um módulo de declaração do Express para impedir acesso inseguro a campos inexistentes.
- Responses de autenticação devem ter contratos explícitos, por exemplo `AuthResponse = { user: PublicUser; accessToken: string; refreshToken: string }`.

## Plano recomendado de melhoria

1. Adicionar TypeScript em modo incremental com `allowJs`, `checkJs` e `noImplicitAny` inicialmente desativado.
2. Criar `src/types/domain.ts` para unions e DTOs de domínio.
3. Criar `src/types/express.d.ts` para estender `Express.Request` com `user` autenticado e `rawBody`.
4. Tipar services primeiro (`authTokenService`, JWT e normalização de produtos), pois eles concentram contratos reutilizados.
5. Tipar validators/controllers por rota, validando que o DTO aceito pelo backend corresponde ao payload enviado pelo frontend.
6. Depois da migração, ativar gradualmente `strict`, `noImplicitAny`, `strictNullChecks` e `noUncheckedIndexedAccess`.
