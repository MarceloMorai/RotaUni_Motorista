# RotaUni Motorista — Arquitetura

## Objetivo

Mesma arquitetura local-first do app do passageiro (`RotaUni`), para que os dois apps possam ser ligados ao mesmo backend (Spring Boot) trocando só a implementação dos repositórios.

```text
Tela (src/app)
   ↓ usa
Hook (src/hooks)            ← ou o AppProvider (src/state)
   ↓ chama
Serviço de regras (src/services/rides/ride-management.service.ts)
   ↓ usa
Repositório (src/services)  ← interface + implementação local
   ↓ usa
StorageAdapter (src/storage)
   ↓
AsyncStorage
```

Futuro:

```text
RotaUni (passageiro) ─┐
                      ├─ REST/JSON ─→ Spring Boot ─→ Banco de dados
RotaUni Motorista ────┘
```

## Pastas

O código fica dividido em três partes:

- **`src/app/`**: só as rotas.
- **`src/core/`**: a parte de "back". Regras, dados e estado, sem nada visual.
- **`src/ui/`**: a parte de "front". Telas, componentes e estilos.

```text
src/
├── app/                          # SÓ ROTAS (Expo Router)
│   ├── _layout.tsx               # Tema, SafeArea, AppProvider, splash
│   ├── (onboarding)/_layout.tsx  # Guarda: logado → "/"
│   ├── (onboarding)/login.tsx    # 1 linha: export { default } from '@/ui/screens/login/login.screen'
│   ├── (app)/_layout.tsx         # Guarda: não logado → "/login"
│   └── (app)/...                 # idem, 1 linha por rota
│
├── core/                         # "BACK": regras e dados (sem telas, sem estilos)
│   ├── domain/                   # Tipos e funções puras (ride, vehicle, request, auth, user)
│   ├── services/                 # Repositórios (interface + local) e ride-management.service
│   ├── storage/                  # StorageAdapter + chaves
│   ├── data/                     # Dados simulados (passageiros)
│   ├── state/app-provider.tsx    # Conta, perfil, veículo, hidratação
│   └── hooks/                    # Hooks de dados usados pelas telas
│
└── ui/                           # "FRONT": o que aparece na tela
    ├── screens/<tela>/
    │   ├── <tela>.screen.tsx     # Estrutura (JSX) e interação
    │   └── <tela>.styles.ts      # Estilos da tela
    ├── components/<componente>/
    │   ├── <componente>.tsx
    │   └── <componente>.styles.ts
    ├── theme/                    # Cores, fontes, Palette, use-theme, global.css
    └── utils/format.ts           # Formatação para exibição (preço, data, máscara)
```

### Regras de dependência

```text
app  ──→  ui  ──→  core
```

- `core` **nunca** importa de `ui` (nem `StyleSheet`, nem componentes React Native).
- `ui` usa o `core` só por **hooks**, **`useAppState`** e **tipos/funções do `domain`**, nunca chamando repositórios ou storage direto.
- Estilos ficam no `.styles.ts` ao lado do arquivo. No `.tsx` só entram estilos dinâmicos (ex.: cor que depende do status).
- Ordem dos imports: bibliotecas → `@/core/...` → `@/ui/...` → `./*.styles`.

### Onde mexer

| Quero mudar... | Arquivo |
|---|---|
| Uma regra (vagas, preço, iniciar/finalizar) | `core/services/rides/ride-management.service.ts` |
| Um tipo ou validação pura | `core/domain/...` |
| Onde/como os dados são salvos | `core/services/.../local-*.repository.ts` |
| O layout de uma tela | `ui/screens/<tela>/<tela>.screen.tsx` |
| Cores, espaçamentos, fontes de uma tela | `ui/screens/<tela>/<tela>.styles.ts` |
| Cores da marca, espaçamentos, cantos, sombra e peças prontas | `ui/theme/theme.ts` (`colors`, `spacing`, `radius`, `typography`, `shadow`, `ui`) |
| Uma rota nova | crie a tela em `ui/screens/` e um arquivo de 1 linha em `app/` |

## Código compartilhado com o app do passageiro

Copiados sem alteração de comportamento. Mudaram só de pasta, e devem continuar iguais nos dois apps:

