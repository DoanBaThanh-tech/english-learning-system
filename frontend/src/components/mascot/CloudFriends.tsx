import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { cloudGeometry, cloudSurfaceZ } from './NimboMascot'
import './cloud-friends.css'

export type CloudMood = 'idle' | 'cheer' | 'sad' | 'think'

type FriendDef = {
  name: string
  top: string
  bottom: string
  accent: number
  ink: number
  x: number
  y: number
  scale: number
  phase: number
  accessory: 'none' | 'star' | 'bow'
}

const FRIENDS: FriendDef[] = [
  {
    name: 'Lumi',
    top: '#ffeaa0',
    bottom: '#dcae35',
    accent: 0xc9a43b,
    ink: 0x5a4107,
    x: -2.15,
    y: 0.74,
    scale: 0.72,
    phase: 1.6,
    accessory: 'star',
  },
  {
    name: 'Nimbo',
    top: '#e6f6ff',
    bottom: '#78b9e5',
    accent: 0x3b8fd0,
    ink: 0x1b2a55,
    x: 0,
    y: 1.06,
    scale: 1,
    phase: 0,
    accessory: 'none',
  },
  {
    name: 'Pip',
    top: '#ffd6e6',
    bottom: '#e87ba4',
    accent: 0xd95d8a,
    ink: 0x5b2340,
    x: 2.15,
    y: 0.8,
    scale: 0.76,
    phase: 3.1,
    accessory: 'bow',
  },
]

type Props = {
  mood?: CloudMood
  className?: string
  ariaLabel?: string
}

