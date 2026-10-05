# Farmácia Perto — Prompts para o front-end (React Native + Expo)

Estrutura de prompts sequenciais para construir **apenas a parte visual** do app Farmácia Perto. Use um prompt por vez, na ordem, e só avance quando o anterior estiver rodando sem erros.

**Como usar**
1. Cole o **Contexto fixo** no início de cada nova sessão com o assistente (ou deixe em um arquivo `CLAUDE.md` / `AGENTS.md` na raiz do projeto).
2. Execute os prompts 1 a 9 em ordem.
3. Ao final de cada prompt, rode `npx expo start` e teste no Android antes de seguir.

---

## Contexto fixo (cole sempre)

```
Projeto: "Farmácia Perto", aplicativo móvel para localizar farmácias credenciadas ao
Programa Farmácia Popular do Brasil.

ESCOPO DESTA ETAPA: apenas o front-end (visual e navegação). NÃO implementar
geolocalização do usuário, ordenação por proximidade, importação/sincronização de dados,
autenticação nem backend. Todos os dados são mockados localmente.

Fluxo do app (sem login):
  Seleção de estado -> Seleção de município -> Mapa com as farmácias do município.
Ao tocar em um marcador abre um painel inferior (bottom sheet) com os detalhes da farmácia
e um botão "Traçar rota" que abre o app do Google Maps com a farmácia como destino.

Stack decidida:
- Expo (managed) + React Native + TypeScript (strict)
- Expo Router (rotas por arquivos)
- React Native Paper (Material Design 3) para UI
- react-native-maps com provider Google Maps
- Somente Android nesta etapa
- Dados mockados em arquivos locais (JSON/TS)

Arquitetura: este repositório contém SOMENTE o app mobile. O back-end (API, banco de
dados, importação/sincronização dos dados oficiais) fica em OUTRO repositório, com stack
ainda não definida. O app nunca acessa banco ou fonte oficial diretamente; só consome uma
API HTTP. Nesta etapa os mocks continuam ativos e o cliente HTTP fica apenas preparado.
Contrato proposto da API (a confirmar):
  GET /estados                       -> Estado[]
  GET /estados/{uf}/municipios       -> Municipio[]
  GET /municipios/{id}/farmacias     -> Farmacia[]

Identidade visual: azul institucional (estilo SUS / gov.br), tema claro, cor primária
#1351B4.

Regras gerais:
- Código em TypeScript, componentes funcionais com hooks.
- Textos da interface em português do Brasil.
- Separar claramente: telas (app/), componentes (src/components/), dados mockados
  (src/data/), serviços/repositórios (src/services/), tipos (src/types/), tema (src/theme/).
- Não instalar bibliotecas além das listadas sem me perguntar antes.
- Se houver dúvida técnica relevante, pergunte antes de decidir.
- Ao final de cada tarefa, liste os arquivos criados/alterados e como testar.
```

---

## Prompt 1 — Setup do projeto

```
Crie o projeto Expo com TypeScript usando o template padrão com Expo Router
(npx create-expo-app@latest farmacia-perto). Depois:

1. Remova o conteúdo de exemplo do template (telas, componentes e assets de demonstração),
   mantendo apenas a estrutura mínima de rotas funcionando.
2. Instale as dependências: react-native-paper, react-native-safe-area-context,
   react-native-vector-icons (ou @expo/vector-icons, que já vem com o Expo — prefira este),
   react-native-maps (via `npx expo install react-native-maps`).
3. Ative TypeScript strict no tsconfig.
4. Crie a estrutura de pastas:
   app/            (rotas)
   src/components/
   src/data/
   src/services/
   src/theme/
   src/types/
5. Configure o app.json: nome "Farmácia Perto", slug "farmacia-perto", orientation
   "portrait", e deixe um comentário/placeholder para a futura chave do Google Maps
   (android.config.googleMaps.apiKey), sem inventar chave.
6. Garanta que o app abre em uma tela inicial vazia com o texto "Farmácia Perto".

Não implemente nenhuma tela real ainda. Mostre como rodar e testar no Android.
```

