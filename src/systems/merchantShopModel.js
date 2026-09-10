// Builder for the "AURA" merchant shop prop. Framework-free (Tech.md rule 2):
// pure three.js, no React import. components/MerchantShop.jsx calls
// buildMerchantShop() once, adds the returned root to a mount group, and
// calls dispose() on teardown (three.js does not GC GPU memory — Tech.md §7).
//
// The whole stall is a heap of box / cylinder / cone primitives authored in
// the local space described in data/merchantShop.js. Primitives are bucketed
// by (collection, colour) and each bucket is merged into ONE
// MeshLambertMaterial mesh — Tech.md §7's "static and unique is merged into
// one geometry per material". That lands the prop at ~18 draw calls; the
// four named sub-groups (Structure, Roof_Sign, Props, Character) are the
// scene-graph stand-in for the brief's "hierarchical collections". If
// renderer.info ever shows draw-call pressure, drop the per-collection split
// and merge each colour once across the model.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  SHOP_COLORS,
  CRYSTAL_OPACITY,
  BASEPLATE,
  PILLARS,
  COUNTER,
  RAILINGS,
  INTERIOR_FLOOR,
  ROOF,
  AWNING,
  SIGN,
  SIGN_TEXT,
  CHEST,
  CRATE,
  FRONT_BIN,
  CRYSTALS,
  MERCHANT,
} from '../data/merchantShop.js'

const CRYSTAL_NAMES = new Set(['crystalCyan', 'crystalMagenta', 'crystalWhite'])

// --- primitive factories (return geometry already baked into local space) --
function bake(geo, pre, euler, post) {
  if (pre) geo.translate(pre[0], pre[1], pre[2])
  if (euler) {
    geo.applyMatrix4(
      new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(euler[0], euler[1], euler[2])),
    )
  }
  if (post) geo.translate(post[0], post[1], post[2])
  return geo
}

const boxGeo = (w, h, d, pos = [0, 0, 0], euler = null) =>
  bake(new THREE.BoxGeometry(w, h, d), null, euler, pos)

const cylGeo = (rt, rb, h, seg, pos = [0, 0, 0], euler = null) =>
  bake(new THREE.CylinderGeometry(rt, rb, h, seg), null, euler, pos)

const coneGeo = (r, h, seg, pos = [0, 0, 0], euler = null) =>
  bake(new THREE.ConeGeometry(r, h, seg), null, euler, pos)