export function CloudFriends({
  mood = 'idle',
  className = '',
  ariaLabel = 'Nimbo, Lumi và Pip — ba bạn mây 3D của SkyWorld',
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const moodRef = useRef<CloudMood>(mood)

  useEffect(() => {
    moodRef.current = mood
  }, [mood])

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
    renderer.toneMappingExposure = 0.95
    renderer.domElement.setAttribute('aria-label', ariaLabel)
    renderer.domElement.setAttribute('role', 'img')
    hostEl.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1.6, 0.1, 50)
    camera.position.set(0, 1.7, 9.8)
    camera.lookAt(0, 1.0, 0)

    scene.add(new THREE.HemisphereLight(0xe2f3ff, 0x93b9d6, 0.9))
    const key = new THREE.DirectionalLight(0xfff6e9, 0.65)
    key.position.set(4, 7, 6)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xa9d4f5, 0.32)
    rim.position.set(-5, 3, -5)
    scene.add(rim)

    const sphere = new THREE.SphereGeometry(1, 24, 18)
    type EyeRig = {
      white: THREE.Mesh
      pupil: THREE.Mesh
      happy: THREE.Mesh
    }
    type Rig = {
      def: FriendDef
      body: THREE.Group
      eyes: EyeRig[]
      arms: THREE.Group[]
      mouth: THREE.Mesh
      baseY: number
    }
    const rigs: Rig[] = []

    for (const def of FRIENDS) {
      const body = new THREE.Group()
      body.position.set(def.x, def.y, 0)
      body.scale.setScalar(def.scale)
      scene.add(body)

      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        metalness: 0,
      })
      const geo = cloudGeometry(def.top, def.bottom, 2.1)
      body.add(new THREE.Mesh(geo, material))

      const inkMat = new THREE.MeshStandardMaterial({ color: def.ink, roughness: 0.35 })
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      const cheekMat = new THREE.MeshStandardMaterial({ color: 0xf2b4bf, roughness: 0.85 })
      const limbMat = new THREE.MeshStandardMaterial({ color: def.bottom, roughness: 0.9 })
      const shoeMat = new THREE.MeshStandardMaterial({ color: def.accent, roughness: 0.7 })

      const ell = (mat: THREE.Material, sx: number, sy: number, sz: number) => {
        const mesh = new THREE.Mesh(sphere, mat)
        mesh.scale.set(sx, sy, sz)
        return mesh
      }

      const eyes: EyeRig[] = []
      const arms: THREE.Group[] = []

      for (const side of [-1, 1]) {
        const ex = side * 0.37
        const ey = 0.2
        const group = new THREE.Group()
        group.position.set(ex, ey, cloudSurfaceZ(ex, ey) + 0.03)
        body.add(group)
        const white = ell(whiteMat, 0.123, 0.153, 0.05)
        group.add(white)
        const pupil = ell(inkMat, 0.066, 0.084, 0.04)
        pupil.position.z = 0.034
        group.add(pupil)
        const shine = ell(whiteMat, 0.018, 0.018, 0.012)
        shine.position.set(0.026, 0.04, 0.066)
        group.add(shine)
        const happy = new THREE.Mesh(
          new THREE.TorusGeometry(0.085, 0.019, 8, 20, Math.PI),
          inkMat,
        )
        happy.position.set(0, 0.2, 0.04)
        happy.visible = false
        group.add(happy)
        eyes.push({ white, pupil, happy })

        const brow = ell(inkMat, 0.075, 0.014, 0.025)
        brow.position.set(side * 0.37, 0.47, cloudSurfaceZ(side * 0.37, 0.47) + 0.03)
        brow.rotation.z = side * -0.1
        body.add(brow)

        const cheek = ell(cheekMat, 0.095, 0.065, 0.025)
        cheek.position.set(side * 0.6, -0.02, cloudSurfaceZ(side * 0.6, -0.02) + 0.03)
        body.add(cheek)

        const armGroup = new THREE.Group()
        armGroup.position.set(side * 1.12, -0.02, 0.12)
        const arm = ell(limbMat, 0.19, 0.42, 0.27)
        arm.position.y = -0.28
        armGroup.add(arm)
        body.add(armGroup)
        arms.push(armGroup)

        const foot = ell(limbMat, 0.17, 0.1, 0.24)
        foot.position.set(side * 0.37, -0.66, 0.28)
        body.add(foot)
        const shoe = ell(shoeMat, 0.18, 0.06, 0.25)
        shoe.position.set(side * 0.37, -0.72, 0.31)
        body.add(shoe)
      }

      const mouth = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.02, 8, 22, Math.PI),
        inkMat,
      )
      mouth.position.set(0, -0.06, cloudSurfaceZ(0, -0.06) + 0.035)
      mouth.rotation.z = Math.PI
      body.add(mouth)

      if (def.accessory === 'star') {
        const star = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.15, 0),
          new THREE.MeshStandardMaterial({
            color: 0xf6d77a,
            roughness: 0.35,
            metalness: 0.08,
          }),
        )
        star.scale.set(0.8, 1.35, 0.5)
        star.position.set(0, 1.34, 0.52)
        body.add(star)
      }

      if (def.accessory === 'bow') {
        const bowMat = new THREE.MeshStandardMaterial({ color: 0xd95d8a, roughness: 0.6 })
        for (const side of [-1, 1]) {
          const loop = ell(bowMat, 0.11, 0.085, 0.05)
          loop.position.set(side * 0.1, 1.32, 0.52)
          loop.rotation.z = side * 0.5
          body.add(loop)
        }
        const knot = ell(bowMat, 0.04, 0.04, 0.04)
        knot.position.set(0, 1.32, 0.56)
        body.add(knot)
      }

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(1.05, 36),
        new THREE.MeshBasicMaterial({
          color: 0x1d4468,
          transparent: true,
          opacity: 0.13,
        }),
      )
      shadow.rotation.x = -Math.PI / 2
      shadow.position.set(def.x, 0.01, 0)
      shadow.scale.set(def.scale, def.scale * 0.7, 1)
      scene.add(shadow)

      rigs.push({ def, body, eyes, arms, mouth, baseY: def.y })
    }

    let raf = 0
    let running = true
    const start = performance.now()
    let cheer = 0
    let sad = 0
    let think = 0

    function applyFrame(now: number) {
      const t = (now - start) / 1000
      const targetCheer = moodRef.current === 'cheer' ? 1 : 0
      const targetSad = moodRef.current === 'sad' ? 1 : 0
      const targetThink = moodRef.current === 'think' ? 1 : 0
      cheer += (targetCheer - cheer) * 0.12
      sad += (targetSad - sad) * 0.12
      think += (targetThink - think) * 0.12

      for (const rig of rigs) {
        const { def } = rig
        const bob = Math.sin(t * 1.5 + def.phase) * 0.04
        const hop = cheer * Math.abs(Math.sin(t * 4.4 + def.phase)) * 0.16
        const breathe = 1 + Math.sin(t * 1.7 + def.phase) * 0.012
        rig.body.position.y = rig.baseY + bob + hop
        rig.body.scale.set(
          def.scale / breathe,
          def.scale * breathe,
          def.scale / breathe,
        )
        rig.body.rotation.z = think * Math.sin(t * 1.2 + def.phase) * 0.05

        const blink = (t + def.phase) % 4.2 < 0.1 ? 0.1 : 1
        for (const eye of rig.eyes) {
          const happy = cheer > 0.55
          eye.white.visible = !happy
          eye.pupil.visible = !happy
          eye.happy.visible = happy
          eye.white.scale.set(0.123, 0.153 * blink, 0.05)
          eye.pupil.scale.set(0.066, 0.084 * blink, 0.04)
        }

        rig.arms.forEach((arm, index) => {
          const side = index === 0 ? -1 : 1
          const idle = side * (0.12 + Math.sin(t * 1.8 + def.phase) * 0.05)
          const cheerPose = side * (2.1 + Math.sin(t * 12 + def.phase) * 0.22)
          const sadPose = side * -0.28
          arm.rotation.z = idle * (1 - cheer - sad) + cheerPose * cheer + sadPose * sad
        })

        rig.mouth.rotation.z = sad > 0.5 ? 0 : Math.PI
        rig.mouth.position.y = -0.06 - sad * 0.02
        rig.mouth.scale.setScalar(1 - sad * 0.15)
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
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      applyFrame(performance.now())
    }
    const observer = new ResizeObserver(resize)
    observer.observe(hostEl)
    resize()
    if (!reduceMotion) {
      running = true
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
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const material = mesh.material
        if (Array.isArray(material)) material.forEach((item) => item.dispose())
        else if (material) material.dispose()
      })
      sphere.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [ariaLabel])

  return <div className={`cloud-friends ${className}`.trim()} ref={hostRef} />
}