---

## Prompt 2 — Tema e provider

```
Configure o tema e o provider do React Native Paper.

1. Em src/theme/ crie o tema MD3 claro customizado a partir de MD3LightTheme com:
   - primary: #1351B4
   - onPrimary: #FFFFFF
   - primaryContainer: azul bem claro derivado (ex.: #D6E4FF)
   - secondary: #071D41
   - background/surface: tons claros neutros
   - error: vermelho padrão acessível
   Exporte também constantes de espaçamento (xs, sm, md, lg, xl) e raio de borda.
2. Em app/_layout.tsx envolva o app com PaperProvider usando o tema e configure
   o Stack do Expo Router com header estilizado na cor primária e texto branco.
3. Garanta contraste adequado (WCAG AA) entre texto e fundo nas cores escolhidas.
4. Fontes: use a fonte padrão do sistema por enquanto.

Mostre a tela inicial já usando o tema (ex.: um Button primário de teste, que será removido depois).
```

---

## Prompt 3 — Tipos, dados mockados e camada de serviço

```
Crie os tipos, os dados mockados e uma camada de serviço assíncrona.

1. Em src/types/ defina:
   - Estado { sigla: string; nome: string }
   - Municipio { id: string; nome: string; uf: string }
   - Farmacia { id: string; nome: string; endereco: string; bairro: string;
     municipioId: string; latitude: number; longitude: number }

2. Em src/data/ crie mocks:
   - estados: os 27 estados (26 + DF) com sigla e nome.
   - municipios: pelo menos 6 municípios da Paraíba (incluindo Campina Grande e João Pessoa)
     e 3 municípios de outros 2 estados, para testar a busca.
   - farmacias: 12 farmácias FICTÍCIAS em Campina Grande (nomes e endereços inventados,
     NÃO usar redes ou estabelecimentos reais), com coordenadas plausíveis em torno de
     -7.2306, -35.8811, e 3 a 4 farmácias fictícias em João Pessoa.

3. Em src/services/ crie um repositório com funções assíncronas (Promise com pequeno
   delay simulado de ~300ms):
   - listarEstados(): Promise<Estado[]>
   - listarMunicipios(uf: string): Promise<Municipio[]>
   - listarFarmacias(municipioId: string): Promise<Farmacia[]>
   A interface deve permitir trocar os mocks por API no futuro sem alterar as telas.

4. Prepare a integração futura com o back-end (que fica em outro repositório), sem ativá-la:
   - Crie .env.example na raiz com a variável EXPO_PUBLIC_API_URL (sem valor real) e
     garanta que .env esteja no .gitignore.
   - Crie src/services/apiClient.ts com um cliente HTTP mínimo (fetch) que lê
     process.env.EXPO_PUBLIC_API_URL, faz GET com tratamento de erro (status HTTP não-2xx
     vira erro com mensagem) e timeout. Não adicione bibliotecas como axios.
   - Deixe, em comentário ou em uma implementação alternativa NÃO exportada/usada, como cada
     uma das 3 funções chamaria a API: GET /estados, GET /estados/{uf}/municipios e
     GET /municipios/{id}/farmacias, usando os mesmos tipos do passo 1 como formato de resposta.
   - As telas continuam usando apenas os mocks nesta etapa.

Não use geolocalização nem faça chamadas de rede reais.
```

---

## Prompt 4 — Tela 1: seleção de estado

```
Implemente a tela inicial em app/index.tsx: seleção de estado.

Requisitos:
- Cabeçalho com o nome "Farmácia Perto" e um texto curto explicando: "Encontre farmácias
  do Programa Farmácia Popular. Escolha seu estado para começar."
- Campo de busca (Searchbar do Paper) que filtra a lista de estados por nome ou sigla,
  ignorando acentos e caixa.
- Lista rolável (FlatList) de estados usando List.Item do Paper, com sigla em destaque.
- Ao tocar em um estado, navegar para a tela de municípios passando a UF como parâmetro
  de rota (ex.: /municipios?uf=PB).
- Estados de interface: carregando (ActivityIndicator), vazio ("Nenhum estado encontrado")
  e erro simples com botão "Tentar novamente".
- Dados vindos de listarEstados().
- Ícones de @expo/vector-icons; áreas de toque com mínimo de 48dp.
- Respeitar safe areas e teclado aberto.
```

