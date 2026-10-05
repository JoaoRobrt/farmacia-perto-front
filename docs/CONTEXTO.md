# Farmácia Perto — Contexto do Projeto

Arquivo de contexto para ser lido por qualquer assistente de IA (ou pessoa) que for trabalhar no projeto. Se usar Claude Code, pode renomear para `CLAUDE.md` na raiz do repositório.

---

## 1. Visão geral

**Farmácia Perto** é um aplicativo móvel para localizar farmácias credenciadas ao **Programa Farmácia Popular do Brasil**. O cidadão escolhe o estado e o município e visualiza, em um mapa do Google Maps, as farmácias credenciadas, podendo traçar uma rota até a farmácia escolhida.

- **Município piloto:** Campina Grande, Paraíba (testes e consolidação).
- **Expansão prevista:** outros municípios e estados do Brasil, conforme a cobertura da fonte de dados que for adotada.
- **Público:** pessoas que procuram farmácias credenciadas, familiares e cuidadores.
- **Origem:** projeto acadêmico de Sistemas de Informação (UNIFACISA), metodologia Design Science Research.
- **Repositórios:** o projeto é dividido em **dois repositórios**. Este é o do **app mobile (front-end)**. O **back-end** (API, banco de dados, importação e sincronização dos dados oficiais) fica em outro repositório. Ver seção 12.

## 2. Problema

Hoje o Ministério da Saúde mantém uma consulta de endereços das farmácias credenciadas (lista atualizada diariamente), mas o processo exige pesquisa manual, comparação de endereços e abertura separada de um serviço de navegação. O app reúne localização no mapa, busca e rota em um só lugar.

## 3. Escopo da etapa atual: somente front-end visual

**Dentro do escopo**
- Navegação e telas do app.
- Mapa com marcadores das farmácias.
- Painel de detalhes e botão "Traçar rota".
- Dados 100% mockados localmente.

**Fora do escopo (não implementar agora)**
- Geolocalização do usuário e ordenação por proximidade.
- Importação/sincronização de dados oficiais (ETL).
- Autenticação e cadastro.
- Qualquer código de back-end, banco de dados, ETL ou sincronização: pertence ao repositório do back.
- Chamadas reais de API: nesta etapa os mocks continuam ativos; o cliente HTTP fica apenas preparado (ver seção 12).
- Geocodificação, agrupamento de marcadores por zoom, testes com usuários.

## 4. Fluxo do app

Sem login. O usuário abre o app e segue:

1. **Tela 1 — Estado:** lista pesquisável de estados.
2. **Tela 2 — Município:** lista pesquisável de municípios do estado escolhido.
3. **Tela 3 — Mapa:** Google Maps com todos os marcadores das farmácias do município.
4. **Toque em um marcador:** abre um painel inferior (bottom sheet) com nome, endereço, bairro e o botão **"Traçar rota"**, que abre o app do Google Maps com a farmácia como destino.

Aviso exibido no painel: *a localização de uma farmácia credenciada não confirma estoque ou disponibilidade de medicamentos.*

## 5. Stack e decisões técnicas

| Tema | Decisão |
|---|---|
| Framework | Expo (managed) + React Native |
| Linguagem | TypeScript (strict) |
| Navegação | Expo Router (rotas por arquivos) |
| UI | React Native Paper (Material Design 3) |
| Mapa | `react-native-maps` com provider Google Maps |
| Plataforma | Somente Android nesta etapa |
| Dados | Mockados em arquivos locais, acessados por camada de serviço assíncrona |
| Back-end | Repositório separado (stack ainda não definida). O app consumirá uma API HTTP |
| Configuração da API | URL base em variável de ambiente `EXPO_PUBLIC_API_URL`; cliente HTTP isolado em `src/services/`, ainda não usado enquanto os mocks estiverem ativos |
| Estado/seleção | Estado e município em duas telas separadas, com lista pesquisável |
| Detalhes da farmácia | Painel inferior próprio com `Animated` (sem biblioteca extra) |
| Rota | Abre o Google Maps via URL universal `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG` com `Linking.openURL`; sem Directions API e sem polyline |
| Identidade visual | Azul institucional (estilo SUS/gov.br), tema claro, cor primária `#1351B4` |

**Observações**
- No Expo Go (Android) o mapa funciona sem chave própria. Para build próprio é necessária uma chave do *Maps SDK for Android*, configurada em `android.config.googleMaps.apiKey` no `app.json`.
- Alternativa ao painel próprio, se quiser gestos de arrastar: `@gorhom/bottom-sheet` (exige `react-native-reanimated` e `react-native-gesture-handler`).

## 6. Estrutura de pastas

```
farmacia-perto/
├── app/                  # rotas (Expo Router)
│   ├── _layout.tsx       # PaperProvider + Stack
│   ├── index.tsx         # Tela 1: estados
│   ├── municipios.tsx    # Tela 2: municípios
│   └── mapa.tsx          # Tela 3: mapa
├── .env.example          # EXPO_PUBLIC_API_URL (placeholder, sem valor real)
└── src/
    ├── components/       # componentes reutilizáveis (busca, vazio, erro, painel)
    ├── data/             # mocks (estados, municípios, farmácias)
    ├── services/         # repositório assíncrono (trocável por API)
    │   ├── apiClient.ts  # cliente HTTP (preparado, ainda não usado)
    │   └── ...           # funções listarEstados / listarMunicipios / listarFarmacias
    ├── theme/            # tema Paper, espaçamentos, raios
    └── types/            # Estado, Municipio, Farmacia
```

