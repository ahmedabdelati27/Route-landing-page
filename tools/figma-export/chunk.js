const fs=require('fs');const B=fs.readFileSync(__dirname+'/builder.js','utf8');
const PAGES={index:'Home',courses:'Courses',course:'Course Details',leadership:'Leadership',privacy:'Privacy Policy',terms:'Terms'};
const LIMIT=+process.env.LIMIT||42000;
fs.mkdirSync(__dirname+'/chunks',{recursive:true});
for(const [f,pgName] of Object.entries(PAGES)){
  const {tree}=JSON.parse(fs.readFileSync(`${__dirname}/out/${f}.json`));
  const rn=`${pgName} — Desktop 1440`;
  const ACT={index:0,courses:1,course:1};
  if(f!=='leadership'){const L=tree.ch.length-1;const ft=tree.ch[L];tree.ch[0]={t:'CL',src:0,act:ACT[f]};tree.ch[L]={t:'CL',src:2,y:ft.y,plain:!ft.f};}
  const chunks=[];
  const sz=o=>JSON.stringify(o).length;
  function emit(list,path){
    let pack=[],deferred=[];
    const flush=()=>{if(pack.length){chunks.push({p:path,n:pack});pack=[]} for(const [c,i] of deferred)emit(c,[...path,i]);deferred=[]};
    list.forEach((node,i)=>{
      let item=node;
      if(sz(node)>LIMIT){const {ch,...shell}=node;item=shell;deferred.push([ch||[],i]);}
      if(sz(pack)+sz(item)>LIMIT)flush();
      pack.push(item);
    });
    flush();
  }
  const SKIP=JSON.parse(process.env.SKIP||'{}');
  if(SKIP[f]!=null){const main=tree.ch[1];emit(main.ch.slice(SKIP[f]),[1]);}else emit(tree.ch,[]);
  chunks.forEach((c,i)=>{
    const S=[],idx=new Map();
    const dd=o=>{if(o.svg){let v=o.svg.replace(/ aria-hidden="true"| focusable="false"| role="img"| aria-label="[^"]*"/g,'');if(!idx.has(v)){idx.set(v,S.length);S.push(v)}o.svg=idx.get(v)}(o.ch||[]).forEach(dd)};
    c.n.forEach(dd);
    const D={pg:pgName,rn,p:c.p,S,n:c.n};
    if(i===0)D.root={n:rn,w:tree.w,h:tree.h,x:0,f:tree.f};
    const code='const D='+JSON.stringify(D).replace(/,\{"t":"F"/g,',\n{"t":"F"').replace(/","<svg/g,'",\n"<svg')+';\nconst AF=Object.getPrototypeOf(async function(){}).constructor;return await new AF("D",(await figma.getNodeByIdAsync("11:3")).characters)(D);';
    fs.writeFileSync(`${__dirname}/chunks/${f}_${String(i).padStart(2,'0')}.js`,code);
  });
  console.log(f,chunks.length,chunks.map(c=>JSON.stringify(c.p)+':'+sz(c.n)).join(' '));
}
