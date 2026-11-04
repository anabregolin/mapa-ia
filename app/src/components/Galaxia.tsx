import { Html, Line, OrbitControls, QuadraticBezierLine, Stars } from '@react-three/drei'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { GRUPOS, TOPICOS, UNIDADES, grupoPorId, topicoPorId, unidadePorId } from '../content/topicos'
import type { UnidadeId } from '../content/tipos'
import { enquadrar, grupoDaEtapa, POS_GRUPO, POS_TOPICO, POS_UNIDADE, type Foco, type V3 } from '../lib/galaxia'
import { dependentesDe, prereqsDe } from '../lib/grafo'
import { ULTIMA_ETAPA, useMapa } from '../store/useMapa'
import { COR_NIVEL } from './NoMapa'

const FUNDO = '#03040c'
const LARGURA_PAINEL = 440

/** Brilho redondo (gradiente radial) usado em volta de sol, planetas, luas e estrelas. */
function texturaBrilho() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.25, 'rgba(255,255,255,.45)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

function Brilho({ cor, tamanho, opacidade = 1, textura }: { cor: string; tamanho: number; opacidade?: number; textura: THREE.Texture }) {
  return (
    <sprite scale={[tamanho, tamanho, tamanho]}>
      <spriteMaterial map={textura} color={cor} transparent opacity={opacidade} blending={THREE.AdditiveBlending} depthWrite={false} />
    </sprite>
  )
}

