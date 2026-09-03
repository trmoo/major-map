/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 화면 부품. 모든 탭이 같은 모양을 쓰도록 여기 모아 둔다.
//
// ⚠ 고르기가 필요하면 choicePicker 를 쓸 것.
//   pillGroup 은 첫 항목이 기본으로 골라져 있어, 학생이 안 고르고 넘어가도
//   골랐다고 처리된다. 채점·판정이 붙는 자리에는 쓰지 말 것.

import { h, mono, fmt, comma, redraw } from './ui.js'

// ── 상자 ───────────────────────────────────────────────────
export function card(title, ...body) {
  return h('section.card',
    title ? h('h3.card-title', title) : null,
    h('div.card-body', ...body))
}

export function panel(...body) { return h('div.panel', ...body) }

export function row(...body) { return h('div.row', ...body) }

export function cols(n, ...body) { return h(`div.cols.cols-${n}`, ...body) }

/** 큰 숫자 카드 */
export function stat(label, value, note) {
  return h('div.stat',
    h('div.stat-label', label),
    h('div.stat-value', value),
    note ? h('div.stat-note', note) : null)
}

// ── 알림 상자 ──────────────────────────────────────────────
export const note = (...body) => h('div.note', ...body)
export const warn = (...body) => h('div.note.note-warn', ...body)
export const caution = (...body) => h('div.note.note-caution', ...body)
export const tip = (...body) => h('div.note.note-tip', ...body)

/**
 * 출처 상자 — 남의 자료를 쓸 때는 반드시 붙인다.
 * 화면마다 「이 숫자가 어디서 왔는가」를 밝히는 것이 이 앱의 원칙이다.
 */
export function source(name, text, warnText) {
  return h('details.src', { 'data-k': `src-${name}` },
    h('summary', `📚 자료 출처 — ${name}`),
    h('div.src-body',
      h('p', text),
      warnText ? h('p.src-warn', `⚠ ${warnText}`) : null))
}

/** 추정값임을 밝히는 노란 상자. 환산·예측을 보여 주는 화면에는 반드시 넣는다. */
export function estimate(...body) {
  return h('div.note.note-estimate',
    h('b', '⚠ 이 값은 추정입니다. '), ...body)
}

// ── 표 ─────────────────────────────────────────────────────
/**
 * table(['머리1','머리2'], [[셀,셀],[셀,셀]], {정렬:['left','right'], 좁게:true})
 * 셀은 글자여도 되고 요소여도 된다.
 */
export function table(head, rows, opt = {}) {
  const al = opt.정렬 || []
  const wrap = h('div.tw' + (opt.높이 ? '.tw-scroll' : ''))
  if (opt.높이) wrap.style.maxHeight = opt.높이
  const tb = h('table.tbl' + (opt.좁게 ? '.tbl-tight' : ''))
  if (head && head.length) {
    tb.append(h('thead', h('tr', ...head.map((x, i) =>
      h('th', { style: { textAlign: al[i] || 'left' } }, x)))))
  }
  tb.append(h('tbody', ...rows.map((r, ri) =>
    h('tr' + (opt.강조 && opt.강조(r, ri) ? '.hl' : ''), ...r.map((c, i) =>
      h('td', { style: { textAlign: al[i] || 'left' } }, c))))))
  wrap.append(tb)
  return wrap
}

// ── 고르기 ─────────────────────────────────────────────────
/**
 * 알약 단추 묶음. 화면 상태를 바꾸는 「보기 바꾸기」에 쓴다.
 * @param {Array<{값, 이름}|string>} items
 */
export function pillGroup(items, current, onPick, opt = {}) {
  const norm = items.map((x) => (typeof x === 'string' ? { 값: x, 이름: x } : x))
  return h('div.pills' + (opt.작게 ? '.pills-sm' : ''),
    ...norm.map((it) => h('button.pill' + (it.값 === current ? '.on' : ''), {
      type: 'button',
      onclick: () => { onPick(it.값); redraw() },
    }, it.이름)))
}

/**
 * 채점·판정이 붙는 고르기. 「아직 안 골랐음」 상태가 따로 있다.
 */
export function choicePicker(items, current, onPick, opt = {}) {
  const norm = items.map((x) => (typeof x === 'string' ? { 값: x, 이름: x } : x))
  return h('div.choices',
    ...norm.map((it) => h('button.choice' + (it.값 === current ? '.on' : ''), {
      type: 'button',
      onclick: () => { onPick(it.값 === current && opt.토글 ? null : it.값); redraw() },
    }, it.이름)))
}

