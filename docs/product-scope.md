# RotaUni Motorista — Escopo do produto

## Produto

O RotaUni é um app de carona universitária dividido em dois apps:

- **RotaUni** — passageiro (projeto `RotaUni`);
- **RotaUni Motorista** — este projeto.

Este app permite que um motorista universitário:

- crie uma conta local com perfil e veículo;
- entre e saia da conta;
- ofereça caronas (destino, horário, vagas, preço ou gratuita);
- veja e responda solicitações de passageiros (aceitar/recusar);
- inicie, finalize ou cancele caronas;
- veja o resumo (caronas feitas, passageiros levados, valor arrecadado) e o histórico;
- edite o veículo.

## Fluxo do motorista

```text
Cadastro (dados + veículo) ──→ já entra na conta
  ↓                               │
Login (próximas vezes)            │
  ↓  ←────────────────────────────┘
Home (resumo + minhas caronas)
  ↓
Oferecer carona
  ↓
Detalhes da carona → aceitar/recusar passageiros
  ↓
Iniciar carona
  ↓
Finalizar carona
  ↓
Carona finalizada
  ↓
Histórico
```

## Limitações do protótipo

Este protótipo local **não** implementa:

- backend, API REST ou banco remoto;
- comunicação real com o app do passageiro (as solicitações são simuladas);
- caronas recorrentes, paradas intermediárias ou data da carona (só horário);
- GPS, mapas, localização em tempo real;
- chat, pagamentos, notificações push;
- avaliação de passageiros pelo motorista.

Não implemente esses itens sem um pedido explícito.

# Escopo atual

O motorista mantém cadastro em formulário único, perfil somente leitura, criação e ciclo de vida de caronas, gerenciamento de solicitações, veículo e avaliação de passageiros. A API pode ser usada em modo HTTP ou o app pode operar com os repositórios locais em modo mock.
