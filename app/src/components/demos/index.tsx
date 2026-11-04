import { lazy, type ReactNode } from 'react'

// cada demo é carregada só quando abre
const DemoBusca = lazy(() => import('./DemoBusca').then((m) => ({ default: m.DemoBusca })))
const DemoArvore = lazy(() => import('./DemoArvore').then((m) => ({ default: m.DemoArvore })))
const DemoHill = lazy(() => import('./DemoHill').then((m) => ({ default: m.DemoHill })))
const DemoKNN = lazy(() => import('./DemoKNN').then((m) => ({ default: m.DemoKNN })))

/** Demos feitas no próprio app: o campo `url` da demo é a chave aqui. */
export const DEMOS_INTERNAS: Record<string, () => ReactNode> = {
  'busca:romenia': () => <DemoBusca grafoInicial="romenia" />,
  'busca:rs': () => <DemoBusca grafoInicial="rs" />,
  'busca:sg': () => <DemoBusca grafoInicial="sg" />,
  'arvore:l2-q22': () => <DemoArvore arvoreInicial="l2-q22" />,
  'arvore:e1': () => <DemoArvore arvoreInicial="e1" />,
  hill: () => <DemoHill />,
  knn: () => <DemoKNN />,
}