/** Rótulo HTML preso a um ponto 3D; clicável quando recebe onClick. */
function Rotulo({ pos, children, fator, onClick, classe = '' }: { pos: V3; children: ReactNode; fator: number; onClick?: () => void; classe?: string }) {
  // a câmera fica mais longe em tela em pé; o rótulo cresce junto para continuar legível
  const { size } = useThree()
  const k = Math.max(1, 1.15 / (size.width / size.height)) ** 0.85
  return (
    <Html position={pos} center distanceFactor={fator * k} zIndexRange={[8, 0]} style={{ pointerEvents: onClick ? 'auto' : 'none' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        className={`whitespace-nowrap rounded-full px-3 py-1 font-medium text-white/90 backdrop-blur-sm transition hover:bg-white/15 ${classe}`}
        style={{ background: 'rgba(3,4,12,.55)', textShadow: '0 1px 6px #000' }}
      >
        {children}
      </button>
    </Html>
  )
}

const cursor = (sobre: boolean) => (document.body.style.cursor = sobre ? 'pointer' : '')

/** Câmera: voa até o enquadramento do foco e abre espaço para o painel à direita. */
function Camera({ foco, topico }: { foco: Foco; topico: string | null }) {
  const { camera, controls, size } = useThree()
  const voo = useRef<{ alvo: THREE.Vector3; pos: THREE.Vector3 } | null>(null)
  const deslocamento = useRef(0)

  // tela em pé (celular): afasta a câmera para caber na largura
  const afastar = Math.max(1, 1.15 / (size.width / size.height))
  useEffect(() => {
    const e = enquadrar(foco, topico)
    const alvo = new THREE.Vector3(...e.alvo)
    const pos = new THREE.Vector3(...e.camera).sub(alvo).multiplyScalar(afastar).add(alvo)
    voo.current = { alvo, pos }
  }, [foco, topico, afastar])

  // se a pessoa começa a girar, a câmera para de voar sozinha
  useEffect(() => {
    const c = controls as unknown as OrbitControlsImpl | null
    if (!c) return
    const parar = () => (voo.current = null)
    c.addEventListener('start', parar)
    return () => c.removeEventListener('start', parar)
  }, [controls])

  useFrame((_, dt) => {
    const c = controls as unknown as OrbitControlsImpl | null
    const cam = camera as THREE.PerspectiveCamera
    const k = 1 - Math.exp(-dt * 2.6)
    if (c && voo.current) {
      cam.position.lerp(voo.current.pos, k)
      c.target.lerp(voo.current.alvo, k)
      c.update()
      if (cam.position.distanceTo(voo.current.pos) < 0.03 && c.target.distanceTo(voo.current.alvo) < 0.03) voo.current = null
    }
    const querido = topico && size.width > 900 ? LARGURA_PAINEL / 2 : 0
    if (Math.abs(deslocamento.current - querido) > 0.5) {
      deslocamento.current += (querido - deslocamento.current) * k
      cam.setViewOffset(size.width, size.height, deslocamento.current, 0, size.width, size.height)
      cam.updateProjectionMatrix()
    } else if (querido === 0 && deslocamento.current !== 0) {
      deslocamento.current = 0
      cam.clearViewOffset()
      cam.updateProjectionMatrix()
    }
  })
  return null
}

function Sol({ textura, onClick }: { textura: THREE.Texture; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => ref.current && (ref.current.rotation.y += dt * 0.08))
  return (
    <group>
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={() => cursor(true)}
        onPointerOut={() => cursor(false)}
      >
        <icosahedronGeometry args={[3.2, 3]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>
      <Brilho cor="#a855f7" tamanho={22} textura={textura} />
      <Brilho cor="#ec4899" tamanho={11} opacidade={0.8} textura={textura} />
    </group>
  )
}

function Planeta({ id, ativo, apagado, textura, onClick }: { id: UnidadeId; ativo: boolean; apagado: boolean; textura: THREE.Texture; onClick: () => void }) {
  const u = unidadePorId.get(id)!
  const pos = POS_UNIDADE.get(id)!
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => ref.current && (ref.current.rotation.y += dt * 0.15))
  return (
    <group position={pos}>
      <group ref={ref}>
        <mesh
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          onPointerOver={() => cursor(true)}
          onPointerOut={() => cursor(false)}
        >
          <sphereGeometry args={[2, 48, 48]} />
          <meshStandardMaterial color={u.cor} emissive={u.cor} emissiveIntensity={ativo ? 0.55 : 0.3} roughness={0.55} transparent opacity={apagado ? 0.35 : 1} />
        </mesh>
        <mesh rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[3.1, 0.05, 8, 96]} />
          <meshBasicMaterial color={u.cor} transparent opacity={0.45} />
        </mesh>
      </group>
      <Brilho cor={u.cor} tamanho={ativo ? 12 : 9} opacidade={apagado ? 0.3 : 0.7} textura={textura} />
    </group>
  )
}

function Lua({ id, ativo, apagado, textura, onClick }: { id: string; ativo: boolean; apagado: boolean; textura: THREE.Texture; onClick: () => void }) {
  const g = grupoPorId.get(id)!
  const cor = unidadePorId.get(g.unidade)!.cor
  return (
    <group position={POS_GRUPO.get(id)!}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={() => cursor(true)}
        onPointerOut={() => cursor(false)}
      >
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial color={cor} emissive={cor} emissiveIntensity={ativo ? 0.6 : 0.25} roughness={0.8} transparent opacity={apagado ? 0.3 : 1} />
      </mesh>
      <Brilho cor={cor} tamanho={ativo ? 5 : 3.2} opacidade={apagado ? 0.25 : 0.6} textura={textura} />
    </group>
  )
}

type EstadoEstrela = 'normal' | 'foco' | 'pre' | 'dep' | 'apagado' | 'fantasma'

function Estrela({ id, cor, estado, estudado, textura, onClick, onHover }: { id: string; cor: string; estado: EstadoEstrela; estudado: boolean; textura: THREE.Texture; onClick: () => void; onHover: (sobre: boolean) => void }) {
  const ref = useRef<THREE.Group>(null)
  const tp = topicoPorId.get(id)!
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulso = estado === 'foco' ? 1 + Math.sin(clock.elapsedTime * 4) * 0.15 : 1
    ref.current.scale.setScalar(pulso)
  })
  const opacidade = estado === 'fantasma' ? 0.08 : estado === 'apagado' ? 0.3 : 1
  const corBrilho = estado === 'pre' ? '#22d3ee' : estado === 'dep' ? '#fb923c' : estado === 'foco' ? '#ffffff' : cor
  return (
    <group position={POS_TOPICO.get(id)!}>
      <group ref={ref}>
        <mesh
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation()
            onClick()
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            cursor(true)
            onHover(true)
          }}
          onPointerOut={() => {
            cursor(false)
            onHover(false)
          }}
        >
          {/* esfera de clique um pouco maior que a estrela visível */}
          <sphereGeometry args={[0.45, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[tp.naoVisto ? 0.16 : 0.24, 16, 16]} />
          <meshBasicMaterial color={tp.naoVisto ? '#64748b' : cor} transparent opacity={opacidade} />
        </mesh>
        <Brilho cor={corBrilho} tamanho={estado === 'foco' ? 2.6 : estado === 'pre' || estado === 'dep' ? 2.1 : 1.5} opacidade={opacidade * (tp.naoVisto ? 0.3 : 0.85)} textura={textura} />
        {estudado && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.03, 6, 32]} />
            <meshBasicMaterial color="#34d399" transparent opacity={opacidade} />
          </mesh>
        )}
      </group>
    </group>
  )
}