// --- build ---------------------------------------------------------------
export function buildMerchantShop() {
  const root = new THREE.Group()
  root.name = 'merchant_shop'

  const groups = {}
  for (const name of ['Structure', 'Roof_Sign', 'Props', 'Character']) {
    const g = new THREE.Group()
    g.name = name
    groups[name] = g
    root.add(g)
  }

  // key `${group}|${color}` -> list of geometries
  const buckets = new Map()
  const add = (group, color, geo) => {
    const key = `${group}|${color}`
    let list = buckets.get(key)
    if (!list) buckets.set(key, (list = []))
    list.push(geo)
  }

  // ===================================================================
  // Structure
  // ===================================================================
  const B = BASEPLATE
  add('Structure', 'baseGray', boxGeo(B.size, B.height, B.size, [0, B.height / 2, 0]))
  {
    const span = (B.studCount - 1) * B.studPitch
    for (let i = 0; i < B.studCount; i++) {
      for (let j = 0; j < B.studCount; j++) {
        add(
          'Structure',
          'baseGray',
          cylGeo(B.studRadius, B.studRadius, B.studHeight, B.studSegments, [
            -span / 2 + i * B.studPitch,
            B.height + B.studHeight / 2,
            -span / 2 + j * B.studPitch,
          ]),
        )
      }
    }
  }

  // interior floor plate
  add(
    'Structure',
    'baseGray',
    boxGeo(INTERIOR_FLOOR.width, 0.08, INTERIOR_FLOOR.depth, [
      0,
      INTERIOR_FLOOR.top - 0.04,
      INTERIOR_FLOOR.z,
    ]),
  )

  // four notched corner pillars
  const P = PILLARS
  const pillarH = P.top - P.base
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const px = sx * P.inset
      const pz = sz * P.inset
      add('Structure', 'wood', boxGeo(P.section, pillarH, P.section, [px, P.base + pillarH / 2, pz]))
      for (let y = P.base + P.notchStep; y < P.top - 0.15; y += P.notchStep) {
        add(
          'Structure',
          'woodDark',
          boxGeo(P.section + 0.12, P.notchSize, P.section + 0.12, [px, y, pz]),
        )
      }
    }
  }

  // roof frame beams tying the pillar tops
  {
    const y = P.top - 0.15
    const sec = 0.32
    const span = 2 * P.inset + P.section
    add('Structure', 'wood', boxGeo(span, sec, sec, [0, y, P.inset]))
    add('Structure', 'wood', boxGeo(span, sec, sec, [0, y, -P.inset]))
    add('Structure', 'wood', boxGeo(sec, sec, span, [P.inset, y, 0]))
    add('Structure', 'wood', boxGeo(sec, sec, span, [-P.inset, y, 0]))
  }

  // front counter: solid body + overhanging light top shelf
  const C = COUNTER
  add(
    'Structure',
    'wood',
    boxGeo(C.width, C.bodyTop - C.base, C.depth, [0, (C.base + C.bodyTop) / 2, C.z]),
  )
  add(
    'Structure',
    'woodLight',
    boxGeo(C.lipWidth, C.lipThickness, C.lipDepth, [0, C.bodyTop + C.lipThickness / 2, C.z]),
  )

  // low side + back railings (two bars + a few posts each)
  {
    const R = RAILINGS
    const sideLen = 4.9
    const backLen = 2 * R.inset
    for (const sx of [-1, 1]) {
      for (const h of [R.height, R.height * 0.55]) {
        add(
          'Structure',
          'woodDark',
          boxGeo(R.barThickness, R.barThickness, sideLen, [sx * R.inset, h, -0.1]),
        )
      }
      for (const pz of [2.2, 0, -2.3]) {
        add(
          'Structure',
          'woodDark',
          boxGeo(R.barThickness, R.height, R.barThickness, [sx * R.inset, R.height / 2, pz]),
        )
      }
    }
    for (const h of [R.height, R.height * 0.55]) {
      add('Structure', 'woodDark', boxGeo(backLen, R.barThickness, R.barThickness, [0, h, R.backZ]))
    }
    for (const px of [-R.inset, 0, R.inset]) {
      add(
        'Structure',
        'woodDark',
        boxGeo(R.barThickness, R.height, R.barThickness, [px, R.height / 2, R.backZ]),
      )
    }
  }

  // ===================================================================
  // Roof_Sign
  // ===================================================================
  const RF = ROOF
  const slabAngle = Math.atan2(RF.ridgeY - RF.eaveY, RF.eaveZ)
  const slabLen = Math.hypot(RF.eaveZ, RF.ridgeY - RF.eaveY)
  const slabCenterY = (RF.ridgeY + RF.eaveY) / 2
  for (const sign of [1, -1]) {
    const theta = sign * slabAngle
    const cz = (sign * RF.eaveZ) / 2
    add(
      'Roof_Sign',
      'purple',
      boxGeo(2 * RF.overhangX, RF.slabThickness, slabLen, [0, slabCenterY, cz], [theta, 0, 0]),
    )
    // stud dots across the slab
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    for (let r = 0; r < RF.studRows; r++) {
      for (let c = 0; c < RF.studCols; c++) {
        const u = -(slabLen / 2 - 0.55) + (r * (slabLen - 1.1)) / (RF.studRows - 1)
        const x = -(RF.overhangX - 0.6) + (c * 2 * (RF.overhangX - 0.6)) / (RF.studCols - 1)
        const oy = RF.slabThickness / 2 + RF.studHeight / 2
        add(
          'Roof_Sign',
          'purple',
          cylGeo(RF.studRadius, RF.studRadius, RF.studHeight, 8, [
            x,
            slabCenterY + oy * cos - u * sin,
            cz + oy * sin + u * cos,
          ], [theta, 0, 0]),
        )
      }
    }
  }

  // planked triangular gable ends
  {
    const planks = 5
    const dy = (RF.ridgeY - RF.eaveY) / planks
    for (const sx of [-1, 1]) {
      const x = sx * (PILLARS.inset + 0.1)
      for (let k = 0; k < planks; k++) {
        const yc = RF.eaveY + (k + 0.5) * dy
        const frac = (RF.ridgeY - yc) / (RF.ridgeY - RF.eaveY)
        add('Roof_Sign', 'wood', boxGeo(0.16, dy * 0.96, 2 * RF.eaveZ * frac, [x, yc, 0]))
      }
    }
  }

  // front awning: alternating purple / white stripe valance
  {
    const A = AWNING
    const angle = Math.atan2(A.drop, A.reach)
    const len = Math.hypot(A.drop, A.reach)
    const pitch = A.totalWidth / A.stripes
    for (let i = 0; i < A.stripes; i++) {
      add(
        'Roof_Sign',
        i % 2 === 0 ? 'purple' : 'white',
        boxGeo(pitch * 0.92, A.thickness, len, [
          -A.totalWidth / 2 + (i + 0.5) * pitch,
          A.topY - A.drop / 2,
          A.topZ + A.reach / 2,
        ], [angle, 0, 0]),
      )
    }
  }

  // octagonal sign board + stud border + AURA block letters
  {
    const S = SIGN
    // An 8-gon prism laid flat by rotateX so its face normal is +Z, then spun
    // about THAT normal by `spin` (a pure in-plane turn — rotateZ here is the
    // world Z, which after rotateX is the face normal) so a flat edge sits on
    // top. The previous single-euler form baked in a 22.5° yaw and the board
    // faced off to the side.
    const octPrism = (r, thick, spin) => {
      const g = new THREE.CylinderGeometry(r, r, thick, 8)
      g.rotateX(Math.PI / 2)
      g.rotateZ(spin)
      return g
    }

    add('Roof_Sign', 'wood', bake(octPrism(S.radius, S.thickness, S.spin), null, null, [0, S.y, S.z]))
    add(
      'Roof_Sign',
      'woodLight',
      bake(octPrism(S.faceRadius, S.faceThickness, S.spin), null, null, [
        0,
        S.y,
        S.z + S.thickness / 2 - S.faceInset,
      ]),
    )

    // short post tucking the board onto the roof ridge
    add(
      'Roof_Sign',
      'wood',
      boxGeo(1.4, S.y - ROOF.ridgeY + 1.6, 0.34, [0, (S.y + ROOF.ridgeY) / 2 - 0.8, S.z - 0.3]),
    )

    // stud border, ring just inside the rim, studs facing the viewer
    for (let i = 0; i < S.borderStuds; i++) {
      const a = (i / S.borderStuds) * Math.PI * 2 + Math.PI / S.borderStuds
      add(
        'Roof_Sign',
        'wood',
        cylGeo(S.borderStudRadius, S.borderStudRadius, S.borderStudHeight, 10, [
          Math.cos(a) * S.borderRadius,
          S.y + Math.sin(a) * S.borderRadius,
          S.z + S.thickness / 2,
        ], [Math.PI / 2, 0, 0]),
      )
    }

    // "AURA" — bold white block letters, centred on the face, proud of it
    const T = SIGN_TEXT
    const glyphW = 4 * T.cell
    const totalW = T.word.length * glyphW + (T.word.length - 1) * T.gap
    const faceZ = S.z + S.thickness / 2 + T.depth / 2 + T.standoff
    T.word.forEach((letter, gi) => {
      const rows = T.glyphs[letter]
      const x0 = -totalW / 2 + gi * (glyphW + T.gap)
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
          if (!rows[r][c]) continue
          add(
            'Roof_Sign',
            'white',
            boxGeo(T.cell * 0.98, T.cell * 0.98, T.depth, [
              x0 + c * T.cell + T.cell / 2,
              S.y + (2 - r) * T.cell,
              faceZ,
            ]),
          )
        }
      }
    })
  }

  // ===================================================================
  // Props
  // ===================================================================
  // open wooden box helper (floor + 4 walls)
  const openBox = (group, color, cx, cz, baseY, w, d, h, wall) => {
    add(group, color, boxGeo(w, wall, d, [cx, baseY + wall / 2, cz]))
    add(group, color, boxGeo(w, h, wall, [cx, baseY + h / 2, cz + d / 2 - wall / 2]))
    add(group, color, boxGeo(w, h, wall, [cx, baseY + h / 2, cz - d / 2 + wall / 2]))
    add(group, color, boxGeo(wall, h, d, [cx + w / 2 - wall / 2, baseY + h / 2, cz]))
    add(group, color, boxGeo(wall, h, d, [cx - w / 2 + wall / 2, baseY + h / 2, cz]))
  }

  // chest with an open lid
  {
    const H = CHEST
    add('Props', 'wood', boxGeo(H.width, H.height, H.depth, [H.x, H.base + H.height / 2, H.z]))
    add(
      'Props',
      'woodDark',
      boxGeo(H.width + 0.06, 0.1, H.depth + 0.06, [H.x, H.base + H.height * 0.55, H.z]),
    )
    // lid hinged at the rear-top edge, flipped back by lidOpen
    add(
      'Props',
      'wood',
      bake(
        new THREE.BoxGeometry(H.width, H.lidThickness, H.depth),
        [0, H.lidThickness / 2, H.depth / 2],
        [-H.lidOpen, 0, 0],
        [H.x, H.base + H.height, H.z - H.depth / 2],
      ),
    )
  }

  // crate of gold coins
  {
    const K = CRATE
    openBox('Props', 'wood', K.x, K.z, K.base, K.size, K.size, K.height, K.wall)
    for (let i = 0; i < K.coin.count; i++) {
      const a = i * 2.399963 // golden-angle scatter, deterministic
      const rr = 0.06 + 0.28 * ((i % 3) / 2)
      add(
        'Props',
        'gold',
        cylGeo(K.coin.radius, K.coin.radius, K.coin.height, K.coin.segments, [
          K.x + Math.cos(a) * rr,
          K.base + 0.06 + (i % 4) * 0.035,
          K.z + Math.sin(a) * rr,
        ], [0.12 * Math.sin(a), a, 0.1 * Math.cos(a)]),
      )
    }
  }

  // front floor bin
  {
    const F = FRONT_BIN
    openBox('Props', 'wood', 0, F.z, F.base, F.width, F.depth, F.height, F.wall)
  }

  // crystal clusters (faceted cones)
  for (const cluster of CRYSTALS) {
    const [ax, ay, az] = cluster.at
    for (const s of cluster.shards) {
      add(
        'Props',
        s.tint,
        coneGeo(s.r, s.h, 5, [ax + s.x, ay + s.y, az + s.z], [s.tilt, s.x * 3.0, s.tilt * 0.4]),
      )
    }
  }

  // ===================================================================
  // Character — stylized cube merchant, facing +Z
  // ===================================================================
  {
    const M = MERCHANT
    const legTopY = M.floor + M.legs.height
    const torsoTopY = legTopY + M.torso.height
    const headCY = torsoTopY + M.head / 2
    const shoulderY = torsoTopY - 0.05

    add(
      'Character',
      'trouser',
      boxGeo(M.legs.width, M.legs.height, M.legs.depth, [M.x, M.floor + M.legs.height / 2, M.z]),
    )
    add(
      'Character',
      'shirt',
      boxGeo(M.torso.width, M.torso.height, M.torso.depth, [
        M.x,
        legTopY + M.torso.height / 2,
        M.z,
      ]),
    )
    add('Character', 'skin', boxGeo(M.head, M.head, M.head, [M.x, headCY, M.z]))

    // face
    const fz = M.z + M.head / 2 + 0.01
    add('Character', 'faceDark', boxGeo(M.face.eyeSize, M.face.eyeSize, 0.02, [M.x - 0.13, headCY + 0.05, fz]))
    add('Character', 'faceDark', boxGeo(M.face.eyeSize, M.face.eyeSize, 0.02, [M.x + 0.13, headCY + 0.05, fz]))
    add(
      'Character',
      'faceDark',
      boxGeo(M.face.mouthWidth, M.face.mouthHeight, 0.02, [M.x, headCY - 0.12, fz]),
    )

    // left arm straight down
    const lx = M.x - M.torso.width / 2 - M.arm.width / 2
    add(
      'Character',
      'shirt',
      boxGeo(M.arm.width, M.arm.height, M.arm.depth, [lx, shoulderY - M.arm.height / 2, M.z]),
    )
    add('Character', 'skin', boxGeo(M.hand, M.hand, M.hand, [lx, shoulderY - M.arm.height - M.hand / 2 + 0.03, M.z]))

    // right arm swung forward, hand presenting a coin
    const rx = M.x + M.torso.width / 2 + M.arm.width / 2
    add(
      'Character',
      'shirt',
      bake(
        new THREE.BoxGeometry(M.arm.width, M.arm.height, M.arm.depth),
        [0, -M.arm.height / 2, 0],
        [M.rightArmPitch, 0, 0],
        [rx, shoulderY, M.z],
      ),
    )
    const reach = M.arm.height + M.hand / 2
    const handY = shoulderY + reach * Math.cos(M.rightArmPitch)
    const handZ = M.z + reach * -Math.sin(M.rightArmPitch)
    add('Character', 'skin', boxGeo(M.hand, M.hand, M.hand, [rx, handY, handZ]))
    // flat round coin, face toward the customer (+Z)
    add(
      'Character',
      'gold',
      cylGeo(M.coin.radius, M.coin.radius, M.coin.height, M.coin.segments, [
        rx,
        handY + 0.04,
        handZ + M.hand / 2 + 0.04,
      ], [Math.PI / 2, 0, 0]),
    )
  }

  // ===================================================================
  // merge each bucket into one mesh
  // ===================================================================
  for (const [key, geoms] of buckets) {
    const [groupName, colorName] = key.split('|')
    const merged = mergeGeometries(geoms, false)
    for (const g of geoms) g.dispose()
    const isCrystal = CRYSTAL_NAMES.has(colorName)
    const material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(SHOP_COLORS[colorName]),
      ...(isCrystal
        ? { transparent: true, opacity: CRYSTAL_OPACITY, depthWrite: false }
        : {}),
    })
    const mesh = new THREE.Mesh(merged, material)
    mesh.name = `${groupName}_${colorName}`
    mesh.castShadow = false
    mesh.receiveShadow = false
    groups[groupName].add(mesh)
  }

  return {
    root,
    dispose() {
      root.traverse((o) => {
        if (o.isMesh) {
          o.geometry.dispose()
          o.material.dispose()
        }
      })
    },
  }
}
