// Cell-view sorting engine (after Zhang, Goldstein & Levin 2024).
// Pure logic, no DOM: works in the browser (window.SortEngine) and in Node (module.exports).
(function(root){
const rnd=()=>root.SortEngine&&root.SortEngine.random?root.SortEngine.random():Math.random();
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const before=(a,b,d)=>d>0?a<b:a>b;

function makeArray(c){
  const n=c.n;let keys=Object.keys(c.mix).filter(k=>c.mix[k]>0);if(!keys.length)keys=['bubble'];
  const tot=keys.reduce((a,k)=>a+(c.mix[k]||1),0);const tags=[];
  keys.forEach((k,i)=>{const m=i===keys.length-1?n-tags.length:Math.round(n*(c.mix[k]||1)/tot);for(let j=0;j<m;j++)tags.push(k);});
  shuffle(tags);
  const vals=[];for(let i=0;i<n;i++)vals.push(c.vr>0?1+Math.floor(rnd()*c.vr):i+1);shuffle(vals);
  const cells=vals.map((v,i)=>{const type=c.ctrl?'bubble':tags[i];return {v,tag:tags[i],type,dir:c.dirs[type],frozen:null,ideal:0,busy:false};});
  shuffle([...cells.keys()]).slice(0,Math.min(c.fz,n)).forEach(i=>cells[i].frozen=c.ft);
  return cells;
}
const canSwap=(arr,j)=>arr[j].frozen!=='immovable';
const swap=(arr,i,j)=>{const t=arr[i];arr[i]=arr[j];arr[j]=t;};
function act(arr,i){
  const c=arr[i];if(c.frozen)return false;const n=arr.length,d=c.dir;
  if(c.type==='bubble'){
    for(const s of (rnd()<.5?[-1,1]:[1,-1])){const j=i+s;if(j<0||j>=n)continue;
      if(s<0&&before(c.v,arr[j].v,d)&&canSwap(arr,j)){swap(arr,i,j);return true;}
      if(s>0&&before(arr[j].v,c.v,d)&&canSwap(arr,j)){swap(arr,i,j);return true;}}
    return false;}
  if(c.type==='insertion'){
    if(i===0)return false;
    for(let k=0;k<i-1;k++)if(before(arr[k+1].v,arr[k].v,d))return false;
    if(before(c.v,arr[i-1].v,d)&&canSwap(arr,i-1)){swap(arr,i,i-1);return true;}
    return false;}
  // selection
  if(c.ideal>=i){c.ideal=i;for(let k=0;k<i;k++)if(before(c.v,arr[k].v,d)&&canSwap(arr,k)){c.ideal=0;c.busy=true;break;}return false;}
  const j=c.ideal;
  if(before(c.v,arr[j].v,d)&&canSwap(arr,j)){const o=arr[j];swap(arr,i,j);o.ideal=0;return true;}
  c.ideal++;c.busy=true;return false;
}
const sortedness=a=>{let ok=0;for(let i=0;i<a.length-1;i++)if(a[i].v<=a[i+1].v)ok++;return ok/(a.length-1);};
const inversions=a=>{let c=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i].v>a[j].v)c++;return c;};
const aggregation=a=>{let s=0;for(let i=0;i<a.length-1;i++)if(a[i].tag===a[i+1].tag)s++;return s/(a.length-1);};
function chanceOf(a){const n=a.length,cnt={};a.forEach(c=>cnt[c.tag]=(cnt[c.tag]||0)+1);let p=0;for(const k in cnt)p+=cnt[k]*(cnt[k]-1);return p/(n*(n-1));}

// A simulation that advances one cell action at a time
function Sim(cfg){
  const arr=makeArray(cfg);const s={arr,queue:[],changed:false,done:false,swaps:0,
    S:[sortedness(arr)],I:[],A:[aggregation(arr)],inv0:inversions(arr),inv:0,dipsS:0,dipsI:0,peak:aggregation(arr),chance:chanceOf(arr)};
  s.inv=s.inv0;s.I.push(s.inv0?0:1);
  s.tick=(k,record=true)=>{
    for(let t=0;t<k&&!s.done;t++){
      if(!s.queue.length){
        if(s.started&&!s.changed){s.done=true;break;}
        s.queue=shuffle(arr.slice());s.changed=false;s.started=true;}
      const cell=s.queue.pop();cell.busy=false;const i=arr.indexOf(cell);
      if(act(arr,i)){s.changed=true;s.swaps++;
        if(record){const so=sortedness(arr),iv=inversions(arr),ag=aggregation(arr);
          if(so<s.S[s.S.length-1])s.dipsS++; if(iv>s.inv)s.dipsI++;
          s.inv=iv;s.S.push(so);s.I.push(s.inv0?1-iv/s.inv0:1);s.A.push(ag);if(ag>s.peak)s.peak=ag;}
        else s.A.push(aggregation(arr));
      } else if(cell.busy)s.changed=true;
      if(s.swaps>60000)s.done=true;
    }
  };
  return s;
}


const api={makeArray,act,Sim,sortedness,inversions,aggregation,chanceOf,shuffle,before};
if(typeof module!=='undefined'&&module.exports)module.exports=api; else root.SortEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
