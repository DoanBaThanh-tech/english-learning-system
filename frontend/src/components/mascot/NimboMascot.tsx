import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export type NimboPose =
  | 'idle'
  | 'shock'
  | 'think'
  | 'sad'
  | 'wave'
  | 'cheer'
  | 'walk'

type Params = {
  ey: number
  ex: number
  pup: number
  lid: number
  lt: number
  hap: number
  tear: number
  ck: number
  mx: number
  mw: number
  mh: number
  my: number
  sad: number
  bl: number
  br: number
  by: number
  bh: number
  lx: number
  ly: number
  al: number
  ar: number
  jump: number
  walk: number
}

const base: Params = {
  ey: 1,
  ex: 1,
  pup: 1,
  lid: 0,
  lt: 0,
  hap: 0,
  tear: 0,
  ck: 1,
  mx: 0,
  mw: 0.13,
  mh: 0.07,
  my: -0.06,
  sad: 0,
  bl: 0,
  br: 0,
  by: 0,
  bh: 0,
  lx: 0,
  ly: 0,
  al: 0.15,
  ar: 0.15,
  jump: 0,
  walk: 0,
}

export const NIMBO_POSES: Record<NimboPose, Params> = {
  idle: { ...base },
  shock: {
    ...base,
    ey: 1.3,
    ex: 1.25,
    pup: 0.55,
    mw: 0.07,
    mh: 0.12,
    my: -0.18,
    bl: -0.12,
    br: 0.12,
    by: 0.1,
    al: 0.7,
    ar: 0.7,
    ck: 0.7,
  },
  think: {
    ...base,
    lid: 0.2,
    mw: 0.06,
    mh: 0.03,
    mx: 0.14,
    my: -0.16,
    bl: -0.3,
    br: 0.15,
    bh: 0.1,
    lx: 0.7,
    ly: 0.6,
    ar: 1.0,
    ck: 0.9,
  },
  sad: {
    ...base,
    ey: 0.95,
    pup: 1.15,
    lid: 0.5,
    lt: 0.45,
    tear: 1,
    ck: 0.6,
    mw: 0,
    mh: 0,
    my: -0.2,
    sad: 1,
    bl: 0.55,
    br: -0.55,
    by: -0.02,
    ly: -0.6,
    al: 0.05,
    ar: 0.05,
  },
  wave: { ...base, mw: 0.2, mh: 0.14, ck: 1.25, lx: 0.3, ar: 1.3 },
  cheer: {
    ...base,
    hap: 1,
    mw: 0.23,
    mh: 0.17,
    my: -0.13,
    ck: 1.35,
    by: 0.05,
    al: 2.4,
    ar: 2.4,
    jump: 1,
  },
  walk: { ...base, mw: 0.16, mh: 0.09, lx: 0.5, walk: 1 },
}

const ELLIPSOIDS: [number, number, number, number, number, number][] = [
  [-1.2, -0.2, 0, 0.42, 0.42, 0.5],
  [-0.95, 0.05, 0, 0.55, 0.55, 0.6],
  [-0.2, 0.5, -0.02, 0.85, 0.8, 0.75],
  [0.7, 0.3, 0, 0.62, 0.62, 0.65],
  [1.1, -0.12, 0, 0.42, 0.42, 0.5],
]

const CENTER = { x: 0, y: 0.35, z: 0 }

function sdEllipsoid(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
): number {
  const px = (x - cx) / rx
  const py = (y - cy) / ry
  const pz = (z - cz) / rz
  const k0 = Math.sqrt(px * px + py * py + pz * pz)
  const qx = px / rx
  const qy = py / ry
  const qz = pz / rz
  const k1 = Math.sqrt(qx * qx + qy * qy + qz * qz)
  if (k1 < 1e-6) return -Math.min(rx, ry, rz)
  return (k0 * (k0 - 1)) / k1
}

