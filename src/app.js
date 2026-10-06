// UI: controls, drawing, batch runs. Simulation logic lives in engine.js.
(()=>{
const $=id=>document.getElementById(id);
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const {Sim,sortedness}=window.SortEngine;

function readCfg(){
  return {n:+$('n').value,mix:{bubble:+$('mb').value,insertion:+$('mi').value,selection:+$('ms').value},
    vr:+$('vr').value,fz:+$('fz').value,ft:$('ft').value,
    dirs:{bubble:$('dB').checked?-1:1,insertion:$('dI').checked?-1:1,selection:$('dS').checked?-1:1},
    ctrl:$('ctrl').checked};
}
// ---------- drawing ----------
function fit(cv){const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);const g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);return [g,r.width,r.height];}
const typeColor=c=>c.frozen?css('--frozen'):css('--'+c.type);
function drawStrip(sim){
  const [g,W,H]=fit($('strip'));const a=sim.arr,n=a.length,maxV=Math.max(...a.map(c=>c.v));
  const bw=W/n,tagH=10,top=4,bh=H-tagH-top-6;
  g.clearRect(0,0,W,H);
  a.forEach((c,i)=>{const h=Math.max(2,bh*c.v/maxV);g.fillStyle=typeColor(c);g.globalAlpha=c.frozen?.55:1;
    g.fillRect(i*bw+.5,top+bh-h,Math.max(1,bw-1),h);g.globalAlpha=1;
    if(c.frozen){g.strokeStyle=css('--ink');g.lineWidth=1;g.strokeRect(i*bw+.5,top+bh-h,Math.max(1,bw-1),h);}
    g.fillStyle=css('--'+c.tag);g.fillRect(i*bw,H-tagH,Math.ceil(bw),tagH);});
}
function drawTrace(cv,series,opts){
  const [g,W,H]=fit(cv);const L=34,R=8,T=8,B=20,w=W-L-R,h=H-T-B;
  g.clearRect(0,0,W,H);g.font='11px '+css('--f-mono');g.fillStyle=css('--muted');g.strokeStyle=css('--grid');g.lineWidth=1;
  const [y0,y1]=opts.range;
  for(let k=0;k<=4;k++){const v=y0+(y1-y0)*k/4,y=T+h-(v-y0)/(y1-y0)*h;g.beginPath();g.moveTo(L,y);g.lineTo(L+w,y);g.stroke();g.fillText(v.toFixed(2),2,y+4);}
  const maxX=Math.max(1,...series.map(s=>s.data.length-1));
  g.fillText(opts.xlabel(0),L,H-5);const xl=opts.xlabel(maxX);g.fillText(xl,L+w-g.measureText(xl).width,H-5);
  series.forEach(s=>{const d=s.data;if(!d.length)return;g.strokeStyle=s.color;g.lineWidth=s.width||1.6;g.setLineDash(s.dash||[]);g.beginPath();
    const step=Math.max(1,Math.floor(d.length/(w*1.5)));
    for(let i=0;i<d.length;i+=step){const x=L+i/maxX*w,y=T+h-(d[i]-y0)/(y1-y0)*h;i?g.lineTo(x,y):g.moveTo(x,y);}
    const i=d.length-1;g.lineTo(L+i/maxX*w,T+h-(d[i]-y0)/(y1-y0)*h);g.stroke();g.setLineDash([]);});
}
function render(){
  drawStrip(sim);
  drawTrace($('traceSort'),[{data:sim.S,color:css('--accent')},{data:sim.I,color:css('--good'),dash:[4,3]}],{range:[0,1],xlabel:x=>x+(x?' swaps':'')});
  const ch=sim.A.map(()=>sim.chance);
  drawTrace($('traceAgg'),[{data:ch,color:css('--chance'),dash:[3,3],width:1},{data:sim.A,color:css('--selection'),width:1.8}],{range:[0,1],xlabel:x=>x+(x?' swaps':'')});
  $('sSwaps').textContent=sim.swaps.toLocaleString();
  $('sSorted').textContent=(100*sim.S[sim.S.length-1]).toFixed(1)+'%';
  $('sInv').textContent=(100*sim.I[sim.I.length-1]).toFixed(1)+'%';
  $('sAgg').textContent=sim.A[sim.A.length-1].toFixed(2);
  $('sPeak').textContent=sim.peak.toFixed(2);$('sChance').textContent=sim.chance.toFixed(2);
  $('sDips').textContent=sim.dipsS+' / '+sim.dipsI;
  if(lastBatch)drawBatch();
}