---

## Prompt 5 — Tela 2: seleção de município

```
Implemente a tela de municípios em app/municipios.tsx.

Requisitos:
- Recebe `uf` pela rota; o título do header mostra "Municípios — {UF}".
- Searchbar para filtrar por nome (sem acento/caixa).
- FlatList performática (keyExtractor, getItemLayout se possível, initialNumToRender
  adequado) pensando em estados com mais de 200 municípios.
- Ao tocar em um município, navegar para o mapa passando municipioId, nome do município e uf
  (ex.: /mapa?municipioId=...&nome=...&uf=...).
- Estados de carregando, vazio e erro idênticos aos da tela de estados (extraia os
  componentes reutilizáveis para src/components/ — por exemplo EstadoVazio, EstadoErro,
  CampoBusca — e refatore a tela de estados para usá-los).
- Botão de voltar nativo do header funcionando.
```

---

## Prompt 6 — Tela 3: mapa com marcadores

```
Implemente a tela do mapa em app/mapa.tsx.

Requisitos:
- Header mostrando "{Município} — {UF}".
- MapView do react-native-maps com PROVIDER_GOOGLE, ocupando a tela inteira abaixo do header.
- Buscar as farmácias com listarFarmacias(municipioId) e exibir um Marker por farmácia
  (ícone/cor consistentes com o tema).
- Ao carregar, ajustar a câmera para enquadrar todos os marcadores
  (fitToCoordinates com padding), tratando o caso de lista vazia (mostrar mensagem
  "Nenhuma farmácia encontrada neste município" sobre o mapa) e de uma única farmácia.
- Indicador de carregamento enquanto os dados chegam e tela de erro com "Tentar novamente".
- NÃO usar a localização do usuário (userLocation desligado, sem pedir permissão).
- Controles: manter botões de zoom padrão do Android e desativar a barra de ferramentas
  nativa de marcadores se ela conflitar com o bottom sheet (explique a escolha).
- Deixe preparado, mas NÃO implementado, um ponto de extensão comentado para o futuro
  botão "Usar minha localização".

Ainda não implemente o painel de detalhes (próximo prompt); por ora, ao tocar em um marcador,
guarde a farmácia selecionada em estado.
```

---

## Prompt 7 — Bottom sheet de detalhes e botão "Traçar rota"

```
Implemente o painel de detalhes da farmácia selecionada na tela do mapa.

Requisitos:
- Componente src/components/PainelFarmacia.tsx exibido na parte inferior da tela quando há
  farmácia selecionada, usando Surface/Card do Paper com cantos superiores arredondados,
  elevação e animação simples de entrada (Animated, sem novas dependências).
- Conteúdo: nome da farmácia, endereço, bairro e município/UF.
- Botão primário "Traçar rota" (ícone de direções) e botão secundário/ícone para fechar o painel.
- "Traçar rota" abre o app do Google Maps com a farmácia como destino usando a URL universal
  https://www.google.com/maps/dir/?api=1&destination=LAT,LNG via Linking.openURL,
  com tratamento de erro (Snackbar do Paper se não for possível abrir).
- Tocar em outro marcador troca a farmácia exibida; tocar no mapa vazio fecha o painel.
- Ao selecionar um marcador, centralizar suavemente o mapa nele sem esconder o marcador
  atrás do painel.
- Texto auxiliar discreto no painel: "A localização não confirma estoque de medicamentos."
  (conforme a proposta do projeto).

Não usar Directions API nem desenhar polyline: a rota é feita pelo app externo do Google Maps.
```

