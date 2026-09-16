import { useEffect, useMemo } from 'react'
import { Text } from '@react-three/drei'
import { MATERIAL_PBR } from '../data/materials.js'
import { makeStudTexture } from '../systems/studTexture.js'
import {
  LEADERBOARD_TRANSFORM,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BOARD_THICKNESS,
  BOARD_BOTTOM,
  BOARD_TOP,
  BOARD_CENTER_Y,
  LEG_HEIGHT,
  LEG_SECTION,
  LEG_INSET,
  PANEL_INSET_X,
  PANEL_THICKNESS,
  PANEL_WIDTH,
  PANEL_HEIGHT,
  PANEL_CENTER_Y,
  BOARD_STUD_CELL,
  CORNER_STUD_RADIUS,
  CORNER_STUD_HEIGHT,
  CORNER_STUD_INSET,
  SIDE_TAB_WIDTH,
  SIDE_TAB_HEIGHT,
  SIDE_TAB_DEPTH,
  LEADERBOARD_COLORS,
  LEADERBOARD_TITLE,
  TITLE_FONT_SIZE,
  TITLE_Y,
  LEADERBOARD_ROWS,
  ENTRY_NAME_COLOR,
  ROW_FONT_SIZE,
  ROW_HEIGHT,
  ROW_YS,
  RANK_TEXT_X,
  NAME_TEXT_X,
  SCORE_TEXT_X,
  LEADERBOARD_TIMER_TEXT,
  TIMER_FONT_SIZE,
  TIMER_Y,
} from '../data/leaderboardBoard.js'

// Everything below is local to the mount group in this file's default export:
// origin at ground level, centred on X, +Z the readable front face — same
// convention data/leaderboardBoard.js documents. Every size/position number
// (BOARD_HEIGHT, PANEL_CENTER_Y, TITLE_Y, ROW_YS, TIMER_Y, ...) is computed
// there, not here, so editing LEADERBOARD_ENTRIES never needs a matching
// change in this file.
const FRAME_FRONT_Z = BOARD_THICKNESS / 2
const PANEL_FRONT_Z = FRAME_FRONT_Z + PANEL_THICKNESS / 2
const TEXT_Z = PANEL_FRONT_Z + PANEL_THICKNESS / 2 + 0.01

// The brown frame board: a stud-textured checker on its front face (systems/
// studTexture.js — same "Lego brick" material as Ground.jsx/
// PvpCenterPentagon.jsx, just recolored), plain wood color on every other
// face. BoxGeometry's six material groups run [+x, -x, +y, -y, +z, -z], so
// index 4 is the front (+Z) face this board reads from.
function FrameBoard() {
  const studTexture = useMemo(
    () =>
      makeStudTexture({
        light: LEADERBOARD_COLORS.frame,
        dark: LEADERBOARD_COLORS.frame,
        repeatX: BOARD_WIDTH / (BOARD_STUD_CELL * 2),
        repeatY: BOARD_HEIGHT / (BOARD_STUD_CELL * 2),
        studShadow: false,
        plateBevel: false,
      }),
    [],
  )
  useEffect(() => () => studTexture.dispose(), [studTexture])

  return (
    <mesh position={[0, BOARD_CENTER_Y, 0]} castShadow receiveShadow>
      <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_THICKNESS]} />
      <meshStandardMaterial attach="material-0" color={LEADERBOARD_COLORS.frame} {...MATERIAL_PBR.WOOD} />
      <meshStandardMaterial attach="material-1" color={LEADERBOARD_COLORS.frame} {...MATERIAL_PBR.WOOD} />
      <meshStandardMaterial attach="material-2" color={LEADERBOARD_COLORS.frame} {...MATERIAL_PBR.WOOD} />
      <meshStandardMaterial attach="material-3" color={LEADERBOARD_COLORS.frame} {...MATERIAL_PBR.WOOD} />
      <meshStandardMaterial attach="material-4" map={studTexture} {...MATERIAL_PBR.WOOD} />
      <meshStandardMaterial attach="material-5" color={LEADERBOARD_COLORS.frame} {...MATERIAL_PBR.WOOD} />
    </mesh>
  )
}