function sdRoundBox(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  cz: number,
  hx: number,
  hy: number,
  hz: number,
  r: number,
): number {
  const qx = Math.abs(x - cx) - hx + r
  const qy = Math.abs(y - cy) - hy + r
  const qz = Math.abs(z - cz) - hz + r
  const ox = Math.max(qx, 0)
  const oy = Math.max(qy, 0)
  const oz = Math.max(qz, 0)
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - r
}

function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k
  return Math.min(a, b) - h * h * k * 0.25
}

function sdf(x: number, y: number, z: number): number {
  let d = sdRoundBox(x, y, z, 0, -0.4, 0, 1.0, 0.25, 0.45, 0.3)
  for (const [cx, cy, cz, rx, ry, rz] of ELLIPSOIDS) {
    d = smin(d, sdEllipsoid(x, y, z, cx, cy, cz, rx, ry, rz), 0.14)
  }
  return d
}

function surfaceAlong(dir: THREE.Vector3): THREE.Vector3 {
  let t = 0.02
  let prev = t
  const max = 2.8
  while (t < max) {
    const px = CENTER.x + dir.x * t
    const py = CENTER.y + dir.y * t
    const pz = CENTER.z + dir.z * t
    if (sdf(px, py, pz) > 0) break
    prev = t
    t += 0.035
  }
  let lo = prev
  let hi = Math.min(t, max)
  for (let i = 0; i < 14; i += 1) {
    const mid = (lo + hi) / 2
    const px = CENTER.x + dir.x * mid
    const py = CENTER.y + dir.y * mid
    const pz = CENTER.z + dir.z * mid
    if (sdf(px, py, pz) < 0) lo = mid
    else hi = mid
  }
  const r = (lo + hi) / 2
  return new THREE.Vector3(
    CENTER.x + dir.x * r,
    CENTER.y + dir.y * r,
    CENTER.z + dir.z * r,
  )
}

