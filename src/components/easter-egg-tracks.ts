// Track abstraction for the Scalextric easter-egg game.
//
// A `Track` is a closed loop in canvas pixel space. The game advances each
// car by an arc-length `s` along the centerline; `sample(s, lateral)` returns
// the canvas-space position, tangent angle, and a corner flag. `draw(ctx)`
// renders the asphalt, slots, and start/finish line.
//
// `buildSvgTrack` samples an arbitrary SVG path via DOM `getPointAtLength`,
// detects corners by curvature, and caches a Path2D for fast stroking.

// Slot half-width, asphalt stroke, and detail sizes are intentionally
// slim. Real F1 silhouettes have hairpins and chicanes that overlap on
// themselves visually if the road is too thick relative to the canvas —
// a fat oval-shaped stroke would smear adjacent corners into one blob.
// Lane offset of each slot from the centerline — pushed out toward the
// asphalt edges so the two cars run closer to opposite sides of the track.
export const SLOT = 12
const SAMPLE_COUNT = 800
const ROAD_WIDTH = 46

export type Sample = {
  x: number
  y: number
  angle: number
  isCorner: boolean
}

export type Track = {
  id: string
  name: string
  length: number
  sample(s: number, lateral: number): Sample
  draw(ctx: CanvasRenderingContext2D): void
}

export type TrackId = 'spain' | 'monza'

export const TRACK_LIST: { id: TrackId; name: string }[] = [
  { id: 'spain', name: 'Spain' },
  { id: 'monza', name: 'Monza' },
]

export function buildTrack(id: TrackId, canvasW: number, canvasH: number): Track {
  switch (id) {
    case 'spain':
      return buildSvgTrack({
        id,
        name: 'Spain',
        d: SPAIN_PATH_D,
        canvasW,
        canvasH,
        // Threshold is in canvas-pixel inverse-radius. With the bigger
        // canvas, pixel radii grow proportionally, so the threshold needs
        // to grow too — otherwise the same physical corner stops flagging.
        cornerCurvatureThreshold: 1 / 260,
        reverse: true,
        // Slide the start/finish line around the loop (0..1). With reverse
        // applied, ~0.78 lands roughly mid-bottom-straight, slightly left
        // of canvas centre — matching the position circled on the map.
        startOffset: 0.78,
      })
    case 'monza':
      return buildSvgTrack({
        id,
        name: 'Monza',
        d: MONZA_PATH_D,
        canvasW,
        canvasH,
        cornerCurvatureThreshold: 1 / 220,
        // Monza runs the SVG's natural traversal direction (no reverse) —
        // samples[0] is the M-command point at the right-hand end of the
        // main straight, matching Monza's real-world start/finish position.
      })
  }
}

