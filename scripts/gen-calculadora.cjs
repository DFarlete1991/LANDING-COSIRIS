// Genera engine.js, markup.ts y plan-calculator.css desde la calculadora HTML de Cosiris.
// Uso: node gen-calc3.cjs <calculadora.html> <carpeta-salida> <repo-root>
const fs = require('fs');
const path = require('path');
const [, , SRC, OUT, REPO] = process.argv;
const postcss = require(path.join(REPO, 'node_modules', 'postcss'));

const html = fs.readFileSync(SRC, 'utf8');
fs.mkdirSync(OUT, { recursive: true });

function rep(s, from, to, { all = false, min = 1 } = {}) {
  const n = s.split(from).length - 1;
  if (n < min) throw new Error('No encontrado: ' + String(from).slice(0, 120));
  return all ? s.split(from).join(to) : s.replace(from, to);
}
function repRe(s, re, to) {
  if (!re.test(s)) throw new Error('No encontrado (re): ' + re);
  return s.replace(re, to);
}

/* ---------- partes del HTML ---------- */
const styles = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]);
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const bodyStart = html.lastIndexOf('</style>') + '</style>'.length;
let body = html.slice(bodyStart, html.indexOf('<script'));

/* ---------- markup ---------- */
body = repRe(body, /<header class="m-top bar">[\s\S]*?<\/header>\s*/, '');
body = rep(body, '<span class="m-pill">Calculadora ROI</span>', '<p class="pc-kicker">Calcula el retorno de la inversión de tu campaña de captación</p>');
body = rep(body, '<h1>', '<h1 class="pc-h1">');
body = repRe(body, /(<label class="fl full"><span>Zona en la que te encuentras<\/span><input name="zona"[^>]*><\/label>)/,
  '$1 <label class="fl full"><span>Número de empleados</span><select name="empleados" required><option value="">Selecciona…</option><option value="1-2">1-2</option><option value="3-5">3-5</option><option value="6-10">6-10</option><option value="+10">+10</option></select></label>');
body = rep(body, 'contactarme por teléfono o email sobre él.</span>',
  'contactarme por teléfono o email sobre él, según la <a href="/privacidad" target="_blank" rel="noopener">Política de Privacidad</a>.</span>');
if (/data:image/.test(body)) throw new Error('Queda una imagen base64 en el markup');
body = body.trim();
fs.writeFileSync(path.join(OUT, 'markup.ts'),
  '// Generado desde la calculadora HTML original.\nexport const PLAN_MARKUP = ' + JSON.stringify(body) + ';\n');

