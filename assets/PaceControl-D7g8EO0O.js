import{c,u as g}from"./index-v0OCzsSk.js";import{j as n}from"./motion-BKZRgHTS.js";import{r as d}from"./react-B699V9yx.js";/**
 * @license lucide-react v1.68.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l={name:"gauge",size:24,node:[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]]};l.node;const f=c(l);/**
 * @license lucide-react v1.68.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h={name:"pause",size:24,node:[["rect",{x:"14",y:"3",width:"5",height:"18",rx:"1",key:"kaeet6"}],["rect",{x:"5",y:"3",width:"5",height:"18",rx:"1",key:"1wsw3u"}]]};h.node;const v=c(h);/**
 * @license lucide-react v1.68.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p={name:"play",size:24,node:[["path",{d:"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",key:"10ikf1"}]]};p.node;const z=c(p);/**
 * @license lucide-react v1.68.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m={name:"rotate-ccw",size:24,node:[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]};m.node;const E=c(m);/**
 * @license lucide-react v1.68.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u={name:"swords",size:24,node:[["path",{d:"m13 19 6-6",key:"gj6q8g"}],["path",{d:"M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5",key:"uwfxh8"}],["path",{d:"m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586",key:"1f17hx"}],["path",{d:"m16 16 4 4",key:"up5ibb"}],["path",{d:"m19 21 2-2",key:"1phfkn"}],["path",{d:"m5 14 4 4",key:"1gk0qx"}],["path",{d:"m5 21-2-2",key:"1kw20b"}],["path",{d:"M7.5 16.5 4 20",key:"14nozp"}]]};u.node;const M=c(u),x=[.5,.75,1,1.5],k="xchain-pace",r=new Set;function w(){try{const e=Number(localStorage.getItem(k));return x.includes(e)?e:1}catch{return 1}}let o=w();const N=()=>o;function b(e){o=e;try{localStorage.setItem(k,String(e))}catch{}r.forEach(t=>t())}function P(){const[e,t]=d.useState(o);return d.useEffect(()=>{const a=()=>t(o);return r.add(a),()=>void r.delete(a)},[]),[e,b]}async function D(e){let t=0;for(;t<e;)await new Promise(a=>setTimeout(a,100)),t+=100*o}function $({compact:e}){const{t,lang:a}=g(),[i,y]=P();return n.jsxs("div",{className:"flex items-center gap-1.5",title:t("pace.title"),children:[!e&&n.jsxs("span",{className:"flex items-center gap-1 text-[11px] text-slate-400",children:[n.jsx(f,{className:"h-3.5 w-3.5"})," ",t("pace.label")]}),n.jsx("div",{role:"radiogroup","aria-label":t("pace.title"),className:"flex rounded-lg border border-white/10 p-0.5 text-xs",children:x.map(s=>n.jsxs("button",{role:"radio","aria-checked":i===s,onClick:()=>y(s),className:`rounded-md px-2 py-0.5 font-semibold tabular-nums transition ${i===s?"bg-slate-100 text-surface-0":"text-slate-400 hover:text-white"}`,children:[a==="vi"?String(s).replace(".",","):s,"×"]},s))})]})}export{f as G,v as P,E as R,M as S,z as a,$ as b,N as g,D as p,P as u};