export function cloudSurfaceZ(x: number, y: number): number {
  let z = 0
  let prev = 0
  while (z < 1.7) {
    if (sdf(x, y, z) > 0) break
    prev = z
    z += 0.02
  }
  if (z >= 1.7) return 0.9
  let lo = prev
  let hi = z
  for (let i = 0; i < 10; i += 1) {
    const mid = (lo + hi) / 2
    if (sdf(x, y, mid) < 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function cloudGeometry(
  topHex = '#e3ecf5',
  bottomHex = '#b9d8f0',
  colorBias = 1,
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 96, 64)
  const pos = geo.attributes.position as THREE.BufferAttribute
  const colors: number[] = []
  const top = new THREE.Color(topHex)
  const bottom = new THREE.Color(bottomHex)
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i += 1) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize()
    const p = surfaceAlong(v)
    pos.setXYZ(i, p.x, p.y, p.z)
    const raw = THREE.MathUtils.clamp((p.y + 0.66) / 1.96, 0, 1)
    const t = colorBias === 1 ? raw : Math.pow(raw, colorBias)
    const c = bottom.clone().lerp(top, t)
    colors.push(c.r, c.g, c.b)
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
  return geo
}

const FALLBACK = { ...base }

type NimboMascotProps = {
  pose?: NimboPose
  interactive?: boolean
  size?: number | string
  className?: string
  onClick?: () => void
  ariaLabel?: string
}

export function NimboMascot({
  pose = 'idle',
  interactive = false,
  size,
  className = '',
  onClick,
  ariaLabel = 'Nimbo, chú mây 3D của SkyWorld',
}: NimboMascotProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const poseRef = useRef<NimboPose>(pose)
  const clickRef = useRef<(() => void) | undefined>(onClick)
  const waveUntilRef = useRef(0)

  useEffect(() => {
    poseRef.current = pose
  }, [pose])

  useEffect(() => {
    clickRef.current = onClick
  }, [onClick])

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputEncoding = THREE.sRGBEncoding
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.82
    renderer.domElement.setAttribute('aria-label', ariaLabel)
    renderer.domElement.setAttribute('role', 'img')
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(0, 1.7, 8.4)
    camera.lookAt(0, 1.1, 0)

    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x7da6cc, 0.65))
    const key = new THREE.DirectionalLight(0xfff4e6, 0.5)
    key.position.set(3, 6, 5)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xa9d4f5, 0.35)
    rim.position.set(-4, 3, -4)
    scene.add(rim)

    const root = new THREE.Group()
    scene.add(root)
    const body = new THREE.Group()
    body.position.y = 1.1
    root.add(body)

    const cloudMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      metalness: 0,
    })
    const cloudGeo = cloudGeometry()
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat)
    body.add(cloudMesh)

    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x1b2a55,
      roughness: 0.32,
    })
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.28,
    })
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const tearMat = new THREE.MeshStandardMaterial({
      color: 0x7cc4f0,
      roughness: 0.2,
      transparent: true,
      opacity: 0.95,
    })
    const cheekMat = new THREE.MeshStandardMaterial({
      color: 0xf2b4bf,
      roughness: 0.85,
    })
    const mouthMat = new THREE.MeshStandardMaterial({
      color: 0x5a2236,
      roughness: 0.5,
    })
    const tongueMat = new THREE.MeshStandardMaterial({
      color: 0xf08aa0,
      roughness: 0.6,
    })
    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x8fc3ea,
      roughness: 0.7,
    })
    const cloudFaceMat = new THREE.MeshStandardMaterial({
      color: 0xdce9f4,
      roughness: 0.9,
    })
    const limbMat = new THREE.MeshStandardMaterial({
      color: 0xdfeaf6,
      roughness: 0.9,
    })

    const sphere = new THREE.SphereGeometry(1, 26, 20)
    function ell(mat: THREE.Material, sx: number, sy: number, sz: number) {
      const m = new THREE.Mesh(sphere, mat)
      m.scale.set(sx, sy, sz)
      return m
    }

    type EyeRig = {
      group: THREE.Group
      white: THREE.Mesh
      pupil: THREE.Mesh
      lid: THREE.Mesh
      happy: THREE.Mesh
      highlights: THREE.Mesh[]
      baseY: number
    }
    const eyes: EyeRig[] = []
    const brows: THREE.Mesh[] = []
    const cheeks: THREE.Mesh[] = []

    for (const side of [-1, 1]) {
      const ex = side * 0.4
      const ey = 0.14
      const ez = cloudSurfaceZ(ex, ey) + 0.025
      const group = new THREE.Group()
      group.position.set(ex, ey, ez)
      body.add(group)

      const white = ell(whiteMat, 0.135, 0.17, 0.055)
      group.add(white)
      const pupil = ell(faceMat, 0.072, 0.092, 0.045)
      pupil.position.z = 0.035
      group.add(pupil)
      const hi = ell(glowMat, 0.024, 0.024, 0.02)
      hi.position.set(0.035, 0.055, 0.07)
      group.add(hi)
      const hi2 = ell(glowMat, 0.012, 0.012, 0.012)
      hi2.position.set(-0.02, -0.02, 0.075)
      group.add(hi2)

      const lid = ell(cloudFaceMat, 0.155, 0.085, 0.065)
      lid.position.set(0, 0.12, 0.01)
      group.add(lid)

      const happy = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.023, 8, 22, Math.PI),
        faceMat,
      )
      happy.rotation.z = 0
      happy.position.set(0, 0.03, 0.06)
      happy.visible = false
      group.add(happy)

      eyes.push({ group, white, pupil, lid, happy, highlights: [hi, hi2], baseY: ey })

      const brow = ell(faceMat, 0.1, 0.02, 0.04)
      brow.position.set(side * 0.4, 0.42, cloudSurfaceZ(side * 0.4, 0.42) + 0.045)
      brow.rotation.z = side === -1 ? 0.12 : -0.12
      body.add(brow)
      brows.push(brow)

      const cheek = ell(cheekMat, 0.11, 0.08, 0.03)
      cheek.position.set(side * 0.66, -0.04, cloudSurfaceZ(side * 0.66, -0.04) + 0.035)
      body.add(cheek)
      cheeks.push(cheek)
    }

    const mouthGroup = new THREE.Group()
    mouthGroup.position.set(0, -0.15, cloudSurfaceZ(0, -0.15) + 0.03)
    body.add(mouthGroup)
    const mouth = ell(mouthMat, 1, 1, 0.05)
    mouthGroup.add(mouth)
    const tongue = ell(tongueMat, 1, 1, 0.06)
    mouthGroup.add(tongue)
    const frown = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.024, 10, 22, Math.PI),
      faceMat,
    )
    frown.rotation.z = 0
    frown.position.set(0, -0.06, cloudSurfaceZ(0, -0.12) + 0.34)
    frown.visible = false
    body.add(frown)

    const tear = ell(tearMat, 0.035, 0.06, 0.035)
    tear.position.set(0.5, 0.06, cloudSurfaceZ(0.5, 0.06) + 0.12)
    tear.visible = false
    body.add(tear)

    const armGroups: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const g = new THREE.Group()
      g.position.set(side * 1.22, -0.02, 0.12)
      const arm = ell(limbMat, 0.28, 0.6, 0.36)
      arm.position.y = -0.34
      g.add(arm)
      body.add(g)
      armGroups.push(g)
    }

    const legGroups: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const g = new THREE.Group()
      g.position.set(side * 0.42, -0.7, 0.28)
      const leg = ell(limbMat, 0.17, 0.26, 0.17)
      leg.position.y = -0.04
      g.add(leg)
      const shoe = ell(shoeMat, 0.24, 0.1, 0.33)
      shoe.position.set(side * 0.02, -0.23, 0.08)
      g.add(shoe)
      body.add(g)
      legGroups.push(g)
    }

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.5, 48),
      new THREE.MeshBasicMaterial({
        color: 0x1d4468,
        transparent: true,
        opacity: 0.22,
      }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.01
    scene.add(shadow)

    const current: Params = { ...FALLBACK }
    let drag = false
    let dragged = false
    let lastX = 0

    function wave() {
      waveUntilRef.current = performance.now() + 2400
    }

    function onPointerDown(event: PointerEvent) {
      drag = true
      dragged = false
      lastX = event.clientX
      renderer.domElement.setPointerCapture(event.pointerId)
    }
    function onPointerMove(event: PointerEvent) {
      if (!drag) return
      const dx = event.clientX - lastX
      if (Math.abs(dx) > 1) dragged = true
      root.rotation.y += dx * 0.012
      lastX = event.clientX
    }
    function onPointerUp() {
      if (drag && !dragged) {
        if (interactive) wave()
        clickRef.current?.()
      }
      drag = false
    }

    if (interactive) {
      renderer.domElement.addEventListener('pointerdown', onPointerDown)
      renderer.domElement.addEventListener('pointermove', onPointerMove)
      renderer.domElement.addEventListener('pointerup', onPointerUp)
      renderer.domElement.addEventListener('pointercancel', onPointerUp)
      renderer.domElement.style.cursor = 'grab'
      renderer.domElement.style.touchAction = 'pan-y'
    }

    function resize() {
      const w = Math.max(hostEl.clientWidth, 1)
      const h = Math.max(hostEl.clientHeight, 1)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(hostEl)
    resize()

    let raf = 0
    let running = true
    const start = performance.now()

    function applyFrame(now: number) {
      const t = (now - start) / 1000
      const override = now < waveUntilRef.current ? 'wave' : poseRef.current
      const target = NIMBO_POSES[override] ?? NIMBO_POSES.idle
      for (const k of Object.keys(target) as (keyof Params)[]) {
        current[k] += (target[k] - current[k]) * 0.14
      }

      if (!drag) {
        const r = ((root.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI
        root.rotation.y += (Math.sin(t * 0.6) * 0.18 - r) * 0.03
      }

      const breathe = 1 + Math.sin(t * 1.8) * 0.012
      const floatY = Math.sin(t * 1.8) * 0.05
      const jump = current.jump > 0.5 ? Math.abs(Math.sin(t * 4.5)) * 0.9 : 0
      body.position.y = 1.1 + floatY + jump
      body.scale.set(1 / breathe, breathe, 1 / breathe)

      const blink = t % 3.4 < 0.12 ? 0.1 : 1
      for (const eye of eyes) {
        const happy = current.hap > 0.5
        eye.white.visible = !happy
        eye.pupil.visible = !happy
        eye.happy.visible = happy
        eye.highlights.forEach((highlight) => (highlight.visible = !happy))
        eye.white.scale.set(0.135 * current.ex, 0.17 * current.ey * blink, 0.055)
        eye.pupil.scale.set(
          0.072 * current.pup,
          0.092 * current.pup * blink,
          0.045,
        )
        eye.pupil.position.set(current.lx * 0.045, current.ly * 0.04, 0.035)
        eye.lid.position.y = 0.12 - current.lid * 0.2
        eye.lid.scale.set(0.155, 0.085 + current.lid * 0.03, 0.065)
        eye.lid.rotation.z = current.lt * 0.35
        eye.lid.visible = current.lid > 0.02
      }

      brows.forEach((brow, index) => {
        const rot = index === 0 ? current.bl : current.br
        brow.rotation.z = rot
        brow.position.y = 0.42 + current.by + current.bh * 0.5
      })

      cheeks.forEach((cheek) => {
        cheek.scale.set(0.11 * current.ck, 0.08 * current.ck, 0.03)
        cheek.visible = current.ck > 0.1
      })

      mouthGroup.position.y = -0.15 + current.my * 0.35
      mouthGroup.position.x = current.mx
      const sad = current.sad > 0.5
      mouthGroup.visible = !sad
      frown.visible = sad
      mouth.scale.set(Math.max(current.mw, 0.001), Math.max(current.mh, 0.001), 0.05)
      tongue.scale.set(
        Math.max(current.mw * 0.55, 0.001),
        Math.max(current.mh * 0.5, 0.001),
        0.06,
      )
      tongue.position.set(0, -current.mh * 0.45, 0.012)

      tear.visible = current.tear > 0.04
      tear.scale.set(0.035 * current.tear, 0.06 * current.tear, 0.035 * current.tear)
      tear.position.y = 0.02 - ((t * 0.5) % 1) * 0.06 * current.tear

      if (override === 'wave') {
        armGroups[1].rotation.z = 1.3 + Math.sin(t * 12) * 0.4
        armGroups[0].rotation.z = -current.al
      } else if (override === 'cheer') {
        armGroups[0].rotation.z = -(2.2 + Math.sin(t * 14) * 0.25)
        armGroups[1].rotation.z = 2.2 + Math.sin(t * 14 + 1) * 0.25
      } else {
        armGroups[0].rotation.z = -current.al
        armGroups[1].rotation.z = current.ar
      }

      const walk = Math.sin(t * 6) * 0.4 * current.walk
      legGroups[0].rotation.x = walk
      legGroups[1].rotation.x = -walk

      shadow.scale.set(1.1 - jump * 0.2, 0.75 - jump * 0.14, 1)
      ;(shadow.material as THREE.MeshBasicMaterial).opacity = 0.22 - jump * 0.08

      renderer.render(scene, camera)
    }

    function loop(now: number) {
      if (!running) return
      applyFrame(now)
      raf = requestAnimationFrame(loop)
    }

    if (reduceMotion) {
      applyFrame(performance.now())
    } else {
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
      observer.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointercancel', onPointerUp)
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = (mesh as THREE.Mesh).material
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else if (mat) mat.dispose()
      })
      cloudGeo.dispose()
      sphere.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [ariaLabel, interactive])

  const dimension = typeof size === 'number' ? `${size}px` : size

  return (
    <div
      className={`nimbo ${className}`.trim()}
      ref={hostRef}
      style={dimension ? { width: dimension, height: dimension } : undefined}
    />
  )
}
