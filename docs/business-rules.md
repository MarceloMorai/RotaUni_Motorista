# RotaUni Motorista — Regras de negócio

Estas regras descrevem o comportamento intencional do app. Não altere sem um pedido explícito.

## Contas, senhas e sessão

Iguais às do app do passageiro:

- E-mail único, normalizado (`trim().toLowerCase()`), comparação sem diferenciar maiúsculas.
- Senha com no mínimo 8 caracteres, nunca salva em texto puro: salt aleatório de 16 bytes + SHA-256 iterado (`PASSWORD_ITERATIONS`).
- Conta, sessão e perfil são entidades separadas.
- Apenas uma sessão local ativa por vez.
- Ao concluir o cadastro, o motorista já entra na conta (não precisa fazer login de novo).
- As validações de cadastro e de veículo ficam no `core` (`domain/auth/registration.ts`, `domain/vehicle/vehicle.types.ts`) e são aplicadas pelo `AppProvider`, não só pelas telas.

## Veículo

- Todo motorista cadastra um veículo no cadastro: modelo, cor, placa e lugares para passageiros.
- Cada motorista tem **um** veículo; editar substitui o anterior.
- Placa no padrão antigo (`ABC1234`) ou Mercosul (`ABC1D23`), salva em maiúsculas sem hífen.
- Lugares para passageiros: de 1 a 6 (`MAX_VEHICLE_SEATS`), sem contar o motorista.
- Editar o veículo não altera caronas já publicadas.

## Criar carona

- A origem é o campus do perfil do motorista.
- Destino obrigatório, até 60 caracteres.
- Horário de saída no formato `HH:MM` (00:00–23:59).
- Vagas: de 1 até o número de lugares do veículo.
- Preço: gratuita (`price = null`) ou valor maior que zero e até R$ 100 por passageiro, com no máximo 2 casas decimais (centavos).
- Não pode haver duas caronas ativas (agendada ou em andamento) do mesmo motorista no mesmo horário.
- Dois toques rápidos em "Publicar" não criam duas caronas.

## Solicitações de passageiros

- No protótipo, ao publicar uma carona são geradas **3 solicitações simuladas** (`data/passengers.ts`). Com o backend, elas virão do app do passageiro.
- Só é possível aceitar ou recusar enquanto a carona está **agendada**.
- Só é possível aceitar se houver vaga livre.
- Cada solicitação só pode ser respondida uma vez.
- Aceitar soma 1 em `confirmedPassengers` e adiciona o nome em `passengerNames`.

## Ciclo de vida da carona

```text
Agendada ──iniciar──→ Em andamento ──finalizar──→ Finalizada
   │
   └──cancelar──→ Cancelada
```

- **Iniciar**: só com pelo menos 1 passageiro aceito, e só se o motorista não tiver outra carona em andamento. Solicitações ainda pendentes são recusadas.
- **Finalizar**: só a partir de "em andamento". Pede confirmação.
- **Cancelar**: só a partir de "agendada". Pede confirmação. Solicitações pendentes são recusadas.
- Arrecadação = preço × passageiros confirmados (zero se gratuita).

## Histórico

- Mostra apenas caronas **finalizadas**, da mais recente para a mais antiga.
- Caronas canceladas não aparecem no histórico (mesma regra do passageiro).

## Sair × Resetar

| Ação | Sessão | Contas/Perfis | Veículos | Caronas | Solicitações |
|---|---|---|---|---|---|
| Sair | apaga | mantém | mantém | mantém | mantém |
| Resetar (desenvolvimento) | apaga | apaga | apaga | apaga | apaga |

Não use o reset de desenvolvimento como implementação do logout. O botão de reset só aparece em builds de desenvolvimento (`__DEV__`).

# Regras integradas

- Caronas usam `open`, `in_progress`, `finished` e `cancelled` no domínio do app.
- Solicitações usam `pending`, `confirmed`, `rejected`, `completed` e `cancelled`.
- `origin` é derivada do campus do motorista.
- Veículo é consultado por `GET /drivers/me/vehicle`; cadastro HTTP cria a conta e depois faz upsert do veículo.
- Ratings sem avaliações são exibidos como `Sem avaliações`.
