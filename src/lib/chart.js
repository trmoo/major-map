/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 그래프 — 외부 라이브러리를 쓰지 않고 SVG 로 직접 그린다.
// 교실 TV·전자칠판에서 보이도록 글자와 선을 크게 잡았다.
//
// 모두 SVG 요소 하나를 돌려준다. 부모 너비에 맞춰 늘어나고,
// viewBox 를 쓰므로 화면 크기가 바뀌어도 다시 그릴 필요가 없다.

const NS = 'http://www.w3.org/2000/svg'

function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue
    el.setAttribute(k, v)
  }
  for (const c of kids.flat()) if (c) el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  return el
}

function svg(w, h, extra = {}) {
  return s('svg', {
    viewBox: `0 0 ${w} ${h}`, width: '100%', class: 'chart',
    preserveAspectRatio: 'xMidYMid meet', role: 'img', ...extra,
  })
}

const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)']

/**
 * 막대그래프
 * @param {Array<{이름, 값, 값2?, 색?}>} data
 * @param {object} opt {제목, 이름1, 이름2, 단위, 세로, 최대}
 */
export function bars(data, opt = {}) {
  const n = data.length
  if (!n) return svg(10, 10)
  const W = 900, padL = 120, padR = 40, padT = opt.제목 ? 46 : 20, padB = 44
  const rowH = opt.얇게 ? 30 : 38
  const H = padT + padB + n * rowH
  const el = svg(W, H)
  const max = opt.최대 ?? Math.max(1, ...data.map((d) => Math.max(d.값 || 0, d.값2 || 0)))
  const barW = W - padL - padR
  const two = data.some((d) => d.값2 !== undefined && d.값2 !== null)

  if (opt.제목) el.append(s('text', { x: 12, y: 26, class: 'ch-title' }, opt.제목))

  data.forEach((d, i) => {
    const y = padT + i * rowH
    el.append(s('text', { x: padL - 10, y: y + rowH / 2 + 5, class: 'ch-label', 'text-anchor': 'end' },
      d.이름))
    const h1 = two ? rowH * 0.34 : rowH * 0.55
    const w1 = Math.max(0, ((d.값 || 0) / max) * barW)
    el.append(s('rect', {
      x: padL, y: y + (two ? 3 : (rowH - h1) / 2), width: w1, height: h1, rx: 3,
      fill: d.색 || COLORS[0], class: 'ch-bar',
    }))
    el.append(s('text', {
      x: padL + w1 + 8, y: y + (two ? 3 + h1 - 3 : rowH / 2 + 5), class: 'ch-val',
    }, opt.값글 ? opt.값글(d.값, d) : `${d.값 ?? 0}${opt.단위 || ''}`))
    if (two) {
      const w2 = Math.max(0, ((d.값2 || 0) / max) * barW)
      el.append(s('rect', {
        x: padL, y: y + rowH * 0.5, width: w2, height: h1, rx: 3,
        fill: d.색2 || COLORS[1], class: 'ch-bar',
      }))
      el.append(s('text', {
        x: padL + w2 + 8, y: y + rowH * 0.5 + h1 - 3, class: 'ch-val',
      }, opt.값글2 ? opt.값글2(d.값2, d) : `${d.값2 ?? 0}${opt.단위 || ''}`))
    }
  })

  if (two && (opt.이름1 || opt.이름2)) {
    const ly = H - 14
    el.append(s('rect', { x: padL, y: ly - 11, width: 14, height: 12, rx: 2, fill: COLORS[0] }))
    el.append(s('text', { x: padL + 20, y: ly, class: 'ch-legend' }, opt.이름1 || '값1'))
    el.append(s('rect', { x: padL + 110, y: ly - 11, width: 14, height: 12, rx: 2, fill: COLORS[1] }))
    el.append(s('text', { x: padL + 130, y: ly, class: 'ch-legend' }, opt.이름2 || '값2'))
  }
  return el
}

/**
 * 꺾은선 — 여러 줄을 겹쳐 그린다
 * @param {Array<{이름, 점:Array<[x,y]>, 색?}>} series
 * @param {object} opt {제목, x축, y축, xMin,xMax,yMin,yMax, y뒤집기}
 */