- `core/storage/storage.adapter.ts`, `core/storage/async-storage.adapter.ts`
- `core/services/auth/*` (hash de senha, sessão, conta). `normalizeEmail`/`isValidEmail` agora ficam em `core/domain/auth/email.ts` e são reexportados pelo `password.service`.
- `core/services/user/user.repository.ts`
- `core/domain/auth/*`, `core/domain/user/user.types.ts`
- `ui/components/themed-text`, `ui/components/themed-view`, `ui/theme/use-theme.ts`
- `ui/theme/theme.ts`: os nomes antigos (`Colors`, `Palette`, `Fonts`, `Spacing`) continuam existindo, mas agora apontam para o tema visual do motorista (azul `#1E4FD8` + laranja `#FF7A1A`, só modo claro). Ao alinhar o visual dos dois apps, copiar este arquivo para o passageiro.

As chaves de armazenamento usam o prefixo `rotauni-driver.` (o passageiro usa `rotauni.`).

## Repositórios

| Repositório | Implementação atual |
|---|---|
| `UserAccountRepository` | `LocalUserAccountRepository` |
| `SessionRepository` | `LocalSessionRepository` |
| `UserRepository` (perfil) | objeto local |
| `VehicleRepository` | `LocalVehicleRepository` |
| `RidesRepository` | `LocalRidesRepository` |
| `RideRequestsRepository` | `LocalRideRequestsRepository` |

As regras de negócio ficam em `core/services/rides/ride-management.service.ts` (`createRide`, `acceptRequest`, `rejectRequest`, `startRide`, `finalizeRide`, `cancelRide`). Erros de regra são lançados como `RideRuleError`, com mensagem pronta para exibir.

## Contrato de integração (para o backend)

### Entidades

| Motorista | Passageiro | Observação |
|---|---|---|
| `Ride` | `Ride` | Mesmos campos até `price`. O motorista acrescenta `origin`, `status`, `createdAt`, `startedAt`, `completedAt`, `cancelledAt`. |
| `Driver.rating: number \| null` | `Driver.rating: number` | `null` = motorista sem avaliações. O passageiro precisará tratar `null`. |
| `RideRequest` | `Booking` | Uma reserva do passageiro vira uma solicitação para o motorista. |
| `Vehicle` | — | Só no motorista. `Ride.vehicle`/`vehicleColor` são uma cópia no momento da criação. |
| — | `Rating` | A média das avaliações feitas no app do passageiro alimenta `Driver.rating`. |

### Endpoints sugeridos

```text
POST   /auth/register                      # perfil + papel (PASSENGER | DRIVER)
POST   /auth/login

GET    /drivers/me/vehicle
PUT    /drivers/me/vehicle

GET    /drivers/me/rides                   # caronas do motorista
POST   /rides                              # criar carona
GET    /rides/{rideId}
POST   /rides/{rideId}/start
POST   /rides/{rideId}/finalize
POST   /rides/{rideId}/cancel

GET    /rides/{rideId}/requests
POST   /rides/{rideId}/requests/{id}/accept
POST   /rides/{rideId}/requests/{id}/reject

# Lado do passageiro
GET    /rides?status=scheduled             # lista de caronas disponíveis
POST   /rides/{rideId}/requests            # passageiro pede para entrar
```

Para migrar, cria-se por exemplo `RestRidesRepository implements RidesRepository` e troca-se apenas o `export const ridesRepository`. As regras do `ride-management.service.ts` passam a ser validadas também no servidor.

### Decisão pendente

Hoje o passageiro reserva diretamente (`Booking` com status `confirmed`). No app do motorista, o passageiro entra via solicitação aprovada. Ao ligar os dois apps, será preciso escolher entre:

1. A reserva do passageiro vira `pending` e espera o motorista aceitar; ou
2. O motorista configura a carona como "aceite automático".

# Integração da aplicação

O app está organizado em `src/core` (domínio, estado, hooks e serviços) e `src/ui` (rotas, telas e componentes). A factory em `src/core/services/factories/repository-factory.ts` seleciona repositórios locais ou HTTP conforme `EXPO_PUBLIC_DATA_SOURCE`.

O cliente HTTP normaliza a base para `/api/v1`, envia `X-User-Id` a partir da sessão simulada e converte respostas da API para os tipos usados pela UI. O modo `mock` continua disponível offline.