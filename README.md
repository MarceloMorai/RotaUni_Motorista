# RotaUni Motorista

App mobile para motoristas universitários oferecerem caronas. É o par do app do passageiro (**RotaUni**) e usa a mesma stack: Expo SDK 57, React Native 0.86, React 19, TypeScript (strict) e Expo Router.

## Rodando

```bash
npm install
npx expo start
```

Escaneie o QR code com o Expo Go (SDK 57). Na primeira execução, espere o terminal mostrar `Android Bundled` e toque em **Reload** no Expo Go.

## Verificações

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npx expo-doctor
```

## Como testar o fluxo

1. Crie uma conta (dados pessoais + veículo) e entre.
2. Toque em **+ Oferecer carona**, preencha destino, horário, vagas e preço.
3. Na carona criada aparecem 3 solicitações simuladas: aceite ou recuse.
4. **Iniciar carona** → **Finalizar carona**.
5. Veja o resumo na home e a carona no **Histórico**.

## Documentação

- [docs/product-scope.md](docs/product-scope.md) — escopo e limitações
- [docs/business-rules.md](docs/business-rules.md) — regras de negócio
- [docs/architecture.md](docs/architecture.md) — arquitetura e contrato de integração com o app do passageiro
- [docs/roadmap.md](docs/roadmap.md) — próximos passos
- Guia de construção (comum aos dois apps): `../RotaUni/docs/guia-de-construcao.md`

## Integração

A arquitetura usa `src/core` para domínio e serviços e `src/ui` para telas e componentes.

O modo HTTP usa `.env.local` com `EXPO_PUBLIC_DATA_SOURCE=http` e `EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1`. Para trabalhar offline, use `EXPO_PUBLIC_DATA_SOURCE=mock`.

Validação local: `npm run typecheck` e `npm run lint`.