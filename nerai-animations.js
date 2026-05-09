/*!
 * NERAI Animations v2.1 — neraicorp.com native build
 * ─────────────────────────────────────────────────────────────
 * Colors matched exactly to the site's CSS variables:
 *   --teal:   #0077a8
 *   --accent: #00a886
 *   --navy:   #0d1f3c
 *
 * NERAI = Go strategy term "nerai" (predict opponent's move
 * before they make it) + AI (the engine that makes it possible).
 *
 * Animations injected:
 *   Hero      — Living Go board: teal + accent stones, alert ripples
 *   About     — 5 data source orbit (GDELT/ACLED/WB/IMF/Satellite)
 *   How       — Event → Causal AI → Intelligence pipeline
 *   Platform  — Animated stat counters
 *   AI Analyst— Typewriter chat demo
 *   Causal    — Cause-effect network graph
 *   What-if   — Go game-tree branching scenarios
 *   Methodology— Data pipeline steps
 *   Global    — Scroll reveal + cursor trail
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Brand palette (exact site colors) ──────────────────── */
  const T  = '#0077a8';              // --teal
  const A  = '#00a886';              // --accent
  const N  = '#0d1f3c';              // --navy
  const TA = (a) => `rgba(0,119,168,${a})`;
  const AA = (a) => `rgba(0,168,134,${a})`;
  const NA = (a) => `rgba(13,31,60,${a})`;

  /* ── Utilities ───────────────────────────────────────────── */
  const lerp  = (a,b,t) => a+(b-a)*t;
  const rand  = (mn,mx) => Math.random()*(mx-mn)+mn;
  const randI = (mn,mx) => Math.floor(rand(mn,mx+1));
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const TAU   = Math.PI*2;

  function hexRgb(hex) {
    return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',');
  }

  function onVisible(el,cb,thr=0.25) {
    new IntersectionObserver((es,obs)=>{
      if(es[0].isIntersecting){cb();obs.disconnect();}
    },{threshold:thr}).observe(el);
  }

  function fadeIn(el) {
    el.style.opacity='0';
    el.style.transition='opacity 1.1s ease';
    onVisible(el,()=>{ el.style.opacity='1'; },0.2);
  }

  /* ══════════════════════════════════════════════════════════
   * 1. HERO — Living Go Board
   *    Teal & accent stones breathe like the logo grid.
   *    Ripples erupt at hotspot positions — intelligence alerts.
   *    Signal threads connect stones — influence chains.
   * ══════════════════════════════════════════════════════════ */
  function initHero() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const cvs = document.createElement('canvas');
    Object.assign(cvs.style, {
      position:'absolute', inset:'0',
      width:'100%', height:'100%',
      pointerEvents:'none', zIndex:'0',
      opacity:'0.65',
    });
    // Insert after hero-grid so the existing grid shows through
    const hg = hero.querySelector('.hero-grid');
    hg ? hg.after(cvs) : hero.prepend(cvs);

    const ctx = cvs.getContext('2d');
    let W, H, dots, threads;
    const COLS = 20, ROWS = 11;
    let mx = 0, my = 0;

    document.addEventListener('mousemove', e => {
      mx = (e.clientX/window.innerWidth  - 0.5) * 14;
      my = (e.clientY/window.innerHeight - 0.5) *  8;
    });

    function build() {
      dots=[]; threads=[];
      const cW=W/COLS, cH=H/ROWS;
      for (let r=0; r<=ROWS; r++) {
        for (let c=0; c<=COLS; c++) {
          // Mix teal (60%) and accent (40%) stones, matching the brand gradient
          const isTeal   = Math.random() < 0.38;
          const isAccent = !isTeal && Math.random() < 0.38;
          const isActive = isTeal || isAccent;
          dots.push({
            baseX: c*cW, baseY: r*cH,
            x: c*cW, y: r*cH,
            r: isActive ? rand(2.6,4.6) : rand(1.5,2.8),
            teal: isTeal, accent: isAccent, active: isActive,
            hot: isActive && Math.random() < 0.08,
            alpha: rand(0.28,0.88),
            phase: rand(0,TAU), phaseSpd: rand(0.016,0.05),
            ripR: 0, ripCap: 0,
          });
        }
      }
      // Signal threads between active stones
      const cW2 = W/COLS;
      for (let i=0; i<dots.length; i++) {
        if (!dots[i].active) continue;
        for (let j=i+1; j<dots.length; j++) {
          if (!dots[j].active) continue;
          const d = Math.hypot(dots[i].x-dots[j].x, dots[i].y-dots[j].y);
          if (d < cW2*1.8 && Math.random() < 0.25) {
            threads.push({ a:i, b:j, flow:rand(0,1), spd:rand(0.004,0.014) });
          }
        }
      }
    }

    let frame=0, nextRip=100;
    function draw() {
      ctx.clearRect(0,0,W,H); frame++;
      if (frame >= nextRip) {
        const hs = dots.filter(d=>d.hot&&d.ripCap===0);
        if (hs.length) { const d=hs[randI(0,hs.length-1)]; d.ripR=0; d.ripCap=rand(40,80); }
        nextRip = frame + randI(65,160);
      }
      // Threads
      threads.forEach(th => {
        th.flow = (th.flow+th.spd)%1;
        const a=dots[th.a], b=dots[th.b];
        const px=lerp(a.x,b.x,th.flow), py=lerp(a.y,b.y,th.flow);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle = TA(0.1); ctx.lineWidth=0.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(px,py,1.7,0,TAU);
        ctx.fillStyle = a.teal ? TA(0.82) : AA(0.82); ctx.fill();
      });
      // Stones
      dots.forEach(dot => {
        dot.phase += dot.phaseSpd;
        const p = 0.76+0.24*Math.sin(dot.phase);
        dot.x = dot.baseX + mx*(dot.baseX/W-.5+.5)*.8;
        dot.y = dot.baseY + my*(dot.baseY/H-.5+.5)*.55;
        if (dot.active) {
          const col = dot.teal ? T : A;
          const colA = dot.teal ? TA : AA;
          const g = ctx.createRadialGradient(dot.x,dot.y,0,dot.x,dot.y,dot.r*4.2);
          g.addColorStop(0, colA(0.16*p)); g.addColorStop(1, colA(0));
          ctx.beginPath(); ctx.arc(dot.x,dot.y,dot.r*4.2,0,TAU); ctx.fillStyle=g; ctx.fill();
          ctx.beginPath(); ctx.arc(dot.x,dot.y,dot.r*p,0,TAU);
          ctx.fillStyle=colA(dot.alpha*p); ctx.fill();
          // Alert ripple
          if (dot.ripCap>0) {
            dot.ripR += 1.7;
            const rA = clamp(1-dot.ripR/dot.ripCap,0,1);
            ctx.beginPath(); ctx.arc(dot.x,dot.y,dot.ripR,0,TAU);
            ctx.strokeStyle = colA(rA*.65); ctx.lineWidth=1.8; ctx.stroke();
            if (dot.ripR>18) {
              const rA2=clamp(1-(dot.ripR-18)/dot.ripCap,0,1);
              ctx.beginPath(); ctx.arc(dot.x,dot.y,dot.ripR-18,0,TAU);
              ctx.strokeStyle=colA(rA2*.24); ctx.lineWidth=0.8; ctx.stroke();
            }
            if (dot.ripR>=dot.ripCap) { dot.ripR=0; dot.ripCap=0; }
          }
        } else {
          ctx.beginPath(); ctx.arc(dot.x,dot.y,dot.r*p,0,TAU);
          ctx.fillStyle=NA(dot.alpha*.18*p); ctx.fill();
        }
      });
      requestAnimationFrame(draw);
    }

    function resize() {
      W=cvs.width=cvs.offsetWidth; H=cvs.height=cvs.offsetHeight; build();
    }
    window.addEventListener('resize', resize);
    resize(); draw();
  }

  /* ══════════════════════════════════════════════════════════
   * 2. ABOUT — Data Source Orbit
   *    Five streams orbit inward to the NERAI core.
   * ══════════════════════════════════════════════════════════ */
  function initAbout() {
    const sec = document.getElementById('about');
    if (!sec) return;

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position:'absolute', top:'50%', right:'3vw',
      transform:'translateY(-50%)',
      width:'280px', height:'280px',
      pointerEvents:'none', zIndex:'1',
    });
    sec.style.position='relative'; sec.style.overflow='hidden';
    sec.appendChild(wrap); fadeIn(wrap);

    const cvs=document.createElement('canvas');
    cvs.width=280; cvs.height=280;
    Object.assign(cvs.style,{width:'100%',height:'100%'});
    wrap.appendChild(cvs);
    const ctx=cvs.getContext('2d'), CX=140, CY=140, R=102;

    const srcs=[
      {label:'GDELT',      col:T,          angle:-90},
      {label:'ACLED',      col:A,          angle:-18},
      {label:'World Bank', col:'#3b82f6',  angle: 54},
      {label:'IMF',        col:'#8b5cf6',  angle:126},
      {label:'Satellite',  col:'#f59e0b',  angle:-162},
    ].map(s=>({
      ...s,
      angle: s.angle*Math.PI/180,
      get x(){return CX+Math.cos(this.angle)*R},
      get y(){return CY+Math.sin(this.angle)*R},
      pts: Array.from({length:3},()=>({t:rand(0,1),spd:rand(0.005,0.012)})),
      phase: rand(0,TAU),
    }));

    let cp=0;
    function draw() {
      ctx.clearRect(0,0,280,280); cp+=0.022;
      srcs.forEach(s => {
        s.phase+=0.018;
        ctx.beginPath(); ctx.moveTo(CX,CY); ctx.lineTo(s.x,s.y);
        ctx.strokeStyle=`rgba(${hexRgb(s.col)},0.18)`; ctx.lineWidth=1.1; ctx.stroke();
        s.pts.forEach(p => {
          p.t-=p.spd; if(p.t<0)p.t=1;
          const px=lerp(CX,s.x,p.t), py=lerp(CY,s.y,p.t);
          ctx.beginPath(); ctx.arc(px,py,2.1,0,TAU);
          ctx.fillStyle=`rgba(${hexRgb(s.col)},0.82)`; ctx.fill();
        });
        const pl=0.88+0.12*Math.sin(s.phase);
        const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,16);
        g.addColorStop(0,`rgba(${hexRgb(s.col)},0.2)`); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(s.x,s.y,16,0,TAU); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x,s.y,6*pl,0,TAU); ctx.fillStyle=s.col; ctx.fill();
        ctx.font='bold 8.5px Inter,sans-serif'; ctx.fillStyle=s.col; ctx.textAlign='center';
        const off = s.y<CY-10?-13:13;
        ctx.fillText(s.label, s.x, s.y+off);
      });
      // Core node
      const cp2=0.84+0.16*Math.sin(cp);
      const cg=ctx.createRadialGradient(CX,CY,0,CX,CY,34*cp2);
      cg.addColorStop(0,TA(0.24*cp2)); cg.addColorStop(1,TA(0));
      ctx.beginPath(); ctx.arc(CX,CY,34*cp2,0,TAU); ctx.fillStyle=cg; ctx.fill();
      ctx.beginPath(); ctx.arc(CX,CY,12*cp2,0,TAU); ctx.fillStyle=T; ctx.fill();
      ctx.font='bold 10px Inter,sans-serif'; ctx.fillStyle=T; ctx.textAlign='center';
      ctx.fillText('NERAI',CX,CY+24);
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ══════════════════════════════════════════════════════════
   * 3. HOW — Intelligence Pipeline
   * ══════════════════════════════════════════════════════════ */
  function initHow() {
    const sec = document.getElementById('how');
    if (!sec) return;
    const wrap=document.createElement('div');
    Object.assign(wrap.style,{display:'flex',justifyContent:'center',marginTop:'40px',pointerEvents:'none'});
    sec.appendChild(wrap);
    const cvs=document.createElement('canvas'); cvs.width=640; cvs.height=95;
    Object.assign(cvs.style,{width:'min(640px,88vw)',height:'auto',display:'block'});
    wrap.appendChild(cvs); fadeIn(wrap);
    const ctx=cvs.getContext('2d'), W=640, CY=48;
    const stages=[
      {x:82, label:'EVENT SIGNALS',  sub:'GDELT · ACLED · Sat'},
      {x:320,label:'CAUSAL AI',      sub:'Pattern · Predict'},
      {x:558,label:'INTELLIGENCE',   sub:'Quantified · Ready'},
    ];
    const pipes=stages.slice(0,-1).map((s,i)=>({
      x1:s.x+36,x2:stages[i+1].x-36,
      pts:Array.from({length:5},()=>({t:rand(0,1),spd:rand(0.004,0.01)})),
    }));
    let t=0;
    function draw() {
      ctx.clearRect(0,0,W,95); t+=0.02;
      pipes.forEach(p=>{
        ctx.beginPath(); ctx.moveTo(p.x1,CY); ctx.lineTo(p.x2,CY);
        ctx.strokeStyle=TA(0.22); ctx.lineWidth=1.8; ctx.stroke();
        p.pts.forEach(pt=>{
          pt.t=(pt.t+pt.spd)%1;
          const px=lerp(p.x1,p.x2,pt.t);
          ctx.beginPath(); ctx.arc(px,CY,2.3,0,TAU); ctx.fillStyle=TA(0.78); ctx.fill();
        });
      });
      stages.forEach((s,i)=>{
        const pl=0.88+0.12*Math.sin(t+i*2.1);
        const col=i===1?A:T;
        const g=ctx.createRadialGradient(s.x,CY,0,s.x,CY,34);
        g.addColorStop(0,`rgba(${hexRgb(col)},0.13)`); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(s.x,CY,34,0,TAU); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x,CY,12*pl,0,TAU); ctx.fillStyle=col; ctx.fill();
        ctx.font='bold 8.5px Inter,sans-serif'; ctx.fillStyle=N; ctx.textAlign='center';
        ctx.fillText(s.label,s.x,CY-22);
        ctx.font='7.5px Inter,sans-serif'; ctx.fillStyle='#64748b';
        ctx.fillText(s.sub,s.x,CY+30);
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ══════════════════════════════════════════════════════════
   * 4. PLATFORM — Stat Counters
   * ══════════════════════════════════════════════════════════ */
  function initCounters() {
    document.querySelectorAll('.hero-stat-num, .stat-num, [class*="stat-num"]').forEach(el=>{
      const raw=el.textContent.trim();
      const num=parseFloat(raw.replace(/[^0-9.]/g,''));
      const suffix=raw.replace(/[0-9.,]/g,'');
      if(!num||num<2)return;
      const orig=el.textContent;
      el.textContent='0'+suffix;
      onVisible(el,()=>{
        const dur=1500,start=performance.now();
        function tick(now){
          const p=Math.min((now-start)/dur,1);
          const e=1-Math.pow(1-p,3);
          el.textContent=Math.round(num*e)+suffix;
          if(p<1)requestAnimationFrame(tick);else el.textContent=orig;
        }
        requestAnimationFrame(tick);
      },0.5);
    });
  }

  /* ══════════════════════════════════════════════════════════
   * 5. AI ANALYST — Typewriter Chat Demo
   * ══════════════════════════════════════════════════════════ */
  function initAIAnalyst() {
    const sec=document.getElementById('ai-analyst');
    if (!sec) return;
    // Find the right panel to insert into
    const panel=sec.querySelector('.analyst-demo,.chat-panel,[class*="demo"],[class*="chat"]');
    const container=panel||sec;

    const demo=document.createElement('div');
    Object.assign(demo.style,{
      maxWidth:'440px', margin:'28px auto 0',
      background:'#ffffff', border:'1px solid #e2e8f0',
      borderRadius:'12px', overflow:'hidden',
      fontFamily:'Inter,sans-serif',
      boxShadow:'0 4px 20px rgba(13,31,60,0.08)',
    });
    demo.innerHTML=`
      <div style="background:#f4f7fb;padding:10px 16px;font-size:10px;font-weight:700;
                  letter-spacing:.1em;color:#0d1f3c;text-transform:uppercase;
                  border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;">
        <span style="width:7px;height:7px;border-radius:50%;background:#0077a8;display:inline-block;"></span>
        NERAI AI Analyst
      </div>
      <div id="_nerai_chat" style="padding:18px;min-height:145px;"></div>
    `;
    container.appendChild(demo); fadeIn(demo);

    const chat=demo.querySelector('#_nerai_chat');
    const exs=[
      {q:'What is the current risk level in Iran?',a:'Nuclear Risk Index: 0.84 — elevated. Military event frequency +18% WoW. Three causal drivers: enrichment pace, G7 posture, proxy activity in Iraq. Monitor 72h window.'},
      {q:'Which risks predict oil price volatility?',a:'Strait of Hormuz tension (r=0.81, lag 3d), Saudi signals (r=0.73, lag 5d), US inventory (r=0.68, lag 1d). Composite: 62% probability of >4% move in 7 days.'},
      {q:'Simulate a Gaza ceasefire scenario.',a:'Ceasefire: Regional Risk −0.22, Oil −3.1%, Jordan stability +0.15. Egyptian mediation succeeds (p=0.41) vs collapses (p=0.59). Watch border crossing data as lead indicator.'},
    ];
    let idx=0;
    function typeText(el,text,spd,done){
      let i=0; el.textContent='';
      const iv=setInterval(()=>{el.textContent+=text[i++];if(i>=text.length){clearInterval(iv);if(done)setTimeout(done,1400);}},spd);
    }
    function run(){
      const ex=exs[idx%exs.length]; idx++; chat.innerHTML='';
      const u=document.createElement('div');
      Object.assign(u.style,{background:'rgba(0,119,168,0.07)',border:'1px solid rgba(0,119,168,0.18)',
        borderRadius:'8px 8px 2px 8px',padding:'9px 13px',fontSize:'12.5px',color:'#0d1f3c',
        marginBottom:'10px',maxWidth:'86%',marginLeft:'auto'});
      chat.appendChild(u);
      typeText(u,ex.q,30,()=>{
        const dots=document.createElement('div');
        dots.style.cssText='font-size:18px;color:#94a3b8;letter-spacing:4px;margin-bottom:10px;';
        dots.textContent='···'; chat.appendChild(dots);
        let d=0; const dv=setInterval(()=>{dots.textContent=['·  ','·· ','···'][d++%3];},300);
        setTimeout(()=>{
          clearInterval(dv); dots.remove();
          const a=document.createElement('div');
          Object.assign(a.style,{background:'#fff',border:'1px solid #e2e8f0',
            borderRadius:'2px 8px 8px 8px',padding:'9px 13px',fontSize:'12px',
            color:'#334155',lineHeight:'1.68',maxWidth:'92%'});
          chat.appendChild(a);
          typeText(a,ex.a,17,()=>setTimeout(run,2000));
        },900);
      });
    }
    onVisible(sec,run,0.3);
  }

  /* ══════════════════════════════════════════════════════════
   * 6. CAUSAL ENGINE — Territory Control Network
   * ══════════════════════════════════════════════════════════ */
  function initCausal() {
    const sec=document.getElementById('causal-engine');
    if (!sec) return;
    const wrap=document.createElement('div');
    Object.assign(wrap.style,{position:'absolute',top:'50%',right:'2vw',
      transform:'translateY(-50%)',width:'400px',height:'340px',
      pointerEvents:'none',zIndex:'1'});
    sec.style.position='relative'; sec.style.overflow='hidden';
    sec.appendChild(wrap); fadeIn(wrap);
    const cvs=document.createElement('canvas'); cvs.width=400; cvs.height=340;
    Object.assign(cvs.style,{width:'100%',height:'100%'});
    wrap.appendChild(cvs);
    const ctx=cvs.getContext('2d'), W=400, H=340;
    const nodes=[
      {x:68, y:170,label:'IRAN',       size:11,col:T,     key:true},
      {x:172,y:68, label:'STRAIT',     size:7, col:'#7dd3fc',key:false},
      {x:172,y:170,label:'NUCLEAR',    size:8, col:T,     key:false},
      {x:172,y:274,label:'PROXIES',    size:7, col:A,     key:false},
      {x:295,y:48, label:'OIL PRICE',  size:8, col:'#f59e0b',key:false},
      {x:295,y:135,label:'STRIKE RISK',size:7, col:'#f87171',key:false},
      {x:295,y:210,label:'G7 RESPONSE',size:7, col:A,     key:false},
      {x:295,y:292,label:'REGION RISK',size:9, col:'#fb923c',key:true},
    ].map(n=>({...n,phase:rand(0,TAU),phaseSpd:rand(0.025,.06)}));
    const edges=[{f:0,t:1},{f:0,t:2},{f:0,t:3},{f:1,t:4},{f:2,t:5},
                 {f:2,t:6},{f:3,t:7},{f:5,t:7},{f:6,t:7}]
      .map(e=>({...e,flow:rand(0,1),spd:rand(0.005,0.018)}));
    function draw(){
      ctx.clearRect(0,0,W,H);
      edges.forEach(e=>{
        e.flow=(e.flow+e.spd)%1;
        const a=nodes[e.f],b=nodes[e.t];
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=TA(0.18); ctx.lineWidth=1.3; ctx.stroke();
        const px=lerp(a.x,b.x,e.flow),py=lerp(a.y,b.y,e.flow);
        ctx.beginPath(); ctx.arc(px,py,2.5,0,TAU); ctx.fillStyle=TA(0.88); ctx.fill();
      });
      nodes.forEach(n=>{
        n.phase+=n.phaseSpd; const p=0.86+0.14*Math.sin(n.phase), r=n.size*p;
        const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*3.5);
        g.addColorStop(0,`rgba(${hexRgb(n.col)},0.2)`); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(n.x,n.y,r*3.5,0,TAU); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,TAU); ctx.fillStyle=n.col; ctx.fill();
        ctx.font=`${n.key?'bold ':''}9.5px Inter,sans-serif`;
        ctx.fillStyle=`rgba(${hexRgb(n.col)},0.92)`; ctx.textAlign='center';
        ctx.fillText(n.label,n.x,n.y+r+13);
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ══════════════════════════════════════════════════════════
   * 7. WHAT-IF — Go Game Tree
   * ══════════════════════════════════════════════════════════ */
  function initWhatIf() {
    const sec=document.getElementById('whatif');
    if (!sec) return;
    const wrap=document.createElement('div');
    Object.assign(wrap.style,{position:'absolute',left:'3vw',top:'50%',
      transform:'translateY(-50%)',width:'360px',height:'288px',
      pointerEvents:'none',zIndex:'1'});
    sec.style.position='relative'; sec.style.overflow='hidden';
    sec.appendChild(wrap); fadeIn(wrap);
    const cvs=document.createElement('canvas'); cvs.width=360; cvs.height=288;
    Object.assign(cvs.style,{width:'100%',height:'100%'});
    wrap.appendChild(cvs);
    const ctx=cvs.getContext('2d'), W=360, H=288;
    const root={x:30,y:H/2,col:N,label:'NOW'};
    const branches=[
      {x:148,y:54, col:'#f87171',label:'ESCALATION',prob:32,kids:[
        {x:296,y:26, col:'#ef4444',label:'CONFLICT',  prob:19},
        {x:296,y:84, col:'#fb923c',label:'STANDOFF',  prob:13}]},
      {x:148,y:144,col:T,        label:'DIPLOMACY', prob:45,kids:[
        {x:296,y:124,col:A,        label:'DEAL',       prob:28},
        {x:296,y:192,col:'#8b5cf6',label:'STALEMATE',  prob:17}]},
      {x:148,y:240,col:'#f59e0b', label:'SANCTIONS',prob:23,kids:[
        {x:296,y:250,col:'#a78bfa', label:'ISOLATION',prob:23}]},
    ];
    let t=0,active=0,switchAt=215;
    function bez(ax,ay,bx,by,col,alpha){
      const cp=(ax+bx)/2;
      ctx.beginPath(); ctx.moveTo(ax,ay);
      ctx.bezierCurveTo(cp,ay,cp,by,bx,by);
      ctx.strokeStyle=`rgba(${hexRgb(col)},${alpha})`; ctx.lineWidth=1.5; ctx.stroke();
    }
    function stone(x,y,col,r,alpha,label,prob){
      ctx.globalAlpha=alpha;
      const g=ctx.createRadialGradient(x,y,0,x,y,r*3);
      g.addColorStop(0,`rgba(${hexRgb(col)},0.22)`); g.addColorStop(1,'transparent');
      ctx.beginPath(); ctx.arc(x,y,r*3,0,TAU); ctx.fillStyle=g; ctx.fill();
      ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fillStyle=col; ctx.fill();
      ctx.font='9px Inter,sans-serif'; ctx.fillStyle=col; ctx.textAlign='center';
      ctx.fillText(label,x,y-r-5); if(prob!=null)ctx.fillText(prob+'%',x,y+r+12);
      ctx.globalAlpha=1;
    }
    function draw(){
      ctx.clearRect(0,0,W,H); t++;
      if(t>=switchAt){active=(active+1)%3;switchAt=t+210;}
      const pl=0.86+0.14*Math.sin(t*0.04);
      stone(root.x,root.y,root.col,10*pl,1,root.label,null);
      branches.forEach((br,i)=>{
        const on=i===active,a=on?1:0.18;
        bez(root.x,root.y,br.x,br.y,br.col,a*.55);
        stone(br.x,br.y,br.col,on?9:5.5,a,br.label,br.prob);
        br.kids.forEach(k=>{
          bez(br.x,br.y,k.x,k.y,k.col,on?.58:.07);
          stone(k.x,k.y,k.col,on?6.5:4,on?.8:.1,k.label,k.prob);
        });
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ══════════════════════════════════════════════════════════
   * 8. METHODOLOGY — Data Pipeline Steps
   * ══════════════════════════════════════════════════════════ */
  function initMethodology() {
    const sec=document.getElementById('methodology');
    if (!sec) return;
    const wrap=document.createElement('div');
    Object.assign(wrap.style,{pointerEvents:'none',margin:'36px 0 0',display:'flex',justifyContent:'center'});
    sec.appendChild(wrap);
    const cvs=document.createElement('canvas'); cvs.width=680; cvs.height=88;
    Object.assign(cvs.style,{width:'min(680px,88vw)',height:'auto',display:'block'});
    wrap.appendChild(cvs); fadeIn(wrap);
    const ctx=cvs.getContext('2d'), W=680, CY=44;
    const steps=[
      {x:58, label:'RAW EVENTS'},{x:196,label:'FILTER'},
      {x:340,label:'CAUSAL MODEL'},{x:484,label:'SCORING'},{x:622,label:'INTELLIGENCE'}
    ];
    const pipes=steps.slice(0,-1).map((s,i)=>({
      x1:s.x+21,x2:steps[i+1].x-21,
      pts:Array.from({length:4},()=>({t:rand(0,1),spd:rand(0.005,0.012)})),
    }));
    let t=0;
    function draw(){
      ctx.clearRect(0,0,W,88); t+=0.022;
      pipes.forEach(p=>{
        ctx.beginPath(); ctx.moveTo(p.x1,CY); ctx.lineTo(p.x2,CY);
        ctx.strokeStyle=TA(0.22); ctx.lineWidth=1.6; ctx.stroke();
        p.pts.forEach(pt=>{
          pt.t=(pt.t+pt.spd)%1; const px=lerp(p.x1,p.x2,pt.t);
          ctx.beginPath(); ctx.arc(px,CY,2.1,0,TAU); ctx.fillStyle=TA(0.76); ctx.fill();
        });
      });
      steps.forEach((s,i)=>{
        const pl=0.88+0.12*Math.sin(t+i*1.3);
        const col=i%2===0?T:A;
        const g=ctx.createRadialGradient(s.x,CY,0,s.x,CY,20);
        g.addColorStop(0,`rgba(${hexRgb(col)},0.15)`); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(s.x,CY,20*pl,0,TAU); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x,CY,8.5*pl,0,TAU); ctx.fillStyle=col; ctx.fill();
        ctx.font='bold 8px Inter,sans-serif'; ctx.fillStyle=N; ctx.textAlign='center';
        ctx.fillText(s.label,s.x,CY+(i%2===0?-17:27));
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ══════════════════════════════════════════════════════════
   * 9. SCROLL REVEAL
   * ══════════════════════════════════════════════════════════ */
  function initReveal() {
    // The site already has its own IntersectionObserver for .animate-on-scroll
    // This adds our class on top of those we don't own
    const css=document.createElement('style');
    css.textContent=`
      .nr-fade{opacity:0;transform:translateY(24px);
        transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1);}
      .nr-fade.nr-in{opacity:1;transform:none;}
    `;
    document.head.appendChild(css);
    // Only target elements not already animated by the site
    document.querySelectorAll(
      'section:not(#hero) h2:not(.animate-on-scroll),' +
      'section:not(#hero) .section-label:not(.animate-on-scroll),' +
      '.step-title:not(.animate-on-scroll),.feature-name:not(.animate-on-scroll)'
    ).forEach((el,i)=>{
      if (!el.closest('#hero')) {
        el.classList.add('nr-fade');
        el.style.transitionDelay=`${(i%4)*70}ms`;
      }
    });
    const io=new IntersectionObserver(
      es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('nr-in');}),
      {threshold:0.18}
    );
    document.querySelectorAll('.nr-fade').forEach(el=>io.observe(el));
  }

  /* ══════════════════════════════════════════════════════════
   * 10. CURSOR TRAIL — Subtle teal signal
   * ══════════════════════════════════════════════════════════ */
  function initCursor() {
    const MAX=12,trail=[];
    const cvs=document.createElement('canvas');
    Object.assign(cvs.style,{position:'fixed',top:'0',left:'0',
      width:'100%',height:'100%',pointerEvents:'none',zIndex:'99999'});
    document.body.appendChild(cvs);
    const ctx=cvs.getContext('2d');
    let W=cvs.width=window.innerWidth, H=cvs.height=window.innerHeight;
    window.addEventListener('resize',()=>{W=cvs.width=window.innerWidth;H=cvs.height=window.innerHeight;});
    document.addEventListener('mousemove',e=>{
      trail.push({x:e.clientX,y:e.clientY,life:1});
      if(trail.length>MAX)trail.shift();
    });
    function draw(){
      ctx.clearRect(0,0,W,H);
      trail.forEach((pt,i)=>{
        pt.life-=0.07; if(pt.life<0)return;
        const a=pt.life*(i/trail.length)*0.45;
        ctx.beginPath(); ctx.arc(pt.x,pt.y,2.3*pt.life,0,TAU);
        ctx.fillStyle=`rgba(0,119,168,${a})`; ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ── INIT ────────────────────────────────────────────────── */
  function init() {
    initHero();
    initAbout();
    initHow();
    initCounters();
    initAIAnalyst();
    initCausal();
    initWhatIf();
    initMethodology();
    initReveal();
    initCursor();
  }

  document.readyState==='loading'
    ? document.addEventListener('DOMContentLoaded',init)
    : init();

})();
