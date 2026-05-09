/*!
 * NERAI Animations v3.0 — neraicorp.com
 * ─────────────────────────────────────────────────────────────
 * Colors matched exactly to the site's CSS variables:
 *   --teal:   #0077a8
 *   --accent: #00a886
 *   --navy:   #0d1f3c
 *
 * NERAI = Go strategy term (predict the move before it's made)
 *         + AI (the engine that makes it possible).
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  /* ── Brand palette ───────────────────────────────────────── */
  const T  = '#0077a8';
  const A  = '#00a886';
  const N  = '#0d1f3c';
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
      threads.forEach(th => {
        th.flow = (th.flow+th.spd)%1;
        const a=dots[th.a], b=dots[th.b];
        const px=lerp(a.x,b.x,th.flow), py=lerp(a.y,b.y,th.flow);
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle = TA(0.1); ctx.lineWidth=0.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(px,py,1.7,0,TAU);
        ctx.fillStyle = a.teal ? TA(0.82) : AA(0.82); ctx.fill();
      });
      dots.forEach(dot => {
        dot.phase += dot.phaseSpd;
        const p = 0.76+0.24*Math.sin(dot.phase);
        dot.x = dot.baseX + mx*(dot.baseX/W-.5+.5)*.8;
        dot.y = dot.baseY + my*(dot.baseY/H-.5+.5)*.55;
        if (dot.active) {
          const colA = dot.teal ? TA : AA;
          const g = ctx.createRadialGradient(dot.x,dot.y,0,dot.x,dot.y,dot.r*4.2);
          g.addColorStop(0, colA(0.16*p)); g.addColorStop(1, colA(0));
          ctx.beginPath(); ctx.arc(dot.x,dot.y,dot.r*4.2,0,TAU); ctx.fillStyle=g; ctx.fill();
          ctx.beginPath(); ctx.arc(dot.x,dot.y,dot.r*p,0,TAU);
          ctx.fillStyle=colA(dot.alpha*p); ctx.fill();
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
   * 2. ABOUT — Data Source Orbit (positioned safely below worldPulse)
   * ══════════════════════════════════════════════════════════ */
  function initAbout() {
    const aboutGrid = document.querySelector('#about .about-grid');
    if (!aboutGrid) return;
    const leftCol = aboutGrid.firstElementChild;
    if (!leftCol) return;

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      width:'100%', height:'220px',
      marginTop:'28px',
      pointerEvents:'none',
      display:'flex', justifyContent:'flex-start', alignItems:'center',
    });
    leftCol.appendChild(wrap);

    const cvs = document.createElement('canvas');
    const DPR = window.devicePixelRatio || 1;
    const W = 360, H = 210;
    cvs.width  = W * DPR;
    cvs.height = H * DPR;
    Object.assign(cvs.style, { width: W+'px', height: H+'px', maxWidth:'100%' });
    wrap.appendChild(cvs);
    fadeIn(wrap);

    const ctx = cvs.getContext('2d');
    ctx.scale(DPR, DPR);

    const CX = W/2, CY = H/2, R = 80;

    const srcs = [
      {label:'GDELT',        col:T,         angle:-90},
      {label:'News APIs',    col:A,         angle:-18},
      {label:'Web Intel',    col:'#3b82f6', angle: 54},
      {label:'Think Tanks',  col:'#8b5cf6', angle:126},
      {label:'Research',     col:'#f59e0b', angle:-162},
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
      ctx.clearRect(0,0,W,H); cp+=0.018;

      // Orbit ring
      ctx.beginPath();
      ctx.arc(CX,CY,R,0,TAU);
      ctx.strokeStyle='rgba(0,119,168,0.08)';
      ctx.lineWidth=1;
      ctx.stroke();

      srcs.forEach(s => {
        s.phase+=0.016;

        // Spoke line
        ctx.beginPath(); ctx.moveTo(CX,CY); ctx.lineTo(s.x,s.y);
        ctx.strokeStyle=`rgba(${hexRgb(s.col)},0.15)`; ctx.lineWidth=1; ctx.stroke();

        // Travelling data particles
        s.pts.forEach(p => {
          p.t-=p.spd; if(p.t<0)p.t=1;
          const px=lerp(CX,s.x,p.t), py=lerp(CY,s.y,p.t);
          ctx.beginPath(); ctx.arc(px,py,2,0,TAU);
          ctx.fillStyle=`rgba(${hexRgb(s.col)},0.75)`; ctx.fill();
        });

        // Node glow
        const pl=0.88+0.12*Math.sin(s.phase);
        const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,16);
        g.addColorStop(0,`rgba(${hexRgb(s.col)},0.18)`); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(s.x,s.y,16,0,TAU); ctx.fillStyle=g; ctx.fill();

        // Node dot
        ctx.beginPath(); ctx.arc(s.x,s.y,5.5*pl,0,TAU); ctx.fillStyle=s.col; ctx.fill();

        // Label — crisp font
        ctx.font='bold 9px Inter,system-ui,sans-serif';
        ctx.fillStyle=s.col;
        ctx.textAlign='center';
        const off = s.y < CY-6 ? -14 : 14;
        ctx.fillText(s.label, s.x, s.y+off);
      });

      // Centre pulse
      const cp2=0.82+0.18*Math.sin(cp);
      const cg=ctx.createRadialGradient(CX,CY,0,CX,CY,30*cp2);
      cg.addColorStop(0,TA(0.25*cp2)); cg.addColorStop(1,TA(0));
      ctx.beginPath(); ctx.arc(CX,CY,30*cp2,0,TAU); ctx.fillStyle=cg; ctx.fill();
      ctx.beginPath(); ctx.arc(CX,CY,10*cp2,0,TAU); ctx.fillStyle=T; ctx.fill();
      ctx.font='bold 9px Inter,system-ui,sans-serif';
      ctx.fillStyle=T; ctx.textAlign='center';
      ctx.fillText('NERAI',CX,CY+22);

      requestAnimationFrame(draw);
    }
    onVisible(leftCol, draw, 0.2);
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
   *    Replaces the static terminal in .analyst-right
   * ══════════════════════════════════════════════════════════ */
  function initAIAnalyst() {
    const sec = document.getElementById('ai-analyst');
    if (!sec) return;

    // Target the right column — clear existing terminal, inject live demo
    const right = sec.querySelector('.analyst-right');
    if (!right) return;
    right.innerHTML = '';

    const demo = document.createElement('div');
    Object.assign(demo.style, {
      background:'#0d1117',
      borderRadius:'14px',
      overflow:'hidden',
      border:'1px solid rgba(0,119,168,0.22)',
      boxShadow:'0 20px 60px rgba(13,31,60,0.18)',
      fontFamily:'Inter,sans-serif',
    });
    demo.innerHTML = `
      <div style="background:#161b22;padding:11px 16px;display:flex;align-items:center;
                  gap:7px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="width:8px;height:8px;border-radius:50%;background:#ff5f56;display:inline-block;"></span>
        <span style="width:8px;height:8px;border-radius:50%;background:#ffbd2e;display:inline-block;"></span>
        <span style="width:8px;height:8px;border-radius:50%;background:#27c93f;display:inline-block;"></span>
        <span style="font-size:0.6rem;color:rgba(255,255,255,0.3);font-family:monospace;
                     letter-spacing:0.05em;margin-left:6px;">NERAI AI ANALYST · LIVE</span>
        <span id="_nerai_live_dot" style="width:6px;height:6px;border-radius:50%;
              background:#00a886;margin-left:auto;animation:_nerai_blink 1.4s ease infinite;"></span>
      </div>
      <style>
        @keyframes _nerai_blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
      </style>
      <div id="_nerai_chat" style="padding:18px 20px;min-height:230px;max-height:340px;overflow-y:auto;"></div>
      <div style="padding:10px 20px 14px;font-size:0.55rem;color:rgba(255,255,255,0.18);
                  font-family:monospace;letter-spacing:0.07em;
                  border-top:1px solid rgba(255,255,255,0.05);">
        SOURCE: GDELT PROJECT · NERAI INDICES · PROPHET FORECAST
      </div>
    `;
    right.appendChild(demo);
    fadeIn(demo);

    const chat = demo.querySelector('#_nerai_chat');
    const exs = [
      {
        q: 'What is the current risk level in Iran?',
        a: 'Nuclear Risk Index: 0.84 — elevated. Military event frequency +18% WoW. Three causal drivers: enrichment pace, G7 posture, proxy activity in Iraq. 12-month forecast: +31% trajectory. Monitor 72h window.',
      },
      {
        q: 'Which risks predict oil price volatility?',
        a: 'Strait of Hormuz tension (r=0.81, lag 3d), Saudi bilateral signals (r=0.73, lag 5d), US inventory data (r=0.68, lag 1d). Composite: 62% probability of >4% price move within 7 days.',
      },
      {
        q: 'Simulate a Gaza ceasefire scenario.',
        a: 'Ceasefire: Regional Risk −0.22, Oil −3.1%, Jordan stability +0.15. Egyptian mediation succeeds (p=0.41) vs collapses (p=0.59). Watch border crossing data as lead indicator.',
      },
      {
        q: 'What is Russia\'s political stability outlook?',
        a: 'Instability index: 0.71. Leadership succession risk elevated (p=0.34 within 18mo). Economic pressure indices rising +14% YoY from sanctions cascade. Belarus correlation: 0.88.',
      },
    ];

    let idx = 0;

    function typeText(el, text, spd, done) {
      let i = 0; el.textContent = '';
      const iv = setInterval(() => {
        el.textContent += text[i++];
        if (i >= text.length) { clearInterval(iv); if (done) setTimeout(done, 1600); }
      }, spd);
    }

    function run() {
      const ex = exs[idx % exs.length]; idx++;
      chat.innerHTML = '';

      const u = document.createElement('div');
      Object.assign(u.style, {
        background:'rgba(0,119,168,0.10)',
        border:'1px solid rgba(0,119,168,0.22)',
        borderRadius:'8px 8px 2px 8px',
        padding:'9px 13px', fontSize:'12.5px', color:'#a8d8ea',
        marginBottom:'12px', maxWidth:'90%', marginLeft:'auto',
        lineHeight:'1.55',
      });
      chat.appendChild(u);

      typeText(u, ex.q, 28, () => {
        const dots = document.createElement('div');
        dots.style.cssText = 'font-size:18px;color:#4b5563;letter-spacing:4px;margin-bottom:10px;';
        dots.textContent = '···'; chat.appendChild(dots);
        let d = 0;
        const dv = setInterval(() => { dots.textContent = ['·  ','·· ','···'][d++ % 3]; }, 320);

        setTimeout(() => {
          clearInterval(dv); dots.remove();
          const a = document.createElement('div');
          Object.assign(a.style, {
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:'2px 8px 8px 8px',
            padding:'10px 14px', fontSize:'12px',
            color:'#c9d1d9', lineHeight:'1.75', maxWidth:'96%',
          });
          chat.appendChild(a);
          typeText(a, ex.a, 16, () => setTimeout(run, 2200));
        }, 850);
      });
    }

    onVisible(sec, run, 0.3);
  }

  /* ══════════════════════════════════════════════════════════
   * 6. CAUSAL ENGINE — In-place network graph
   *    Replaces the .ce-network-mockup HTML with animated canvas
   * ══════════════════════════════════════════════════════════ */
  function initCausal() {
    const mockup = document.querySelector('.ce-network-mockup');
    if (!mockup) return;

    // Hide the static HTML mockup and insert canvas in its place
    mockup.style.display = 'none';

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      width:'100%', height:'220px',
      marginTop:'24px',
      borderRadius:'10px',
      overflow:'hidden',
      background:'rgba(255,255,255,0.04)',
      border:'1px solid rgba(0,119,168,0.12)',
    });
    mockup.parentNode.insertBefore(wrap, mockup);
    fadeIn(wrap);

    const cvs = document.createElement('canvas');
    Object.assign(cvs.style, { width:'100%', height:'100%', display:'block' });
    wrap.appendChild(cvs);

    let W, H;
    function resize() {
      W = cvs.width  = wrap.offsetWidth  || 400;
      H = cvs.height = wrap.offsetHeight || 220;
    }
    resize();
    window.addEventListener('resize', resize);

    const ctx = cvs.getContext('2d');

    // Nodes laid out proportionally so they fit any width
    function makeNodes() {
      return [
        {rx:0.17, ry:0.50, label:'IRAN',        size:10, col:T,          key:true},
        {rx:0.42, ry:0.20, label:'STRAIT',       size: 7, col:'#7dd3fc',  key:false},
        {rx:0.42, ry:0.50, label:'NUCLEAR',      size: 8, col:T,          key:false},
        {rx:0.42, ry:0.80, label:'PROXIES',      size: 7, col:A,          key:false},
        {rx:0.74, ry:0.14, label:'OIL PRICE',    size: 8, col:'#f59e0b',  key:false},
        {rx:0.74, ry:0.39, label:'STRIKE RISK',  size: 7, col:'#f87171',  key:false},
        {rx:0.74, ry:0.62, label:'G7 RESPONSE',  size: 7, col:A,          key:false},
        {rx:0.74, ry:0.86, label:'REGION RISK',  size: 9, col:'#fb923c',  key:true},
      ].map(n=>({...n, phase:rand(0,TAU), phaseSpd:rand(0.022,.055),
                 get x(){return n.rx*W}, get y(){return n.ry*H}}));
    }

    let nodes = makeNodes();
    window.addEventListener('resize', ()=>{ nodes = makeNodes(); });

    const edgesDef = [{f:0,t:1},{f:0,t:2},{f:0,t:3},{f:1,t:4},{f:2,t:5},
                      {f:2,t:6},{f:3,t:7},{f:5,t:7},{f:6,t:7}];
    const edges = edgesDef.map(e=>({...e, flow:rand(0,1), spd:rand(0.005,0.018)}));

    function draw() {
      ctx.clearRect(0,0,W,H);
      edges.forEach(e => {
        e.flow = (e.flow+e.spd)%1;
        const a=nodes[e.f], b=nodes[e.t];
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
        ctx.strokeStyle=TA(0.18); ctx.lineWidth=1.2; ctx.stroke();
        const px=lerp(a.x,b.x,e.flow), py=lerp(a.y,b.y,e.flow);
        ctx.beginPath(); ctx.arc(px,py,2.2,0,TAU); ctx.fillStyle=TA(0.88); ctx.fill();
      });
      nodes.forEach(n => {
        n.phase += n.phaseSpd;
        const p = 0.86+0.14*Math.sin(n.phase), r=n.size*p;
        const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,r*3.2);
        g.addColorStop(0,`rgba(${hexRgb(n.col)},0.18)`); g.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(n.x,n.y,r*3.2,0,TAU); ctx.fillStyle=g; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,r,0,TAU); ctx.fillStyle=n.col; ctx.fill();
        ctx.font=`${n.key?'bold ':''}9px Inter,sans-serif`;
        ctx.fillStyle=`rgba(${hexRgb(n.col)},0.92)`; ctx.textAlign='center';
        ctx.fillText(n.label, n.x, n.y+r+12);
      });
      requestAnimationFrame(draw);
    }

    onVisible(wrap, draw, 0.2);
  }

  /* ══════════════════════════════════════════════════════════
   * 7. WHAT-IF — Go Game Tree (inside right column)
   *    Canvas appended inside .whatif-scenarios, below scenario cards
   * ══════════════════════════════════════════════════════════ */
  function initWhatIf() {
    const scenarios = document.querySelector('.whatif-scenarios');
    if (!scenarios) return;

    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      width:'100%', marginTop:'16px',
      pointerEvents:'none',
      display:'block',
    });
    scenarios.appendChild(wrap);
    fadeIn(wrap);

    const cvs = document.createElement('canvas');
    cvs.width  = 340;
    cvs.height = 200;
    Object.assign(cvs.style, {
      width:'100%', height:'auto', display:'block',
      borderRadius:'8px',
      background:'rgba(13,31,60,0.04)',
    });
    wrap.appendChild(cvs);
    const ctx = cvs.getContext('2d');
    const W = 340, H = 200;

    const root = {x:28, y:H/2, col:N, label:'NOW'};
    const branches = [
      {x:130,y:38,  col:'#f87171', label:'ESCALATION', prob:32, kids:[
        {x:272,y:18,  col:'#ef4444', label:'CONFLICT',   prob:19},
        {x:272,y:62,  col:'#fb923c', label:'STANDOFF',   prob:13}]},
      {x:130,y:100, col:T,         label:'DIPLOMACY',  prob:45, kids:[
        {x:272,y:88,  col:A,         label:'DEAL',       prob:28},
        {x:272,y:138, col:'#8b5cf6', label:'STALEMATE',  prob:17}]},
      {x:130,y:168, col:'#f59e0b',  label:'SANCTIONS',  prob:23, kids:[
        {x:272,y:178, col:'#a78bfa',  label:'ISOLATION',  prob:23}]},
    ];

    let t=0, active=0, switchAt=200;

    function bez(ax,ay,bx,by,col,alpha) {
      const cp=(ax+bx)/2;
      ctx.beginPath(); ctx.moveTo(ax,ay);
      ctx.bezierCurveTo(cp,ay,cp,by,bx,by);
      ctx.strokeStyle=`rgba(${hexRgb(col)},${alpha})`; ctx.lineWidth=1.4; ctx.stroke();
    }

    function stone(x,y,col,r,alpha,label,prob) {
      ctx.globalAlpha=alpha;
      const g=ctx.createRadialGradient(x,y,0,x,y,r*2.8);
      g.addColorStop(0,`rgba(${hexRgb(col)},0.22)`); g.addColorStop(1,'transparent');
      ctx.beginPath(); ctx.arc(x,y,r*2.8,0,TAU); ctx.fillStyle=g; ctx.fill();
      ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fillStyle=col; ctx.fill();
      ctx.font='8px Inter,sans-serif'; ctx.fillStyle=col; ctx.textAlign='center';
      ctx.fillText(label, x, y-r-4);
      if (prob!=null) { ctx.font='7px Inter,sans-serif'; ctx.fillText(prob+'%', x, y+r+10); }
      ctx.globalAlpha=1;
    }

    function draw() {
      ctx.clearRect(0,0,W,H); t++;
      if (t>=switchAt) { active=(active+1)%3; switchAt=t+200; }
      const pl=0.86+0.14*Math.sin(t*0.04);
      stone(root.x,root.y,root.col,9*pl,1,root.label,null);
      branches.forEach((br,i) => {
        const on=i===active, a=on?1:0.18;
        bez(root.x,root.y,br.x,br.y,br.col,a*.55);
        stone(br.x,br.y,br.col,on?8:5,a,br.label,br.prob);
        br.kids.forEach(k => {
          bez(br.x,br.y,k.x,k.y,k.col,on?.55:.07);
          stone(k.x,k.y,k.col,on?6:3.5,on?.78:.1,k.label,k.prob);
        });
      });
      requestAnimationFrame(draw);
    }

    onVisible(wrap, draw, 0.2);
  }

  /* ══════════════════════════════════════════════════════════
   * 8. METHODOLOGY — Data Pipeline Steps
   * ══════════════════════════════════════════════════════════ */
  function initMethodology() {
    const sec = document.getElementById('methodology');
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
    const css=document.createElement('style');
    css.textContent=`
      .nr-fade{opacity:0;transform:translateY(24px);
        transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1);}
      .nr-fade.nr-in{opacity:1;transform:none;}
    `;
    document.head.appendChild(css);
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
   * 10. CURSOR TRAIL
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
