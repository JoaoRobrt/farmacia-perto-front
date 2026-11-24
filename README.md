# Farmácia Perto (app mobile)

Aplicativo para localizar farmácias credenciadas ao **Programa Farmácia Popular do Brasil**. O usuário escolhe o estado e o município, vê as farmácias em um mapa do Google Maps e pode traçar a rota até a farmácia escolhida pelo app do Google Maps.

Projeto acadêmico de Sistemas de Informação (UNIFACISA). Município piloto: Campina Grande - PB.

Este repositório contém o app, que obtém estados, municípios e farmácias da API do back-end. Não há login. A localização do usuário é opcional e só é pedida quando ele toca em "Usar minha localização".

## Stack

- Expo (managed) + React Native + TypeScript (strict)
- Expo Router (rotas por arquivos)
- React Native Paper (Material Design 3), cor primária `#1351B4`
- `react-native-maps` com provider Google Maps (Android)
- Leaflet + OpenStreetMap (versão web, onde o `react-native-maps` não funciona)
- `expo-location` para a localização sob demanda
- Plataforma alvo: Android (a versão web serve para demonstração)

## Fluxo

1. **Estados** (`app/index.tsx`): lista pesquisável, ignorando acentos e maiúsculas.
2. **Municípios** (`app/municipios.tsx`): lista pesquisável do estado escolhido.
3. **Mapa** (`app/mapa.tsx`): mapa com um pin por farmácia do município e, rolando a tela, a lista das farmácias com os botões **Ver no mapa** e **Traçar rota**.
   - Ao tocar em um pin abrem os detalhes da farmácia com o botão **Traçar rota**: em painel lateral em telas largas (tablet, web) e em painel inferior no celular.
   - O botão de mira no mapa (**Usar minha localização**) pede a permissão e mostra a posição do usuário. A posição fica só em memória e não é enviada nem armazenada.
   - O botão **Trocar** no cabeçalho volta para a seleção de município.

Todas as telas de dados têm estados de carregando, vazio e erro (com "Tentar novamente").

## Como rodar

Pré-requisitos: Node.js LTS e o app **Expo Go** instalado no Android (ou um emulador Android).

```bash
npm ci
```

O app exige a API do back-end rodando. Copie `.env.example` para `.env` e preencha `EXPO_PUBLIC_API_URL` conforme o destino:

| Destino | Valor |
|---|---|
| Web no próprio PC | `http://localhost:3000` |
| Emulador Android | `http://10.0.2.2:3000` |
| Celular na mesma rede | `http://<IP do PC>:3000` |

Ao alterar o `.env`, reinicie o Expo.

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

O build na nuvem não recebe o `.env`: defina `EXPO_PUBLIC_API_URL` no ambiente do build. Build de release exige URL https, pois o Android bloqueia http nesse tipo de build.

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
  hooks/                useCarregamento (estados de carregando/erro das telas)
  services/             farmaciaService (consultas à API), localizacaoService e apiClient (cliente HTTP)
  theme/                tema Paper, espaçamentos e raios
  types/                Estado, Municipio, Farmacia
  utils/                normalização de busca e abertura da rota
```

O mapa usa `MapViewContainer.tsx` (Google Maps) no Android e `MapViewContainer.web.tsx` na web, que carrega `MapaLeaflet.tsx` (Leaflet + OpenStreetMap) somente no navegador, pois o Leaflet não funciona na renderização estática.

## Integração com o back-end

Este repositório contém **apenas o app**. A API, o banco de dados e a importação dos dados oficiais ficam no repositório do back-end. O app nunca acessa banco ou fonte oficial diretamente.

- A URL da API vem de `EXPO_PUBLIC_API_URL`, sem valor padrão, e precisa começar com `http://` ou `https://` (ver "Como rodar"). O `.env` não é versionado.
- Contrato da API (confirmado e implementado no back-end), com respostas em JSON nos formatos de `src/types`. O app consome os três endpoints abaixo.

| Método | Endpoint | Resposta |
|---|---|---|
| GET | `/estados` | `Estado[]` |
| GET | `/estados/{uf}/municipios` | `Municipio[]` |
| GET | `/municipios/{id}/farmacias` | `Farmacia[]` |

Erros devolvem `{ "mensagem": "..." }`: 400 para parâmetro inválido, 404 para UF ou município inexistente e para rota desconhecida, 500 para falha inesperada.

## Fora desta etapa (roadmap)

- Ordenação das farmácias por proximidade da localização do usuário.
- Busca por nome ou bairro.
- Exibição da data da última sincronização.
- Importação e sincronização dos dados oficiais (ETL), no repositório do back-end.
- Agrupamento de marcadores por zoom.
- Ícone e splash definitivos (substituir os arquivos em `assets/images/`).
- Testes de usabilidade em Campina Grande.

Aviso exibido no app: a localização de uma farmácia credenciada não confirma estoque ou disponibilidade de medicamentos.
