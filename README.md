# Farmácia Perto (app mobile)

Aplicativo para localizar farmácias credenciadas ao **Programa Farmácia Popular do Brasil**. O usuário escolhe o estado e o município, vê as farmácias em um mapa do Google Maps e pode traçar a rota até a farmácia escolhida pelo app do Google Maps.

Projeto acadêmico de Sistemas de Informação (UNIFACISA). Município piloto: Campina Grande - PB.

Esta etapa cobre **somente o front-end visual**, com dados mockados localmente. Não há login, geolocalização nem chamadas reais à API.

## Stack

- Expo (managed) + React Native + TypeScript (strict)
- Expo Router (rotas por arquivos)
- React Native Paper (Material Design 3), cor primária `#1351B4`
- `react-native-maps` com provider Google Maps
- Plataforma alvo: Android

## Fluxo

1. **Estados** (`app/index.tsx`): lista pesquisável, ignorando acentos e maiúsculas.
2. **Municípios** (`app/municipios.tsx`): lista pesquisável do estado escolhido.
3. **Mapa** (`app/mapa.tsx`): marcadores das farmácias do município. Ao tocar em um marcador abre o painel com nome, endereço e o botão **Traçar rota**. O botão **Trocar** no cabeçalho volta para a seleção de município.

Todas as telas de dados têm estados de carregando, vazio e erro (com "Tentar novamente").

## Como rodar

Pré-requisitos: Node.js LTS e o app **Expo Go** instalado no Android (ou um emulador Android).

```bash
npm ci
```

```bash
npx expo start
```

Leia o QR code com o Expo Go ou pressione `a` para abrir no emulador. No Expo Go o mapa funciona sem chave própria do Google Maps.

### Development build (Android)

Para gerar um build próprio é necessária uma chave do **Maps SDK for Android**:

1. No Google Cloud Console, crie uma chave e habilite o *Maps SDK for Android*.
2. Substitua `SUA_CHAVE_GOOGLE_MAPS_AQUI` em `android.config.googleMaps.apiKey` no `app.json`. Não versione a chave real.
3. Gere o build:

```bash
npx expo run:android
```

ou, pela nuvem, `npx eas-cli@latest build --profile development --platform android`.

### Verificações

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

## Estrutura de pastas

```
app/                    rotas (Expo Router)
  _layout.tsx           PaperProvider + Stack
  index.tsx             tela de estados
  municipios.tsx        tela de municípios
  mapa.tsx              tela do mapa
assets/images/          ícone, splash e favicon (placeholders)
src/
  components/           busca, carregando, vazio, erro, mapa e painel da farmácia
  data/                 dados mockados (estados, municípios, farmácias fictícias)
  hooks/                useCarregamento (estados de carregando/erro das telas)
  services/             farmaciaService (mocks) e apiClient (preparado, não usado)
  theme/                tema Paper, espaçamentos e raios
  types/                Estado, Municipio, Farmacia
  utils/                normalização de busca e abertura da rota
```

O mapa usa `MapViewContainer.tsx` no Android e `MapViewContainer.web.tsx` na web, onde o `react-native-maps` não é suportado e as farmácias aparecem em lista.

## Integração com o back-end

Este repositório contém **apenas o app**. A API, o banco de dados e a importação dos dados oficiais ficam no repositório do back-end. O app nunca acessa banco ou fonte oficial diretamente.

- A URL da API vem de `EXPO_PUBLIC_API_URL`. Copie `.env.example` para `.env` e preencha o valor. O `.env` não é versionado.
- Contrato esperado (a confirmar com o back), com respostas em JSON nos formatos de `src/types`:

| Método | Endpoint | Resposta |
|---|---|---|
| GET | `/estados` | `Estado[]` |
| GET | `/estados/{uf}/municipios` | `Municipio[]` |
| GET | `/municipios/{id}/farmacias` | `Farmacia[]` |

### Como trocar os mocks pela API

Somente `src/services/farmaciaService.ts` muda: substitua o corpo de `listarEstados`, `listarMunicipios` e `listarFarmacias` pelas chamadas a `apiGet` (de `src/services/apiClient.ts`). A implementação está descrita no comentário ao final do arquivo. Telas e componentes não precisam ser alterados.

## Fora desta etapa (roadmap)

- Localização do usuário e ordenação por proximidade (ponto de extensão comentado em `app/mapa.tsx`).
- Busca por nome ou bairro.
- Troca dos mocks pela API real e exibição da data da última sincronização.
- Importação e sincronização dos dados oficiais (ETL), no repositório do back-end.
- Agrupamento de marcadores por zoom.
- Ícone e splash definitivos (substituir os arquivos em `assets/images/`).
- Testes de usabilidade em Campina Grande.

Aviso exibido no app: a localização de uma farmácia credenciada não confirma estoque ou disponibilidade de medicamentos.