// Two square support posts from the ground up to the frame's own bottom
// edge — same "physical object needs a base" idea as data/podiumStage.js's
// sign posts, just standalone here rather than resting on a tier.
function Legs() {
  const x = BOARD_WIDTH / 2 - LEG_INSET
  return (
    <>
      {[-x, x].map((lx) => (
        <mesh key={lx} position={[lx, LEG_HEIGHT / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[LEG_SECTION, LEG_HEIGHT, LEG_SECTION]} />
          <meshStandardMaterial color={LEADERBOARD_COLORS.frame} {...MATERIAL_PBR.WOOD} />
        </mesh>
      ))}
    </>
  )
}

// The two decorative knob studs above the frame's top edge and the flat
// side tabs at mid-height — the reference image's corner lugs/notches.
// Purely cosmetic, no collider (same precedent as data/pvpCenterPentagon.js's
// summit shell/disc: renders, stays walk-through).
function Trim() {
  const studX = BOARD_WIDTH / 2 - CORNER_STUD_INSET
  const tabX = BOARD_WIDTH / 2 + SIDE_TAB_WIDTH / 2
  return (
    <>
      {[-studX, studX].map((sx) => (
        <mesh key={sx} position={[sx, BOARD_TOP + CORNER_STUD_HEIGHT / 2, 0]} castShadow>
          <cylinderGeometry args={[CORNER_STUD_RADIUS, CORNER_STUD_RADIUS, CORNER_STUD_HEIGHT, 16]} />
          <meshStandardMaterial color={LEADERBOARD_COLORS.frame} {...MATERIAL_PBR.WOOD} />
        </mesh>
      ))}
      {[-tabX, tabX].map((sx) => (
        <mesh key={sx} position={[sx, BOARD_CENTER_Y, 0]} castShadow>
          <boxGeometry args={[SIDE_TAB_WIDTH, SIDE_TAB_HEIGHT, SIDE_TAB_DEPTH]} />
          <meshStandardMaterial color={LEADERBOARD_COLORS.frame} {...MATERIAL_PBR.WOOD} />
        </mesh>
      ))}
    </>
  )
}

// The dark readable panel, proud of the frame's front face, plus faint
// alternating row-banding stripes behind the text (the reference image's
// subtle scroll shading) — one thin plane per row, positioned at data/
// leaderboardBoard.js's own ROW_YS, so it tracks LEADERBOARD_ENTRIES' length
// automatically.
function Panel() {
  return (
    <>
      <mesh position={[0, PANEL_CENTER_Y, PANEL_FRONT_Z]}>
        <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_THICKNESS]} />
        <meshStandardMaterial color={LEADERBOARD_COLORS.panel} {...MATERIAL_PBR.WOOD} />
      </mesh>
      {ROW_YS.map((y, i) => (
        <mesh key={i} position={[0, y, PANEL_FRONT_Z + PANEL_THICKNESS / 2 + 0.002]}>
          <planeGeometry args={[PANEL_WIDTH - 0.1, ROW_HEIGHT * 0.92]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? LEADERBOARD_COLORS.panelStripeA : LEADERBOARD_COLORS.panelStripeB}
            {...MATERIAL_PBR.WOOD}
          />
        </mesh>
      ))}
    </>
  )
}