// ────────────────────────── SVG-based ──────────────────────────
function buildSvgTrack(opts: {
  id: TrackId
  name: string
  d: string
  canvasW: number
  canvasH: number
  margin?: number
  cornerCurvatureThreshold?: number  // 1/radius — paths with tighter radius are corners
  reverse?: boolean  // flip travel direction
  startOffset?: number  // 0..1 fraction of total path length where the start/finish line sits
}): Track {
  // `margin` is the visible buffer around the *outside* of the asphalt,
  // not around the centerline — so a value of 0 would let the asphalt edge
  // touch the canvas edge.
  const visualMargin = opts.margin ?? 8
  const margin = visualMargin + ROAD_WIDTH / 2
  const cornerThreshold = opts.cornerCurvatureThreshold ?? 1 / 280

  if (typeof document === 'undefined') {
    throw new Error('SVG tracks require a browser environment')
  }

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', opts.d)

  const totalSrcLen = path.getTotalLength()
  const N = SAMPLE_COUNT

  // Sample raw points in source space
  let rawPoints: { x: number; y: number }[] = []
  for (let i = 0; i < N; i++) {
    const p = path.getPointAtLength((i / N) * totalSrcLen)
    rawPoints.push({ x: p.x, y: p.y })
  }

  // Optionally reverse traversal direction (cars walk through the array in
  // index order, so reversing the array reverses on-track direction).
  if (opts.reverse) {
    rawPoints = rawPoints.slice().reverse()
  }

  // Optionally rotate the array so that a chosen point along the path
  // becomes index 0 — that's where the start/finish line gets drawn and
  // where lap detection wraps.
  const startOffset = ((opts.startOffset ?? 0) % 1 + 1) % 1
  if (startOffset > 0) {
    const shift = Math.floor(startOffset * N) % N
    rawPoints = rawPoints.slice(shift).concat(rawPoints.slice(0, shift))
  }

  // Source-space bbox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of rawPoints) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  const srcW = maxX - minX
  const srcH = maxY - minY
  const availW = opts.canvasW - margin * 2
  const availH = opts.canvasH - margin * 2
  const scale = Math.min(availW / srcW, availH / srcH)
  const offsetX = (opts.canvasW - srcW * scale) / 2 - minX * scale
  const offsetY = (opts.canvasH - srcH * scale) / 2 - minY * scale

  // Scale into canvas space
  const points = rawPoints.map((p) => ({ x: p.x * scale + offsetX, y: p.y * scale + offsetY }))

  // Tangent angles (segment from i to i+1)
  const angles: number[] = []
  for (let i = 0; i < N; i++) {
    const a = points[i]
    const b = points[(i + 1) % N]
    angles.push(Math.atan2(b.y - a.y, b.x - a.x))
  }

  // Cumulative arc length in canvas space
  const cumulative: number[] = [0]
  for (let i = 1; i < N; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy))
  }
  const dxClose = points[0].x - points[N - 1].x
  const dyClose = points[0].y - points[N - 1].y
  const length = cumulative[N - 1] + Math.hypot(dxClose, dyClose)

  // Corner detection: curvature κ = |Δθ| / Δs over a window of W samples.
  // Flag the sample as a corner if κ exceeds the threshold (i.e. local
  // radius is tighter than the threshold's inverse). Then dilate so a
  // narrow corner region maps to a slightly wider grip-loss zone.
  const W = 6
  const dsWindow = (2 * W * length) / N
  const minDeltaAngle = cornerThreshold * dsWindow
  const flagged: boolean[] = new Array(N).fill(false)
  for (let i = 0; i < N; i++) {
    const aPrev = angles[(i - W + N) % N]
    const aNext = angles[(i + W) % N]
    let d = aNext - aPrev
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    if (Math.abs(d) > minDeltaAngle) flagged[i] = true
  }
  const isCornerArr: boolean[] = new Array(N).fill(false)
  const dilate = 5
  for (let i = 0; i < N; i++) {
    if (flagged[i]) {
      for (let k = -dilate; k <= dilate; k++) {
        const j = ((i + k) % N + N) % N
        isCornerArr[j] = true
      }
    }
  }

  const samples: Sample[] = points.map((p, i) => ({
    x: p.x,
    y: p.y,
    angle: angles[i],
    isCorner: isCornerArr[i],
  }))

  function sample(s: number, lateral: number): Sample {
    const sm = ((s % length) + length) % length
    // Binary search the cumulative array for the segment containing `sm`
    let lo = 0
    let hi = N - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cumulative[mid] < sm) lo = mid + 1
      else hi = mid
    }
    const idx = Math.max(0, lo - 1)
    const sa = samples[idx]
    const ox = -Math.sin(sa.angle) * lateral
    const oy = Math.cos(sa.angle) * lateral
    return { x: sa.x + ox, y: sa.y + oy, angle: sa.angle, isCorner: sa.isCorner }
  }

  // Cached Path2D for the centerline asphalt stroke
  const path2d = new Path2D()
  path2d.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < N; i++) path2d.lineTo(points[i].x, points[i].y)
  path2d.closePath()

  function draw(ctx: CanvasRenderingContext2D) {
    // Outer asphalt rim (slightly lighter — gives the track a soft edge highlight)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = ROAD_WIDTH + 4
    ctx.stroke(path2d)

    // Asphalt
    ctx.strokeStyle = '#171717'
    ctx.lineWidth = ROAD_WIDTH
    ctx.stroke(path2d)

    // Inner asphalt sheen (very subtle inner band)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)'
    ctx.lineWidth = ROAD_WIDTH - 6
    ctx.stroke(path2d)

    // Slot lines (the two car-slots in classic Scalextric track)
    ctx.strokeStyle = '#070707'
    ctx.lineWidth = 1.4
    for (const lat of [SLOT, -SLOT]) {
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const sa = samples[i % N]
        const ox = -Math.sin(sa.angle) * lat
        const oy = Math.cos(sa.angle) * lat
        const x = sa.x + ox
        const y = sa.y + oy
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    // White dashed centerline between the slots
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.lineWidth = 0.9
    ctx.setLineDash([6, 8])
    ctx.beginPath()
    for (let i = 0; i <= N; i++) {
      const sa = samples[i % N]
      if (i === 0) ctx.moveTo(sa.x, sa.y)
      else ctx.lineTo(sa.x, sa.y)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])

    // Start/finish line
    drawStartLine(ctx, samples[0])
  }

  return { id: opts.id, name: opts.name, length, sample, draw }
}