/* ---------- css ---------- */
const css = styles.slice(1).join('\n'); // el primero es la base de la plataforma de diseño
const root = postcss.parse(css);
const kf = new Set();
root.walkAtRules(/keyframes$/, a => { kf.add(a.params); a.params = 'pc-' + a.params; });
root.walkDecls(/^animation(-name)?$/, d => {
  kf.forEach(k => { d.value = d.value.replace(new RegExp('(^|[\\s,])' + k + '(?=$|[\\s,])', 'g'), '$1pc-' + k); });
});
const scopeSel = sel => {
  sel = sel.trim();
  if (sel === ':root') return '.plan-calc,#ftip';
  if (sel.startsWith('#ftip')) return sel;
  if (/^(html|body)\b/.test(sel)) return sel.replace(/^(html|body)/, '.plan-calc');
  sel = sel.replace(/(^|[\s>+~(,])h1\b/g, '$1.pc-h1');
  return '.plan-calc ' + sel;
};
root.walkRules(r => {
  if (r.parent && r.parent.type === 'atrule' && /keyframes$/.test(r.parent.name)) return;
  const wasBody = r.selectors.some(s => /^(html|body)\b/.test(s.trim()));
  r.selectors = r.selectors.map(scopeSel);
  if (wasBody) r.walkDecls(/^padding-(inline|block)$/, d => d.remove());
});
let outCss = '/* Generado desde la calculadora HTML original: estilos limitados a .plan-calc */\n' + root.toString().trim() + '\n' +
  '.plan-calc.pc-portal{background:none}\n.plan-calc .months{scroll-margin-top:96px}\n.plan-calc .chk a{color:var(--orange-d);font-weight:700;text-decoration:underline}\n';
fs.writeFileSync(path.join(OUT, 'plan-calculator.css'), outCss);

/* ---------- engine ---------- */
let js = script;
js = rep(js, '(function(){', `/* eslint-disable */
// Calculadora "Plan de captación" (lógica original de la versión HTML entregada
// por Cosiris), adaptada para montarse dentro de un componente React:
// - Todo se busca dentro de \`root\` (o del portal del modal), no en document.
// - Los listeners globales se quitan al desmontar (AbortController).
// - El modal de lead y el visor del PDF se mueven a <body> para que su
//   position:fixed no dependa de transformaciones de los contenedores.
// - El lead se entrega a \`opts.onLead\` y la web lo envía a su webhook.
export function mountPlanCalculator(root, opts){
  const ac=new AbortController();
  const on=(t,ev,fn,o)=>t.addEventListener(ev,fn,Object.assign(typeof o==="boolean"?{capture:o}:(o||{}),{signal:ac.signal}));
  const portal=document.createElement("div");portal.className="plan-calc pc-portal";
  ["leadM","viewer"].forEach(id=>{const el=root.querySelector("#"+id);if(el)portal.appendChild(el);});
  document.body.appendChild(portal);
  let io=null, ft=null;
`);
js = rep(js, 'const $=id=>document.getElementById(id);', 'const $=id=>root.querySelector("#"+id)||portal.querySelector("#"+id);');
js = rep(js, 'const val=n=>document.querySelector(', 'const val=n=>root.querySelector(');
js = rep(js, `document.querySelectorAll('input[type="radio"]')`, `root.querySelectorAll('input[type="radio"]')`);
js = rep(js, 'document.querySelector(`input[name="pack"][value="${v}"]`)', 'root.querySelector(`input[name="pack"][value="${v}"]`)');
js = rep(js, 'if("IntersectionObserver" in window)new IntersectionObserver(es=>es.forEach(e=>$("mBar").classList.toggle("off",e.isIntersecting)),{threshold:0.05}).observe($("sum"));',
  'if("IntersectionObserver" in window){let inRoot=false,inSum=false;const upd=()=>$("mBar").classList.toggle("off",!inRoot||inSum);io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.target===root)inRoot=e.isIntersecting;else inSum=e.isIntersecting;});upd();},{threshold:0.05});io.observe(root);io.observe($("sum"));}');
js = rep(js, 'loadImg(`pages/p', 'loadImg(`/calculadora/pages/p', { all: true, min: 2 });
js = rep(js, 'let rt;window.addEventListener("resize",', 'let rt;on(window,"resize",');
js = rep(js, 'const ft=document.createElement("div");ft.id="ftip"', 'ft=document.createElement("div");ft.id="ftip"');
js = rep(js, 'document.addEventListener(', 'on(document,', { all: true });
js = rep(js, 'window.addEventListener("scroll",hideT,{passive:true});', 'on(window,"scroll",hideT,{passive:true});');
js = rep(js, 'const LOGO_O=()=>document.querySelector(".bar img");', 'const LOGO_O="/calculadora/logo-color.png";');
js = repRe(js, /const LOGO_W="data:[^"]+";/, 'const LOGO_W="/calculadora/logo-white.png";');
js = rep(js, 'lg=dark?await loadImg(LOGO_W):LOGO_O()', 'lg=await loadImg(dark?LOGO_W:LOGO_O)');
js = repRe(js, /\s*let dlP=null;\n.*\n\s*setTimeout\(getDownloads,0\);/, '');
js = repRe(js, /try\{const dl=await getDownloads\(\);\n\s*if\(dl\)\{[^\n]*\}\n\s*else\{const a=/, 'try{\n      {const a=');
js = rep(js, 'const {jsPDF}=window.jspdf;', 'const {jsPDF}=await import("jspdf");');
js = repRe(js, /\n\s*window\.__cosPdf=makePdf;/, '');
js = repRe(js, /\n\s*\/\* ---- Lead → HubSpot[^\n]*\n\s*const HS_PORTAL=[^\n]*/, '');
js = repRe(js, /async function sendLead\(kind\)\{\n[\s\S]*?catch\(e\)\{return false;\}\}/,
  'async function sendLead(kind){try{return !!(await opts.onLead({...LEAD,summary:leadSummary(kind)}));}catch(e){return false;}}');
js = rep(js, '["nombre","inmobiliaria","email","telefono","zona"]', '["nombre","inmobiliaria","email","telefono","zona","empleados"]', { all: true, min: 2 });
js = rep(js, 'if(d.zona.length<2)bad.push("zona");', 'if(d.zona.length<2)bad.push("zona");if(!d.empleados)bad.push("empleados");');
js = rep(js, 'document.querySelectorAll(".dlb")', 'root.querySelectorAll(".dlb")', { all: true, min: 2 });
js = rep(js, 'if(LEAD){sendLead(kind);doDownload(kind);}', 'if(LEAD){doDownload(kind);}');
// Etiquetas del eje X: que la penúltima no se monte sobre la última en móvil.
js = rep(js, 'if((W<520&&n>6||n>14)&&i%2===1&&i!==n-1)return;', 'if((W<520&&n>6||n>14)&&((i%2===1&&i!==n-1)||(i===n-2&&(n-1)%2===1)))return;');
// PDF página 2: la cifra grande se encoge si no cabe junto al subtítulo.
js = rep(js, 'k.t(w[1],BX+BW-40,y+44,{w:800,s:i===2?44:38,c:K.white,a:"right"});',
  'k.f(500,17);const subW=x.measureText(w[2]).width;let fs=i===2?44:38;k.f(800,fs);while(fs>24&&x.measureText(w[1]).width>BW-80-subW-20){fs-=2;k.f(800,fs);}k.t(w[1],BX+BW-40,y+44,{w:800,s:fs,c:K.white,a:"right"});');
js = repRe(js, /\}\)\(\);\s*$/, '\n  return ()=>{ac.abort();if(io)io.disconnect();if(ft)ft.remove();portal.remove();if(OUT&&OUT.url)URL.revokeObjectURL(OUT.url);};\n}\n');
if (/data:image/.test(js)) throw new Error('Queda una imagen base64 en engine.js');
fs.writeFileSync(path.join(OUT, 'engine.js'), js.replace(/^\s*\n/, ''));
console.log('OK', { markup: body.length, css: outCss.length, js: js.length, keyframes: [...kf] });