function Cena() {
  const { selecionado, hover, foco3d: foco, etapa, origemEtapa, revelar, corPor, estudados, selecionar, setHover, setFoco3d, setEtapa } = useMapa()
  const textura = useMemo(() => texturaBrilho(), [])
  const ativo = hover ?? selecionado
  const unidadeFoco: UnidadeId | null = foco.nivel === 'unidade' ? foco.id : foco.nivel === 'grupo' ? grupoPorId.get(foco.id)!.unidade : null
  const grupoFoco = foco.nivel === 'grupo' ? foco.id : null

  // a barra do tempo mudou de etapa → voa até o grupo daquela aula
  const primeira = useRef(true)
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false
      return
    }
    if (origemEtapa !== 'barra') return
    const g = grupoDaEtapa(etapa)
    if (useMapa.getState().selecionado) selecionar(null)
    setFoco3d(g && !(etapa === ULTIMA_ETAPA && !revelar) ? { nivel: 'grupo', id: g } : { nivel: 'galaxia' })
  }, [etapa, origemEtapa, revelar, selecionar, setFoco3d])

  // tópico selecionado (clique, busca ou link) → entra no grupo dele
  useEffect(() => {
    const g = selecionado ? topicoPorId.get(selecionado)?.grupo : undefined
    if (!g) return
    const f = useMapa.getState().foco3d
    if (f.nivel !== 'grupo' || f.id !== g) setFoco3d({ nivel: 'grupo', id: g })
  }, [selecionado, setFoco3d])

  const entrarGrupo = (id: string) => {
    selecionar(null)
    setFoco3d({ nivel: 'grupo', id })
    setEtapa(grupoPorId.get(id)!.etapa, 'mapa')
  }
  const irGalaxia = () => {
    selecionar(null)
    setFoco3d({ nivel: 'galaxia' })
  }
  const entrarUnidade = (id: UnidadeId) => {
    selecionar(null)
    setFoco3d({ nivel: 'unidade', id })
  }

  const estadoDe = (id: string): EstadoEstrela => {
    const tp = topicoPorId.get(id)!
    if (revelar && tp.etapa > etapa) return 'fantasma'
    if (ativo) {
      if (id === ativo) return 'foco'
      if (prereqsDe.get(ativo)?.includes(id)) return 'pre'
      if (dependentesDe.get(ativo)?.includes(id)) return 'dep'
    }
    if (grupoFoco && tp.grupo !== grupoFoco) return 'apagado'
    return 'normal'
  }
  const corDe = (id: string) => {
    const tp = topicoPorId.get(id)!
    return corPor === 'nivel' ? COR_NIVEL[tp.nivel] : unidadePorId.get(tp.unidade)!.cor
  }

  // linhas de constelação: sol → planetas → luas → estrelas
  const linhas = useMemo(() => {
    const l: { de: V3; para: V3; cor: string; op: number }[] = []
    for (const u of UNIDADES) l.push({ de: [0, 0, 0], para: POS_UNIDADE.get(u.id)!, cor: u.cor, op: 0.18 })
    for (const g of GRUPOS) l.push({ de: POS_UNIDADE.get(g.unidade)!, para: POS_GRUPO.get(g.id)!, cor: unidadePorId.get(g.unidade)!.cor, op: 0.3 })
    for (const t of TOPICOS) l.push({ de: POS_GRUPO.get(t.grupo)!, para: POS_TOPICO.get(t.id)!, cor: unidadePorId.get(t.unidade)!.cor, op: 0.14 })
    return l
  }, [])

  // ligações de pré-requisito do tópico em foco, como arcos
  const arcos = useMemo(() => {
    if (!ativo || !POS_TOPICO.has(ativo)) return []
    const a = POS_TOPICO.get(ativo)!
    const arco = (outro: string, cor: string) => {
      const b = POS_TOPICO.get(outro)!
      const meio: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + Math.hypot(a[0] - b[0], a[2] - b[2]) * 0.25 + 1, (a[2] + b[2]) / 2]
      return { id: outro, a, b, meio, cor }
    }
    return [...(prereqsDe.get(ativo) ?? []).map((id) => arco(id, '#22d3ee')), ...(dependentesDe.get(ativo) ?? []).map((id) => arco(id, '#fb923c'))]
  }, [ativo])

  return (
    <>
      <color attach="background" args={[FUNDO]} />
      <fog attach="fog" args={[FUNDO, 90, 260]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={2.2} decay={0} color="#e9d5ff" />
      <Stars radius={260} depth={90} count={5000} factor={5} saturation={0.4} fade speed={0.4} />

      {linhas.map((x, i) => (
        <Line key={i} points={[x.de, x.para]} color={x.cor} transparent opacity={x.op} lineWidth={1} />
      ))}
      {arcos.map((x) => (
        <QuadraticBezierLine key={x.id} start={x.a} end={x.b} mid={x.meio} color={x.cor} lineWidth={2} transparent opacity={0.9} />
      ))}

      <Sol textura={textura} onClick={irGalaxia} />
      {UNIDADES.map((u) => (
        <Planeta key={u.id} id={u.id} ativo={unidadeFoco === u.id} apagado={!!unidadeFoco && unidadeFoco !== u.id} textura={textura} onClick={() => entrarUnidade(u.id)} />
      ))}
      {GRUPOS.map((g) => (
        <Lua key={g.id} id={g.id} ativo={grupoFoco === g.id} apagado={!!grupoFoco && grupoFoco !== g.id} textura={textura} onClick={() => entrarGrupo(g.id)} />
      ))}
      {TOPICOS.map((t) => (
        <Estrela
          key={t.id}
          id={t.id}
          cor={corDe(t.id)}
          estado={estadoDe(t.id)}
          estudado={!!estudados[t.id]}
          textura={textura}
          onClick={() => selecionar(t.id)}
          onHover={(sobre) => setHover(sobre ? t.id : null)}
        />
      ))}

      {/* rótulos: só os do nível em foco, para não poluir */}
      <Rotulo pos={[0, 5.2, 0]} fator={60} classe="text-lg" onClick={irGalaxia}>
        Inteligência Artificial
      </Rotulo>
      {UNIDADES.map((u) => {
        const p = POS_UNIDADE.get(u.id)!
        return (
          <Rotulo key={u.id} pos={[p[0], p[1] + 3.6, p[2]]} fator={foco.nivel === 'galaxia' ? 55 : foco.nivel === 'grupo' ? 16 : 30} classe={unidadeFoco && unidadeFoco !== u.id ? 'opacity-50 text-sm' : 'text-base'} onClick={() => entrarUnidade(u.id)}>
          <span style={{ color: u.cor }}>{u.id.toUpperCase()}</span> {u.titulo}
          </Rotulo>
        )
      })}
      {GRUPOS.filter((g) => unidadeFoco === g.unidade).map((g) => {
        const p = POS_GRUPO.get(g.id)!
        return (
          <Rotulo key={g.id} pos={[p[0], p[1] + 1.5, p[2]]} fator={grupoFoco ? 16 : 22} classe={grupoFoco && grupoFoco !== g.id ? 'opacity-60 text-sm' : 'text-sm'} onClick={() => entrarGrupo(g.id)}>
            {g.titulo}
          </Rotulo>
        )
      })}
      {TOPICOS.filter((t) => t.grupo === grupoFoco || t.id === ativo).map((t) => {
        const p = POS_TOPICO.get(t.id)!
        const estado = estadoDe(t.id)
        if (estado === 'fantasma' && t.id !== ativo) return null
        return (
          <Rotulo key={t.id} pos={[p[0], p[1] + 0.62, p[2]]} fator={8} classe={`text-sm ${t.id === ativo ? 'ring-1 ring-white/60' : ''} ${t.naoVisto ? 'opacity-60 italic' : ''}`} onClick={() => selecionar(t.id)}>
            {t.titulo}
          </Rotulo>
        )
      })}
      {/* rótulos dos pré-requisitos/dependentes de outros grupos */}
      {arcos
        .filter((x) => topicoPorId.get(x.id)!.grupo !== grupoFoco)
        .map((x) => (
          <Rotulo key={'arco' + x.id} pos={[x.b[0], x.b[1] + 0.62, x.b[2]]} fator={8} classe="text-xs" onClick={() => selecionar(x.id)}>
            <span style={{ color: x.cor }}>●</span> {topicoPorId.get(x.id)!.titulo}
          </Rotulo>
        ))}

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1.5} maxDistance={200} />
      <Camera foco={foco} topico={selecionado} />
    </>
  )
}

