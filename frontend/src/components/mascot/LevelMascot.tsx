import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { MASCOTS, type MascotId } from '../../lib/mascots'
import './level-mascot.css'

export type LevelMascotMood = 'idle' | 'cheer' | 'sad' | 'think'

type Props = {
  mascot: MascotId
  mood?: LevelMascotMood
  danceSignal?: number
  className?: string
  ariaLabel?: string
  /** `mini` dùng cho thumbnail trên bản đồ: ít pixel hơn, vẫn đủ 3D và nhảy múa. */
  quality?: 'full' | 'mini'
  decorative?: boolean
}

type Rig = {
  root: THREE.Group
  body: THREE.Group
  head: THREE.Group
  arms: THREE.Group[]
  legs: THREE.Group[]
  ears: THREE.Group[]
  eyes: THREE.Mesh[]
  pupils: THREE.Mesh[]
  mouths: THREE.Object3D[]
  tail: THREE.Group | null
  wings: THREE.Group[]
  sparkles: THREE.Mesh[]
  headBaseY: number
}

/* Các động tác nhỏ để linh vật tự chọn ngẫu nhiên, không chạy theo một chu kỳ cố định. */
type MascotGesture = 'hop' | 'wave' | 'look' | 'sway' | 'stretch' | 'twirl' | 'celebrate'
const IDLE_GESTURES: MascotGesture[] = ['hop', 'wave', 'look', 'sway', 'stretch', 'twirl']

