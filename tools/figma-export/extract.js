const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = __dirname + '/out';
fs.mkdirSync(OUT + '/img', { recursive: true });
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index', 'courses', 'course', 'leadership', 'privacy', 'terms'];
const extractSrc = fs.readFileSync(__dirname + '/extract_in_page.js', 'utf8');

const PREP = () => {
  // materialize pseudo elements
  const todo = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) continue;
    for (const pe of ['::before', '::after']) {
      const cs = getComputedStyle(el, pe);
      if (cs.content === 'none' || cs.content === 'normal' || cs.display === 'none') continue;
      const props = {};
      for (const p of cs) props[p] = cs.getPropertyValue(p);
      let txt = cs.content;
      txt = /^["']/.test(txt) ? txt.slice(1, -1).replace(/\\([0-9a-f]{1,6}) ?/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))) : '';
      todo.push([el, pe, props, txt]);
    }
  }
  for (const [el, pe, props, txt] of todo) {
    const s = document.createElement('span');
    for (const p in props) s.style.setProperty(p, props[p]);
    s.textContent = txt;
    s.dataset.pseudo = pe;
    if (pe === '::before') el.insertBefore(s, el.firstChild); else el.appendChild(s);
    el.classList.add('__np');
  }
  const st = document.createElement('style');
  st.textContent = '.__np::before,.__np::after{content:none!important;display:none!important}';
  document.head.appendChild(st);
  return todo.length;
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const rp = await ctx.newPage();
  for (const f of pages) {
    await p.goto('file://' + require('path').resolve(__dirname, '../..') + '/' + f + '.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 400) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(60); }
    await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}' });
    await p.evaluate(() => { document.querySelectorAll('img[loading=lazy]').forEach(i => i.loading = 'eager'); document.querySelectorAll('.rv').forEach(e => e.classList.add('in')); });
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(600);
    const npseudo = await p.evaluate(PREP);
    await p.waitForTimeout(200);
    await p.screenshot({ path: `${OUT}/${f}_ref.png`, fullPage: true });
    for (let k = 0; k < 10; k++) { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); window.dispatchEvent(new Event('scroll')); }); await p.waitForTimeout(150); if (await p.evaluate(() => scrollY) === 0) break; }
    console.log('scrollY', await p.evaluate(() => scrollY));
    const res = await p.evaluate(extractSrc);
    // save images
    for (const [k, src] of Object.entries(res.images)) {
      let buf, ext;
      if (src.startsWith('data:')) { const m = src.match(/^data:image\/([a-z+]+);base64,(.*)$/); ext = m[1]; buf = Buffer.from(m[2], 'base64'); }
      else { const fp = decodeURIComponent(src.replace('file://', '')); buf = fs.readFileSync(fp); ext = path.extname(fp).slice(1); }
      if (ext === 'jpeg') ext = 'jpg';
      res.images[k] = `${k}.${ext}`;
      fs.writeFileSync(`${OUT}/img/${k}.${ext}`, buf);
    }
    // rasterize backgrounds
    for (const [k, r] of Object.entries(res.rasters)) {
      const W = Math.max(1, Math.ceil(r.w)), Hh = Math.max(1, Math.ceil(r.h));
      await rp.setViewportSize({ width: Math.min(W, 3000), height: Math.min(Hh, 4000) });
      await rp.setContent(`<html><body style="margin:0;background:transparent"><div id="d" style="width:${r.w}px;height:${r.h}px"></div></body></html>`);
      await rp.evaluate(css => Object.assign(document.getElementById('d').style, css), r.css);
      await rp.locator('#d').screenshot({ path: `${OUT}/img/${k}.png`, omitBackground: true });
      res.images[k] = `${k}.png`;
    }
    delete res.rasters;
    fs.writeFileSync(`${OUT}/${f}.json`, JSON.stringify(res));
    console.log(f, 'pseudo', npseudo, 'json', JSON.stringify(res.tree).length, 'imgs', Object.keys(res.images).length);
  }
  await b.close();
})();