/** 드롭다운 */
export function select(items, current, onPick, opt = {}) {
  const norm = items.map((x) => (typeof x === 'string' ? { 값: x, 이름: x } : x))
  const el = h('select.sel', {
    onchange: (e) => { onPick(e.target.value); redraw() },
  }, ...(opt.빈칸 ? [h('option', { value: '' }, opt.빈칸)] : []),
     ...norm.map((it) => h('option', { value: it.값, selected: String(it.값) === String(current) }, it.이름)))
  return opt.라벨 ? h('label.field', h('span.field-label', opt.라벨), el) : el
}

/** 글자 넣는 칸 */
export function input(value, onInput, opt = {}) {
  const el = h('input.inp', {
    type: opt.종류 || 'text', value: value ?? '',
    placeholder: opt.안내 || '', inputmode: opt.숫자 ? 'decimal' : undefined,
    min: opt.최소, max: opt.최대, step: opt.간격,
    oninput: (e) => onInput(e.target.value),
    onchange: opt.다시그리기 ? () => redraw() : undefined,
  })
  return opt.라벨 ? h('label.field', h('span.field-label', opt.라벨), el) : el
}

/**
 * 슬라이더.
 * ⚠ 화면을 통째로 다시 그리는 일은 onInput 이 아니라 onChange(손 뗄 때)에 넣는다.
 *   안 그러면 끌 때마다 다시 그려져 손잡이를 놓친다.
 */
export function slider(value, onChange, opt = {}) {
  const out = h('span.slider-val', opt.값글 ? opt.값글(value) : String(value))
  const el = h('input.rng', {
    type: 'range', value, min: opt.최소 ?? 0, max: opt.최대 ?? 100, step: opt.간격 ?? 1,
    oninput: (e) => { out.textContent = opt.값글 ? opt.값글(e.target.value) : e.target.value },
    onchange: (e) => { onChange(Number(e.target.value)); redraw() },
  })
  return h('div.slider',
    opt.라벨 ? h('span.field-label', opt.라벨) : null, el, out)
}

/** 켜고 끄기 */
export function toggle(label, on, onChange) {
  return h('label.tog' + (on ? '.on' : ''),
    h('input', { type: 'checkbox', checked: on, onchange: (e) => { onChange(e.target.checked); redraw() } }),
    h('span.tog-box'), h('span.tog-label', label))
}

/** 단추 */
export function button(label, onClick, opt = {}) {
  return h(`button.btn${opt.주요 ? '.btn-primary' : ''}${opt.lg ? '.lg' : ''}${opt.평평 ? '.btn-flat' : ''}`,
    { type: 'button', onclick: onClick, disabled: opt.꺼짐 || false }, label)
}

/** 접었다 펴는 상자. data-k 를 꼭 줘야 다시 그려도 펴진 채로 남는다. */
export function details(key, title, ...body) {
  return h('details.acc', { 'data-k': key }, h('summary', title), h('div.acc-body', ...body))
}

/** 「🔬 더 깊이」 상자 */
export function deeper(key, title, ...body) {
  return h('details.acc.acc-deep', { 'data-k': key },
    h('summary', `🔬 ${title}`), h('div.acc-body', ...body))
}

// ── 자주 쓰는 조각 ─────────────────────────────────────────
export const tag = (text, kind = '') => h(`span.tag${kind ? `.tag-${kind}` : ''}`, text)

export const 등급표시 = (g, 자 = 5) =>
  g === null || g === undefined ? h('span.dim', '-')
    : h(`span.grade.g${Math.min(자, Math.max(1, Math.round(g)))}`, fmt(g, 2))

export const 결과표시 = (r) => {
  const k = { 합격: 'ok', 충원합격: 'ok2', 불합격: 'no', 미상: 'dim' }[r] || 'dim'
  return h(`span.res.res-${k}`, r)
}

export function 판정표시(v) {
  if (v === true || v === '통과') return h('span.judge.judge-ok', '✅ 통과')
  if (v === false || v === '미달') return h('span.judge.judge-no', '❌ 미달')
  return h('span.judge.judge-unknown', '❓ 확인 필요')
}

/** 지원 대비 합격 비율 막대 하나 */
export function rateBar(pass, apply, opt = {}) {
  const r = apply ? (pass / apply) * 100 : 0
  return h('div.rate',
    h('div.rate-track', h('div.rate-fill', { style: { width: `${Math.min(100, r)}%` } })),
    h('span.rate-text', apply ? `${comma(pass)}/${comma(apply)} · ${r.toFixed(1)}%` : '-'))
}

export function empty(msg) { return h('p.empty', msg) }

/** 화면 맨 위 설명 */
export function lead(title, ...body) {
  return h('div.lead', h('h2.lead-title', title), h('div.lead-body', ...body))
}
