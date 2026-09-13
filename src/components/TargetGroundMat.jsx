import { useEffect, useMemo } from 'react'
import { makeTargetGroundMatTexture } from '../systems/targetGroundMatTexture.js'
import {
  TARGET_GROUND_MAT_WIDTH,
  TARGET_GROUND_MAT_DEPTH,
  TARGET_GROUND_MAT_THICKNESS,
  TARGET_GROUND_MAT_Y_OFFSET,
  TARGET_GROUND_MAT_Z_OFFSET,
  TARGET_GROUND_MAT_COLORS,
} from '../data/targetGroundMat.js'

// One ground mat, under one target — a code-generated checker plate (studs
// over a 2-tone checkerboard, solid border) mounted by TargetGroundMats.jsx
// once per data/targets.js TARGET_PROPS entry. Geometry (size/thickness/
// offsets/grid) is shared by every instance (data/targetGroundMat.js); only
// the palette varies, looked up here by `id` from that same file's
// TARGET_GROUND_MAT_COLORS so each target can be recolored independently
// without touching any other target or the shared size/position.
//
// Unlit on purpose (MeshBasicMaterial, not Lambert): the retro
// voxel/baseplate look this is going for reads as flat, uniformly bright
// "digital plastic" with zero shading, specular or emissive response to
// the scene's lights — the stud bevel highlight/shadow is faked entirely
// in the texture (systems/targetGroundMatTexture.js) rather than coming
// from real lighting.
export default function TargetGroundMat({ id, position }) {
  const colors = TARGET_GROUND_MAT_COLORS[id]
  const texture = useMemo(() => makeTargetGroundMatTexture(colors), [colors])
  // three.js does not GC GPU memory (Tech.md §7).
  useEffect(() => () => texture.dispose(), [texture])

  if (!colors) return null
  const [x, y, z] = position
  // BoxGeometry centres on its own origin, so lifting the *box* by half its
  // own thickness on top of Y_OFFSET keeps the TOP face — the one carrying
  // the checker texture — exactly where a flat plane would have sat.
  const centerY = y + TARGET_GROUND_MAT_Y_OFFSET + TARGET_GROUND_MAT_THICKNESS / 2

  return (
    <mesh position={[x, centerY, z + TARGET_GROUND_MAT_Z_OFFSET]}>
      <boxGeometry
        args={[TARGET_GROUND_MAT_WIDTH, TARGET_GROUND_MAT_THICKNESS, TARGET_GROUND_MAT_DEPTH]}
      />
      {/* BoxGeometry face-group order: +X, -X, +Y (top), -Y (bottom), +Z, -Z
          — only the top gets the checker map; the 4 edges + underside are a
          flat border-color fill, which is what makes them read as an
          actual raised-slab edge rather than a floating decal. Basic, not
          Lambert, on every face: unlit flat color, no shading response. */}
      <meshBasicMaterial attach="material-0" color={colors.border} />
      <meshBasicMaterial attach="material-1" color={colors.border} />
      <meshBasicMaterial attach="material-2" map={texture} />
      <meshBasicMaterial attach="material-3" color={colors.border} />
      <meshBasicMaterial attach="material-4" color={colors.border} />
      <meshBasicMaterial attach="material-5" color={colors.border} />
    </mesh>
  )
}