## 7. Modelo de dados (mock)

```ts
type Estado = { sigla: string; nome: string };
type Municipio = { id: string; nome: string; uf: string };
type Farmacia = {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  municipioId: string;
  latitude: number;
  longitude: number;
};
```

Serviços previstos (todos `Promise`, com pequeno delay simulado):
- `listarEstados(): Promise<Estado[]>`
- `listarMunicipios(uf: string): Promise<Municipio[]>`
- `listarFarmacias(municipioId: string): Promise<Farmacia[]>`

As farmácias mockadas são **fictícias** (sem nomes de redes ou estabelecimentos reais), com coordenadas em torno de Campina Grande (`-7.2306, -35.8811`) e algumas em João Pessoa.

## 8. Regras para quem for gerar código

- Código em TypeScript, componentes funcionais com hooks.
- Textos da interface em português do Brasil.
- Não instalar bibliotecas além das listadas sem consultar o dono do projeto.
- Em caso de dúvida técnica relevante, perguntar antes de decidir.
- Estados de interface obrigatórios nas telas de dados: carregando, vazio e erro (com "Tentar novamente").
- Acessibilidade: áreas de toque ≥ 48dp, contraste WCAG AA, labels de acessibilidade.
- Não pedir permissão de localização nesta etapa.
- Deixar pontos de extensão comentados (sem implementar) para a futura localização do usuário.

## 9. Privacidade (para fases futuras)

A proposta prevê: geolocalização solicitada somente quando necessária, possibilidade de negar a permissão e buscar por bairro/endereço, minimização de dados e conformidade com a LGPD (Lei nº 13.709/2018). A posição do dispositivo não deve ser armazenada além do tempo da consulta. Não coletar dados clínicos nem prescrições.

## 10. Roadmap

1. **Atual:** front-end visual com mocks (Estado → Município → Mapa → Rota).
2. Localização do usuário e ordenação por proximidade; busca por nome ou bairro.
3. *(repositório do back)* Pesquisa e análise da fonte oficial de dados (cobertura, atualização, duplicidades, qualidade das coordenadas).
4. *(repositório do back)* Importação e sincronização automática (ETL). *(app)* Exibir a data da última sincronização bem-sucedida, vinda da API.
4.1. *(app + back)* Trocar os mocks pela API real, mantendo as telas inalteradas.
5. Agrupamento de marcadores por zoom em áreas densas (utility library do Maps SDK).
6. Testes de usabilidade em Campina Grande e avaliação de expansão para outras localidades.

## 11. Referências

- Ministério da Saúde. *Consulta de endereço das farmácias credenciadas ao Programa Farmácia Popular.* https://infoms.saude.gov.br/extensions/SEIDIGI_DEMAS_PFPB_ENDERECOS/SEIDIGI_DEMAS_PFPB_ENDERECOS.html
- Google. *Maps SDK for Android.* https://developers.google.com/maps/documentation/android-sdk
- Google. *Maps SDK for Android Utility Library: marker clustering.* https://developers.google.com/maps/documentation/android-sdk/utility/marker-clustering
- Hevner et al. (2004). *Design science in information systems research.* MIS Quarterly, 28(1), 75-105.
- Brasil. Lei nº 13.709/2018 (LGPD).

## 12. Separação de repositórios e contrato da API

O projeto tem dois repositórios independentes:

| Repositório | Responsabilidade |
|---|---|
| **App mobile (este)** | Telas, navegação, mapa, tema, consumo da API |
| **Back-end** | API HTTP, banco de dados, importação/sincronização da fonte oficial, qualidade dos dados, geocodificação |

### Regras de integração

- O app **nunca** acessa banco de dados nem a fonte oficial diretamente; só conversa com a API.
- A URL da API vem de `EXPO_PUBLIC_API_URL`. O arquivo `.env.example` traz apenas o nome da variável; o `.env` real não entra no controle de versão.
- Enquanto os mocks estiverem ativos, `src/services/` devolve os dados locais. Para migrar, só a implementação das três funções muda; telas e componentes não são alterados.
- Os tipos `Estado`, `Municipio` e `Farmacia` (seção 7) são a **referência do contrato**. Qualquer mudança neles deve ser refletida nos dois repositórios.

### Contrato proposto (a confirmar com o back)

| Método | Endpoint | Resposta |
|---|---|---|
| GET | `/estados` | `Estado[]` |
| GET | `/estados/{uf}/municipios` | `Municipio[]` |
| GET | `/municipios/{id}/farmacias` | `Farmacia[]` |

Formato das respostas: JSON, mesmos campos e nomes dos tipos TypeScript da seção 7. Erros devem devolver status HTTP adequado e um corpo simples com mensagem, que o app traduz para as telas de erro.

### Decisões em aberto

- **Ordenação por proximidade (fase futura):** feita no back (a API recebe latitude/longitude e devolve ordenado) ou no app (a API devolve tudo e o app ordena)? A escolha altera o contrato.
- **Stack do back-end:** ainda não definida.
- **Data da última sincronização:** em qual endpoint ou campo a API vai expor esse dado.
- **Paginação:** municípios grandes podem ter muitas farmácias; definir se a API pagina ou devolve tudo.
