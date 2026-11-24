// As partes da página de Configurações: a ordem do índice e o fim do endereço (#/configuracoes/estudo).
export type SecaoConfig = 'leitura' | 'estudo' | 'pomodoro' | 'marcas' | 'dados'
export const SECOES_CONFIG: { id: SecaoConfig; icone: string; nome: string; descricao: string }[] = [
  { id: 'leitura', icone: 'Aa', nome: 'Leitura', descricao: 'Como o texto dos tópicos aparece. A prévia muda junto.' },
  { id: 'estudo', icone: '📚', nome: 'Estudo', descricao: 'Testes, cartões, pausas e quando cada assunto volta para revisão.' },
  { id: 'pomodoro', icone: '🍅', nome: 'Pomodoro', descricao: 'Os tempos do relógio de foco e o que fazer nas pausas.' },
  { id: 'marcas', icone: '🖍', nome: 'Marca-texto', descricao: 'O que cada cor quer dizer quando você marca um trecho.' },
  { id: 'dados', icone: '💾', nome: 'Dados', descricao: 'Seu progresso fica só neste navegador. Aqui você guarda uma cópia.' },
]