---

## Prompt 8 — Fluxo, UX e acessibilidade

```
Revise e refine o fluxo completo (Estado -> Município -> Mapa).

1. No mapa, adicione ação no header para "Trocar município" (volta para a seleção).
2. Garanta que voltar do mapa -> municípios -> estados funcione sem estados quebrados.
3. Acessibilidade: accessibilityLabel/Role em itens de lista, botões e marcadores;
   tamanhos de toque >= 48dp; contraste AA; suporte a fonte maior do sistema sem quebrar layout.
4. Padronize textos de interface em PT-BR e mensagens de erro amigáveis.
5. Ícone e splash: use um placeholder simples na cor primária (ícone de cruz/pin) e
   deixe indicado onde substituir pelo definitivo.
6. Teste mentalmente os cenários: estado sem municípios mockados, município sem farmácias,
   busca sem resultado, rotação bloqueada em retrato.

Liste tudo que foi ajustado e quaisquer inconsistências que encontrar.
```

---

## Prompt 9 — Revisão final e documentação

```
Faça uma revisão geral do projeto:

1. Rode o type-check (tsc --noEmit) e o lint (se configurado) e corrija os erros.
2. Remova código morto, imports não usados e o botão de teste do tema.
3. Crie um README.md em PT-BR com: objetivo, stack, como rodar (Expo Go e development
   build no Android), estrutura de pastas, como trocar os mocks pela API real no futuro
   (src/services/), como configurar a chave do Google Maps (Maps SDK for Android) em
   app.json para builds próprios, e a seção "Integração com o back-end": este repositório é
   só o app, o back fica em outro repositório, a URL da API vem de EXPO_PUBLIC_API_URL
   (copiar .env.example para .env), e o contrato esperado é o das três rotas GET.
4. Liste o que ficou fora desta etapa (geolocalização, ordenação por proximidade,
   importação de dados oficiais, ETL, testes com usuários) como roadmap.
5. Faça uma checagem final do fluxo completo e me diga se algo diverge do escopo.
```

---

## Checklist de aceite da etapa visual

- [ ] App abre direto na seleção de estado, sem login.
- [ ] Busca de estado e município funciona sem acento/caixa.
- [ ] Mapa mostra todas as farmácias mockadas do município escolhido.
- [ ] Toque no marcador abre o painel com detalhes.
- [ ] "Traçar rota" abre o Google Maps com o destino correto.
- [ ] Estados de carregamento, vazio e erro presentes nas três telas.
- [ ] Tema azul institucional aplicado de forma consistente.
- [ ] Nenhuma permissão de localização é solicitada.
- [ ] Nenhuma chamada de rede real é feita; `apiClient.ts` e `.env.example` existem, mas não são usados.
- [ ] `.env` está no `.gitignore`.

## Notas técnicas

- **Chave do Google Maps:** no Expo Go (Android) o mapa funciona sem chave própria. Para build próprio (EAS/dev build) é necessário criar uma chave do *Maps SDK for Android* no Google Cloud e configurá-la em `android.config.googleMaps.apiKey` do `app.json`.
- **Bottom sheet:** os prompts usam um painel próprio com `Animated` para não adicionar dependências. Se quiser gestos de arrastar (snap points), a alternativa comum é `@gorhom/bottom-sheet`, que exige `react-native-reanimated` e `react-native-gesture-handler`.
- **Dois repositórios:** estes prompts cobrem só o app. API, banco, integração com a fonte oficial e ETL/sincronização pertencem ao repositório do back-end, que precisará de um contexto e de prompts próprios.
- **Decisões em aberto que afetam o contrato:** ordenação por proximidade no back ou no app, stack do back, campo da data da última sincronização e paginação das farmácias. Detalhes na seção 12 do `CONTEXTO.md`.
- **Próximas fases no app:** geolocalização e ordenação por proximidade, troca dos mocks pela API real e agrupamento de marcadores por zoom (Maps SDK utility library).
