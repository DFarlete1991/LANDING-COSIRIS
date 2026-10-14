// Calculadora "Plan de captación" (lógica original de la versión HTML entregada
// por Cosiris), adaptada para montarse dentro de un componente React:
// - Todo se busca dentro de `root` (o del portal del modal), no en document.
// - Los listeners globales se quitan al desmontar (AbortController).
// - El modal de lead y el visor del PDF se mueven a <body> para que su
//   position:fixed no dependa de transformaciones de los contenedores.
// - El lead se entrega a `opts.onLead` y la web lo envía a su webhook.
export function mountPlanCalculator(root, opts){
  const ac=new AbortController();
  const on=(t,ev,fn,o)=>t.addEventListener(ev,fn,Object.assign(typeof o==="boolean"?{capture:o}:(o||{}),{signal:ac.signal}));
  const portal=document.createElement("div");portal.className="plan-calc pc-portal";
  ["leadM","viewer"].forEach(id=>{const el=root.querySelector("#"+id);if(el)portal.appendChild(el);});
  document.body.appendChild(portal);
  let io=null, ft=null;


  const FEES={12:[90,190,290,290,290,290,390,390,390,390,390,390],6:[190,290,290,390,390,390],3:[390,390,390]}, TARIFA=390;
  const yearSave=perm=>12*TARIFA-(FEES[perm].reduce((a,b)=>a+b,0)+(12-perm)*TARIFA);
  const ADD={basico:0,avanzado:90,premium:190}, NAME={basico:"Básico",avanzado:"Avanzado",premium:"Premium"};
  const ACT=90, MIN=300; let LAST=null;
  const $=id=>root.querySelector("#"+id)||portal.querySelector("#"+id);
  const val=n=>root.querySelector(`input[name="${n}"]:checked`).value;
  const grp=n=>{const neg=n<0;let s=Math.abs(n).toFixed(2);let [i,d]=s.split(".");i=i.replace(/\B(?=(\d{3})+(?!\d))/g,".");return (neg?"−":"")+i+(d==="00"?"":","+d);};
  const eur=n=>grp(n)+" €";
  const dec1=n=>{const s=(Math.round(n*10)/10).toFixed(1).replace(".",",");return s.endsWith(",0")?s.slice(0,-2):s;};

  const kfmt=v=>{const a=Math.abs(v);const s=a>=1000?(Math.round(a/100)/10).toString().replace(".",",")+" k€":Math.round(a)+" €";return (v<0?"−":"")+s;};
  /* Modelo de maduración: de los leads que entran un mes, unos están calientes (se captan enseguida) y otros fríos (tardan meses). */
  const MAT=[0.15,0.15,0.2,0.2,0.15,0.15], CPL=37.5, LPC=17.5, SELL=0.5, LAG=3;
  function project(r){
    const com=Math.max(0,+$("com").value||0), H=r.perm+MAT.length-1+LAG;
    const fees=[],ads=[],rev=[],labels=[],soldC=[],capC=[],capM=[];let cf=0,ca=0,cap=0,rv=0,be=0,sc=0;
    for(let m=1;m<=H;m++){
      const inC=m<=r.perm;
      cf+=inC?r.paid[m-1]+(m===1?r.act:0):0; ca+=inC?r.inv:0;
      let c=0;for(let k=1;k<=Math.min(m,r.perm);k++){const d=m-k;if(d<MAT.length)c+=r.inv/CPL/LPC*MAT[d];}
      capM.push(c);cap+=c;
      const sold=m>LAG?capM[m-1-LAG]*SELL:0; rv+=sold*com; sc+=sold;
      soldC.push(sc);rev.push(rv);capC.push(cap);fees.push(cf);ads.push(ca);labels.push("M"+m);
      if(!be&&rv>=cf+ca&&rv>0)be=m;
    }
    const tot=cf+ca, net=rv-tot;
    return {fees,ads,rev,labels,cap,ven:sc,be,com,soldC,revC:rev,capC,capM,tot,net,H};
  }
  /* Escalera ilustrativa: cada mes entran leads (inversión ÷ 30 €), la bolsa engorda y 1 de cada 15 leads acaba en captación.
     Un 30 % están calientes (se captan el mismo mes); el resto madura en los 5 meses siguientes. */
  const WMAT=[0.3,0.15,0.15,0.15,0.15,0.1], WCPL=30, WLPC=15;
  function whyModel(perm,inv){
    const L=inv/WCPL, rows=[];let bag=0,cN=0,cT=0,rN=0,rT=0;
    for(let m=1;m<=12;m++){
      const nw=m<=perm?L:0; bag+=nw;
      let eN=nw/WLPC*WMAT[0], eT=0;
      for(let c=1;c<=Math.min(m,perm);c++){const d=m-c;if(d<WMAT.length)eT+=L/WLPC*WMAT[d];}
      cN+=eN;cT+=eT;const nN=Math.round(cN)-rN,nT=Math.round(cT)-rT;rN+=nN;rT+=nT;
      const hN=Math.max(0,Math.min(nN,nT));
      rows.push({m,inv:m<=perm?inv:0,nw,bag,hN,hO:Math.max(0,nT-hN),tot:rT});
    }
    return rows;
  }
  const house=(x,y,sz,fill)=>`<path d="M${x} ${y+sz*0.45}L${x+sz/2} ${y}L${x+sz} ${y+sz*0.45}V${y+sz}H${x}Z" fill="${fill}"/><rect x="${x+sz*0.4}" y="${y+sz*0.62}" width="${sz*0.2}" height="${sz*0.38}" fill="#fff"/>`;
  function renderWhy(r){
    const rows=whyModel(r.perm,r.inv), full=whyModel(12,r.inv);
    const W=Math.max(320,Math.min(1060,$("whyChart").clientWidth||760)), small=W<620;
    const n=12, pl=8, pr=8, colW=(W-pl-pr)/n, base=small?250:300, top=60, maxBag=full.at(-1).bag||1;
    const Y=v=>base-(v/maxBag)*(base-top-80)-(small?22:36), hs=Math.min(22,colW*0.42);
    let g="",path=`M${pl} ${base}`;
    rows.forEach((d,i)=>{const x=pl+i*colW, y=Y(d.bag);
      if(r.perm<12&&d.m>r.perm){const gy=Y(full[i].bag);g+=`<rect x="${x+2}" y="${gy}" width="${colW-4}" height="${y-gy}" fill="none" stroke="#C9CDDC" stroke-width="1.5" stroke-dasharray="4 3" rx="4"/>`;}
      g+=`<rect x="${x}" y="${y}" width="${colW}" height="${base-y}" fill="${d.m<=r.perm?"#FFE8D2":"#F1EEEA"}"/>`;
      path+=`V${y}H${x+colW}`;
      g+=`<text x="${x+colW/2}" y="${y+16}" text-anchor="middle" font-size="${small?10:12}" font-weight="800" fill="#13204A">${Math.round(d.bag)}</text>`;
      if(!small||i===0)g+=`<text x="${x+colW/2}" y="${y+29}" text-anchor="middle" font-size="9.5" font-weight="600" fill="#8A8FA3">leads</text>`;
      let k=0;const hh=[...Array(d.hN).fill("#FF8C19"),...Array(d.hO).fill("#13204A")];
      hh.forEach(c=>{const col=k%2,row=Math.floor(k/2);g+=house(x+colW/2-(hh.length>1?hs+1:hs/2)+col*(hs+2),y-8-hs-row*(hs+3),hs,c);k++;});
      // pie
      g+=`<text x="${x+colW/2}" y="${base+16}" text-anchor="middle" font-size="${small?10:11.5}" font-weight="800" fill="#13204A">${small?"M":"Mes "}${d.m}</text>`;
      if(!small){g+=`<text x="${x+colW/2}" y="${base+31}" text-anchor="middle" font-size="10.5" font-weight="600" fill="${d.inv?"#2F5BEA":"#8A8FA3"}">${d.inv?grp(d.inv)+" €":"—"}</text>`;
        g+=`<text x="${x+colW/2}" y="${base+45}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${d.nw?"#C24E08":"#8A8FA3"}">${d.nw?"+"+Math.round(d.nw)+" leads":"sin nuevos"}</text>`;}
    });
    path+=`V${base}`;
    g=g+`<path d="${path}" fill="none" stroke="#FF8C19" stroke-width="2.5" stroke-linejoin="round"/><line x1="${pl}" x2="${W-pr}" y1="${base}" y2="${base}" stroke="#13204A" stroke-width="1.5"/>`;
    if(r.perm<12){const xb=pl+r.perm*colW;g+=`<line x1="${xb}" x2="${xb}" y1="${top-34}" y2="${base}" stroke="#C24E08" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${xb+5}" y="${top-24}" font-size="11" font-weight="800" fill="#C24E08">Fin de tu permanencia</text>`;}
    const Hh=base+(small?26:56);
    $("whyChart").innerHTML=`<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Escalera de leads y captaciones mes a mes">${g}</svg>`;
    $("whyGhost").style.display=r.perm<12?"":"none";
    const L=Math.round(r.inv/WCPL), m6=rows[5], tot=rows.at(-1).tot, totF=full.at(-1).tot;
    $("whyTxt").innerHTML=(r.perm<12?`Con ${r.perm} meses: <b>${tot} captaciones</b>. Si continúas el año: <b>${totF}</b>. `:`En 12 meses: <b>${tot} captaciones</b>. `)+`<b>Más tiempo, más captaciones.</b>`;
  }
  function lineChart(o){
    const W=Math.max(300,Math.min(900,o.w||640)),H=o.h,pl=58,pr=16,pt=22,pb=30,iw=W-pl-pr,ih=H-pt-pb,n=o.labels.length;
    const all=o.series.flatMap(s=>s.data);let mn=Math.min(...all),mx=Math.max(...all);
    if(!o.zero){mn=0;} else {mn=Math.min(0,mn);}
    if(mx===mn)mx=mn+1;
    const raw=(mx-mn)/4,mag=Math.pow(10,Math.floor(Math.log10(raw))),step=[1,2,2.5,5,10].map(k=>k*mag).find(v=>v>=raw);
    mn=Math.floor(mn/step)*step; mx=Math.ceil(mx/step)*step; if(mx-(Math.max(...all))<step*0.15)mx+=step; const ticks=Math.round((mx-mn)/step);
    const X=i=>pl+(n===1?iw/2:i*iw/(n-1)), Y=v=>pt+ih-(v-mn)/(mx-mn)*ih;
    let g="";
    if(o.band&&o.band<n){const xb=(X(o.band-1)+X(o.band))/2;const nar=(xb-pl)<130;g+=`<rect x="${pl}" y="${pt}" width="${xb-pl}" height="${ih}" fill="#FFF3E6"/><text x="${pl+6}" y="${pt+14}" font-size="11" font-weight="800" fill="#C24E08">${nar?"Permanencia":"Tu permanencia"}</text><text x="${xb+8}" y="${pt+(nar?32:14)}" font-size="11" font-weight="700" fill="#8A8FA3">Lo captado se sigue vendiendo</text>`;}
    for(let k=0;k<=ticks;k++){const v=mn+step*k,y=Y(v);g+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="#E8E8EC" stroke-width="1"/><text x="${pl-8}" y="${y+4}" text-anchor="end" font-size="11" fill="#8A8FA3" font-weight="600">${o.yFmt(v)}</text>`;}
    if(o.zero&&mn<0){const y=Y(0);g+=`<line x1="${pl}" x2="${W-pr}" y1="${y}" y2="${y}" stroke="#13204A" stroke-width="1.5"/>`;}
    o.labels.forEach((l,i)=>{if((W<520&&n>6||n>14)&&i%2===1&&i!==n-1)return;g+=`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="11" fill="#8A8FA3" font-weight="700">${l}</text>`;});
    o.series.forEach(s=>{
      const pts=s.data.map((v,i)=>`${X(i)},${Y(v)}`).join(" ");
      g+=`<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="${s.width||3}" stroke-linejoin="round" stroke-linecap="round"/>`;
      s.data.forEach((v,i)=>{const last=i===s.data.length-1;if(s.labels||last||s.end)if(s.labels||last){g+=`<circle cx="${X(i)}" cy="${Y(v)}" r="${last?5:3.5}" fill="#fff" stroke="${s.color}" stroke-width="2.5"/>`;}
        if(s.labels&&(W>=520||i===0||last||i===3))g+=`<text x="${X(i)}" y="${Y(v)-10}" text-anchor="middle" font-size="11" font-weight="800" fill="#13204A">${grp(Math.round(v))}</text>`;});
    });
    const ends=o.series.filter(s=>!s.labels).map(s=>({s,v:s.data[s.data.length-1],y:Y(s.data[s.data.length-1])-10})).sort((a,b)=>a.y-b.y);
    for(let i=1;i<ends.length;i++)if(ends[i].y-ends[i-1].y<18)ends[i].y=ends[i-1].y+18;
    ends.forEach(e=>{g+=`<text x="${X(n-1)-10}" y="${e.y}" text-anchor="end" font-size="12" font-weight="800" fill="${e.s.color}" stroke="#fff" stroke-width="3" paint-order="stroke">${kfmt(e.v)}</text>`;});
    if(o.out){o.out.W=W;o.out.X=X;o.out.n=n;o.out.pt=pt;o.out.ih=ih;}
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.series.map(s=>s.name).join(", ")}">${g}</svg>`;
  }
  function hover(id,geo,html){
    const box=$(id); const svg=box.querySelector("svg");
    let tip=box.querySelector(".ctip"),gd=box.querySelector(".cguide");
    if(!tip){tip=document.createElement("div");tip.className="ctip";box.appendChild(tip);gd=document.createElement("div");gd.className="cguide";box.appendChild(gd);}
    const show=ev=>{
      const rc=svg.getBoundingClientRect(), k=rc.width/geo.W;
      const x=(ev.clientX-rc.left)/k; let best=0,bd=1e9;
      for(let i=0;i<geo.n;i++){const d=Math.abs(geo.X(i)-x);if(d<bd){bd=d;best=i;}}
      tip.innerHTML=html(best); tip.style.display="block"; gd.style.display="block";
      const px=geo.X(best)*k; gd.style.left=px+"px"; gd.style.top=(geo.pt*k)+"px"; gd.style.height=(geo.ih*k)+"px";
      const tw=tip.offsetWidth; let lx=px+12; if(lx+tw>rc.width) lx=px-tw-12; if(lx<0) lx=0; tip.style.left=lx+"px"; tip.style.top="4px";
    };
    const hide=()=>{tip.style.display="none";gd.style.display="none";};
    svg.addEventListener("mousemove",show); svg.addEventListener("click",show); svg.addEventListener("mouseleave",hide);
  }
  function calc(){
    const perm=+val("perm"), pack=val("pack");
    let inv=+$("inv").value; if(!(inv>=MIN)) inv=MIN;
    const base=FEES[perm], months=base.map(f=>f+ADD[pack]), paid=months;
    const fees=months.reduce((a,b)=>a+b,0), ads=inv*perm;
    return {perm,pack,inv,base,months,paid,fees,cos:fees,disc:0,act:0,ads,tot:fees+ads};
  }
  function render(){
    const r=calc();
    if($("avg"))$("avg").innerHTML=eur(Math.round(r.fees/r.perm))+"<small>/mes</small>";
    if($("avgS"))$("avgS").textContent=`${r.perm} meses · pack ${NAME[r.pack]} · ${eur(r.fees)} en total`;
    $("rCos").textContent=eur(r.cos);
    const sv=yearSave(r.perm);$("rSave").textContent=sv?("−"+eur(sv)):"0 €";
    $("rAdsL").textContent=`Inversión en Meta Ads (${grp(r.inv)} € × ${r.perm})`;
    $("rAds").textContent=eur(r.ads);
    $("rTot").textContent=eur(r.tot);
    const lo=r.ads/45, hi=r.ads/30;
    $("eLeads").textContent=`${Math.round(lo)}–${Math.round(hi)}`;
    $("eLeadsS").textContent=`en ${r.perm} meses`;
    const cLo=lo/20, cHi=hi/15;
    $("eCap").textContent=`${dec1(cLo)}–${dec1(cHi)}`;
    // gráfico 1: cuota mes a mes (líneas)
    const g1={}; if($("feeChart")){ $("feeChart").innerHTML=lineChart({out:g1,w:$("feeChart").clientWidth,labels:r.paid.map((m,i)=>"M"+(i+1)),series:[{name:"Cuota",color:"#FF8C19",data:r.paid,labels:true}],h:220,yFmt:v=>grp(Math.round(v))+" €",zero:false});
    hover("feeChart",g1,i=>`<b>Mes ${i+1}</b><br>Cuota base Básico (${r.perm} meses): ${eur(r.base[i])}<br>Pack ${NAME[r.pack]}: +${eur(ADD[r.pack])}<br><b>Total del mes: ${eur(r.months[i])}</b>`); }
    // gráfico 2: proyección 12 meses (nunca en negativo: inversión acumulada frente a ingresos por ventas)
    const P=project(r);
    const g2={}; $("resChart").innerHTML=lineChart({out:g2,w:$("resChart").clientWidth,labels:P.labels,band:r.perm,series:[
      {name:"Honorarios Cosiris",color:"#FF8C19",data:P.fees},
      {name:"Inversión en Meta Ads",color:"#2F5BEA",data:P.ads},
      {name:"Ingresos por ventas",color:"#1F9D55",data:P.rev,width:4,end:true}],h:280,yFmt:v=>kfmt(v),zero:false});
    hover("resChart",g2,i=>{const inv=P.fees[i]+P.ads[i],d=P.rev[i]-inv;return `<b>Mes ${i+1} · acumulado</b><br>Honorarios Cosiris: ${eur(Math.round(P.fees[i]))}<br>Inversión en Meta: ${eur(P.ads[i])}<br>Captaciones: ${dec1(P.capC[i])} · ventas: ${dec1(P.soldC[i])}<br><span class="g">Ingresos: ${dec1(P.soldC[i])} × ${eur(P.com)} = ${eur(Math.round(P.rev[i]))}</span><br>`+(d>=0?`<span class="g">Ya has recuperado tu inversión: +${eur(Math.round(d))}</span>`:`Aún madurando: faltan ${eur(Math.round(-d))} por recuperar`);});
    $("pCap").textContent=dec1(P.cap);
    $("pVen").textContent=dec1(P.ven);
    const mul=P.tot?P.rev.at(-1)/P.tot:0;$("pMul").textContent=mul.toFixed(2).replace(".",",")+" €";
    const mulOf=pm=>{const rr={...r,perm:pm,paid:FEES[pm].map(f=>f+ADD[r.pack])};const q=project(rr);return (q.rev.at(-1)/q.tot).toFixed(2).replace(".",",");};
    $("pBE").textContent=P.be?("mes "+P.be):"más adelante";
    $("resT").textContent=`Tus ${r.perm} meses y lo que viene después`;
    $("pBE").parentElement.classList.toggle("pos",!!P.be);
    $("pRes").textContent=`Con ${grp(r.inv)} €/mes durante ${r.perm} meses y una comisión media de ${eur(P.com)}: unas ${dec1(P.cap)} captaciones y ${dec1(P.ven)} ventas, ${eur(Math.round(P.rev.at(-1)))} en ingresos frente a ${eur(Math.round(P.tot))} invertidos. Los leads de tus ${r.perm} meses siguen madurando después y lo captado se vende en los meses siguientes: por eso el gráfico llega hasta el mes ${P.H}.`+` Supuestos: unos 37,5 € por lead, 1 captación por cada 17,5 leads, se vende el 50 % de lo captado unos 3 meses después.`;
    if(r.perm<12){const r12={...r,perm:12,paid:[...r.months,...Array(12-r.perm).fill(TARIFA+ADD[r.pack])]};const P12=project(r12);
      $("pRes").textContent+=` Si sigues todo el año (renovación automática a ${eur(TARIFA+ADD[r.pack])}/mes), serían unas ${dec1(P12.cap)} captaciones y ${eur(Math.round(P12.rev.at(-1)))} en ingresos.`;}
    renderWhy(r);
    const groups=[];r.months.forEach((m,i)=>{const g=groups[groups.length-1];if(g&&g.v===m)g.to=i+1;else groups.push({from:i+1,to:i+1,v:m});});
    const inc={basico:"campañas en Meta Ads, minisite, CRM, cualificación por WhatsApp y leads por email",avanzado:"todo el Básico más leads por WhatsApp y seguimiento automatizado por email y WhatsApp",premium:"todo el Avanzado más cualificación telefónica desde Cosiris"}[r.pack];
    const bg=[];r.base.forEach((m,i)=>{const g=bg[bg.length-1];if(g&&g.v===m)g.to=i+1;else bg.push({from:i+1,to:i+1,v:m});});
    $("rcT").innerHTML=`<b>${r.perm} meses</b> · pack <b>${NAME[r.pack]}</b>`;
    $("rcBase").innerHTML=bg.map(g=>`<i>${g.from===g.to?"Mes "+g.from:"Mes "+g.from+" a "+g.to}</i><b>${eur(g.v)}</b>`).join("");
    $("rcPackT").textContent=r.pack==="basico"?"Pack Básico":"Pack "+NAME[r.pack];
    $("rcPack").innerHTML=r.pack==="basico"?`<div class="rpv">+0 €</div><div class="rps">Ya incluido en la cuota base.</div>`:`<div class="rpv">+${ADD[r.pack]} €</div><div class="rps">cada mes</div>`;
    $("rcG").innerHTML=groups.map(g=>`<div><i>${g.from===g.to?"Mes "+g.from:"Meses "+g.from+" a "+g.to}</i><b class="num">${eur(g.v)}</b><small>al mes</small></div>`).join("");
    $("rcInc").textContent=`Total gestión ${r.perm} meses`+(sv?` · ahorras ${eur(sv)}/año`:"")+":";
    $("rcTot").textContent=eur(r.fees);
    const T=(id,h)=>{const e=$(id);if(!e)return;e.innerHTML=e.firstElementChild.outerHTML+h;};
    const plus=ADD[r.pack]?` + ${ADD[r.pack]} € del pack ${NAME[r.pack]}`:"";
    T("tSave",sv?`Si te quedas todo el año: a 390 €/mes pagarías ${eur(12*TARIFA)} de gestión base. Con ${r.perm} meses de permanencia pagas ${eur(12*TARIFA-sv)} (${r.perm<12?`${eur(FEES[r.perm].reduce((a,b)=>a+b,0))} de permanencia + ${12-r.perm} meses a 390 €`:"tus 12 cuotas"}). Ahorras ${eur(sv)}. El pack se suma igual en todos los casos.`:`Con 3 meses pagas la tarifa de 390 €/mes sin bonificar. Con 6 meses ahorrarías ${eur(yearSave(6))} en el año y con 12 meses ${eur(yearSave(12))}.`);
    T("tAvg",`Total de gestión (${eur(r.fees)}) ÷ ${r.perm} meses = ${eur(Math.round(r.fees/r.perm))} de media. Al principio pagas menos y luego algo más.`);
    T("tCos",`Suma de tus ${r.perm} cuotas mensuales: cuota base del pack Básico${plus} cada mes = ${eur(r.fees)}. No incluye la publicidad.`);
    T("tAds",`${eur(r.inv)} al mes × ${r.perm} meses = ${eur(r.ads)}. Se paga a Meta, no a Cosiris.`);
    T("tTot",`Lo que pagas a Cosiris (${eur(r.fees)}) + inversión en Meta Ads (${eur(r.ads)}) = ${eur(r.tot)}.`);
    T("tLeads",`Inversión en Meta (${eur(r.ads)}) ÷ coste medio por lead de nuestros clientes (entre 30 y 45 €) = ${Math.round(lo)} a ${Math.round(hi)} leads. Es un ejemplo, no una garantía.`);
    T("tCap",`De media, 1 de cada 15–20 leads acaba en captación. ${Math.round(lo)}–${Math.round(hi)} leads ÷ 15–20 = ${dec1(cLo)} a ${dec1(cHi)} captaciones. Es un ejemplo, no una garantía.`);
    T("tPack",r.pack==="basico"?"Has elegido el Básico: ya está incluido en la cuota base, no suma nada.":`Has elegido el pack ${NAME[r.pack]}: suma ${ADD[r.pack]} € a la cuota base cada mes, durante los ${r.perm} meses.`);
    T("tRcTot",`Suma de tus ${r.perm} cuotas mensuales totales: ${groups.map(g=>(g.to>g.from?(g.to-g.from+1)+" × ":"")+grp(g.v)+" €").join(" + ")} = ${eur(r.fees)}.`);
    const leads12=r.inv*Math.min(r.perm,12)/37.5;
    T("tPCap",`Inversión en Meta durante ${r.perm} meses (${eur(r.inv*r.perm)}) ÷ 37,5 € por lead = ${Math.round(leads12)} leads. ${Math.round(leads12)} ÷ 17,5 leads por captación = ${dec1(P.cap)} captaciones.`);
    T("tPMul",`Ingresos por ventas (${eur(Math.round(P.rev.at(-1)))}) ÷ todo lo que inviertes (${eur(Math.round(P.tot))}). Con tu inversión y tu pack: 3 meses ${mulOf(3)} €, 6 meses ${mulOf(6)} €, 12 meses ${mulOf(12)} € por cada euro. Más permanencia, más rendimiento.`);
    T("tPVen",`Suponemos que se vende el 50 % de lo captado y que cada venta llega unos 3 meses después de captar. Contamos todas las ventas de lo captado con tus leads, también las que llegan después de tu permanencia: ${dec1(P.ven)}.`);
    T("tPBE",P.be?`Es el primer mes en que lo que ingresas por ventas (ventas × ${eur(P.com)}) supera todo lo que has pagado hasta ese mes (Cosiris + Meta).`:`Con estos datos, lo ingresado por ventas no supera lo pagado (Cosiris + Meta) dentro de tus ${r.perm} meses. Muchas ventas llegan después: las captaciones siguen madurando. Prueba con más inversión o tu comisión real.`);
    const com=Math.max(0,+$("com").value||0), vLo=cLo*0.5, vHi=cHi*0.5, iLo=vLo*com, iHi=vHi*com, nLo=iLo-r.tot, nHi=iHi-r.tot;
    const rng=(a,b)=>`${grp(Math.round(a))}–${grp(Math.round(b))} €`;
    $("eVen").textContent=`${dec1(vLo)}–${dec1(vHi)}`;
    $("eIng").textContent=rng(iLo,iHi);
    $("eIngS").textContent=`ventas × tu comisión (${eur(com)})`;
    $("eNet").textContent=`${nLo<0?"":"+"}${grp(Math.round(nLo))} a ${nHi<0?"":"+"}${grp(Math.round(nHi))} €`;
    const roi=n=>Math.round(n/r.tot*100)+" %";
    $("eNetS").textContent=`cuando se vendan tus captaciones · ingresos − inversión (${eur(r.tot)}) · ROI ${roi(nLo)} a ${roi(nHi)}`;
    T("tVen",`De media, nuestros clientes venden alrededor del 50 % de lo que captan. ${dec1(cLo)}–${dec1(cHi)} captaciones × 50 % = ${dec1(vLo)} a ${dec1(vHi)} ventas. Algunas ventas pueden llegar meses después de captar. Es un ejemplo, no una garantía.`);
    T("tIng",`Ventas × tu comisión media por venta (${eur(com)}, puedes cambiarla en el paso 4). ${dec1(vLo)}–${dec1(vHi)} ventas × ${eur(com)} = ${rng(iLo,iHi)}.`);
    T("tRoi",`Ingresos por ventas (${rng(iLo,iHi)}) − todo lo que inviertes: Cosiris ${eur(r.fees)} + Meta ${eur(r.ads)} = ${eur(r.tot)}. ROI = retorno ÷ inversión total. Es un ejemplo con datos promedio de nuestros clientes, no una garantía.`);
    const lm=Math.round(r.inv/30);
    LAST={r,P,lo,hi,cLo,cHi,vLo,vHi,iLo,iHi,nLo,nHi,com};
    if($("mTab"))$("mTab").innerHTML=`<tr><th>Mes</th>${[...Array(12)].map((_,i)=>`<th>${i+1}</th>`).join("")}<th>Total</th></tr>`+[3,6,12].map(pm=>`<tr${pm===r.perm?' class="sel"':''}><td>${pm} m</td>${[...Array(12)].map((_,i)=>i<pm?`<td class="${FEES[pm][i]===TARIFA?"f":""}">${FEES[pm][i]}</td>`:`<td class="e">·</td>`).join("")}<td class="tot">${grp(FEES[pm].reduce((a,b)=>a+b,0))}</td></tr>`).join("");
    $("invLeads").innerHTML=`≈ ${lm} leads aproximados al mes <small>· un lead cuesta unos 30 € de promedio</small><span class="invp">≈ ${grp(lm*r.perm)} leads en tus ${r.perm} meses de permanencia <small>· ${lm} leads × ${r.perm} meses</small></span>`;
    if($("mSub"))$("mSub").textContent=`Base + pack ${NAME[r.pack]}`;
  }
  root.querySelectorAll('input[type="radio"]').forEach(x=>x.addEventListener("change",render));
  const inv=$("inv"), invR=$("invR");
  invR.addEventListener("input",()=>{inv.value=invR.value;$("invHint").className="hint";$("invHint").textContent="Mínimo 300 €/mes.";render();});
  inv.addEventListener("input",()=>{const v=+inv.value;if(v>=MIN)invR.value=Math.min(2000,v);render();});
  inv.addEventListener("change",()=>{if(!(+inv.value>=MIN)){inv.value=MIN;invR.value=MIN;$("invHint").className="warn";$("invHint").textContent="La inversión mínima es de 300 €/mes. Hemos ajustado el valor.";}render();});
  const com=$("com"), comR=$("comR");
  com.addEventListener("input",()=>{const v=+com.value;if(v>0)comR.value=Math.min(30000,Math.max(1000,v));render();});
  comR.addEventListener("input",()=>{com.value=comR.value;render();});
  // recorrido guiado (no obligatorio: se ilumina el paso que tienes delante al hacer scroll)
  const steps=[...root.querySelectorAll("#tour .step")]; const done=new Set(); let scur=0;
  const paint=()=>steps.forEach((s,j)=>{s.classList.toggle("active",j===scur);s.classList.toggle("done",done.has(j));});
  const setActive=i=>{scur=i;paint();};
  const markDone=i=>{done.add(i);paint();};
  const go=el=>el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  let lock=0;
  steps.forEach((s,i)=>{
    s.addEventListener("change",e=>{if(!e.target.closest(".info"))markDone(i);});
    s.addEventListener("input",e=>{if(e.target.type==="range"||e.target.type==="number")markDone(i);});
    s.addEventListener("focusin",e=>{if(!e.target.closest(".next")&&!e.target.closest(".info"))setActive(i);});
    const b=s.querySelector(".next");
    b.addEventListener("click",()=>{markDone(i);lock=Date.now();
      if(b.classList.contains("go")){[4,6,10,11,12,13,14,15].forEach(n=>loadImg(`/calculadora/pages/p${String(n).padStart(2,"0")}.jpg`));render();go($("report"));}
      else{setActive(i+1);go(steps[i+1]);}});
  });
  if("IntersectionObserver" in window){
    const vis=new Map();
    io=new IntersectionObserver(es=>{es.forEach(e=>vis.set(e.target,e.isIntersecting));
      if(Date.now()-lock<900)return;
      const k=steps.findIndex(s=>vis.get(s));if(k>=0&&k!==scur)setActive(k);},{rootMargin:"-38% 0px -50% 0px"});
    steps.forEach(s=>io.observe(s));
  }
  setActive(0);
  let rt;on(window,"resize",()=>{clearTimeout(rt);rt=setTimeout(render,150);});
  render();
  ft=document.createElement("div");ft.id="ftip";ft.setAttribute("role","tooltip");document.body.appendChild(ft);
  let cur=null;
  const showT=el=>{const tb=el.querySelector(".tipbox");if(!tb)return;cur=el;ft.innerHTML=tb.innerHTML;ft.style.display="block";
    const r=el.getBoundingClientRect(),w=ft.offsetWidth,h=ft.offsetHeight;let x=r.left+r.width/2-w/2;x=Math.max(12,Math.min(x,innerWidth-w-12));
    let y=r.bottom+8;if(y+h>innerHeight-8)y=r.top-h-8;ft.style.left=x+"px";ft.style.top=y+"px";};
  const hideT=()=>{cur=null;ft.style.display="none";};
  on(document,"mouseover",e=>{const el=e.target.closest(".info");if(el)showT(el);else if(cur&&!e.target.closest(".info"))hideT();});
  on(document,"focusin",e=>{const el=e.target.closest(".info");if(el)showT(el);});
  on(document,"focusout",e=>{if(e.target.closest(".info"))hideT();});
  on(document,"click",e=>{const el=e.target.closest(".info");if(el){e.preventDefault();e.stopPropagation();showT(el);}else if(cur)hideT();},true);
  on(document,"keydown",e=>{if(e.key==="Escape")hideT();});
  on(window,"scroll",hideT,{passive:true});
  // ================= PDF: presupuesto, informe y presentación =================
  const PG=[[4,"FFFFFF","FFFFFF"],[6,"FBFBFB","FBFBFB"],[10,"FAFAF8","F9F8F6"],[11,"FFFFFF","FFFFFF"],[12,"FCFCFC","FFFFFF"],[13,"FAFAFA","FAFAFA"],[14,"FAFAFA","FAFAFA"],[15,"F8F8F8","F8F8F8"]];
  const K={navy:"#13204A",navy2:"#1C2B5C",or:"#FF8C19",ord:"#F26511",ort:"#C24E08",peach:"#FFE8D2",cream:"#F7F6F4",text:"#4A5068",muted:"#8A8FA3",light:"#C9CDDC",line:"#ECE7E1",green:"#1F9D55",greenBg:"#E7F6EC",blue:"#2F5BEA",white:"#FFFFFF"};
  const FAM="Montserrat, Arial, sans-serif";
  const imgCache={};
  const loadImg=src=>imgCache[src]||(imgCache[src]=new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src;}));
  const LOGO_O="/calculadora/logo-color.png";
  const LOGO_W="/calculadora/logo-white.png";
  function ctxKit(x){
    const f=(w,s)=>{x.font=`${w} ${s}px ${FAM}`;};
    const rr=(X,Y,W,H,r,fill,stroke,lw)=>{x.beginPath();x.roundRect(X,Y,W,H,r);if(fill){x.fillStyle=fill;x.fill();}if(stroke){x.strokeStyle=stroke;x.lineWidth=lw||2;x.stroke();}};
    const t=(s,X,Y,o={})=>{f(o.w||500,o.s||28);x.fillStyle=o.c||K.text;x.textAlign=o.a||"left";x.textBaseline="alphabetic";if(o.ls){x.letterSpacing=o.ls+"px";}x.fillText(s,X,Y);x.letterSpacing="0px";};
    const wrap=(s,X,Y,maxW,o={})=>{f(o.w||500,o.s||26);x.fillStyle=o.c||K.text;x.textAlign="left";const lh=o.lh||(o.s||26)*1.38;let line="",y=Y;
      for(const word of String(s).split(" ")){const test=line?line+" "+word:word;if(x.measureText(test).width>maxW&&line){x.fillText(line,X,y);y+=lh;line=word;}else line=test;}
      if(line){x.fillText(line,X,y);y+=lh;}return y;};
    // rich: [[text,color,weight]] en una línea
    const rich=(parts,X,Y,s)=>{let cx=X;parts.forEach(([s0,c,w,sz])=>{f(w||800,sz||s);x.fillStyle=c;x.textAlign="left";x.fillText(s0,cx,Y);cx+=x.measureText(s0).width;});return cx;};
    const dots=(X,Y,cols,rows,gap,d,c)=>{x.fillStyle=c;for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){x.beginPath();x.arc(X+k*gap,Y+r*gap,d/2,0,7);x.fill();}};
    return {f,rr,t,wrap,rich,dots};
  }
  async function drawSlide(c,slide,n){
    const x=c.getContext("2d"),k=ctxKit(x);x.setTransform(1,0,0,1,0,0);
    x.fillStyle=slide.bg||K.white;x.fillRect(0,0,1920,1080);
    await slide.draw(x,k);
    if(slide.footer!==false){
      const dark=slide.dark, lg=await loadImg(dark?LOGO_W:LOGO_O);
      if(lg)x.drawImage(lg,128,968,130,45);
      k.t(String(n).padStart(2,"0"),1792,1004,{w:700,s:24,c:dark?K.light:K.muted,a:"right"});
      if(slide.note)k.t(slide.note,960,1004,{w:600,s:18,c:dark?K.light:K.muted,a:"center"});
    }
  }
  const head=(k,eyebrow,title,hl,y,dark)=>{y=y||120;k.t(eyebrow.toUpperCase(),128,y,{w:800,s:24,c:dark?K.or:K.ord,ls:4});
    k.rich([[title+(hl?" ":""),dark?K.white:K.navy,800],[hl||"",dark?K.or:K.ord,800]],128,y+78,64);};
  const fmtRange=(a,b,d)=>d?`${dec1(a)}–${dec1(b)}`:`${grp(Math.round(a))}–${grp(Math.round(b))}`;
  const FEATS=[["Campañas en Meta Ads","Creación y optimización continua",[1,1,1]],["Minisite","En nuestro directorio de inmobiliarias",[1,1,1]],["CRM","Gestión de leads y seguimiento",[1,1,1]],["Cualificación por WhatsApp","Respuesta y cualificación automática",[1,1,1]],["Leads por email","Recibes cada lead en tu correo",[1,1,1]],["Leads por WhatsApp","Recibes cada lead en tu WhatsApp",[0,1,1]],["Seguimiento automatizado","Por email y por WhatsApp",[0,1,1]],["Cualificación telefónica","Desde Cosiris",[0,0,1]]];

  function slidesFor(kind,S){
    const r=S.r,P=S.P,pk=NAME[r.pack];
    const cover={bg:K.navy,dark:true,footer:false,async draw(x,k){
      x.fillStyle=K.or;x.fillRect(0,0,24,1080);
      k.dots(1580,120,6,5,36,10,"rgba(255,140,25,.55)");
      const lg=await loadImg(LOGO_W);if(lg)x.drawImage(lg,128,110,260,90);
      k.t("PRESUPUESTO PERSONALIZADO",128,420,{w:800,s:26,c:K.or,ls:5});
      if(kind==="informe"){k.t("Tu informe de",128,530,{w:800,s:96,c:K.white});k.t("resultados esperados",128,640,{w:800,s:96,c:K.or});}
      else{k.t("Tu presupuesto de",128,530,{w:800,s:96,c:K.white});k.t("generación de leads",128,640,{w:800,s:96,c:K.or});}
      k.t(`${r.perm} meses de permanencia  ·  Pack ${pk}  ·  ${grp(r.inv)} €/mes en Meta Ads`,128,740,{w:600,s:32,c:K.light});
      k.rr(128,860,560,4,2,K.or);
      k.t("Generado el "+new Date().toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}),128,930,{w:600,s:24,c:K.light});
      k.t("cosiris.com",1792,930,{w:800,s:24,c:K.white,a:"right"});
    }};
    const budget={bg:K.cream,note:"Precios de gestión sin IVA · La inversión en Meta Ads va aparte",draw(x,k){
      head(k,"01 · Tu presupuesto para ti","Esto es lo que","has elegido");
      // tarjetas de elección
      const ch=[["1 · Permanencia",`${r.perm} meses`,r.perm<12?`Después, renovación automática a 390 €/mes${yearSave(r.perm)?" · ahorras "+eur(yearSave(r.perm))+" en el año":""}`:`Ahorras ${eur(yearSave(r.perm))} en el año`],["2 · Nivel de seguimiento",`Pack ${pk}`,ADD[r.pack]?`+${ADD[r.pack]} € al mes sobre la cuota base`:"Incluido en la cuota base"],["3 · Inversión en Meta Ads",`${grp(r.inv)} €/mes`,`≈ ${Math.round(r.inv/30)} leads al mes · aparte, se paga a Meta`]];
      ch.forEach((c,i)=>{const X=128+i*400,Y=270;k.rr(X,Y,376,190,22,K.white,K.line,2);k.rr(X+28,Y,80,6,3,K.or);
        k.t(c[0].toUpperCase(),X+28,Y+56,{w:800,s:17,c:K.muted,ls:2});k.t(c[1],X+28,Y+116,{w:800,s:c[1].length>12?36:44,c:K.navy});k.wrap(c[2],X+28,Y+158,320,{s:19,w:500,lh:24});});
      // tabla cuota
      const TX=128,TY=500,TW=1176;k.rr(TX,TY,TW,420,22,K.white,K.line,2);
      k.t("TU CUOTA MENSUAL DE GESTIÓN, MES A MES",TX+36,TY+56,{w:800,s:20,c:K.ord,ls:3});
      const cols=[TX+36,TX+380,TX+640,TX+900];
      ["Mes","Cuota base Básico","Pack "+pk,"Total al mes"].forEach((h,i)=>k.t(h,cols[i],TY+110,{w:700,s:20,c:K.muted}));
      x.fillStyle=K.line;x.fillRect(TX+36,TY+128,TW-72,2);
      const gr=[];r.months.forEach((m,i)=>{const g=gr[gr.length-1];if(g&&g.v===m&&g.b===r.base[i])g.to=i+1;else gr.push({from:i+1,to:i+1,v:m,b:r.base[i]});});
      const rh=Math.min(58,250/gr.length);
      gr.forEach((g,i)=>{const y=TY+180+i*rh;k.t(g.from===g.to?"Mes "+g.from:`Meses ${g.from} a ${g.to}`,cols[0],y,{w:600,s:26,c:K.navy});
        k.t(eur(g.b),cols[1],y,{w:600,s:26,c:K.text});k.t("+"+eur(ADD[r.pack]),cols[2],y,{w:600,s:26,c:K.text});k.t(eur(g.v),cols[3],y,{w:800,s:30,c:K.ord});});
      k.wrap(`Base + pack = tu cuota de cada mes. Al terminar los ${r.perm} meses, el contrato se renueva automáticamente mes a mes con las condiciones contratadas: 390 € + pack.`,TX+36,TY+390,TW-72,{s:19,w:500,c:K.muted});
      // totales
      const BX=1344,BY=270,BW=448;k.rr(BX,BY,BW,650,26,K.navy);
      k.t("MEDIA DE GESTIÓN AL MES",BX+40,BY+70,{w:800,s:19,c:K.or,ls:3});
      k.rich([[eur(Math.round(r.fees/r.perm)),K.white,800],["/mes",K.light,600,30]],BX+40,BY+160,72);
      const rows=[["Pagas a Cosiris",eur(r.fees),`${r.perm} cuotas de gestión`],["Inversión en Meta Ads",eur(r.ads),`${grp(r.inv)} € × ${r.perm} meses · aparte`],["Inversión total del plan",eur(r.tot),"Cosiris + Meta Ads"]];
      rows.forEach((w,i)=>{const y=BY+250+i*120;x.fillStyle="rgba(255,255,255,.15)";x.fillRect(BX+40,y-44,BW-80,2);
        k.t(w[0],BX+40,y,{w:700,s:22,c:i===2?K.or:K.light});k.f(500,17);const subW=x.measureText(w[2]).width;let fs=i===2?44:38;k.f(800,fs);while(fs>24&&x.measureText(w[1]).width>BW-80-subW-20){fs-=2;k.f(800,fs);}k.t(w[1],BX+BW-40,y+44,{w:800,s:fs,c:K.white,a:"right"});k.t(w[2],BX+40,y+44,{w:500,s:17,c:K.light});});
      k.rr(BX+40,BY+585,BW-80,40,10,"rgba(255,140,25,.18)");k.t("La inversión en Meta NO está en la cuota",BX+BW/2,BY+612,{w:700,s:17,c:K.or,a:"center"});
    }};
    const report={bg:K.white,note:"Ejemplo con datos promedio de nuestros clientes · No es una garantía",draw(x,k){
      head(k,"05 · Tu informe de resultados esperados","Lo que puedes","esperar");
      const box=[["Leads",fmtRange(S.lo,S.hi),`en ${r.perm} meses`,K.peach,K.ort,K.navy],["Captaciones",fmtRange(S.cLo,S.cHi,1),"1 por cada 15–20 leads",K.peach,K.ort,K.navy],["Ventas (≈ 50 %)",fmtRange(S.vLo,S.vHi,1),"la mitad de lo captado",K.peach,K.ort,K.navy],["Ingresos por ventas",fmtRange(S.iLo,S.iHi)+" €",`ventas × ${eur(S.com)} de comisión`,K.peach,K.ort,K.navy]];
      box.forEach((b,i)=>{const X=128+i*420,Y=250;k.rr(X,Y,396,180,22,b[3]);k.t(b[0].toUpperCase(),X+28,Y+52,{w:800,s:18,c:b[4],ls:2});k.t(b[1],X+28,Y+118,{w:800,s:b[1].length>14?36:48,c:b[5]});k.t(b[2],X+28,Y+156,{w:500,s:19});
        if(i<3)k.t("→",X+408,Y+100,{w:800,s:28,c:K.ord,a:"center"});});
      // retorno
      k.rr(128,460,1664,120,22,K.greenBg);
      k.t("TU RETORNO ESTIMADO",168,512,{w:800,s:20,c:"#157A42",ls:3});
      k.t(`cuando se vendan tus captaciones · ingresos − inversión (${eur(r.tot)})`,168,552,{w:500,s:20});
      const sg=v=>(v<0?"":"+")+grp(Math.round(v));
      k.t(`${sg(S.nLo)} a ${sg(S.nHi)} €`,1340,548,{w:800,s:56,c:K.green,a:"right"});
      k.t(`ROI ${Math.round(S.nLo/r.tot*100)} % a ${Math.round(S.nHi/r.tot*100)} %`,1752,548,{w:800,s:30,c:"#157A42",a:"right"});
      // gráfico
      const GX=200,GY=640,GW=1000,GH=250;
      const all=[...P.fees,...P.ads,...P.rev];let mn=Math.min(0,...all),mx=Math.max(...all);
      const raw=(mx-mn)/4,mag=Math.pow(10,Math.floor(Math.log10(raw||1))),step=[1,2,2.5,5,10].map(q=>q*mag).find(v=>v>=raw);
      mn=Math.floor(mn/step)*step;mx=Math.ceil(mx/step)*step+step*0.0001;
      const NN=P.fees.length,X=i=>GX+i*GW/Math.max(1,NN-1),Y=v=>GY+GH-(v-mn)/(mx-mn)*GH;
      {const xb=(X(r.perm-1)+X(r.perm))/2;x.fillStyle="#FFF3E6";x.fillRect(GX,GY,xb-GX,GH);k.t("Tu permanencia",GX+10,GY+22,{w:800,s:15,c:K.ort});k.t("Lo captado se sigue vendiendo",xb+10,GY+22,{w:700,s:15,c:K.muted});}
      for(let v=mn;v<=mx+1;v+=step){x.fillStyle=v===0?K.navy:"#E8E8EC";x.fillRect(GX,Y(v),GW,v===0?2:1);k.t(kfmt(v),GX-14,Y(v)+6,{w:600,s:16,c:K.muted,a:"right"});}
      P.labels.forEach((l,i)=>{if(NN>14&&i%2===1&&i!==NN-1)return;k.t(l,X(i),GY+GH+30,{w:700,s:16,c:K.muted,a:"center"});});
      [[P.fees,K.or,4],[P.ads,K.blue,4],[P.rev,K.green,6]].forEach(([d,c,w])=>{x.strokeStyle=c;x.lineWidth=w;x.lineJoin="round";x.beginPath();d.forEach((v,i)=>i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v)));x.stroke();
        x.beginPath();x.arc(X(NN-1),Y(d[NN-1]),8,0,7);x.fillStyle="#fff";x.fill();x.lineWidth=4;x.stroke();});
      k.t(`Acumulado hasta el mes ${NN}`,GX,GY-20,{w:800,s:20,c:K.navy});
      [["Honorarios Cosiris",K.or],["Inversión en Meta Ads",K.blue],["Ingresos por ventas",K.green]].forEach(([l,c],i)=>{k.rr(GX+300+i*240,GY-36,16,16,4,c);k.t(l,GX+324+i*240,GY-21,{w:600,s:17});});
      // supuestos
      const SX=1290,SY=620;k.rr(SX,SY,502,310,22,K.cream);
      k.t("CÓMO LO CALCULAMOS",SX+30,SY+50,{w:800,s:18,c:K.ord,ls:2});
      let yy=SY+92;[`Un lead cuesta entre 30 y 45 € en Meta Ads.`,`1 captación por cada 15–20 leads.`,`Se vende ≈ 50 % de lo captado, unos 3 meses después.`,`Ingresos = ventas × tu comisión (${eur(S.com)}).`,`Recuperas tu inversión: ${P.be?"mes "+P.be:"más adelante"} (gráfico).`].forEach(s=>{k.rr(SX+30,yy-14,10,10,5,K.or);yy=k.wrap(s,SX+52,yy,420,{s:19,w:500,lh:25})+8;});
    }};
    const mesames={bg:K.white,note:"Precios de gestión sin IVA · La inversión en Meta Ads va aparte",draw(x,k){
      head(k,"02 · Tu cuota, mes a mes","Así pagas","cada mes");
      const TX=128,TY=250,TW=1664,c0=230,cw=(TW-c0-170)/12,rh=96;
      k.rr(TX,TY,TW,78,16,K.navy);k.t("Permanencia",TX+24,TY+50,{w:800,s:24,c:K.white});
      for(let i=0;i<12;i++)k.t("Mes "+(i+1),TX+c0+cw*i+cw/2,TY+50,{w:800,s:20,c:K.white,a:"center"});
      k.t("Total",TX+TW-85,TY+50,{w:800,s:22,c:K.or,a:"center"});
      [3,6,12].forEach((pm,j)=>{const y=TY+92+j*rh,sel=pm===r.perm;k.rr(TX,y,TW,rh-12,16,sel?K.peach:"#F6F6F8",sel?K.ord:null,3);
        k.t(pm+" meses",TX+24,y+(sel?44:54),{w:800,s:28,c:K.navy});if(sel)k.t("TU PERMANENCIA",TX+24,y+70,{w:800,s:14,c:K.ord,ls:2});
        for(let i=0;i<12;i++){const cx=TX+c0+cw*i+cw/2;if(i<pm){const v=FEES[pm][i];k.t(String(v),cx,y+54,{w:v===TARIFA?800:600,s:28,c:v===TARIFA?K.navy:K.text,a:"center"});}else k.t("·",cx,y+54,{w:600,s:28,c:K.light,a:"center"});}
        k.t(grp(FEES[pm].reduce((a,b)=>a+b,0))+" €",TX+TW-85,y+54,{w:800,s:26,c:K.navy,a:"center"});});
      {const y=TY+92+3*rh+14;k.rr(TX,y,TW,rh-6,16,K.navy);k.t("Tu cuota",TX+24,y+42,{w:800,s:26,c:K.white});k.t(ADD[r.pack]?`con pack ${pk}`:"pack Básico",TX+24,y+70,{w:700,s:17,c:K.or});
        for(let i=0;i<12;i++){const cx=TX+c0+cw*i+cw/2;k.t(i<r.perm?String(r.months[i]):"·",cx,y+56,{w:800,s:28,c:i<r.perm?K.white:"#55607F",a:"center"});}
        k.t(grp(r.fees)+" €",TX+TW-85,y+56,{w:800,s:26,c:K.or,a:"center"});}
      const yy=TY+92+4*rh+40;
      k.wrap(`Tarifa de referencia: 390 €/mes (pack Básico). Tu pack ${pk} suma ${ADD[r.pack]?"+"+ADD[r.pack]+" € cada mes":"0 €"}. Después de la permanencia, renovación automática a 390 €/mes${ADD[r.pack]?" + pack":""}. Si sigues todo el año, ahorras ${eur(yearSave(r.perm))} con tu plan.`,TX,yy,TW,{s:24,w:600,c:K.navy,lh:34});
    }};
    const packs={bg:K.cream,note:"Precios de gestión sin IVA · La inversión en Meta Ads va aparte",draw(x,k){
      head(k,"04 · Qué incluye cada pack","Tu pack","y las demás opciones");
      const TX=128,TY=240,FW=640,CW=341,RH=58;
      const ids=["basico","avanzado","premium"];
      ids.forEach((id,j)=>{const X=TX+FW+j*(CW+12),sel=id===r.pack;k.rr(X,TY,CW,RH*FEATS.length+150,22,sel?K.white:"rgba(255,255,255,.6)",sel?K.ord:K.line,sel?4:2);
        if(sel){k.rr(X+CW/2-80,TY-22,160,40,20,K.ord);k.t("TU PACK",X+CW/2,TY+6,{w:800,s:18,c:K.white,a:"center",ls:2});}
        k.t(NAME[id],X+CW/2,TY+62,{w:800,s:34,c:sel?K.ord:K.navy,a:"center"});
        k.t((ADD[id]?"+"+ADD[id]:"+0")+" €/mes",X+CW/2,TY+104,{w:800,s:24,c:K.navy,a:"center"});
        FEATS.forEach((f,i)=>{const cy=TY+130+i*RH+RH/2;if(f[2][j]){x.beginPath();x.arc(X+CW/2,cy,17,0,7);x.fillStyle=sel?K.ord:K.or;x.fill();x.strokeStyle="#fff";x.lineWidth=4;x.beginPath();x.moveTo(X+CW/2-8,cy);x.lineTo(X+CW/2-2,cy+7);x.lineTo(X+CW/2+9,cy-6);x.stroke();}
          else{x.fillStyle=K.light;x.fillRect(X+CW/2-12,cy-2,24,4);}});});
      FEATS.forEach((f,i)=>{const y=TY+130+i*RH;x.fillStyle=K.line;x.fillRect(TX,y,FW+3*CW+36,2);k.t(f[0],TX,y+28,{w:800,s:23,c:K.navy});k.t(f[1],TX,y+50,{w:500,s:17});});
      const base=FEATS.length*RH+TY+130+56;
      k.wrap(`El importe del pack se suma a tu cuota base cada mes. Tu cuota base (${r.perm} meses): ${(()=>{const g=[];r.base.forEach((m,i)=>{const l=g[g.length-1];if(l&&l.v===m)l.to=i+1;else g.push({from:i+1,to:i+1,v:m});});return g.map(q=>(q.from===q.to?"mes "+q.from:`meses ${q.from} a ${q.to}`)+": "+eur(q.v)).join(" · ");})()}.`,TX,base,1664,{s:21,w:600,c:K.navy});
    }};
    const benefits={bg:K.white,note:"Ejemplo con datos promedio de nuestros clientes · No es una garantía",draw(x,k){
      head(k,"03 · Los beneficios de tu plan","Lo que ganas con","tu plan "+pk);
      const m1=r.months[0], mL=r.months[r.months.length-1];
      const sv=yearSave(r.perm);const B=[r.perm>3?["Empiezas pagando poco",`Mes 1: ${eur(m1)}. No pagas la tarifa de 390 € hasta el mes ${r.base.indexOf(TARIFA)+1}. Si sigues todo el año, ahorras ${eur(sv)}.`]:["Sin compromisos largos",`Tarifa de ${eur(m1)} al mes durante 3 meses. Con 12 meses de permanencia ahorrarías ${eur(yearSave(12))} en el año.`],
        ["Propietarios que quieren vender",`Campañas en Meta Ads creadas y optimizadas por nosotros. Con ${grp(r.inv)} €/mes, unos ${Math.round(r.inv/30)} leads al mes.`],
        r.pack==="basico"?["Cada lead, cualificado","Respuesta y cualificación automática por WhatsApp, y el lead en tu correo al momento."]:["Ningún lead se enfría","Seguimiento automatizado por email y WhatsApp mientras el propietario madura su decisión."],
        r.pack==="premium"?["Te llegan cualificados por teléfono","Desde Cosiris llamamos y cualificamos a cada lead antes de pasártelo."]:["Todo en un solo sitio","Minisite en nuestro directorio de inmobiliarias y CRM para seguir cada lead."]];
      B.forEach((b,i)=>{const X=128+(i%2)*840,Y=250+Math.floor(i/2)*230;k.rr(X,Y,816,206,24,K.cream);
        x.beginPath();x.arc(X+64,Y+66,30,0,7);x.fillStyle=K.or;x.fill();k.t(String(i+1),X+64,Y+78,{w:800,s:30,c:K.white,a:"center"});
        k.t(b[0],X+116,Y+78,{w:800,s:34,c:K.navy});k.wrap(b[1],X+116,Y+126,660,{s:22,w:500,lh:30});});
      k.rr(128,724,1664,170,24,K.navy);
      k.t("TU RETORNO ESTIMADO",176,790,{w:800,s:22,c:K.or,ls:3});
      k.wrap(`Con una comisión media de ${eur(S.com)}, ${fmtRange(S.cLo,S.cHi,1)} captaciones pueden traducirse en ${fmtRange(S.vLo,S.vHi,1)} ventas.`,176,836,900,{s:22,w:500,c:K.light,lh:30});
      const sg=v=>(v<0?"":"+")+grp(Math.round(v));
      k.t(`${sg(S.nLo)} a ${sg(S.nHi)} €`,1744,836,{w:800,s:60,c:K.white,a:"right"});
    }};
    const why={bg:K.cream,draw(x,k){
      head(k,"06 · Por qué elegir Cosiris","Confía en quien conoce","tu sector");
      const W=[["+11 años de experiencia","Conocemos el sector inmobiliario y sabemos lo que funciona."],["Hablamos tu idioma","Sin tecnicismos ni rodeos: te lo explicamos claro y simple."],["Cercanía y trato directo","Estamos a tu lado en todo momento. Hablamos contigo, no con robots."],["Crecemos mes a mes","Optimizamos y probamos cada campaña para mejorar resultados."]];
      W.forEach((w,i)=>{const X=128+i*422,Y=250;k.rr(X,Y,398,300,24,K.white,K.line,2);k.rr(X+28,Y,90,6,3,K.or);
        k.t(w[0],X+28,Y+80,{w:800,s:i===2?27:29,c:K.navy});k.wrap(w[1],X+28,Y+130,340,{s:22,w:500,lh:30});});
      k.t("ASÍ TRABAJAMOS CONTIGO",128,640,{w:800,s:22,c:K.ord,ls:3});
      const st=["Te encuentran y te contactan","Cualificamos y contactamos","Seguimiento automatizado","Agendamos visitas y captas","A notaría"];
      st.forEach((t,i)=>{const X=128+i*336,Y=680;k.rr(X,Y,312,170,20,K.white,K.line,2);x.beginPath();x.arc(X+46,Y+50,24,0,7);x.fillStyle=K.or;x.fill();
        k.t(String(i+1),X+46,Y+60,{w:800,s:24,c:K.white,a:"center"});k.wrap(t,X+28,Y+110,260,{s:23,w:800,c:K.navy,lh:28});
        if(i<4)k.t("›",X+324,Y+96,{w:800,s:40,c:K.or,a:"center"});});
      k.t("Especializados en el sector inmobiliario · Visitamos inmobiliarias de toda España · Un único proveedor para todo lo digital",960,915,{w:600,s:20,c:K.text,a:"center"});
    }};
    const extras={bg:K.white,draw(x,k){
      head(k,"07 · Otros servicios","Haz crecer tu marca con","redes y email");
      const cols=[["Gestión de redes sociales","Tu inmobiliaria, presente donde están tus clientes.",["El propietario te busca en Instagram y Facebook antes de llamarte: le das confianza.","Contenido profesional y constante: diseño, redacción y hashtags.","Vídeos y publicaciones que muestran tu trabajo y tus inmuebles.","Análisis de datos mensual para mejorar cada mes."]],
        ["Email marketing","El buzoneo de siempre, ahora en digital.",["Mantienes viva la relación con todos tus contactos.","Recuperas contactos antiguos que hoy quieren vender.","3 emails al mes diseñados y redactados por nosotros.","Segmentación, automatización e informe de resultados."]]];
      cols.forEach((c,i)=>{const X=128+i*844,Y=270,W=820;k.rr(X,Y,W,640,26,i?K.cream:K.navy);
        k.t(c[0],X+48,Y+90,{w:800,s:44,c:i?K.navy:K.white});k.t(c[1],X+48,Y+140,{w:600,s:24,c:i?K.ord:K.or});
        let y=Y+230;c[2].forEach(s=>{x.beginPath();x.arc(X+64,y-9,14,0,7);x.fillStyle=K.or;x.fill();x.strokeStyle="#fff";x.lineWidth=4;x.beginPath();x.moveTo(X+57,y-9);x.lineTo(X+62,y-3);x.lineTo(X+72,y-15);x.stroke();
          y=k.wrap(s,X+96,y,W-150,{s:25,w:500,c:i?K.text:K.light,lh:34})+30;});});
      k.t("Pregunta a tu asesor de Cosiris por estos servicios y por el Pack Líder de digitalización integral.",960,962,{w:600,s:22,c:K.navy,a:"center"});
    }};
    const pages=PG.map(([n,l,rt])=>({n,bg:"#"+l,footer:false,async draw(x){const im=await loadImg(`/calculadora/pages/p${String(n).padStart(2,"0")}.jpg`);if(!im)return "skip";x.fillStyle="#"+rt;x.fillRect(960,0,960,1080);const w=1080*im.width/im.height;x.drawImage(im,(1920-w)/2,0,w,1080);}}));
    const close={bg:K.navy,dark:true,draw(x,k){
      head(k,"Siguientes pasos","Empecemos a captar","vendedores",140,true);
      [["Revisa tu presupuesto","Comprueba la permanencia, el pack y la inversión que has elegido."],["Habla con tu asesor","Te ayuda con la cuenta publicitaria, la forma de pago y cualquier duda."],["Activamos tus campañas","Firmamos y empezamos a llenar tu bolsa de leads."]].forEach((s,i)=>{const X=128+i*568,Y=330;k.rr(X,Y,536,330,24,K.navy2);k.rr(X+24,Y,488,6,3,K.or);
        k.t(String(i+1).padStart(2,"0"),X+40,Y+110,{w:800,s:72,c:K.or});k.t(s[0],X+40,Y+180,{w:800,s:34,c:K.white});k.wrap(s[1],X+40,Y+228,456,{s:22,w:500,c:K.light,lh:30});});
      let y=750;["Todas las cifras de leads, captaciones, ventas y beneficio son un ejemplo calculado con datos promedio de nuestros clientes. No constituyen una garantía ni un compromiso de resultados.","Precios de gestión sin IVA. La inversión en Meta Ads se paga aparte. Al terminar la permanencia, el contrato se renueva automáticamente mes a mes con las condiciones contratadas (390 € + pack)."].forEach(s=>{y=k.wrap(s,128,y,1664,{s:20,w:500,c:K.light,lh:28})+10;});
      k.t("Sujeto a términos y condiciones contractuales. Habla con tu asesor de Cosiris.",128,y+20,{w:800,s:24,c:K.white});
    }};
    const pg=n=>pages.find(q=>q.n===n);
    return [cover,budget,mesames,benefits,packs,report,why,pg(4),pg(6),extras,pg(10),pg(11),pg(12),pg(13),pg(14),pg(15),close];
  }
  async function makePdf(kind,onP){
    if(document.fonts){await Promise.race([Promise.all([500,600,700,800].map(w=>document.fonts.load(`${w} 40px Montserrat`))).catch(()=>{}),new Promise(r=>setTimeout(r,3000))]);}
    const {jsPDF}=await import("jspdf");const pdf=new jsPDF({orientation:"landscape",unit:"pt",format:[960,540],compress:true});
    const c=document.createElement("canvas");c.width=1920;c.height=1080;
    const list=slidesFor(kind,LAST);let n=0,first=true;const imgsOut=[];pdf.__imgs=imgsOut;
    let idx=0;for(const s of list){idx++;onP&&onP(idx,list.length);await new Promise(r=>setTimeout(r,0));const x=c.getContext("2d");x.setTransform(1,0,0,1,0,0);
      if(s.footer===false&&s.draw.length===1){x.fillStyle=s.bg;x.fillRect(0,0,1920,1080);if((await s.draw(x))==="skip")continue;}
      else await drawSlide(c,s,n+1);
      n++;if(!first)pdf.addPage([960,540],"landscape");first=false;
      const du=c.toDataURL("image/jpeg",0.88);imgsOut.push(du);pdf.addImage(du,"JPEG",0,0,960,540,undefined,"FAST");}
    pdf.setProperties({title:"Presupuesto Cosiris",author:"Cosiris"});
    return pdf;
  }
  const FN={presupuesto:"Tu presupuesto Cosiris.pdf"};
  let LEAD=null, pending=null;
  const KIND={presupuesto:"PDF completo"};
  function leadSummary(kind){const S=LAST,r=S.r;
    return `${LEAD.nombre} (${LEAD.inmobiliaria}, ${LEAD.zona}) se ha descargado un presupuesto (${KIND[kind]}). `+
      `Plan: ${r.perm} meses · pack ${NAME[r.pack]} · ${grp(r.inv)} €/mes en Meta Ads · comisión media ${eur(S.com)}. `+
      `Cuota de gestión: ${r.months.map(m=>grp(m)).join(" / ")} € · total Cosiris ${eur(r.fees)} · Meta ${eur(r.ads)} · total ${eur(r.tot)}. `+
      `Estimación: ${Math.round(S.lo)}–${Math.round(S.hi)} leads, ${dec1(S.cLo)}–${dec1(S.cHi)} captaciones.`;}
  async function sendLead(kind){try{return !!(await opts.onLead({...LEAD,summary:leadSummary(kind)}));}catch(e){return false;}}
  const M=$("leadM"),F=$("leadF");
  const openM=kind=>{pending=kind;$("leadE").textContent="";F.hidden=false;$("leadP").hidden=true;M.hidden=false;setTimeout(()=>F.elements.nombre.focus(),30);};
  const closeM=()=>{M.hidden=true;pending=null;};
  $("leadX").addEventListener("click",closeM);
  M.addEventListener("click",e=>{if(e.target===M)closeM();});
  on(document,"keydown",e=>{if(e.key==="Escape"&&!M.hidden)closeM();});
  F.addEventListener("submit",async e=>{e.preventDefault();
    const d=Object.fromEntries(["nombre","inmobiliaria","email","telefono","zona","empleados"].map(k=>[k,F.elements[k].value.trim()]));
    const bad=[];if(d.nombre.length<2)bad.push("nombre");if(d.inmobiliaria.length<2)bad.push("inmobiliaria");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))bad.push("email");if(d.telefono.replace(/\D/g,"").length<9)bad.push("telefono");if(d.zona.length<2)bad.push("zona");if(!d.empleados)bad.push("empleados");
    ["nombre","inmobiliaria","email","telefono","zona","empleados"].forEach(k=>F.elements[k].classList.toggle("bad",bad.includes(k)));
    if(bad.length){$("leadE").textContent="Revisa los campos marcados: necesitamos todos tus datos (teléfono de al menos 9 cifras).";F.elements[bad[0]].focus();return;}
    if(!F.elements.ok.checked){$("leadE").textContent="Para descargarlo, acepta que podamos contactarte.";return;}
    LEAD=d;const kind=pending;$("leadB").disabled=true;$("leadB").textContent="Preparando…";
    sendLead(kind).then(ok=>{LEAD.sent=ok;});
    $("leadB").disabled=false;$("leadB").textContent="Descargar mi presupuesto ↓";
    doDownload(kind);});
  const PP=$("leadP");
  $("leadPX").addEventListener("click",()=>{M.hidden=true;});
  const prog=(t,msg,pc,html)=>{$("pgT").textContent=t;if(html)$("pgMsg").innerHTML=msg;else $("pgMsg").textContent=msg;if(pc!=null)$("pgBar").style.width=pc+"%";};
  let OUT=null;
  async function saveOut(btn){
    if(!OUT)return;const note=$("pgNote");note.className="hint";note.textContent="Guardando…";
    try{
      {const a=document.createElement("a");a.download=OUT.name;a.href=OUT.url;document.body.appendChild(a);a.click();a.remove();
        note.className="hint";note.textContent="Si tu navegador no lo ha descargado, pulsa «Ver mi presupuesto ahora».";}
    }catch(e){const code=e&&e.code;note.className="warn";note.textContent=code==="declined"?"Has cancelado la descarga.":code==="rate_limited"?"Ya hay una descarga pendiente de confirmar.":"No se ha podido descargar aquí. Pulsa «Ver mi presupuesto ahora».";}
  }
  function openViewer(){if(!OUT)return;const v=$("vPages");v.innerHTML="";OUT.imgs.forEach((u,i)=>{const im=new Image();im.src=u;im.alt="Página "+(i+1);im.loading="lazy";v.appendChild(im);});M.hidden=true;$("viewer").hidden=false;v.scrollTop=0;}
  $("pgView").addEventListener("click",openViewer);
  $("pgDl").addEventListener("click",()=>saveOut());
  $("vDl").addEventListener("click",()=>{$("viewer").hidden=true;M.hidden=false;saveOut();});
  $("vX").addEventListener("click",()=>{$("viewer").hidden=true;});
  on(document,"keydown",e=>{if(e.key==="Escape"&&!$("viewer").hidden)$("viewer").hidden=true;});
  async function doDownload(kind){
    F.hidden=true;PP.hidden=false;M.hidden=false;$("pgAct").hidden=true;$("pgNote").textContent="";
    prog("Preparando tu presupuesto…","Un momento, estamos montando tu PDF.",3);
    const bs=root.querySelectorAll(".dlb");bs.forEach(q=>q.disabled=true);
    try{
      const pdf=await makePdf(kind,(i,n)=>prog("Preparando tu presupuesto…",`Página ${i} de ${n}`,Math.round(i/n*95)));
      const blob=pdf.output("blob");if(OUT&&OUT.url)URL.revokeObjectURL(OUT.url);
      OUT={blob,name:FN[kind],imgs:pdf.__imgs,url:URL.createObjectURL(blob)};
      prog("¡Tu presupuesto está listo!","Míralo ahora aquí mismo o descárgalo en PDF. Un asesor de Cosiris se pondrá en contacto contigo.",100);
      $("pgAct").hidden=false;$("pgView").focus();
    }catch(e){prog("No se ha podido preparar","Algo ha fallado al montar tu presupuesto. Inténtalo de nuevo.",100);}
    finally{bs.forEach(q=>q.disabled=false);}
  }
  root.querySelectorAll(".dlb").forEach(b=>b.addEventListener("click",()=>{const kind=b.dataset.kind;
    if(LEAD){doDownload(kind);}else openM(kind);}));

  return ()=>{ac.abort();if(io)io.disconnect();if(ft)ft.remove();portal.remove();if(OUT&&OUT.url)URL.revokeObjectURL(OUT.url);};
}