export function LevelMascot({
  mascot,
  mood = 'idle',
  danceSignal = 0,
  className = '',
  ariaLabel,
  quality = 'full',
  decorative = false,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const moodRef = useRef<LevelMascotMood>(mood)
  const signalRef = useRef(danceSignal)
  const config = MASCOTS[mascot]

  useEffect(() => {
    moodRef.current = mood
  }, [mood])

  useEffect(() => {
    signalRef.current = danceSignal
  }, [danceSignal])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const hostEl: HTMLDivElement = host
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    // Cho canvas bám theo devicePixelRatio cả khi người dùng zoom trình duyệt,
    // tránh vỡ nét khi phóng to. Cap vừa phải để bản đồ 12 canvas vẫn nhẹ.
    const pixelRatioCap = quality === 'mini' ? 1.9 : 2.6
    const applyPixelRatio = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap))
    }
    applyPixelRatio()
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.NoToneMapping
    renderer.toneMappingExposure = 1
    renderer.domElement.setAttribute('role', decorative ? 'presentation' : 'img')
    if (decorative) {
      renderer.domElement.setAttribute('aria-hidden', 'true')
    } else {
      renderer.domElement.setAttribute(
        'aria-label',
        ariaLabel ?? `${config.name}, linh vật 3D của level này`,
      )
    }
    hostEl.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 50)
    camera.position.set(0, 1.74, 6.55)
    camera.lookAt(0, 1.5, 0)

    scene.add(new THREE.HemisphereLight(0xe8f5ff, 0x9cc4de, 0.95))
    const key = new THREE.DirectionalLight(0xfff8ee, 0.72)
    key.position.set(4, 8, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xb9ddff, 0.22)
    rim.position.set(-5, 4, -5)
    scene.add(rim)

    // Chia lưới dày hơn để silhouette tròn mịn, không lộ cạnh đa giác khi zoom.
    const sphere = new THREE.SphereGeometry(
      1,
      quality === 'mini' ? 26 : 48,
      quality === 'mini' ? 20 : 36,
    )
    const cone = new THREE.ConeGeometry(1, 1, quality === 'mini' ? 20 : 32)
    const box = new THREE.BoxGeometry(1, 1, 1)
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, quality === 'mini' ? 20 : 32)
    const torus = new THREE.TorusGeometry(
      1,
      0.08,
      quality === 'mini' ? 8 : 12,
      quality === 'mini' ? 26 : 44,
    )
    const smile = new THREE.TorusGeometry(
      1,
      0.12,
      quality === 'mini' ? 8 : 12,
      quality === 'mini' ? 18 : 30,
      Math.PI,
    )
    const octa = new THREE.OctahedronGeometry(1, 0)

    const toLinear = (hex: string) => new THREE.Color(hex).convertSRGBToLinear()

    // Cel-shading 4 nấc giúp nhân vật phẳng, sạch như tranh vector thay vì bóng nhựa.
    const gradientMap = new THREE.DataTexture(
      new Uint8Array([96, 158, 214, 255]),
      4,
      1,
      THREE.LuminanceFormat,
    )
    gradientMap.minFilter = THREE.NearestFilter
    gradientMap.magFilter = THREE.NearestFilter
    gradientMap.generateMipmaps = false
    gradientMap.needsUpdate = true

    const toon = (hex: string, extra: THREE.MeshToonMaterialParameters = {}) =>
      new THREE.MeshToonMaterial({ color: toLinear(hex), gradientMap, ...extra })

    const bodyMat = toon(config.body)
    const bellyMat = toon(config.belly)
    const accentMat = toon(config.accent)
    const darkMat = toon(config.dark)
    const whiteMat = toon('#ffffff')
    const scarfMat = toon('#ff4b4b')
    const leafMat = toon('#58cc02')
    const goldMat = toon('#ffc800')
    const cheekMat = toon(config.accent, { transparent: true, opacity: 0.42 })
    const glowMat = toon(config.accent, {
      emissive: toLinear(config.accent),
      emissiveIntensity: 0.5,
    })

    const root = new THREE.Group()
    const body = new THREE.Group()
    root.add(body)
    scene.add(root)

    const add = (
      parent: THREE.Object3D,
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      scale: [number, number, number],
      position: [number, number, number],
      rotation: [number, number, number] = [0, 0, 0],
    ) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.scale.set(...scale)
      mesh.position.set(...position)
      mesh.rotation.set(...rotation)
      parent.add(mesh)
      return mesh
    }

    // Viền tối kiểu tranh vector (inverted hull) giúp khối 3D có nét vẽ rõ như Duolingo,
    // đồng thời tách nhân vật sáng màu khỏi nền trắng.
    const outlineMat = new THREE.MeshBasicMaterial({
      color: toLinear(config.dark),
      side: THREE.BackSide,
    })
    const outline = (mesh: THREE.Mesh, thickness = 0.035) => {
      const shell = new THREE.Mesh(mesh.geometry, outlineMat)
      shell.scale.set(
        1 + thickness / Math.max(mesh.scale.x, 0.001),
        1 + thickness / Math.max(mesh.scale.y, 0.001),
        1 + thickness / Math.max(mesh.scale.z, 0.001),
      )
      mesh.add(shell)
      return shell
    }

    const species = config.species
    const isRobot = species === 'robot'
    const isPenguin = species === 'penguin'
    const isPanda = species === 'panda'
    const isOwl = species === 'owl'
    const isFrog = species === 'frog'
    const isDino = species === 'dino'
    const isDragon = species === 'dragon'
    const limbMat = isPanda ? accentMat : bodyMat

    outline(add(body, sphere, bodyMat, [0.72, 0.78, 0.64], [0, 1.02, 0]), 0.045)
    outline(add(body, sphere, bellyMat, [0.45, 0.54, 0.18], [0, 0.94, 0.49]), 0.016)
    if (isRobot) {
      outline(add(body, box, accentMat, [0.36, 0.26, 0.07], [0, 1.06, 0.6]), 0.014)
      add(body, sphere, glowMat, [0.055, 0.055, 0.03], [0, 1.06, 0.64])
      add(body, box, goldMat, [0.12, 0.12, 0.06], [-0.22, 0.72, 0.58])
      add(body, box, goldMat, [0.12, 0.12, 0.06], [0.22, 0.72, 0.58])
    }

    const armGroups: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const group = new THREE.Group()
      group.position.set(side * 0.72, 1.24, 0.06)
      body.add(group)
      if (isRobot) {
        outline(add(group, box, accentMat, [0.14, 0.36, 0.14], [0, -0.22, 0]), 0.016)
        add(group, sphere, glowMat, [0.055, 0.055, 0.055], [0, -0.44, 0])
      } else if (isOwl || isPenguin) {
        outline(
          add(group, sphere, bodyMat, [0.11, 0.38, 0.26], [0, -0.25, -0.02], [side * 0.1, 0, side * 0.1]),
          0.016,
        )
      } else {
        outline(add(group, sphere, limbMat, [0.17, 0.39, 0.19], [0, -0.28, 0]), 0.018)
        outline(add(group, sphere, isPanda ? accentMat : bodyMat, [0.13, 0.11, 0.14], [0, -0.53, 0.02]), 0.012)
      }
      armGroups.push(group)
    }

    const legGroups: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const group = new THREE.Group()
      group.position.set(side * 0.3, 0.46, 0.04)
      body.add(group)
      if (isRobot) {
        outline(add(group, box, accentMat, [0.17, 0.3, 0.17], [0, -0.12, 0]), 0.016)
        add(group, box, darkMat, [0.24, 0.11, 0.32], [0, -0.29, 0.06])
      } else {
        outline(add(group, sphere, limbMat, [0.18, 0.27, 0.19], [0, -0.06, 0]), 0.018)
        outline(add(group, sphere, isPenguin ? accentMat : limbMat, [0.23, 0.11, 0.33], [0, -0.26, 0.12]), 0.016)
      }
      legGroups.push(group)
    }

    if (isPanda) {
      add(body, sphere, accentMat, [0.18, 0.26, 0.19], [-0.3, 0.4, 0.04])
      add(body, sphere, accentMat, [0.18, 0.26, 0.19], [0.3, 0.4, 0.04])
    }

    let tail: THREE.Group | null = null
    if (species === 'fox' || species === 'lion' || species === 'otter' || species === 'cat') {
      tail = new THREE.Group()
      tail.position.set(0, 1.0, -0.56)
      body.add(tail)
      const len = species === 'lion' ? 0.55 : 0.46
      outline(add(tail, sphere, bodyMat, [0.16, len, 0.16], [0, -0.2, -0.08], [0.2, 0, 0.7]), 0.018)
      if (species === 'fox') {
        add(tail, sphere, whiteMat, [0.17, 0.2, 0.17], [0.34, -0.55, -0.12])
      } else if (species === 'lion') {
        add(tail, sphere, accentMat, [0.14, 0.2, 0.14], [0.28, -0.6, -0.08])
      }
    } else if (isDino || isDragon) {
      tail = new THREE.Group()
      tail.position.set(0, 0.9, -0.5)
      body.add(tail)
      outline(add(tail, sphere, bodyMat, [0.22, 0.5, 0.22], [0, -0.18, -0.2], [0.2, 0, 0.6]), 0.02)
      for (let index = 0; index < 3; index += 1) {
        add(tail, cone, accentMat, [0.07, 0.16, 0.07], [0.25 + index * 0.1, -0.1 - index * 0.14, -0.18], [0, 0, -0.9])
      }
    } else if (species === 'bunny' || isPanda) {
      outline(add(body, sphere, whiteMat, [0.2, 0.2, 0.2], [0, 0.82, -0.58]), 0.016)
    } else if (species === 'owl') {
      for (let index = 0; index < 3; index += 1) {
        add(body, cone, bodyMat, [0.12, 0.28, 0.12], [(index - 1) * 0.16, 0.66, -0.55], [-0.5, 0, (index - 1) * 0.2])
      }
    } else if (isPenguin) {
      add(body, sphere, bodyMat, [0.16, 0.24, 0.12], [0, 0.56, -0.5], [0.5, 0, 0])
    }

    if (isDino) {
      for (let index = 0; index < 4; index += 1) {
        add(body, cone, accentMat, [0.09, 0.22, 0.09], [0, 1.45 + index * 0.2, -0.42 - index * 0.04], [-0.35, 0, 0])
      }
    }

    const head = new THREE.Group()
    head.position.set(0, 2.08, 0)
    body.add(head)
    if (isRobot) {
      outline(add(head, box, bodyMat, [0.64, 0.52, 0.5], [0, 0, 0]), 0.03)
      add(head, box, darkMat, [0.54, 0.26, 0.06], [0, 0.04, 0.27])
      add(head, sphere, glowMat, [0.07, 0.08, 0.035], [-0.17, 0.05, 0.31])
      add(head, sphere, glowMat, [0.07, 0.08, 0.035], [0.17, 0.05, 0.31])
      add(head, box, darkMat, [0.2, 0.035, 0.03], [0, -0.18, 0.28])
      add(head, cylinder, darkMat, [0.028, 0.18, 0.028], [0, 0.6, 0])
      add(head, sphere, glowMat, [0.08, 0.08, 0.08], [0, 0.71, 0])
      add(head, box, goldMat, [0.06, 0.12, 0.06], [-0.35, 0.02, 0.02])
      add(head, box, goldMat, [0.06, 0.12, 0.06], [0.35, 0.02, 0.02])
    } else {
      outline(add(head, sphere, bodyMat, [0.74, 0.66, 0.64], [0, 0, 0]), 0.045)
      outline(add(head, sphere, bellyMat, [0.3, 0.21, 0.13], [0, -0.24, 0.53]), 0.014)
    }

    const eyeY = isFrog ? 0.48 : 0.02
    const eyeZ = isFrog ? 0.45 : 0.55
    const eyeBase: [number, number, number] = isOwl
      ? [0.2, 0.21, 0.08]
      : isFrog
        ? [0.17, 0.19, 0.15]
        : [0.155, 0.18, 0.07]
    const pupilBase: [number, number, number] = isOwl ? [0.075, 0.09, 0.05] : [0.072, 0.088, 0.05]
    const pupilZ = isFrog ? eyeZ + 0.12 : eyeZ + 0.04
    const eyes: THREE.Mesh[] = []
    const pupils: THREE.Mesh[] = []
    for (const side of [-1, 1]) {
      if (isRobot) break
      if (isPanda) {
        add(head, sphere, accentMat, [0.19, 0.23, 0.06], [side * 0.24, 0.03, 0.51])
      }
      if (isOwl) {
        add(head, sphere, bellyMat, [0.32, 0.34, 0.1], [side * 0.25, 0, 0.47])
      }
      const ex = side * (isFrog ? 0.3 : isOwl ? 0.26 : 0.25)
      const white = add(head, sphere, whiteMat, eyeBase, [ex, eyeY, eyeZ])
      outline(white, 0.012)
      const pupil = add(head, sphere, darkMat, pupilBase, [ex, eyeY, pupilZ])
      pupil.userData.baseX = ex
      pupil.userData.baseY = eyeY
      add(head, sphere, whiteMat, [0.024, 0.024, 0.014], [ex + 0.03, eyeY + 0.05, eyeZ + 0.1])
      eyes.push(white)
      pupils.push(pupil)
      if (isOwl) {
        add(head, torus, accentMat, [0.26, 0.26, 0.14], [ex, eyeY, eyeZ - 0.01])
      }
      if (!isFrog) {
        add(head, box, darkMat, [0.12, 0.03, 0.035], [ex, 0.24, 0.56], [0, 0, side * 0.06])
      }
      add(head, sphere, cheekMat, [0.1, 0.07, 0.03], [side * 0.47, -0.15, 0.5])
    }

    const mouths: THREE.Object3D[] = []
    if (isFrog) {
      add(head, sphere, darkMat, [0.025, 0.025, 0.02], [-0.12, 0.18, 0.6])
      add(head, sphere, darkMat, [0.025, 0.025, 0.02], [0.12, 0.18, 0.6])
      mouths.push(add(head, smile, darkMat, [0.32, 0.14, 0.09], [0, -0.14, 0.6], [0, 0, Math.PI]))
    } else if (isOwl || isPenguin) {
      mouths.push(
        add(head, cone, accentMat, [0.13, 0.27, 0.13], [0, -0.16, 0.64], [Math.PI / 2, 0, 0]),
      )
      if (isOwl) {
        add(head, cone, accentMat, [0.06, 0.14, 0.06], [-0.2, -0.34, 0.62], [Math.PI / 2, 0, 0.3])
        add(head, cone, accentMat, [0.06, 0.14, 0.06], [0.2, -0.34, 0.62], [Math.PI / 2, 0, -0.3])
      }
    } else if (isRobot) {
      // miệng đã vẽ bằng box ở trên
    } else if (isDino || isDragon) {
      outline(add(head, sphere, bellyMat, [0.34, 0.21, 0.24], [0, -0.2, 0.55]), 0.014)
      add(head, sphere, darkMat, [0.035, 0.035, 0.02], [-0.11, -0.13, 0.74])
      add(head, sphere, darkMat, [0.035, 0.035, 0.02], [0.11, -0.13, 0.74])
      add(head, cone, whiteMat, [0.035, 0.08, 0.03], [-0.09, -0.32, 0.7], [0, 0, Math.PI])
      add(head, cone, whiteMat, [0.035, 0.08, 0.03], [0.09, -0.32, 0.7], [0, 0, Math.PI])
      mouths.push(add(head, smile, darkMat, [0.13, 0.07, 0.05], [0, -0.29, 0.7], [0, 0, Math.PI]))
    } else {
      outline(add(head, sphere, bellyMat, [0.28, 0.18, 0.14], [0, -0.24, 0.58]), 0.012)
      add(head, sphere, darkMat, [0.075, 0.06, 0.05], [0, -0.15, 0.7])
      mouths.push(add(head, smile, darkMat, [0.11, 0.065, 0.05], [0, -0.3, 0.7], [0, 0, Math.PI]))
      if (species === 'bunny') {
        add(head, box, whiteMat, [0.055, 0.1, 0.04], [-0.035, -0.37, 0.69])
        add(head, box, whiteMat, [0.055, 0.1, 0.04], [0.035, -0.37, 0.69])
      }
    }

    const ears: THREE.Group[] = []
    if (species === 'bunny') {
      for (const side of [-1, 1]) {
        const group = new THREE.Group()
        group.position.set(side * 0.23, 0.44, 0.02)
        group.rotation.z = side * 0.14
        head.add(group)
        outline(add(group, sphere, bodyMat, [0.15, 0.54, 0.11], [0, 0.22, 0]), 0.018)
        add(group, sphere, accentMat, [0.08, 0.36, 0.06], [0, 0.24, 0.07])
        ears.push(group)
      }
      add(head, sphere, accentMat, [0.11, 0.09, 0.06], [0.38, 0.62, 0.22])
      add(head, sphere, accentMat, [0.11, 0.09, 0.06], [0.56, 0.62, 0.22])
      add(head, sphere, goldMat, [0.045, 0.045, 0.04], [0.47, 0.62, 0.29])
    } else if (species === 'fox' || species === 'cat') {
      for (const side of [-1, 1]) {
        const group = new THREE.Group()
        group.position.set(side * 0.34, 0.44, 0.02)
        group.rotation.z = side * -0.18
        head.add(group)
        outline(add(group, cone, bodyMat, [0.24, 0.46, 0.2], [0, 0.2, 0]), 0.018)
        add(group, cone, accentMat, [0.12, 0.28, 0.1], [0, 0.2, 0.09])
        ears.push(group)
      }
      if (species === 'fox') {
        add(head, sphere, bellyMat, [0.17, 0.13, 0.1], [-0.5, -0.06, 0.34])
        add(head, sphere, bellyMat, [0.17, 0.13, 0.1], [0.5, -0.06, 0.34])
      }
      if (species === 'cat') {
        for (const side of [-1, 1]) {
          for (let index = 0; index < 3; index += 1) {
            add(
              head,
              box,
              darkMat,
              [0.2, 0.012, 0.012],
              [side * 0.44, -0.22 + index * 0.06, 0.6],
              [0, side * 0.18, side * (0.1 - index * 0.08)],
            )
          }
        }
        add(body, torus, accentMat, [0.5, 0.5, 0.15], [0, 1.72, 0.04], [Math.PI / 2, 0, 0])
        add(body, sphere, goldMat, [0.08, 0.08, 0.07], [0, 1.63, 0.5])
      }
    } else if (isOwl) {      for (const side of [-1, 1]) {
        const group = new THREE.Group()
        group.position.set(side * 0.4, 0.46, 0.02)
        group.rotation.z = side * 0.25
        head.add(group)
        outline(add(group, cone, bodyMat, [0.16, 0.34, 0.16], [0, 0.18, 0]), 0.016)
        add(group, cone, accentMat, [0.07, 0.16, 0.07], [0, 0.2, 0.06])
        ears.push(group)
      }
    } else if (isPanda) {
      for (const side of [-1, 1]) {
        add(head, sphere, accentMat, [0.22, 0.22, 0.17], [side * 0.38, 0.38, 0.02])
        const group = new THREE.Group()
        group.position.set(side * 0.38, 0.38, 0.02)
        head.add(group)
        ears.push(group)
      }
    } else if (isDino) {
      for (const side of [-1, 1]) {
        add(head, cone, accentMat, [0.08, 0.2, 0.08], [side * 0.2, 0.54, 0.02])
      }
      add(head, cylinder, scarfMat, [0.42, 0.16, 0.42], [0, 0.58, 0])
      add(head, box, scarfMat, [0.46, 0.055, 0.28], [0, 0.52, 0.27])
    } else if (isDragon) {
      for (const side of [-1, 1]) {
        const group = new THREE.Group()
        group.position.set(side * 0.3, 0.47, 0.02)
        group.rotation.z = side * -0.3
        head.add(group)
        add(group, cone, accentMat, [0.09, 0.34, 0.09], [0, 0.17, 0])
        ears.push(group)
      }
      add(body, octa, goldMat, [0.1, 0.1, 0.06], [0, 1.32, 0.6])
    } else if (species === 'lion') {
      for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * Math.PI * 2
        add(head, sphere, accentMat, [0.13, 0.13, 0.11], [Math.cos(angle) * 0.64, Math.sin(angle) * 0.64, -0.02])
      }
      for (const side of [-1, 1]) {
        add(head, sphere, bodyMat, [0.17, 0.17, 0.13], [side * 0.42, 0.33, 0.03])
      }
      add(head, cylinder, goldMat, [0.34, 0.13, 0.34], [0, 0.63, 0])
      for (let index = 0; index < 5; index += 1) {
        const angle = (index / 5) * Math.PI * 2
        add(
          head,
          cone,
          goldMat,
          [0.055, 0.14, 0.055],
          [Math.cos(angle) * 0.18, 0.74, Math.sin(angle) * 0.18],
        )
      }
    } else if (!isRobot) {
      for (const side of [-1, 1]) {
        const group = new THREE.Group()
        group.position.set(side * 0.4, 0.32, 0.02)
        head.add(group)
        outline(add(group, sphere, bodyMat, [0.16, 0.16, 0.11], [0, 0, 0]), 0.016)
        ears.push(group)
      }
      if (species === 'otter') {
        add(body, torus, accentMat, [0.74, 0.74, 0.22], [0, 1.12, 0.02], [Math.PI / 2, 0, 0])
        add(body, box, goldMat, [0.14, 0.14, 0.05], [0, 1.12, 0.64])
      }
    }

    if (isPenguin) {
      add(body, torus, scarfMat, [0.52, 0.52, 0.18], [0, 1.72, 0.04], [Math.PI / 2, 0, 0])
      add(body, box, scarfMat, [0.15, 0.32, 0.08], [0.28, 1.48, 0.52], [0, 0, -0.2])
      add(body, box, scarfMat, [0.11, 0.22, 0.07], [-0.18, 1.53, 0.53], [0, 0, 0.16])
    }

    if (isPanda) {
      add(head, cylinder, leafMat, [0.04, 0.36, 0.04], [0.38, -0.18, 0.48], [0, 0, -0.55])
      add(head, sphere, leafMat, [0.16, 0.06, 0.05], [0.5, 0.02, 0.48], [0, 0, -0.4])
      add(head, sphere, leafMat, [0.13, 0.05, 0.05], [0.58, 0.08, 0.48], [0, 0, 0.3])
    }

    const wings: THREE.Group[] = []
    if (isDragon) {
      for (const side of [-1, 1]) {
        const group = new THREE.Group()
        group.position.set(side * 0.58, 1.25, -0.34)
        group.rotation.z = side * 0.55
        body.add(group)
        add(group, sphere, accentMat, [0.42, 0.28, 0.06], [side * 0.2, 0.05, 0])
        add(group, sphere, config.accent === '#f6d77a' ? darkMat : glowMat, [0.18, 0.16, 0.04], [side * 0.42, 0.14, 0.02])
        wings.push(group)
      }
    }

    if (isRobot) {
      add(body, cylinder, darkMat, [0.04, 0.1, 0.04], [0.28, 1.62, 0.1])
      add(body, sphere, glowMat, [0.05, 0.05, 0.05], [0.28, 1.7, 0.1])
    }

    const sparkles: THREE.Mesh[] = []
    for (let index = 0; index < 7; index += 1) {
      const angle = (index / 7) * Math.PI * 2
      const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), glowMat)
      mesh.position.set(Math.cos(angle) * 1.15, 1.4 + Math.sin(angle * 2) * 0.6, Math.sin(angle) * 0.25)
      mesh.visible = false
      scene.add(mesh)
      sparkles.push(mesh)
    }

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.95, quality === 'mini' ? 36 : 56),
      new THREE.MeshBasicMaterial({ color: 0x1d4468, transparent: true, opacity: 0.18 }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.01
    scene.add(shadow)

    const rig: Rig = {
      root,
      body,
      head,
      arms: armGroups,
      legs: legGroups,
      ears,
      eyes,
      pupils,
      mouths,
      tail,
      wings,
      sparkles,
      headBaseY: 2.08,
    }

    let raf = 0
    let running = true
    const start = performance.now()
    let lastFrame = start
    let seenSignal = signalRef.current
    let cheer = 0
    let sad = 0
    let think = 0
    let motionWeight = 0
    let motionPhase = 0
    let gestureU = 0
    let gestureKind: MascotGesture | null = null
    let gestureStartedAt = start
    let gestureLength = 1
    let lastGesture: MascotGesture | null = null
    let nextGestureAt = start + 2400 + Math.random() * 2000
    let queuedCelebrate = false

    function startGesture(kind: MascotGesture, now: number, length: number) {
      gestureKind = kind
      gestureStartedAt = now
      gestureLength = length
      gestureU = 0
      motionWeight = 0
    }

    function applyFrame(now: number) {
      const t = (now - start) / 1000
      const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000))
      lastFrame = now

      if (signalRef.current !== seenSignal) {
        seenSignal = signalRef.current
        // Không cắt ngang động tác đang chạy (sẽ tạo cú giật): xếp hàng chờ tới lượt.
        if (!gestureKind || motionWeight < 0.2) {
          startGesture('celebrate', now, 3200)
          nextGestureAt = now + 3800
        } else {
          queuedCelebrate = true
        }
      }
      if (!gestureKind && now >= nextGestureAt) {
        const pool = IDLE_GESTURES.filter((kind) => kind !== lastGesture)
        startGesture(
          pool[Math.floor(Math.random() * pool.length)] ?? 'sway',
          now,
          2400 + Math.random() * 1800,
        )
      }

      // Envelope sin²: mọi động tác bắt đầu và kết thúc đều bằng 0 với độ dốc 0,
      // nên chuyển giữa các tư thế không có điểm gãy.
      if (gestureKind) {
        gestureU = Math.min(1, Math.max(0, (now - gestureStartedAt) / gestureLength))
        motionWeight = Math.sin(Math.PI * gestureU) ** 2
        if (gestureU >= 1) {
          lastGesture = gestureKind
          gestureKind = null
          motionWeight = 0
          if (queuedCelebrate) {
            queuedCelebrate = false
            startGesture('celebrate', now, 3200)
            nextGestureAt = now + 3800
          } else {
            nextGestureAt = now + 2600 + Math.random() * 4200
          }
        }
      } else {
        gestureU = 0
        motionWeight = 0
      }
      if (gestureKind && motionWeight > 0.0005) {
        motionPhase += dt * (gestureKind === 'celebrate' ? 7.2 : 4.6)
      }

      const targetCheer = moodRef.current === 'cheer' ? 1 : 0
      const targetSad = moodRef.current === 'sad' ? 1 : 0
      const targetThink = moodRef.current === 'think' ? 1 : 0
      const moodEase = 1 - Math.exp(-dt * 9)
      cheer += (targetCheer - cheer) * moodEase
      sad += (targetSad - sad) * moodEase
      think += (targetThink - think) * moodEase

      const m = motionWeight
      let motionHop = 0
      let armL = 0
      let armR = 0
      let headYaw = Math.sin(t * 0.45) * 0.05
      let headTilt = 0
      let twist = Math.sin(t * 0.32) * 0.04
      let legSwing = 0
      let sparkleWeight = 0
      let stretch = 0

      if (gestureKind && m > 0) {
        switch (gestureKind) {
          case 'celebrate': {
            motionHop = Math.abs(Math.sin(motionPhase)) * 0.3 * m
            armL = -Math.sin(motionPhase * 1.8) * 0.34 * m
            armR = Math.sin(motionPhase * 1.8) * 0.34 * m
            twist += Math.sin(motionPhase * 0.7) * 0.8 * m
            headTilt = Math.sin(motionPhase * 0.9) * 0.13 * m
            legSwing = Math.sin(motionPhase) * 0.5 * m
            sparkleWeight = m
            break
          }
          case 'hop': {
            const bounce = Math.abs(Math.sin(motionPhase * 1.25))
            motionHop = bounce * 0.16 * m
            armL = -bounce * 0.16 * m
            armR = bounce * 0.16 * m
            legSwing = Math.sin(motionPhase * 1.25) * 0.2 * m
            break
          }
          case 'wave': {
            armR = (1.05 + Math.sin(motionPhase * 2.6) * 0.22) * m
            headTilt = 0.07 * m
            twist += 0.12 * m
            break
          }
          case 'look': {
            headYaw += Math.sin(motionPhase * 0.9) * 0.5 * m
            headTilt = Math.sin(motionPhase * 0.9) * 0.06 * m
            twist += Math.sin(motionPhase * 0.9) * 0.16 * m
            break
          }
          case 'sway': {
            twist += Math.sin(motionPhase * 0.8) * 0.22 * m
            headTilt = -Math.sin(motionPhase * 0.8) * 0.09 * m
            armL = Math.sin(motionPhase * 0.8) * 0.08 * m
            armR = -Math.sin(motionPhase * 0.8) * 0.08 * m
            break
          }
          case 'stretch': {
            stretch = Math.sin(gestureU * Math.PI) * m
            armL = -0.85 * m
            armR = 0.85 * m
            motionHop = 0.04 * m
            break
          }
          case 'twirl': {
            twist += Math.sin(gestureU * Math.PI * 2) * 0.55 * m
            headTilt = Math.sin(gestureU * Math.PI * 2) * 0.08 * m
            armL = -Math.sin(gestureU * Math.PI) * 0.45 * m
            armR = Math.sin(gestureU * Math.PI) * 0.45 * m
            break
          }
        }
      }

      const breathe = 1 + Math.sin(t * 1.8) * 0.013
      root.scale.set(
        (1 / breathe) * (1 - 0.035 * stretch),
        breathe * (1 + 0.07 * stretch),
        (1 / breathe) * (1 - 0.035 * stretch),
      )

      // Nhấp nhô thở + nhún khi vui + động tác ngẫu nhiên, tất cả cộng dồn liên tục.
      const cheerHop = cheer * Math.abs(Math.sin(t * 5.5)) * 0.22
      root.position.y = Math.sin(t * 1.8) * 0.035 + cheerHop + motionHop
      root.position.x = Math.sin(t * 0.41) * 0.03
      root.rotation.y = Math.sin(t * 0.5) * 0.1 + twist

      head.rotation.z =
        Math.sin(t * 0.9) * 0.03 + think * 0.13 - sad * 0.08 + headTilt
      head.rotation.x = sad * 0.16 - cheer * 0.05 - stretch * 0.04
      head.rotation.y = headYaw
      head.position.y = rig.headBaseY + Math.sin(t * 1.8) * 0.015 + stretch * 0.04

      const blinkPhase = (t + 0.4) % 4.5
      const blink =
        blinkPhase < 0.18 ? 1 - 0.9 * Math.sin((blinkPhase / 0.18) * Math.PI) : 1
      for (const eye of rig.eyes) {
        const base = isOwl
          ? [0.2, 0.21, 0.08]
          : isFrog
            ? [0.17, 0.19, 0.15]
            : [0.155, 0.18, 0.07]
        eye.scale.set(base[0], base[1] * blink, base[2])
      }
      for (const pupil of rig.pupils) {
        const baseX = (pupil.userData.baseX as number) ?? 0
        const baseY = (pupil.userData.baseY as number) ?? 0
        pupil.position.x = baseX + headYaw * 0.035
        pupil.position.y = baseY + think * 0.018
      }

      const armBase = 0.18 + Math.sin(t * 1.8) * 0.04
      const cheerLift = cheer * 2.3
      const sadArm = sad * 0.85
      rig.arms[0].rotation.z =
        (-(armBase + cheerLift) + armL) * (1 - sadArm) + 0.06 * sadArm
      rig.arms[1].rotation.z =
        (armBase + cheerLift + armR) * (1 - sadArm) - 0.06 * sadArm
      const thinkArm = think * (1 - Math.min(1, cheer + m))
      rig.arms[1].rotation.z += thinkArm * 0.95

      rig.legs.forEach((leg, index) => {
        leg.rotation.x = index === 0 ? legSwing : -legSwing
      })

      if (rig.tail) {
        rig.tail.rotation.y =
          Math.sin(t * 2.2) * 0.16 + Math.sin(motionPhase * 1.4) * 0.4 * m
        rig.tail.rotation.z = sad * 0.3
      }

      for (const wing of rig.wings) {
        wing.rotation.z =
          (wing.position.x < 0 ? -1 : 1) *
          (0.55 + Math.sin(t * 2.4) * 0.1 + cheer * 0.3 + Math.sin(motionPhase * 2) * 0.1 * m)
      }

      for (const ear of rig.ears) {
        const direction = ear.position.x < 0 ? -1 : 1
        ear.rotation.z =
          direction *
          (0.12 -
            sad * 0.45 +
            Math.sin(t * 1.4) * 0.02 +
            Math.sin(motionPhase * 1.2) * 0.085 * m)
      }

      for (const sparkle of rig.sparkles) {
        sparkle.visible = sparkleWeight > 0.02
        if (sparkle.visible) {
          const scale =
            (0.5 + Math.abs(Math.sin(motionPhase * 0.85 + sparkle.position.x)) * 0.9) *
            sparkleWeight
          sparkle.scale.setScalar(scale)
          sparkle.rotation.y += dt * 5
          sparkle.position.y =
            1.4 + Math.sin(motionPhase * 0.7 + sparkle.position.x) * 0.35 * sparkleWeight
        }
      }

      renderer.render(scene, camera)
    }

    function loop(now: number) {
      if (!running) return
      applyFrame(now)
      raf = requestAnimationFrame(loop)
    }

    function resize() {
      const w = Math.max(hostEl.clientWidth, 1)
      const h = Math.max(hostEl.clientHeight, 1)
      applyPixelRatio()
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      applyFrame(performance.now())
    }
    const observer = new ResizeObserver(resize)
    observer.observe(hostEl)
    window.addEventListener('resize', resize)
    resize()
    if (!reduceMotion) {
      raf = requestAnimationFrame(loop)
    }

    function onVisibility() {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reduceMotion && !running) {
        running = true
        raf = requestAnimationFrame(loop)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
      observer.disconnect()
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const material = mesh.material
        if (Array.isArray(material)) material.forEach((item) => item.dispose())
        else if (material) material.dispose()
      })
      sphere.dispose()
      cone.dispose()
      box.dispose()
      cylinder.dispose()
      torus.dispose()
      smile.dispose()
      octa.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [ariaLabel, config, quality, decorative])

  return <div className={`level-mascot ${className}`.trim()} ref={hostRef} />
}

