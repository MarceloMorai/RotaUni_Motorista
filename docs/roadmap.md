# RotaUni Motorista — Roadmap

## Fase atual

Protótipo local-first do motorista. Implementado:

- cadastro com veículo, login, sessão, logout e reset;
- oferecer carona (destino, horário, vagas, preço/gratuita);
- solicitações simuladas de passageiros com aceitar/recusar;
- iniciar, finalizar e cancelar carona;
- resumo na home e histórico;
- edição do veículo.

## Próxima fase: backend compartilhado

- Backend Spring Boot servindo os dois apps (ver contrato em [architecture.md](architecture.md));
- autenticação no servidor com papéis passageiro/motorista;
- solicitações reais vindas do app do passageiro no lugar das simuladas;
- nota do motorista calculada a partir das avaliações do passageiro;
- decidir entre aprovação manual e aceite automático de passageiros.

## Possibilidades futuras

- data da carona e caronas recorrentes (ex.: toda segunda às 18:00);
- paradas intermediárias;
- avaliação de passageiros pelo motorista;
- notificações, chat, mapas, GPS, pagamentos.

Itens do roadmap só viram requisito quando pedidos explicitamente.

# Roadmap

- Fase 1: backend REST e contratos T1–T9.
- Fase 2: integração do app Motorista com modo HTTP/mock, veículo, caronas, solicitações e avaliações.
- Fase 3: integração do app Passageiro.
