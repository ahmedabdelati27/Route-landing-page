/**
 * Keys: a laptop's deck, keys on a rounded base with a trackpad set in front.
 * Where the pointer rests, the keys around it press down, the nearest the
 * deepest, each on its own spring; the key under it takes the bright edge.
 * At rest a short run of keys is mid-press and Enter is bright. The slider is
 * the reach, in keys.
 */
const {
  Cam, clamp, facing, fit, open, poly, prism, proj, ringAt, rings, rrect, unproj, spring, stepS,
  mk, pointer, put, register, disposer, solid,
} = HL;

const U = 13, KG = 2.6, UP = 11, DOWN = 0.8, PAD = 7, TP = 30;
// rows of key widths, in units; 0 marks Enter, 6 the space bar
const ROWS = [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 2], [1.5, 1, 1, 1, 1, 1, 1, 1, 1.5], [1.5, 1, 6, 1, 1.5]];
const TYPED = ["1,2", "1,3", "2,4", "1,5"];

const fall = (u) => (u <= 0 ? 1 : u >= 1 ? 0 : 1 - u * u * (3 - 2 * u));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let R = value * U, over = null;
  const XW = 10 * U, YD = ROWS.length * U;
  const C = Cam(45, 0.5, 1.72);
  fit(C, [[-PAD, -PAD, -7], [XW + PAD, YD + TP + PAD, -7], [XW + PAD, -PAD, -7], [-PAD, YD + TP + PAD, -7], [0, 0, UP]], 200, 160);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [br, bi] = rings(-PAD, -PAD, XW + PAD, YD + TP + PAD, 9, 2);
  put(solid(g), prism(P, front, br, bi, -7, 0));
  // the trackpad: a shallow rounded recess in front of the keys
  const tx = XW / 2, ty = YD + PAD + TP / 2 - 2;
  mk("path", { d: poly(ringAt(P, rrect(tx - 30, ty - 12, tx + 30, ty + 12, 5, 6), 0)), class: "nf lo" }, g);
  mk("path", { d: open(ringAt(P, rrect(tx - 28.6, ty - 10.6, tx + 28.6, ty + 10.6, 4, 6), 0).slice(10, 26)), class: "nf lo" }, g);

  const keys = [];
  ROWS.forEach((row, j) => {
    let x = 0;
    row.forEach((w, n) => {
      const wide = j === 1 && n === row.length - 1, space = w === 6;
      const x0 = x + KG / 2, x1 = x + w * U - KG / 2, y0 = j * U + KG / 2, y1 = (j + 1) * U - KG / 2;
      const h0 = TYPED.includes(j + "," + n) ? (UP + DOWN) / 2 : UP;
      const [ring, inner] = rings(x0, y0, x1, y1, 2.4, 0.9);
      keys.push({ j, n, x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, h0, ring, inner, wide, space, sp: spring(h0, { eps: 0.03 }), drawn: NaN });
      x += w * U;
    });
  });
  // back to front: by the key's nearest corner, x + y ascending
  keys.sort((a, b) => a.x1 + a.y1 - (b.x1 + b.y1));
  for (const k of keys) k.el = solid(g);

  const enter = keys.find((k) => k.wide);
  let lit = enter;
  const light = (k) => { if (k === lit) return; lit.el.sil.classList.remove("hi"); lit = k; lit.el.sil.classList.add("hi"); };
  enter.el.sil.classList.add("hi");

  function drawKey(k) {
    const h = k.sp.x;
    if (h === k.drawn) return;
    k.drawn = h;
    put(k.el, prism(P, front, k.ring, k.inner, 0, h));
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const k of keys) { if (stepS(k.sp, dt)) m = true; drawKey(k); }
    return m;
  });
  bag.add(B.unregister);

  const name = (k) => (k.space ? "space" : k.wide ? "enter" : `key ${k.j + 1}·${k.n + 1}`);
  function retarget() {
    let under = null;
    for (const k of keys) {
      if (!over) { k.sp.t = k.h0; continue; }
      const dx = Math.max(k.x0 - over[0], 0, over[0] - k.x1), dy = Math.max(k.y0 - over[1], 0, over[1] - k.y1);
      k.sp.t = clamp(UP - (UP - DOWN) * fall(Math.hypot(dx, dy) / R), DOWN, UP);
      if (over[0] >= k.x0 - KG / 2 && over[0] <= k.x1 + KG / 2 && over[1] >= k.y0 - KG / 2 && over[1] <= k.y1 + KG / 2) under = k;
    }
    light(under || enter);
    read.textContent = over ? (under ? name(under) : "deck") : "rest";
    B.wake();
  }

  // the ground plane never moves: the pointer is read there, never on a key's lid
  bag.add(pointer(stage, {
    move: (p) => { const w = unproj(C, p[0], p[1], 0); over = w[1] <= YD + PAD ? w : null; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { R = v * U; if (over) retarget(); }, destroy: bag.dispose };
}

hairline({
  name: "keys",
  means: "A laptop's keys press down around the pointer, the nearest the deepest: practice under your own hands.",
  rules: [1, 3, 5, 8],
  range: [1, 3, 5],
  tour: [[200, 140], [150, 170], [250, 130], null],
  mount,
});
