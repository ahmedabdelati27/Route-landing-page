// Runs inside the browser page. Returns {tree, images, rasters}.
(() => {
  const R = v => Math.round(v * 100) / 100;
  const images = {};   // key -> src
  const rasters = {};  // key -> {w,h,css}
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  function color(str) {
    if (!str) return null;
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    const a = p.length > 3 ? p[3] : 1;
    if (a === 0) return null;
    const hex = '#' + p.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    return a < 1 ? [hex, R(a)] : hex;
  }
  const px = v => parseFloat(v) || 0;

  function shadows(str) {
    if (!str || str === 'none') return null;
    const out = [];
    // split on commas not inside parens
    const parts = str.split(/,(?![^(]*\))/);
    for (const part of parts) {
      if (/inset/.test(part)) continue;
      const c = color(part.match(/rgba?\([^)]+\)/)?.[0]);
      const nums = part.replace(/rgba?\([^)]+\)/, '').trim().split(/\s+/).map(px);
      if (!c) continue;
      out.push([c, nums[0] || 0, nums[1] || 0, nums[2] || 0, nums[3] || 0]);
    }
    return out.length ? out : null;
  }

  function radii(cs, w, h) {
    const f = v => { if (/%/.test(v)) return R(Math.min(w, h) * parseFloat(v) / 100); return R(px(v)); };
    const r = [f(cs.borderTopLeftRadius), f(cs.borderTopRightRadius), f(cs.borderBottomRightRadius), f(cs.borderBottomLeftRadius)].map(v => Math.min(v, Math.min(w, h) / 2));
    if (r.every(v => v === 0)) return null;
    if (r.every(v => v === r[0])) return r[0];
    return r;
  }

  function border(cs) {
    const sides = ['Top', 'Right', 'Bottom', 'Left'];
    const ws = sides.map(s => cs['border' + s + 'Style'] === 'none' || cs['border' + s + 'Style'] === 'hidden' ? 0 : px(cs['border' + s + 'Width']));
    if (ws.every(w => w === 0)) return null;
    let c = null;
    for (let i = 0; i < 4; i++) if (ws[i]) { c = color(cs['border' + sides[i] + 'Color']); if (c) break; }
    if (!c) return null;
    return { c, w: ws.every(w => w === ws[0]) ? ws[0] : ws, d: cs.borderTopStyle === 'dashed' ? 1 : 0 };
  }

  const isSrOnly = (el, cs) => (cs.position === 'absolute' || cs.position === 'fixed') && ((cs.clip && /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip)) || /inset\(50%\)/.test(cs.clipPath) || (el.offsetWidth <= 1 && el.offsetHeight <= 1));
  const INLINE_TAGS = new Set(['SPAN', 'A', 'B', 'STRONG', 'EM', 'I', 'SMALL', 'MARK', 'BDI', 'BDO', 'SUB', 'SUP', 'CODE', 'KBD', 'U', 'S', 'ABBR', 'TIME', 'Q', 'CITE', 'LABEL', 'BR']);

  function hasOwnVisual(el, cs) {
    return color(cs.backgroundColor) || cs.backgroundImage !== 'none' || border(cs) || (cs.boxShadow && cs.boxShadow !== 'none');
  }

  function isPureInline(el) {
    if (el.nodeType === 3) return true;
    if (el.nodeType !== 1) return false;
    if (el.tagName === 'BR') return true;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || isSrOnly(el, cs)) return true;
    if (cs.display !== 'inline') return false;
    if (hasOwnVisual(el, cs)) return false;
    if (!INLINE_TAGS.has(el.tagName)) return false;
    for (const c of el.childNodes) if (!isPureInline(c)) return false;
    return true;
  }

  function fontKey(cs) {
    const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    return /urbanist/i.test(fam) ? 'U' : 'P';
  }

  // Collect runs from an inline group
  function collectRuns(nodes, runs, rects) {
    for (const n of nodes) {
      if (n.nodeType === 3) {
        const pe = n.parentElement; const cs = getComputedStyle(pe);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        let t = n.textContent;
        const pre = /^pre/.test(cs.whiteSpace);
        if (!pre) t = t.replace(/[\s​]+/g, ' ');
        if (!t) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        for (const r of rg.getClientRects()) if (r.width > 0 && r.height > 0) rects.push(r);
        if (cs.textTransform === 'uppercase') t = t.toUpperCase();
        const lh = cs.lineHeight === 'normal' ? 0 : R(px(cs.lineHeight));
        const ls = cs.letterSpacing === 'normal' ? 0 : R(px(cs.letterSpacing));
        const deco = /underline/.test(cs.textDecorationLine) ? 1 : (/line-through/.test(cs.textDecorationLine) ? 2 : 0);
        const col = color(cs.color) || '#000000';
        const st = [fontKey(cs), +cs.fontWeight || 400, R(px(cs.fontSize)), col, lh, ls, deco, cs.fontStyle === 'italic' ? 1 : 0];
        const last = runs[runs.length - 1];
        if (last && JSON.stringify(last[1]) === JSON.stringify(st)) last[0] += t; else runs.push([t, st]);
      } else if (n.nodeType === 1) {
        if (n.tagName === 'BR') { runs.push(['\n', runs.length ? runs[runs.length - 1][1] : null]); continue; }
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || isSrOnly(n, cs)) continue;
        collectRuns(n.childNodes, runs, rects);
      }
    }
  }

  function textNode(group, containerEl, containerCs, parentBox) {
    const runs = [], rects = [];
    collectRuns(group, runs, rects);
    // fill null styles for br
    for (let i = 0; i < runs.length; i++) if (!runs[i][1]) runs[i][1] = (runs.find(r => r[1]) || [0, null])[1];
    // trim whitespace
    let full = runs.map(r => r[0]).join('');
    if (!full.trim() || !rects.length) return null;
    // collapse spaces around newlines & at ends
    while (runs.length && !runs[0][0].trimStart()) runs.shift();
    while (runs.length && !runs[runs.length - 1][0].trimEnd()) runs.pop();
    if (!runs.length) return null;
    runs[0][0] = runs[0][0].replace(/^ +/, '');
    runs[runs.length - 1][0] = runs[runs.length - 1][0].replace(/ +$/, '');
    for (const r of runs) r[0] = r[0].replace(/ *\n */g, '\n');
    let l = Infinity, t = Infinity, rr = -Infinity, b = -Infinity;
    const centers = [];
    for (const r of rects) { l = Math.min(l, r.left); t = Math.min(t, r.top); rr = Math.max(rr, r.right); b = Math.max(b, r.bottom); centers.push(r.top + r.height / 2); }
    centers.sort((a, b) => a - b);
    let lines = 0, lastC = -1e9;
    for (const c of centers) { if (c - lastC > 4) { lines++; lastC = c; } }
    const st = runs[0][1];
    const lh = Math.max(...runs.map(r => r[1][4] || r[1][2] * 1.3));
    let y = centers[0] - lh / 2;
    let h = lines * lh;
    const dir = containerCs.direction;
    let ta = containerCs.textAlign;
    if (ta === 'start') ta = dir === 'rtl' ? 'right' : 'left';
    if (ta === 'end') ta = dir === 'rtl' ? 'left' : 'right';
    if (ta === '-webkit-center') ta = 'center';
    const al = { right: 'R', left: 'L', center: 'C', justify: 'J' }[ta] || 'R';
    let x, w, mode;
    if (lines <= 1 && !full.includes('\n')) {
      mode = 'W'; x = l; w = rr - l;
      // anchor based on alignment/direction of actual placement
    } else {
      mode = 'H';
      const cr = containerEl.getBoundingClientRect();
      const cl = cr.left + px(containerCs.paddingLeft) + px(containerCs.borderLeftWidth);
      const crr = cr.right - px(containerCs.paddingRight) - px(containerCs.borderRightWidth);
      // use the wider of text union and container content box, clipped to container
      x = Math.min(l, cl); w = Math.max(rr, crr) - x;
      if (w > (rr - l) + 400 && containerCs.display.includes('flex')) { x = l; w = rr - l + 2; }
    }
    return { t: 'T', x: R(x - parentBox.x), y: R(y + scrollY - parentBox.y), w: R(w), h: R(h), al, m: mode, s: runs };
  }

  function svgString(svg, w, h) {
    const clone = svg.cloneNode(true);
    const orig = [svg, ...svg.querySelectorAll('*')];
    const copy = [clone, ...clone.querySelectorAll('*')];
    for (let i = 0; i < orig.length; i++) {
      const o = orig[i], c = copy[i];
      if (!(o instanceof SVGElement)) continue;
      const cs = getComputedStyle(o);
      if (['path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'g', 'svg', 'use', 'tspan'].includes(o.tagName.toLowerCase())) {
        const fill = cs.fill; const stroke = cs.stroke;
        c.setAttribute('fill', fill === 'none' ? 'none' : (color(fill) ? (Array.isArray(color(fill)) ? color(fill)[0] : color(fill)) : (fill.startsWith('url') ? fill.replace(/url\("?#?([^")]*)"?\)/, (m, id) => 'url(#' + id.split('#').pop() + ')') : 'none')));
        if (Array.isArray(color(fill))) c.setAttribute('fill-opacity', color(fill)[1]);
        if (stroke && stroke !== 'none') {
          const sc = color(stroke);
          if (sc) { c.setAttribute('stroke', Array.isArray(sc) ? sc[0] : sc); if (Array.isArray(sc)) c.setAttribute('stroke-opacity', sc[1]); }
          c.setAttribute('stroke-width', cs.strokeWidth);
          c.setAttribute('stroke-linecap', cs.strokeLinecap);
          c.setAttribute('stroke-linejoin', cs.strokeLinejoin);
        }
        if (cs.opacity !== '1') c.setAttribute('opacity', cs.opacity);
        if (cs.display === 'none') c.setAttribute('display', 'none');
      }
      c.removeAttribute('class'); c.removeAttribute('style');
    }
    // resolve <use>
    for (const u of [...clone.querySelectorAll('use')]) {
      const id = (u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace(/^#/, '');
      const ref = id && document.getElementById(id);
      if (!ref) { u.remove(); continue; }
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const src = ref.tagName.toLowerCase() === 'symbol' ? ref : ref;
      if (src.tagName.toLowerCase() === 'symbol') {
        const inner = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        if (src.getAttribute('viewBox')) inner.setAttribute('viewBox', src.getAttribute('viewBox'));
        for (const a of ['x', 'y', 'width', 'height']) if (u.getAttribute(a)) inner.setAttribute(a, u.getAttribute(a));
        inner.innerHTML = src.innerHTML; g.appendChild(inner);
      } else g.innerHTML = src.outerHTML;
      for (const a of ['fill', 'stroke', 'stroke-width', 'opacity']) if (u.getAttribute(a)) g.setAttribute(a, u.getAttribute(a));
      u.replaceWith(g);
    }
    clone.setAttribute('width', R(w)); clone.setAttribute('height', R(h));
    if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${R(w)} ${R(h)}`);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    let s = clone.outerHTML.replace(/\s+/g, ' ').replace(/> </g, '><');
    s = s.replace(/(\d+\.\d{3})\d+/g, '$1');
    return s;
  }

  function imgKey(src) { const k = 'i' + hash(src); images[k] = src; return k; }

  const LANDMARK = new Set(['HEADER', 'FOOTER', 'NAV', 'MAIN', 'SECTION', 'ARTICLE', 'ASIDE', 'FORM', 'UL', 'OL', 'LI', 'BUTTON', 'A']);

  function nameOf(el) {
    let n = el.tagName.toLowerCase();
    if (el.id) n += '#' + el.id;
    const cls = [...el.classList].filter(c => !/^(in|is-|js-|__)/.test(c)).slice(0, 2);
    if (cls.length) n += '.' + cls.join('.');
    return n;
  }

  function walk(el, parentBox, out, clipRect) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' && !el.querySelector('*')) return;
    if (+cs.opacity === 0) return;
    if (isSrOnly(el, cs)) return;
    // rotation support: measure in local (unrotated) space
    let rot = null;
    const tm = cs.transform && cs.transform !== 'none' ? cs.transform.match(/matrix\(([^)]+)\)/) : null;
    if (tm) { const m = tm[1].split(',').map(parseFloat); if (Math.abs(m[1]) > 1e-3) {
      const vis = el.getBoundingClientRect();
      const prevT = el.style.transform; el.style.setProperty('transform', 'none', 'important');
      const L = el.getBoundingClientRect();
      const o = cs.transformOrigin.split(' ').map(parseFloat);
      const sc = Math.hypot(m[0], m[1]); const a = m[0] / sc, b = m[1] / sc;
      // visual top-left = O + M*(TL-O) + t, with TL-O = (-ox,-oy)
      const Ox = L.left + o[0], Oy = L.top + o[1];
      const tlx = Ox + m[0] * (-o[0]) + m[2] * (-o[1]) + m[4], tly = Oy + m[1] * (-o[0]) + m[3] * (-o[1]) + m[5];
      rot = { a, b, tlx, tly, restore: () => { el.style.transform = prevT; } };
    } }
    const r = el.getBoundingClientRect();
    const box = { x: R(r.left), y: R(r.top + scrollY), w: R(r.width), h: R(r.height) };
    if (clipRect && (r.right < clipRect.left - 1 || r.left > clipRect.right + 1 || r.bottom < clipRect.top - 1 || r.top > clipRect.bottom + 1) && cs.position !== 'fixed') return;
    const tag = el.tagName;
    const rel = { x: R(box.x - parentBox.x), y: R(box.y - parentBox.y), w: box.w, h: box.h };
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE' || tag === 'LINK' || tag === 'META') return;
    if (cs.visibility === 'hidden') { for (const c of el.children) walk(c, parentBox, out, clipRect); return; }
    if (tag === 'svg' || el instanceof SVGSVGElement) {
      if (box.w < 1 || box.h < 1) return;
      out.push({ t: 'V', n: el.getAttribute('aria-label') || 'icon', ...rel, svg: svgString(el, box.w, box.h), o: +cs.opacity < 1 ? +cs.opacity : undefined });
      return;
    }
    if (tag === 'IMG' || tag === 'VIDEO') {
      if (box.w < 1 || box.h < 1) return;
      const src = tag === 'IMG' ? (el.currentSrc || el.src) : el.poster;
      if (!src) return;
      const fit = cs.objectFit === 'contain' ? 'FIT' : 'FILL';
      if (/^data:image\/svg\+xml/.test(src)) {
        let svgText = src.includes(';base64,') ? atob(src.split(',')[1]) : decodeURIComponent(src.split(',')[1]);
        svgText = new TextDecoder().decode(Uint8Array.from(svgText, c => c.charCodeAt(0)));
        out.push({ t: 'V', n: el.alt || 'image', ...rel, svg: svgText.replace(/<\?xml[^>]*>/, '').replace(/\s+/g, ' ').replace(/> </g, '><'), fit: 1, o: +cs.opacity < 1 ? +cs.opacity : undefined });
        return;
      }
      out.push({ t: 'I', n: el.alt || (tag === 'VIDEO' ? 'video' : 'image'), ...rel, k: imgKey(src), fit, r: radii(cs, box.w, box.h), o: +cs.opacity < 1 ? +cs.opacity : undefined });
      return;
    }
    const fill = color(cs.backgroundColor);
    const bd = border(cs);
    const sh = shadows(cs.boxShadow);
    const clip = cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || cs.overflow === 'clip';
    let bgImg = null;
    if (cs.backgroundImage !== 'none' && box.w > 0 && box.h > 0) {
      const css = { backgroundImage: cs.backgroundImage, backgroundSize: cs.backgroundSize, backgroundPosition: cs.backgroundPosition, backgroundRepeat: cs.backgroundRepeat, backgroundClip: cs.backgroundClip, backgroundOrigin: cs.backgroundOrigin };
      const key = 'r' + hash(JSON.stringify(css) + box.w + 'x' + box.h);
      rasters[key] = { w: box.w, h: box.h, css };
      bgImg = key;
    }
    const op = +cs.opacity < 1 ? R(+cs.opacity) : undefined;
    const isRoot = el === document.body;
    const emit = !!rot || isRoot || fill || bd || sh || bgImg || (clip && el.children.length) || op || LANDMARK.has(tag) || (cs.position === 'fixed' || cs.position === 'sticky');
    let node, kids, pbox, clipR = clipRect;
    if (emit && !isRoot) {
      node = { t: 'F', n: nameOf(el), ...rel };
      if (fill) node.f = fill;
      if (bgImg) node.bi = bgImg;
      if (bd) node.b = bd;
      const rad = radii(cs, box.w, box.h); if (rad) node.r = rad;
      if (sh) node.sh = sh;
      if (clip) { node.c = 1; clipR = r; }
      if (op) node.o = op;
      if (rot) node.rt = [R(rot.a * 1e4) / 1e4, R(rot.b * 1e4) / 1e4, R(rot.tlx - parentBox.x), R(rot.tly + scrollY - parentBox.y)];
      node.ch = [];
      out.push(node);
      kids = node.ch; pbox = box;
    } else { kids = out; pbox = parentBox; }
    // children with inline grouping
    let group = [];
    const flush = () => {
      if (group.length) { const tn = textNode(group, el, cs, pbox); if (tn) kids.push(tn); group = []; }
    };
    for (const c of el.childNodes) {
      if (c.nodeType === 3) { if (c.textContent.trim() || group.length) group.push(c); continue; }
      if (c.nodeType !== 1) continue;
      if (isPureInline(c)) { group.push(c); continue; }
      flush();
      walk(c, pbox, kids, clipR);
    }
    flush();
    if (rot) rot.restore();
    if (node && !node.ch.length) delete node.ch;
  }

  const body = document.body;
  const root = { t: 'F', n: 'page', x: 0, y: 0, w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, f: color(getComputedStyle(body).backgroundColor) || '#ffffff', ch: [] };
  walk(body, { x: 0, y: 0 }, root.ch, null);
  return { tree: root, images, rasters };
})();