export function lines(series, opt = {}) {
  const W = 900, H = opt.높이 || 380
  const padL = 66, padR = 24, padT = opt.제목 ? 46 : 20, padB = 56
  const el = svg(W, H)
  const all = series.flatMap((x) => x.점)
  if (!all.length) return el
  const xs = all.map((p) => p[0]), ys = all.map((p) => p[1])
  const xMin = opt.xMin ?? Math.min(...xs), xMax = opt.xMax ?? Math.max(...xs)
  const yMin = opt.yMin ?? Math.min(...ys), yMax = opt.yMax ?? Math.max(...ys)
  const X = (v) => padL + ((v - xMin) / (xMax - xMin || 1)) * (W - padL - padR)
  const Y = (v) => opt.y뒤집기
    ? padT + ((v - yMin) / (yMax - yMin || 1)) * (H - padT - padB)
    : H - padB - ((v - yMin) / (yMax - yMin || 1)) * (H - padT - padB)

  if (opt.제목) el.append(s('text', { x: 12, y: 26, class: 'ch-title' }, opt.제목))

  // 눈금
  for (let i = 0; i <= 4; i++) {
    const v = yMin + ((yMax - yMin) * i) / 4
    el.append(s('line', { x1: padL, y1: Y(v), x2: W - padR, y2: Y(v), class: 'ch-grid' }))
    el.append(s('text', { x: padL - 8, y: Y(v) + 5, class: 'ch-tick', 'text-anchor': 'end' },
      opt.y글 ? opt.y글(v) : Math.round(v * 100) / 100))
  }
  for (let i = 0; i <= 5; i++) {
    const v = xMin + ((xMax - xMin) * i) / 5
    el.append(s('text', { x: X(v), y: H - padB + 24, class: 'ch-tick', 'text-anchor': 'middle' },
      opt.x글 ? opt.x글(v) : Math.round(v * 100) / 100))
  }
  el.append(s('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, class: 'ch-axis' }))
  el.append(s('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, class: 'ch-axis' }))

  series.forEach((se, i) => {
    const color = se.색 || COLORS[i % COLORS.length]
    const d = se.점.map((p, j) => `${j ? 'L' : 'M'}${X(p[0])},${Y(p[1])}`).join(' ')
    el.append(s('path', { d, fill: 'none', stroke: color, 'stroke-width': 3, class: 'ch-line' }))
    if (se.점.length <= 40) {
      for (const p of se.점) el.append(s('circle', { cx: X(p[0]), cy: Y(p[1]), r: 4, fill: color }))
    }
  })

  if (series.length > 1) {
    series.forEach((se, i) => {
      const x = padL + i * 150
      el.append(s('rect', { x, y: H - 18, width: 14, height: 12, rx: 2, fill: se.색 || COLORS[i % COLORS.length] }))
      el.append(s('text', { x: x + 20, y: H - 7, class: 'ch-legend' }, se.이름))
    })
  }
  if (opt.x축) el.append(s('text', { x: W / 2, y: H - 34, class: 'ch-axis-label', 'text-anchor': 'middle' }, opt.x축))
  if (opt.y축) el.append(s('text', { x: 16, y: padT - 6, class: 'ch-axis-label' }, opt.y축))
  return el
}

/**
 * 점 그래프 — 입결 흩뿌리기에 쓴다
 * @param {Array<{x, y, 색?, 이름?, 크기?}>} points
 */
export function scatter(points, opt = {}) {
  const W = 900, H = opt.높이 || 400
  const padL = 66, padR = 24, padT = opt.제목 ? 46 : 20, padB = 56
  const el = svg(W, H)
  if (!points.length) return el
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y)
  const xMin = opt.xMin ?? Math.min(...xs), xMax = opt.xMax ?? Math.max(...xs)
  const yMin = opt.yMin ?? Math.min(...ys), yMax = opt.yMax ?? Math.max(...ys)
  const X = (v) => padL + ((v - xMin) / (xMax - xMin || 1)) * (W - padL - padR)
  const Y = (v) => H - padB - ((v - yMin) / (yMax - yMin || 1)) * (H - padT - padB)

  if (opt.제목) el.append(s('text', { x: 12, y: 26, class: 'ch-title' }, opt.제목))
  for (let i = 0; i <= 4; i++) {
    const v = yMin + ((yMax - yMin) * i) / 4
    el.append(s('line', { x1: padL, y1: Y(v), x2: W - padR, y2: Y(v), class: 'ch-grid' }))
    el.append(s('text', { x: padL - 8, y: Y(v) + 5, class: 'ch-tick', 'text-anchor': 'end' },
      opt.y글 ? opt.y글(v) : Math.round(v * 10) / 10))
  }
  for (let i = 0; i <= 5; i++) {
    const v = xMin + ((xMax - xMin) * i) / 5
    el.append(s('text', { x: X(v), y: H - padB + 24, class: 'ch-tick', 'text-anchor': 'middle' },
      opt.x글 ? opt.x글(v) : Math.round(v * 10) / 10))
  }
  el.append(s('line', { x1: padL, y1: H - padB, x2: W - padR, y2: H - padB, class: 'ch-axis' }))
  el.append(s('line', { x1: padL, y1: padT, x2: padL, y2: H - padB, class: 'ch-axis' }))

  if (opt.기준선 !== undefined) {
    el.append(s('line', {
      x1: X(opt.기준선), y1: padT, x2: X(opt.기준선), y2: H - padB,
      class: 'ch-mark', stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-dasharray': '6 4',
    }))
    if (opt.기준글) el.append(s('text', { x: X(opt.기준선) + 6, y: padT + 16, class: 'ch-mark-label' }, opt.기준글))
  }

  for (const p of points) {
    const c = s('circle', {
      cx: X(p.x), cy: Y(p.y), r: p.크기 || 5,
      fill: p.색 || COLORS[0], opacity: p.투명 ?? 0.72, class: 'ch-dot',
    })
    if (p.이름) c.append(s('title', {}, p.이름))
    el.append(c)
  }
  if (opt.x축) el.append(s('text', { x: W / 2, y: H - 30, class: 'ch-axis-label', 'text-anchor': 'middle' }, opt.x축))
  if (opt.y축) el.append(s('text', { x: 16, y: padT - 6, class: 'ch-axis-label' }, opt.y축))
  return el
}

/** 가로 100% 짜리 비율 막대 하나 */
export function ratioBar(parts, opt = {}) {
  const W = 900, H = 56
  const el = svg(W, H)
  const total = parts.reduce((a, p) => a + (p.값 || 0), 0) || 1
  let x = 0
  parts.forEach((p, i) => {
    const w = (p.값 / total) * W
    el.append(s('rect', { x, y: 8, width: Math.max(0, w - 1), height: 26, rx: 3,
      fill: p.색 || COLORS[i % COLORS.length] }))
    if (w > 60) {
      el.append(s('text', { x: x + w / 2, y: 26, class: 'ch-inbar', 'text-anchor': 'middle' },
        opt.값글 ? opt.값글(p) : p.이름))
    }
    el.append(s('text', { x: x + 2, y: 50, class: 'ch-tick' }, w > 60 ? `${Math.round((p.값 / total) * 100)}%` : ''))
    x += w
  })
  return el
}

export { COLORS }