// ---------- batch ----------
let lastBatch=null;
function drawBatch(){drawTrace($('traceBatch'),[{data:lastBatch.mean.map(()=>lastBatch.chance),color:css('--chance'),dash:[3,3],width:1},{data:lastBatch.mean,color:css('--selection'),width:2}],{range:[0,1],xlabel:x=>x?'1.0':'0'});}
function runBatch(){
  const cfg=readCfg(),trials=40,bins=50,acc=new Array(bins+1).fill(0);let done=0,chance=0,peaks=0,finals=0;
  $('batch').disabled=true;
  const one=()=>{
    const s=Sim(cfg);while(!s.done)s.tick(5000,false);
    const A=s.A;for(let b=0;b<=bins;b++)acc[b]+=A[Math.round(b/bins*(A.length-1))];
    chance+=s.chance;peaks+=Math.max(...A);finals+=sortedness(s.arr);done++;
    $('batchNote').textContent=`${done}/${trials} trials`;
    if(done<trials)setTimeout(one,0);
    else{lastBatch={mean:acc.map(x=>x/trials),chance:chance/trials};drawBatch();$('batch').disabled=false;
      const m=lastBatch.mean,pk=Math.max(...m),at=m.indexOf(pk)/bins;
      $('batchNote').textContent=`Mean peak ${pk.toFixed(2)} at ${(at*100).toFixed(0)}% progress · chance ${lastBatch.chance.toFixed(2)} · final sortedness ${(100*finals/trials).toFixed(1)}%`;}
  };one();
}

// ---------- presets & controls ----------
const presets=[
  {name:'Clustering: Bubble + Selection',sub:'The paper’s headline effect',set:{mb:50,mi:0,ms:50,vr:0,fz:0,ctrl:false}},
  {name:'Clustering: Bubble + Insertion',sub:'Smaller, earlier hump',set:{mb:50,mi:50,ms:0,vr:0,fz:0,ctrl:false}},
  {name:'Control: tags only',sub:'Same colours, everyone runs Bubble',set:{mb:50,mi:0,ms:50,vr:0,fz:0,ctrl:true}},
  {name:'Damaged cells',sub:'5 movable frozen, pure Bubble',set:{mb:100,mi:0,ms:0,vr:0,fz:5,ft:'movable',ctrl:false}},
  {name:'Duplicate values',sub:'10 distinct values, clusters can persist',set:{mb:50,mi:0,ms:50,vr:10,fz:0,ctrl:false}},
  {name:'Conflicting goals',sub:'Bubble ascending, Selection descending',set:{mb:50,mi:0,ms:50,vr:0,fz:0,ctrl:false,dS:true}},
];
const box=$('presets');
presets.forEach(p=>{const b=document.createElement('button');b.innerHTML=`${p.name}<small>${p.sub}</small>`;b.onclick=()=>applyPreset(p);box.appendChild(b);});
function applyPreset(p){
  const s=p.set;['mb','mi','ms','vr','fz'].forEach(k=>$(k).value=s[k]);$('ft').value=s.ft||'movable';
  $('ctrl').checked=!!s.ctrl;$('dB').checked=!!s.dB;$('dI').checked=false;$('dS').checked=!!s.dS;
  $('presetTitle').textContent=p.name;lastBatch=null;$('batchNote').textContent='';fit($('traceBatch'));syncOutputs();reset();
}
function syncOutputs(){$('nOut').value=$('n').value;$('mbOut').value=$('mb').value;$('miOut').value=$('mi').value;$('msOut').value=$('ms').value;
  $('vrOut').value=+$('vr').value?$('vr').value:'unique';$('fzOut').value=$('fz').value;$('spOut').value=$('sp').value;}
document.querySelectorAll('aside input, aside select').forEach(el=>{if(el.id==='sp')el.addEventListener('input',syncOutputs);
  else el.addEventListener('change',()=>{syncOutputs();$('presetTitle').textContent='Custom setup';reset();});
  el.addEventListener('input',syncOutputs);});

let sim,running=false,raf=0;
function reset(){running=false;cancelAnimationFrame(raf);$('run').textContent='Run';sim=Sim(readCfg());render();}
function loop(){sim.tick(+$('sp').value);render();if(sim.done){running=false;$('run').textContent='Run';return;}if(running)raf=requestAnimationFrame(loop);}
$('run').onclick=()=>{if(sim.done)reset();running=!running;$('run').textContent=running?'Pause':'Run';if(running)loop();};
$('stepBtn').onclick=()=>{running=false;$('run').textContent='Run';const before=sim.swaps;let guard=0;while(sim.swaps===before&&!sim.done&&guard++<5000)sim.tick(1);render();};
$('reset').onclick=reset;$('batch').onclick=runBatch;
window.addEventListener('resize',render);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',render);
new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
syncOutputs();reset();
if(document.fonts)document.fonts.ready.then(render);
})();