// One row: rank (left, its own color), name (centre-left, white), score
// (right, its own color) — same three-text-elements-per-row idea as
// GlowFloorPanelLabel.jsx's title/caption pair, just three columns instead
// of one stacked pair. Not billboarded: this is a physical board mounted at
// a fixed yaw (data/leaderboardBoard.js LEADERBOARD_TRANSFORM), same
// static-signage convention as data/podiumStage.js's own board.
function Row({ entry }) {
  return (
    <group position={[0, entry.y, TEXT_Z]}>
      <Text
        position={[RANK_TEXT_X, 0, 0]}
        fontSize={ROW_FONT_SIZE}
        fontWeight="bold"
        color={entry.rankColor}
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="left"
        anchorY="middle"
      >
        {`#${entry.rank}`}
      </Text>
      <Text
        position={[NAME_TEXT_X, 0, 0]}
        fontSize={entry.nameFontSize}
        fontWeight="bold"
        color={ENTRY_NAME_COLOR}
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="left"
        anchorY="middle"
        whiteSpace="nowrap"
      >
        {entry.name}
      </Text>
      <Text
        position={[SCORE_TEXT_X, 0, 0]}
        fontSize={ROW_FONT_SIZE}
        fontWeight="bold"
        color={entry.scoreColor}
        outlineWidth={0.02}
        outlineColor="#000000"
        anchorX="right"
        anchorY="middle"
      >
        {entry.score}
      </Text>
    </group>
  )
}

// The footer timer strip: a small dark chip with two bright glow bars either
// side of the label (the reference image's countdown strip). Static text
// (data/leaderboardBoard.js LEADERBOARD_TIMER_TEXT), not a live countdown.
function TimerChip() {
  const chipWidth = PANEL_WIDTH * 0.62
  const chipHeight = TIMER_FONT_SIZE * 1.8
  const barWidth = PANEL_WIDTH * 0.14
  const barX = chipWidth / 2 + 0.1 + barWidth / 2
  return (
    <group position={[0, TIMER_Y, 0]}>
      <mesh position={[0, 0, TEXT_Z - 0.004]}>
        <planeGeometry args={[chipWidth, chipHeight]} />
        <meshStandardMaterial color={LEADERBOARD_COLORS.timerChip} {...MATERIAL_PBR.WOOD} />
      </mesh>
      {[-barX, barX].map((bx) => (
        <mesh key={bx} position={[bx, 0, TEXT_Z - 0.002]}>
          <planeGeometry args={[barWidth, chipHeight * 0.35]} />
          <meshBasicMaterial color={LEADERBOARD_COLORS.timerGlow} toneMapped={false} />
        </mesh>
      ))}
      <Text
        position={[0, 0, TEXT_Z]}
        fontSize={TIMER_FONT_SIZE}
        fontWeight="bold"
        color={LEADERBOARD_COLORS.timerGlow}
        anchorX="center"
        anchorY="middle"
      >
        {LEADERBOARD_TIMER_TEXT}
      </Text>
    </group>
  )
}

// A freestanding Lego-brick-styled scoreboard: a stud-textured brown frame
// (FrameBoard) on two support posts (Legs), decorative corner studs/side
// tabs (Trim), a dark inset panel with faint row banding (Panel), a
// customizable title + ranked player/score list (Row, one per data/
// leaderboardBoard.js LEADERBOARD_ENTRIES entry), and a static footer timer
// chip (TimerChip). Everything text/score-related is data-driven from
// data/leaderboardBoard.js — LEADERBOARD_TITLE and LEADERBOARD_ENTRIES are
// the two knobs meant to be edited without touching this file, and every
// size below them (BOARD_HEIGHT down to ROW_YS/TIMER_Y) recomputes to fit.
export default function LeaderboardBoard() {
  return (
    <group
      position={[LEADERBOARD_TRANSFORM.x, LEADERBOARD_TRANSFORM.y, LEADERBOARD_TRANSFORM.z]}
      rotation={[0, LEADERBOARD_TRANSFORM.yaw, 0]}
    >
      <FrameBoard />
      <Legs />
      <Trim />
      <Panel />
      <Text
        position={[0, TITLE_Y, TEXT_Z]}
        fontSize={TITLE_FONT_SIZE}
        fontWeight="bold"
        color={LEADERBOARD_COLORS.titleColor}
        outlineWidth={0.045}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
        textAlign="center"
        maxWidth={PANEL_WIDTH - 0.4}
        whiteSpace="normal"
      >
        {LEADERBOARD_TITLE}
      </Text>
      {LEADERBOARD_ROWS.map((entry) => (
        <Row key={entry.rank} entry={entry} />
      ))}
      <TimerChip />
    </group>
  )
}
