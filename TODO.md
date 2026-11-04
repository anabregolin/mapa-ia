# Mapa Mental Imersivo — Inteligência Artificial

Objetivo: transformar o conteúdo do Moodle da cadeira de IA num mapa mental interativo
para estudo, que mostra:
- as conexões entre os conceitos
- cada conceito do mais básico ao mais complexo, em camadas
- fórmulas sendo montadas e resolvidas passo a passo
- os exercícios ligados a cada conteúdo
- uma barra de progresso cronológica que pode ser arrastada para navegar

---

## Tecnologias

| Camada | Tecnologia | Para quê |
|---|---|---|
| Base | **Vite + React + TypeScript** | Projeto rápido, componentes reutilizáveis, tipagem dos dados do curso |
| Mapa mental | **React Flow** (`@xyflow/react`) | Nós e conexões com zoom, arrastar, clicar para expandir |
| Layout automático | **d3-hierarchy** (no lugar do ELK.js) | Árvore dos dois lados da raiz, sem nós sobrepostos e sem posicionar à mão |
| Animações | **Framer Motion** | Transições ao entrar num nó, revelar passos de fórmulas |
| Scroll / timeline | ~~GSAP + ScrollTrigger~~ | A barra foi feita com Framer Motion + pointer events; GSAP fica para se precisar de scroll |
| Fórmulas | **KaTeX** | Renderiza LaTeX rápido; cada passo da resolução é um bloco animado |
| Gráficos interativos | **D3.js** ou **Mafs** | Visualizar funções (sigmoid, perda, gradiente), árvores de busca etc. |
| Estado global | **Zustand** | Guarda posição na timeline, nó aberto, progresso de estudo |
| Estilo | **Tailwind CSS** | Visual rápido e consistente, tema escuro |
| Conteúdo | **Markdown/MDX + JSON** | Um arquivo por tópico; fácil de editar sem mexer no código |
| Leitura do Moodle | **pdf.js / pdftotext** (script Node/Python) | Extrair texto dos PDFs/slides baixados |
| Progresso local | **localStorage** | Lembrar onde você parou e exercícios feitos |

Extensões úteis no VS Code: ESLint, Prettier, Tailwind CSS IntelliSense, Markdown All in One,
MDX, Live Preview (ou só `npm run dev`).

---

## TODO

> Rodar: `cd app && npm install && npm run dev`. `[~]` = parcial.

### Fase 0 — Juntar o conteúdo
- [x] Baixar do Moodle todos os materiais (slides, PDFs, listas de exercícios, provas antigas)
- [x] Colocar tudo em `conteudo-moodle/`, de preferência com o nome da aula/semana
- [x] Anotar a ordem cronológica das aulas (cronograma da cadeira)

### Fase 1 — Estruturar o conhecimento
> Resultado em [ESTRUTURA.md](ESTRUTURA.md). Texto extraído em `extraido/limpo/`.
- [x] Extrair o texto dos PDFs/slides (script)
- [x] Listar todos os tópicos e subtópicos
- [x] Definir para cada tópico: nível (básico / intermediário / avançado), pré-requisitos e ligações
- [x] Definir o modelo de dados (`Topico`, `Conexao`, `Formula`, `Passo`, `Exercicio`) → `app/src/content/tipos.ts`
- [x] Conteúdo em dados TS (`app/src/content/`): tópicos, conexões, fórmulas, calculadoras, exercícios e explicações em camadas. `npm run checar` valida tudo
- [x] Escrever cada fórmula em LaTeX, dividida em passos (montagem → substituição → resultado) → 32 fórmulas em `formulas.ts`
- [x] Ligar cada exercício ao(s) tópico(s) que ele usa
- [~] Escrever a resolução passo a passo de cada exercício: 27 com passos (listas U4/U5, P1, P2, Lista U2 Q17–18, GraphPlan). Faltam os que dependem de figura e os gabaritos longos da Lista U2
- [~] Redesenhar as figuras dos exercícios como dados: mapa da Romênia feito (`lib/romenia.ts`). Faltam mapa do RS (E1), grafo S→G, árvore da Q22, rede n0–n20, gráfico KNN, divisões da P2
- [x] Escrever os tópicos sem slide (regressão, gradiente, redes neurais, métricas): resumo, explicação em camadas e fórmulas

### Fase 2 — Montar o projeto
- [x] `npm create vite@latest` com React + TypeScript → pasta `app/`
- [x] Instalar React Flow, d3-hierarchy, Framer Motion, KaTeX, Zustand, Tailwind (ELK e GSAP trocados, ver tabela)
- [x] Estrutura de pastas (`src/components`, `src/content`, `src/store`, `src/lib`)

### Fase 3 — Mapa mental
- [x] Desenhar o mapa geral com todos os tópicos e conexões
- [x] Zoom e arrastar pelo mapa (+ minimapa)
- [x] Cores por unidade/tema e por nível de dificuldade (botão no canto)
- [x] Ao passar o mouse num nó: destacar pré-requisitos (azul), dependentes (laranja) e parecidos (rosa)
- [x] Ao clicar: "mergulhar" no nó (zoom animado) e abrir o painel do tópico. Link direto: `#u2.astar`

### Fase 4 — Barra de controle cronológica
- [x] Barra fixa que representa o curso do início ao fim
- [x] Marcadores de cada aula/unidade na barra (losango = avaliação)
- [x] Arrastar a barra (ou ← →) → o mapa navega até aquele ponto do conteúdo
- [x] Arrastar o mapa → a barra acompanha sozinha
- [x] Revelar progressivamente os nós conforme se avança (opção "revelar aos poucos")

### Fase 5 — Página de conceito (dentro de cada nó)
- [x] Explicação em camadas: intuição → definição → detalhe técnico (+ "cuidado" com pegadinhas de prova)
- [x] Botão "mostrar mais" para abrir cada camada
- [~] Exemplos visuais/interativos: busca passo a passo no mapa da Romênia (BFS, DFS, UCS, gulosa, A*). Faltam KNN, roleta, GraphPlan, árvore com Gini
- [x] Links para conceitos relacionados (volta ao mapa)

### Fase 6 — Fórmulas animadas
- [ ] Componente que mostra a fórmula sendo montada termo a termo
- [ ] Explicação de cada termo ao passar o mouse
- [x] Resolução passo a passo: avançar, voltar, mostrar tudo e recomeçar
- [x] Campos para trocar os valores e ver o resultado mudar (26 das 32 fórmulas)

### Fase 7 — Exercícios
- [x] Lista de exercícios em cada tópico (com status e resposta conferida)
- [x] Mostrar dica → próximo passo → resolução completa
- [x] Marcar exercício como feito / com dúvida (salvo no navegador)
- [x] Mostrar no mapa quais tópicos ainda têm exercícios pendentes (número no canto do nó; ? = dúvida)

### Fase 8 — Extras de estudo
- [x] Busca por conceito (tecla /). Falta buscar fórmula
- [x] Salvar progresso: etapa da barra, tópicos estudados e exercícios feitos/dúvida no localStorage
- [ ] Modo revisão (flashcards a partir das definições e fórmulas)
- [ ] Tema claro/escuro e funcionar bem em tela pequena

### Fase 9 — Finalizar
- [ ] Revisar todo o conteúdo contra o material original
- [ ] Testar navegação completa do início ao fim
- [ ] Gerar build (`npm run build`) e, se quiser, publicar (GitHub Pages / Vercel)
