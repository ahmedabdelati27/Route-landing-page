/**
 * Steps: five rounded blocks climbing away on a plinth, the course's five
 * stages. The block under the pointer lifts; its neighbours follow less,
 * staggered outwards. Each block carries its stage number as dots on its lid.
 * At rest the top step, the job, has the bright edge. The slider is the stagger.
 */
const {
  Cam, clamp, facing, fit, prism, proj, rings, unproj, flatDot,
  tset, tval, tdone, tween, mk, place, pointer, put, register, disposer, solid,
} = HL;

const N = 5, W = 30, D = 40, G = 5, H0 = 12, DH = 11, LIFT = 16, PAD = 7;
const SHARE = [1, 0.42, 0.14, 0.05, 0];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let stag = value;
  const X1 = N * W + (N - 1) * G;
  const C = Cam(45, 0.5, 1.5);
  fit(C, [[-PAD, -PAD, -6], [X1 + PAD, D + PAD, -6], [X1 + PAD, -PAD, -6], [-PAD, D + PAD, -6], [0, 0, H0 + (N - 1) * DH + LIFT]], 200, 170);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-PAD, -PAD, X1 + PAD, D + PAD, 8, 2);
  put(solid(g), prism(P, front, pr, pi, -6, 0));

  // block i stands at x = i·(W+G); i = 0 is the far, tall one (the job), i = N-1 the near, low one (stage 1)
  const blocks = [];
  for (let i = 0; i < N; i++) {
    const x0 = i * (W + G), h = H0 + (N - 1 - i) * DH, stageNo = N - i;
    const [ring, inner] = rings(x0, 0, x0 + W, D, 4.5, 1.4);
    const el = solid(g), dots = mk("g", {}, g), dl = [];
    for (let k = 0; k < stageNo; k++) dl.push(flatDot(dots, C, 0.9, "dot off"));
    blocks.push({ i, x0, h, stageNo, ring, inner, el, dots, dl, z: tween(0), drawn: NaN });
  }

  function draw(b, z) {
    if (z === b.drawn) return;
    b.drawn = z;
    put(b.el, prism(P, front, b.ring, b.inner, z, z + b.h));
    const cx = b.x0 + W / 2, cy = D / 2, top = z + b.h;
    b.dl.forEach((el, k) => place(el, P(cx + (k - (b.stageNo - 1) / 2) * 4.6, cy, top)));
  }

  // hit: each block's REST volume, sampled up its height; the nearest block that holds the point wins
  function hit([sx, sy]) {
    let best = -1;
    for (const b of blocks) {
      for (let s = 0; s <= 6; s++) {
        const [wx, wy] = unproj(C, sx, sy, (b.h * s) / 6);
        if (wx >= b.x0 - 1 && wx <= b.x0 + W + 1 && wy >= -1 && wy <= D + 1) { best = Math.max(best, b.i); break; }
      }
    }
    return best;
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const b of blocks) { draw(b, tval(b.z, now)); if (!tdone(b.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    for (const b of blocks) {
      const d = Math.abs(b.i - from);
      tset(b.z, a < 0 ? 0 : LIFT * SHARE[clamp(d, 0, N - 1)], now, from < 0 ? 0 : d * stag);
      const lit = a < 0 ? b.i === 0 : b.i === a;
      b.el.sil.classList.toggle("hi", lit);
      b.dl.forEach((el) => { el.setAttribute("class", "dot " + (b.i === a ? "m" : "off")); });
    }
    read.textContent = a < 0 ? "rest" : `stage ${blocks[a].stageNo}`;
    B.wake();
  }
  setActive(-1);

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { stag = v; }, destroy: bag.dispose };
}

hairline({
  name: "steps",
  means: "Five stages climb to a first job: the step under the pointer lifts, and its neighbours follow in turn.",
  rules: [1, 2, 5, 9],
  range: [0, 45, 90],
  tour: [[255, 240], [202, 152], [124, 100], null],
  mount,
});
