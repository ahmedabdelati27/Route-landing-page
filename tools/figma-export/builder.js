const pg=figma.root.children.find(p=>p.name===D.pg);await figma.setCurrentPageAsync(pg);
let P;if(D.root){const w=figma.createFrame();w.name=D.root.n;w.resize(D.root.w,D.root.h);w.x=D.root.x;w.y=0;w.fills=[{type:'SOLID',color:hx(D.root.f)}];w.clipsContent=true;P=w;}else{P=pg.children.find(n=>n.name===D.rn);for(const i of D.p)P=P.children[i];}
function hx(h){h=Array.isArray(h)?h[0]:h;return{r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255}}
const sp=c=>({type:'SOLID',color:hx(c),opacity:Array.isArray(c)?c[1]:1});
const WS={300:'Light',400:'Regular',500:'Medium',600:'SemiBold',700:'Bold',800:'ExtraBold',900:'ExtraBold'};
const AR=/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
function fam(k,ar){return ar?'Noto Sans Arabic':(k==='U'?'Urbanist':'IBM Plex Sans')}
function fn(k,w,ar,it){const f=fam(k,ar);let s=WS[Math.round(w/100)*100]||'Regular';if(f==='IBM Plex Sans'&&s==='ExtraBold')s='Bold';if(it&&f!=='Noto Sans Arabic')s=s==='Regular'?'Italic':s+' Italic';return{family:f,style:s}}
const need=new Map();need.set('Inter|Regular',{family:'Inter',style:'Regular'});
(function sc(a){for(const n of a){if(n.t==='T')for(const r of n.s){for(const ar of [0,1]){const f=fn(r[1][0],r[1][1],ar,r[1][7]);need.set(f.family+'|'+f.style,f)}}if(n.ch)sc(n.ch)}})(D.n);
await Promise.all([...need.values()].map(f=>figma.loadFontAsync(f).catch(()=>{})));
const imgs={},errs=[];let cnt=0;
function rad(n,r){if(r==null)return;if(Array.isArray(r)){n.topLeftRadius=r[0];n.topRightRadius=r[1];n.bottomRightRadius=r[2];n.bottomLeftRadius=r[3]}else n.cornerRadius=r}
function img(k,id){(imgs[k]=imgs[k]||[]).push(id)}
function build(d,par){cnt++;let n;
if(d.t==='F'){n=figma.createFrame();n.name=d.n;par.appendChild(n);n.resize(Math.max(d.w,.01),Math.max(d.h,.01));n.x=d.x;n.y=d.y;n.fills=d.f?[sp(d.f)]:[];n.clipsContent=!!d.c;rad(n,d.r);
 if(d.b){n.strokes=[sp(d.b.c)];n.strokeAlign='INSIDE';if(Array.isArray(d.b.w)){n.strokeTopWeight=d.b.w[0];n.strokeRightWeight=d.b.w[1];n.strokeBottomWeight=d.b.w[2];n.strokeLeftWeight=d.b.w[3]}else n.strokeWeight=d.b.w;if(d.b.d)n.dashPattern=[4,4]}
 if(d.sh)n.effects=d.sh.map(s=>{const c=hx(s[0]);return{type:'DROP_SHADOW',color:{...c,a:Array.isArray(s[0])?s[0][1]:1},offset:{x:s[1],y:s[2]},radius:s[3],spread:s[4],visible:true,blendMode:'NORMAL'}});
 if(d.o!=null)n.opacity=d.o;
 if(d.rt)n.relativeTransform=[[d.rt[0],-d.rt[1],d.rt[2]],[d.rt[1],d.rt[0],d.rt[3]]];
 if(d.bi){const r=figma.createRectangle();r.name='bg-image';n.appendChild(r);r.resize(Math.max(d.w,.01),Math.max(d.h,.01));r.fills=[{type:'SOLID',color:{r:.9,g:.92,b:.95}}];rad(r,d.r);img(d.bi,r.id)}
 if(d.ch)for(const c of d.ch){try{build(c,n)}catch(e){errs.push((c.n||c.t)+":"+String(e).slice(0,120))}}return}
if(d.t==='I'){n=figma.createRectangle();n.name=d.n;par.appendChild(n);n.resize(Math.max(d.w,.01),Math.max(d.h,.01));n.x=d.x;n.y=d.y;n.fills=[{type:'SOLID',color:{r:.9,g:.92,b:.95}}];rad(n,d.r);if(d.o!=null)n.opacity=d.o;img(d.k+(d.fit==='FIT'?'|FIT':''),n.id);return}
if(d.t==='V'){try{n=figma.createNodeFromSvg(typeof d.svg==='number'?D.S[d.svg]:d.svg)}catch(e){errs.push(d.n+':'+String(e).slice(0,80));n=figma.createFrame();n.fills=[]}
 n.name=d.n;par.appendChild(n);if(Math.abs(n.width-d.w)>.5||Math.abs(n.height-d.h)>.5){const s=Math.min(d.w/n.width,d.h/n.height);if(isFinite(s)&&s>0)n.rescale(s)}
 n.x=d.x+(d.w-n.width)/2;n.y=d.y+(d.h-n.height)/2;n.fills=[];if(d.o!=null)n.opacity=d.o;return}
if(d.t==='T'){n=figma.createText();par.appendChild(n);n.fontName={family:'Inter',style:'Regular'};
 {const f0=d.s.map(r=>r[0]).join('');if(AR.test(f0)&&/^[^A-Za-z\u0600-\u06FF]*[A-Za-z]/.test(f0))d.s[0][0]='\u200F'+d.s[0][0]}const full=d.s.map(r=>r[0]).join('');const f0=fn(d.s[0][1][0],d.s[0][1][1],AR.test(full),d.s[0][1][7]);n.fontName=f0;n.characters=full;
 let o=0;for(const [tx,st] of d.s){const L=tx.length;if(!L)continue;
  n.setRangeFontSize(o,o+L,st[2]);n.setRangeFills(o,o+L,[sp(st[3])]);
  n.setRangeLineHeight(o,o+L,st[4]?{unit:'PIXELS',value:st[4]}:{unit:'AUTO'});if(st[5])n.setRangeLetterSpacing(o,o+L,{unit:'PIXELS',value:st[5]});
  if(st[6])n.setRangeTextDecoration(o,o+L,st[6]===1?'UNDERLINE':'STRIKETHROUGH');
  let i=0,prev=AR.test(full)?1:0;while(i<L){let a=AR.test(tx[i])?1:(/[A-Za-z]/.test(tx[i])?0:prev);let j=i+1;while(j<L){const c=tx[j];const b=AR.test(c)?1:(/[A-Za-z]/.test(c)?0:a);if(b!==a)break;j++}
   n.setRangeFontName(o+i,o+j,fn(st[0],st[1],a,st[7]));prev=a;i=j}
  o+=L}
 n.textAlignHorizontal={R:'RIGHT',L:'LEFT',C:'CENTER',J:'JUSTIFIED'}[d.al];n.name=full.slice(0,40);
 if(d.m==='W'){n.textAutoResize='WIDTH_AND_HEIGHT';const W=n.width;n.x=d.al==='C'?d.x+(d.w-W)/2:(d.al==='L'?d.x:d.x+d.w-W)}else{n.resize(Math.max(d.w,1),Math.max(d.h,1));n.textAutoResize='HEIGHT';n.x=d.x}
 n.y=d.y+(d.h-n.height)/2;return}}
const LH=D.n.some(n=>n.t==='CL')?await figma.getNodeByIdAsync('8:2'):null;
if(LH){for(const t of LH.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName)}
function clone(d,par){const c=LH.children[d.src].clone();par.appendChild(c);c.x=0;c.y=d.y||0;
 if(d.act!=null){const a=c.children[1].children[d.act];a.name='a.active';a.children[0].fills=[sp('#00298e')];const u=a.children[1];u.resize(a.width,2);u.x=0;u.cornerRadius=1}
 if(d.plain){c.fills=[];c.strokes=[]}cnt++}
for(const d of D.n){try{if(d.t==='CL')clone(d,P);else build(d,P)}catch(e){errs.push((d.n||d.t)+':'+String(e).slice(0,120))}}
return{root:P.id,cnt,imgs,errs};