// Chequered start/finish line, perpendicular to the track at sample `s`.
// Draws white border bars on either side and a 4-row × 8-col chequered grid
// flush across the asphalt.
function drawStartLine(ctx: CanvasRenderingContext2D, s: Sample) {
  ctx.save()
  ctx.translate(s.x, s.y)
  // Rotate so +y of the local frame runs across the track
  ctx.rotate(s.angle + Math.PI / 2)

  const halfRoad = ROAD_WIDTH / 2 - 1
  const cols = 8
  const rows = 4
  const tileW = (halfRoad * 2) / cols
  const tileH = 3.5
  const totalH = tileH * rows

  // Front white bar
  ctx.fillStyle = '#fff'
  ctx.fillRect(-halfRoad - 0.5, -totalH / 2 - 2.5, halfRoad * 2 + 1, 1.6)
  // Rear white bar
  ctx.fillRect(-halfRoad - 0.5, totalH / 2 + 0.9, halfRoad * 2 + 1, 1.6)

  // Chequered grid
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -halfRoad + c * tileW
      const y = -totalH / 2 + r * tileH
      ctx.fillStyle = (r + c) % 2 === 0 ? '#f5f5f5' : '#0a0a0a'
      ctx.fillRect(x, y, tileW + 0.5, tileH + 0.5)
    }
  }

  ctx.restore()
}

// ────────────────────────── Path data ──────────────────────────
// Inspired by F1 circuits but simplified to single closed silhouettes.
// These are the path `d` strings from the source SVG files.

const SPAIN_PATH_D =
  'M559.976 9.33579C298.825 16.3595 129.003 160.367 56.9725 292.75C24.678 350.554 7.28015 415.488 6.3606 481.69C6.28704 541.322 22.5814 599.828 53.4782 650.847C134.152 782.972 459.598 976.73 459.598 976.73C496.675 999.198 527.167 1014.86 551.553 1027.55C631.701 1068.77 653.218 1079.81 667.821 1201.6C686.506 1356.82 709.863 1415.47 882.259 1415.36L4376.09 1413.34C4535.98 1412.2 4650.37 1384.15 4685.06 1291.73C4701.2 1248.65 4696.05 986.545 4685.42 770.984C4677.41 609.083 4674.61 424.916 4655.7 391.964C4594.28 285.006 4058.05 137.622 4065 130.139C3913.2 69.5702 3790.13 134.295 3751.43 226.007C3722.56 294.405 3741.76 384.977 3849.86 433.076C3932.73 469.849 4027.3 509.601 4096.52 536.372C4124.36 547.172 4308.23 603.24 4352.29 702.586C4391.17 790.276 4373.07 1027.7 4345.85 1050.06C4305.72 1082.93 4170.15 1089.66 4088.43 1042.08C3885.36 923.814 3622.66 759.107 3368.57 599.953C3095.46 428.627 2837.07 266.825 2718.41 204.715C2480.54 80.5285 2378.77 37.9085 2233.85 233.288C2099.85 413.844 2031.22 507.726 1965.6 598.518L1879.09 717.259C1836.27 775.728 1842.3 854.68 1847.53 924.328C1852.57 990.226 1857.31 1052.48 1822.63 1090.91C1799.53 1116.43 1760.94 1129.56 1704.11 1130.88L1607.19 1133.6C1378.3 1140.85 1263.1 1144.31 1141.02 1072.08C1028.43 1005.89 922.278 947.753 828.705 896.565C746.755 851.738 676.281 813.237 623.168 780.84C582.119 755.797 562.735 692.584 578.146 634.703C599.443 553.802 679.297 503.717 791.482 500.297C987.529 494.377 1082.24 493.494 1151.21 492.943C1197.74 492.502 1234.45 492.171 1283.99 490.479C1460.18 484.411 1623.41 303.672 1621.06 168.126C1619.99 108.59 1585.82 8.67386 1365.57 8.78418C1182.84 8.78418 1073.23 7.90162 985.249 7.16616C850.811 6.13651 769.56 5.43783 559.976 9.33579Z'

const MONZA_PATH_D =
  'M1133.85 652.162L558.388 651.792C558.388 651.792 516.248 651.662 501.718 653.702C475.718 657.332 454.468 663.322 443.478 643.072C416.218 592.922 381.218 665.572 338.968 665.322C271.658 667.652 251.108 666.322 201.718 637.662C145.858 605.252 137.458 518.722 137.458 518.722L108.458 315.122C105.898 300.882 84.558 300.882 81.058 292.522C68.677 263.172 14.777 112.632 14.777 112.632C14.777 112.632 -0.0229733 80.0524 9.62703 54.4404C19.277 28.8364 41.847 23.2664 60.117 19.5364C64.117 18.6964 119.118 11.3664 138.638 9.08641C142.248 8.66641 178.208 -1.24359 204.048 19.5364C228.228 38.8704 292.118 188.322 333.098 230.632C377.788 276.762 598.428 462.892 598.428 462.892C598.428 462.892 617.048 478.892 641.748 471.412C671.748 462.292 676.748 485.412 693.748 494.102C703.548 499.172 730.748 497.872 730.748 497.872H1211.44C1211.44 497.872 1238.44 496.642 1257.99 508.302C1270.55 515.269 1278.15 528.693 1277.66 543.052C1277.66 585.942 1247.29 607.682 1216.12 626.842C1180.58 648.782 1133.85 652.162 1133.85 652.162Z'