/** Trilha "Galáxia › U2 › Busca informada" e o botão de voltar um nível. */
function Trilha() {
  const { foco3d: foco, selecionado, setFoco3d, selecionar } = useMapa()
  const unidade = foco.nivel === 'unidade' ? foco.id : foco.nivel === 'grupo' ? grupoPorId.get(foco.id)!.unidade : null
  const irGalaxia = () => {
    selecionar(null)
    setFoco3d({ nivel: 'galaxia' })
  }
  const irUnidade = (id: UnidadeId) => {
    selecionar(null)
    setFoco3d({ nivel: 'unidade', id })
  }
  const subir = () => {
    if (selecionado) selecionar(null)
    else if (foco.nivel === 'grupo') setFoco3d({ nivel: 'unidade', id: unidade! })
    else setFoco3d({ nivel: 'galaxia' })
  }
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || useMapa.getState().revisaoAberta) return
      if ((e.target as HTMLElement).closest('input, textarea, select')) return
      const f = useMapa.getState().foco3d
      if (f.nivel === 'grupo') setFoco3d({ nivel: 'unidade', id: grupoPorId.get(f.id)!.unidade })
      else if (f.nivel === 'unidade') setFoco3d({ nivel: 'galaxia' })
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [setFoco3d])

  const item = 'rounded-md px-2 py-0.5 hover:bg-white/10'
  return (
    <div className="pointer-events-auto absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-sm text-slate-300 backdrop-blur sm:bottom-auto sm:left-4 sm:top-[84px]">
      {foco.nivel !== 'galaxia' && (
        <button onClick={subir} className="mr-1 rounded-md px-1.5 text-white hover:bg-white/10" aria-label="voltar um nível" title="voltar um nível (Esc)">
          ←
        </button>
      )}
      <button className={item} onClick={irGalaxia}>
        Galáxia
      </button>
      {unidade && (
        <>
          <span className="text-slate-500">›</span>
          <button className={item} style={{ color: unidadePorId.get(unidade)!.cor }} onClick={() => irUnidade(unidade)}>
            {unidade.toUpperCase()}
          </button>
        </>
      )}
      {foco.nivel === 'grupo' && (
        <>
          <span className="text-slate-500">›</span>
          <span className="px-2 text-white">{grupoPorId.get(foco.id)!.titulo}</span>
        </>
      )}
    </div>
  )
}

export default function Galaxia() {
  const [dica, setDica] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setDica(false), 9000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="relative isolate h-full w-full" style={{ background: FUNDO }}>
      <Canvas camera={{ position: [0, 48, 72], fov: 50, near: 0.1, far: 1500 }} dpr={[1, 2]} onPointerMissed={() => cursor(false)}>
        <Cena />
      </Canvas>
      <Trilha />
      {dica && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 rounded-full sm:block bg-black/50 px-4 py-1.5 text-xs text-slate-300 backdrop-blur">
          clique num planeta para entrar · arraste para girar · role para aproximar · Esc volta
        </div>
      )}
    </div>
  )
}
