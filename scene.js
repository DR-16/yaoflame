import * as THREE from 'three';
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }       from 'three/addons/postprocessing/OutputPass.js';

/* ═══════════════════════════ setup ═══════════════════════════ */
const INK = 0x07070a;
const FLAME      = new THREE.Color(0xff6a1f);
const FLAME_HOT  = new THREE.Color(0xffd27a);
const FLAME_DEEP = new THREE.Color(0x8c1d04);

let LANG = 'en';
const CJK = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei"';
const FACE = (w,size) => `${w} ${size}px Sora, ${CJK}, sans-serif`;

const LOW = matchMedia('(max-width:760px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
const CALM = matchMedia('(prefers-reduced-motion:reduce)').matches;

const canvas = document.getElementById('scene');
const DEV = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW,
  powerPreference:'high-performance', preserveDrawingBuffer: DEV });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.4 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.96;

const scene = new THREE.Scene();
scene.background = new THREE.Color(INK);
scene.fog = new THREE.FogExp2(INK, 0.015);
const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 400);
const world = new THREE.Group();
scene.add(world);

/* ═══════════════════════════ court ═══════════════════════════ */
// Regulation badminton court in metres. Long axis = Z, width = X, net at z = 0.
const HALF_W = 3.05, HALF_L = 6.70, SINGLES_W = 2.59, FRONT_SVC = 1.98, BACK_SVC = 4.72;
const NET_H = 1.55;

const slab = new THREE.Mesh(
  new THREE.BoxGeometry(HALF_W*2 + 4.4, 0.35, HALF_L*2 + 4.4),
  new THREE.MeshStandardMaterial({ color:0x101520, roughness:.8, metalness:.03 })
);
slab.position.y = -0.175; world.add(slab);

const rim = new THREE.Mesh(
  new THREE.BoxGeometry(HALF_W*2 + 4.62, 0.05, HALF_L*2 + 4.62),
  new THREE.MeshBasicMaterial({ color:0x1a3755 })
);
rim.position.y = -0.02; world.add(rim);

const lineMat = new THREE.MeshBasicMaterial({ color:0x8ea8c8 });
const LW = 0.04;
function courtLine(x1,z1,x2,z2){
  const horiz = Math.abs(x2-x1) > Math.abs(z2-z1);
  const len = Math.hypot(x2-x1, z2-z1);
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(horiz?len:LW, 0.012, horiz?LW:len), lineMat);
  m.position.set((x1+x2)/2, 0.013, (z1+z2)/2);
  world.add(m);
}
courtLine(-HALF_W,-HALF_L, HALF_W,-HALF_L); courtLine(-HALF_W,HALF_L, HALF_W,HALF_L);
courtLine(-HALF_W,-HALF_L,-HALF_W,HALF_L);  courtLine( HALF_W,-HALF_L, HALF_W,HALF_L);
courtLine(-SINGLES_W,-HALF_L,-SINGLES_W,HALF_L); courtLine(SINGLES_W,-HALF_L,SINGLES_W,HALF_L);
courtLine(-HALF_W,-FRONT_SVC,HALF_W,-FRONT_SVC); courtLine(-HALF_W,FRONT_SVC,HALF_W,FRONT_SVC);
courtLine(-HALF_W,-BACK_SVC,HALF_W,-BACK_SVC);   courtLine(-HALF_W,BACK_SVC,HALF_W,BACK_SVC);
courtLine(0,-HALF_L,0,-FRONT_SVC); courtLine(0,FRONT_SVC,0,HALF_L);

/* ── net ── */
const netGroup = new THREE.Group(); world.add(netGroup);
{
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_W*2, 0.76),
    new THREE.MeshBasicMaterial({ color:0x8fa8c6, transparent:true, opacity:.13, side:THREE.DoubleSide })
  );
  mesh.position.y = NET_H - 0.38; netGroup.add(mesh);
  const tape = new THREE.Mesh(new THREE.BoxGeometry(HALF_W*2, 0.05, 0.02), lineMat);
  tape.position.y = NET_H; netGroup.add(tape);
  const postMat = new THREE.MeshStandardMaterial({ color:0x2b2f3a, roughness:.55 });
  [-HALF_W, HALF_W].forEach(x=>{
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,NET_H,12), postMat);
    p.position.set(x, NET_H/2, 0); netGroup.add(p);
  });
}

/* ── spec table, drawn onto a panel that rises out of the net ── */
const SPEC = {
  en: {
    title:'SPECIFICATION', sub:'YAO FLAME · 2026',
    foot:'String tension — up to 76 lbs across all three models',
    labels:['Play style','Target player','Shaft','Stiffness','Shot feel','Control','Power'],
    cols:[
      { code:'YF-B25', name:'Balanced Control', rows:['All-round balanced','Singles & doubles','7.0 mm · Hollow','Medium','High hold','★★★★☆','★★★☆☆'] },
      { code:'YF-A25', name:'Aggressive Power', rows:['Attack-oriented','Aggressive singles','6.3 mm · Solid core','Stiff','Snappy rebound','★★★☆☆','★★★★☆'] },
      { code:'YF-X25', name:'Extreme Attack',   rows:['Extreme power','Advanced / pro','6.6 mm · Hollow','Extra stiff','Instant repulsion','★★☆☆☆','★★★★★'] },
    ],
  },
  zh: {
    title:'产品规格', sub:'YAO FLAME · 2026',
    foot:'穿线磅数 — 三款均可达 76 磅',
    labels:['打法','适用人群','中杆','硬度','击球手感','控制','力量'],
    cols:[
      { code:'YF-B25', name:'均衡控制', rows:['全面均衡','单打与双打','7.0 mm · 空心','中等','持球感强','★★★★☆','★★★☆☆'] },
      { code:'YF-A25', name:'进攻力量', rows:['进攻导向','进攻型单打','6.3 mm · 实心','偏硬','回弹迅捷','★★★☆☆','★★★★☆'] },
      { code:'YF-X25', name:'极限突击', rows:['极限力量','高阶 / 专业','6.6 mm · 空心','超硬','瞬间弹射','★★☆☆☆','★★★★★'] },
    ],
  },
};
const specCanvas = document.createElement('canvas');
specCanvas.width = 1792; specCanvas.height = 820;
const specTex = new THREE.CanvasTexture(specCanvas);
specTex.colorSpace = THREE.SRGBColorSpace;

function drawSpec(){
  const S = SPEC[LANG] || SPEC.en;
  const W = specCanvas.width, H = specCanvas.height, c = specCanvas;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(7,7,10,0.9)'; g.fillRect(0,0,W,H);
  g.strokeStyle = 'rgba(255,106,31,0.5)'; g.lineWidth = 5;
  g.strokeRect(2.5,2.5,W-5,H-5);

  const padL = 300, colW = (W - padL - 70) / 3, top = 160, rowH = 82;
  g.textBaseline = 'middle';

  g.font = FACE(300, 34); g.fillStyle = 'rgba(255,255,255,0.46)';
  g.fillText(S.title, 56, 74);
  g.font = FACE(300, 26); g.fillStyle = 'rgba(255,150,80,0.9)';
  g.fillText(S.sub, 56, 118);

  S.cols.forEach((col,i)=>{
    const x = padL + i*colW;
    g.font = FACE(600, 46); g.fillStyle = '#ffc266';
    g.fillText(col.code, x, 74);
    g.font = FACE(300, 27); g.fillStyle = 'rgba(255,255,255,0.56)';
    g.fillText(LANG === 'zh' ? col.name : col.name.toUpperCase(), x, 120);
  });
  g.strokeStyle = 'rgba(255,106,31,0.45)'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(48, 152); g.lineTo(W-48, 152); g.stroke();

  S.labels.forEach((label,r)=>{
    const y = top + r*rowH + rowH/2;
    g.font = FACE(300, 30); g.fillStyle = 'rgba(255,255,255,0.4)';
    g.fillText(LANG === 'zh' ? label : label.toUpperCase(), 56, y);
    S.cols.forEach((col,i)=>{
      const star = col.rows[r].includes('★');
      g.font = star ? '400 34px sans-serif' : FACE(300, 33);
      g.fillStyle = star ? '#ff8a3d' : 'rgba(255,255,255,0.9)';
      g.fillText(col.rows[r], padL + i*colW, y);
    });
    g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(48, top + (r+1)*rowH); g.lineTo(W-48, top + (r+1)*rowH); g.stroke();
  });
  g.font = FACE(300, 26); g.fillStyle = 'rgba(255,255,255,0.36)';
  g.fillText(S.foot, 56, H - 54);

  specTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  specTex.needsUpdate = true;
}
drawSpec();
const specPanel = new THREE.Mesh(
  new THREE.PlaneGeometry(5.8, 2.66),
  new THREE.MeshBasicMaterial({ map:specTex, transparent:true, opacity:0, side:THREE.FrontSide })
);
specPanel.position.set(0, NET_H + 1.5, 0);
specPanel.scale.y = 0.02;                  // grows out of the net tape
world.add(specPanel);

/* ── the three rackets, standing under their own columns of the spec table ── */
// Column centres of the spec canvas mapped onto the 5.8 m panel, so each racket
// lines up with the data that describes it.
const SPEC_COL_X = [0, 1, 2].map(i => ((300 + i*((1792 - 300 - 70)/3)) / 1792 - 0.5) * 5.8);
const RACKET_FACE = [0xeb9fb6, 0xcadb55, 0x86b0d4];     // as the real ones were strung

function buildRacket(faceColor){
  const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color:0x171a22, roughness:.4, metalness:.3 });

  const frame = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.016, 10, 44), dark);
  frame.scale.set(1, 1.18, 1); frame.position.y = 1.36; g.add(frame);

  const bed = new THREE.Mesh(new THREE.CircleGeometry(0.292, 36),
    new THREE.MeshBasicMaterial({ color:faceColor, transparent:true, opacity:.42,
                                  side:THREE.DoubleSide }));
  bed.scale.set(1, 1.18, 1); bed.position.y = 1.36; g.add(bed);

  // throat splits into two struts before the shaft, like the real frame
  [-1, 1].forEach(sx=>{
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.3, 8), dark);
    strut.position.set(sx*0.09, 1.0, 0); strut.rotation.z = -sx*0.3; g.add(strut);
  });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.027, 0.56, 10), dark);
  shaft.position.y = 0.6; g.add(shaft);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.037, 0.32, 10),
    new THREE.MeshStandardMaterial({ color:0x0c0e13, roughness:.9 }));
  grip.position.y = 0.19; g.add(grip);
  return g;
}

const rackets = new THREE.Group();
rackets.visible = false;
const PLINTH_Y = 0.78, RACKET_Z = 2.9;
{
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.1, 0.9),
    new THREE.MeshStandardMaterial({ color:0x1a1e28, roughness:.55, metalness:.15 }));
  top.position.set(SPEC_COL_X[1], PLINTH_Y, RACKET_Z); rackets.add(top);
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.4, PLINTH_Y, 0.78),
    new THREE.MeshStandardMaterial({ color:0x0d1016, roughness:.9 }));
  body.position.set(SPEC_COL_X[1], PLINTH_Y/2, RACKET_Z); rackets.add(body);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.018, 0.02),
    new THREE.MeshBasicMaterial({ color:0xff7f33 }));
  edge.position.set(SPEC_COL_X[1], PLINTH_Y + 0.055, RACKET_Z - 0.44); rackets.add(edge);
}
SPEC_COL_X.forEach((x,i)=>{
  const r = buildRacket(RACKET_FACE[i]);
  r.position.set(x, PLINTH_Y + 0.05, RACKET_Z);
  rackets.add(r);
});
// the room is dark on purpose, so this act brings its own light
const racketKey = new THREE.SpotLight(0xffe6c8, 0, 12, 0.8, 0.55, 1.4);
racketKey.position.set(SPEC_COL_X[1], 6.2, RACKET_Z + 2.2);
racketKey.target.position.set(SPEC_COL_X[1], PLINTH_Y + 0.9, RACKET_Z);
rackets.add(racketKey, racketKey.target);
const racketFill = new THREE.PointLight(0xaec6ff, 0, 9, 2);
racketFill.position.set(SPEC_COL_X[1], 1.6, RACKET_Z + 1.9);
rackets.add(racketFill);
world.add(rackets);

/* ── stands: rectangular tiers ── */
const standMat = new THREE.MeshStandardMaterial({ color:0x0e1017, roughness:.95 });
const riserMat = new THREE.MeshStandardMaterial({ color:0x161a24, roughness:.88 });
[-1,1].forEach(side=>{
  for(let i=0;i<5;i++){
    const tread = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, HALF_L*2+8), standMat);
    tread.position.set(side*(8.0 + i*1.5), 0.46 + i*0.46, 0); world.add(tread);
    const riser = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.46, HALF_L*2+8), riserMat);
    riser.position.set(side*(8.0 + i*1.5 - 0.75), 0.23 + i*0.46, 0); world.add(riser);
  }
});

/* ── entrance screens: both clips loop on their own, no interaction ── */
const videoEls = [];
function videoScreen({ src, w, h, x, y, z, rotY = 0, parent = world }){
  // eslint-disable-next-line no-unused-vars
  const v = document.createElement('video');
  // The autoplay decision is made the moment a source is attached, so everything the
  // policy looks at must already be set — and set as ATTRIBUTES, which is what Safari
  // inspects. Assigning src first (as this did) is why it needed a click.
  v.setAttribute('muted', '');
  v.setAttribute('autoplay', '');
  v.setAttribute('loop', '');
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.setAttribute('preload', 'auto');
  v.muted = true; v.defaultMuted = true; v.volume = 0;
  v.loop = true; v.autoplay = true; v.playsInline = true;
  // Safari also refuses to decode an element that is not in the document, so park it
  // off-screen rather than leaving it detached.
  v.style.cssText = 'position:fixed;left:-4px;top:-4px;width:2px;height:2px;opacity:0;pointer-events:none';
  document.body.appendChild(v);
  v.src = src;        // source goes on last, with the element already muted and in the DOM
  v.load();
  // Autoplay is refused until enough data is buffered, so retry on the media events
  // and then poll briefly before falling back to the first-interaction handler.
  const tryPlay = () => v.play().catch(()=>{});
  ['loadeddata','canplay','canplaythrough'].forEach(e =>
    v.addEventListener(e, tryPlay, { once:true }));
  tryPlay();
  let tries = 0;
  const poll = setInterval(()=>{
    if(!v.paused || ++tries > 24) clearInterval(poll); else tryPlay();
  }, 500);
  videoEls.push(v);

  const tex = new THREE.VideoTexture(v);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;

  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.07, h + 0.07),
    new THREE.MeshBasicMaterial({ color:0xff7f33, transparent:true, opacity:.5 }));
  frame.position.z = -0.012;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    // slightly under full brightness so the bloom pass doesn't blow out bright frames
    new THREE.MeshBasicMaterial({ map:tex, color:0xd8d8d8 }));
  g.add(frame, panel);
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  parent.add(g);
  return g;
}

// ── back wall: the screens and the scoreboard share one surface ────────
const backWall = new THREE.Group(); world.add(backWall);
{
  const wall = new THREE.Mesh(new THREE.BoxGeometry(22, 11, 0.4),
    new THREE.MeshStandardMaterial({ color:0x0a0c12, roughness:.95 }));
  wall.position.set(0, 5, -16.5); backWall.add(wall);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.028, 0.06),
    new THREE.MeshBasicMaterial({ color:0xff7f33 }));
  trim.position.set(-0.45, 0.28, -16.26); backWall.add(trim);
}
// 16:9 clip and the vertical one, hung level along their top edge
videoScreen({ src:'assets/videos/video01.mp4', w:4.6, h:2.59,
              x: LOW ? 0 : -2.6, y:5.1, z:-16.26, parent:backWall });
if(!LOW)   // the vertical clip is 8.6 MB — skip it on phones and low-end machines
  videoScreen({ src:'assets/videos/video03.mp4', w:1.95, h:3.47,
                x:3.05, y:4.66, z:-16.26, parent:backWall });

// Autoplay policies can still block a muted video until the first interaction.
const resumeVideos = () => videoEls.forEach(v => v.paused && v.play().catch(()=>{}));
['pointerdown','keydown','scroll'].forEach(ev=>
  addEventListener(ev, resumeVideos, { once:true, passive:true }));
// browsers pause background tabs; pick the clips back up when the page returns
addEventListener('visibilitychange', () => { if(!document.hidden) resumeVideos(); });

/* ── display boards: the project's documents, propped along the front row ── */
const DISPLAYS = [
  { f:'image09', side: 1, z:  8.0, cap:'Hand-drawn frame geometry',        zh:'手绘拍框几何' },
  { f:'image05', side: 1, z:  3.0, cap:'Designing the racket',             zh:'设计球拍' },
  { f:'image10', side: 1, z: -2.0, cap:'At the manufacturing partner',     zh:'在制造工厂' },
  { f:'image14', side: 1, z: -7.0, cap:'YF-B25 / A25 / X25',               zh:'YF-B25 / A25 / X25' },
  { f:'image12', side:-1, z: 11.5, cap:'Ten finished rackets',             zh:'十支成品球拍' },
  { f:'image06', side:-1, z:  7.0, cap:'Youth Community Enhancement Award',zh:'青少年社区贡献奖' },
  { f:'image16', side:-1, z:  2.0, cap:'District of West Vancouver, 2025', zh:'西温哥华区政府,2025' },
  { f:'image08', side:-1, z: -3.0, cap:'Donation & free-use program',      zh:'捐赠与免费借用项目' },
  { f:'image13', side:-1, z: -8.0, cap:'Handover at the Community Centre', zh:'社区中心交接仪式' },
  { f:'image03', side:-1, z:-12.5, cap:'Appreciation letter — Nepal',      zh:'感谢信 — 尼泊尔' },
];
const capOf = d => (LANG === 'zh' ? d.zh : d.cap);
const displays = [];        // the ones propped along the stands
const repaints = [];        // redraw each board's canvas when the language changes
if(location.hostname==='localhost'||location.hostname==='127.0.0.1') window.__exposures = [];
const gallery  = [];        // the same images, squared up on a wall for act 07
const clickable = [];       // {mesh, kind, group, src, cap}
const BOARD_H = 2.0, GAL_H = 1.44, GAL_Z = 15.5;

// Back wall for the archive act — a plain dark slab so the images have a ground.
const archive = new THREE.Group();
archive.visible = false;              // only exists during act 07
world.add(archive);
{
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(13.5, 6.4, 0.3),
    new THREE.MeshStandardMaterial({ color:0x0b0d13, roughness:.92 })
  );
  wall.position.set(0, 2.7, GAL_Z - 0.55); archive.add(wall);
  const led = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.035, 0.05),
    new THREE.MeshBasicMaterial({ color:0xff7f33 }));
  led.position.set(0, -0.44, GAL_Z - 0.36); archive.add(led);
}

DISPLAYS.forEach((d,i)=>{
  const img = new Image();
  img.onload = ()=>{
    const W = 880, capH = 86;
    const c = document.createElement('canvas');
    c.width = W; c.height = Math.round(W * img.height/img.width) + capH;

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // A fixed exposure can't serve both a dark workshop photo and a white scan of a
    // letter. Measure each image and aim them all at a similar level, or the pale ones
    // read as glowing rectangles in a near-black room.
    const probe = document.createElement('canvas');
    probe.width = probe.height = 48;
    const pg = probe.getContext('2d', { willReadFrequently:true });
    pg.drawImage(img, 0, 0, 48, 48);
    const pd = pg.getImageData(0, 0, 48, 48).data;
    let lum = 0;
    for(let i = 0; i < pd.length; i += 4) lum += (pd[i] + pd[i+1] + pd[i+2]) / 3;
    const avg = lum / (pd.length / 4);
    const exposure = Math.min(0.86, Math.max(0.3, 104 / Math.max(avg, 1)));
    if(window.__exposures) window.__exposures.push({ f:d.f, avg:+avg.toFixed(0), exposure:+exposure.toFixed(2) });

    const paint = ()=>{
      const g = c.getContext('2d');
      g.fillStyle = '#090a0f'; g.fillRect(0,0,c.width,c.height);
      g.filter = `brightness(${exposure}) contrast(1.07) saturate(1.05)`;
      g.drawImage(img, 0, 0, W, c.height - capH);
      g.filter = 'none';
      g.fillStyle = '#ff7f33'; g.fillRect(0, c.height-capH, W, 4);
      g.fillStyle = '#eef1f7'; g.font = FACE(300, 31);
      g.textBaseline = 'middle';
      g.fillText(capOf(d), 24, c.height - capH/2 + 4);
      tex.needsUpdate = true;
    };
    paint();
    repaints.push(paint);

    const w = BOARD_H * (c.width / c.height);
    const mat = new THREE.MeshBasicMaterial({ map:tex, transparent:true, opacity:.12 });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, BOARD_H), mat);
    const edgeMat = new THREE.MeshBasicMaterial({ color:0xff6a1f, transparent:true, opacity:0 });
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(w+0.07, BOARD_H+0.07), edgeMat);
    edge.position.z = -0.012;

    const g3 = new THREE.Group();
    g3.add(edge, panel);
    g3.position.set(d.side * 7.9, 1.42 + BOARD_H/2, d.z);
    g3.rotation.y = d.side > 0 ? -Math.PI/2 : Math.PI/2;
    world.add(g3);
    displays.push({ g3, mat, edgeMat });
    clickable.push({ mesh:panel, kind:'stand', group:g3, src:`assets/${d.f}.jpg`, d });

    // ── the same panel again, squared up on the archive wall ──
    const gw = GAL_H * (c.width / c.height);
    const gMat  = new THREE.MeshBasicMaterial({ map:tex, transparent:true, opacity:0, fog:false });
    const gEdge = new THREE.MeshBasicMaterial({ color:0xff7f33, transparent:true, opacity:0, fog:false });
    const gPanel = new THREE.Mesh(new THREE.PlaneGeometry(gw, GAL_H), gMat);
    const gFrame = new THREE.Mesh(new THREE.PlaneGeometry(gw+0.055, GAL_H+0.055), gEdge);
    gFrame.position.z = -0.01;
    const gg = new THREE.Group();
    gg.add(gFrame, gPanel);
    archive.add(gg);
    gallery.push({ gg, gMat, gEdge, i });
    clickable.push({ mesh:gPanel, kind:'gallery', group:gg, src:`assets/${d.f}.jpg`, d });
    layoutGallery();
  };
  img.src = `assets/${d.f}.jpg`;
});

// Five across on a wide screen, two across on a phone.
function layoutGallery(){
  const narrow = innerWidth/innerHeight < 1.15;
  const cols = narrow ? 2 : 5;
  const colW = 2.3, rowH = 1.72;
  // On a phone the copy block sits over the lower third, so lift the grid clear of it.
  const yMid = narrow ? 4.5 : 2.7;
  const rows = Math.ceil(DISPLAYS.length / cols);
  gallery.forEach(({ gg, i })=>{
    const col = i % cols, row = Math.floor(i / cols);
    gg.position.set((col - (cols-1)/2) * colW,
                    (rows-1)/2 * rowH - row*rowH + yMid,
                    GAL_Z);
  });
}

/* ── scoreboard ── */
const boardCanvas = document.createElement('canvas');
boardCanvas.width = 1024; boardCanvas.height = 420;
const boardTex = new THREE.CanvasTexture(boardCanvas);
boardTex.colorSpace = THREE.SRGBColorSpace;
function drawBoard(main, sub){
  const g = boardCanvas.getContext('2d'), W = 1024, H = 420;
  g.fillStyle = '#05050a'; g.fillRect(0,0,W,H);
  // dot-matrix wash
  g.fillStyle = 'rgba(255,106,31,0.055)';
  for(let y=14;y<H;y+=15) for(let x=14;x<W;x+=15) g.fillRect(x,y,4,4);
  g.strokeStyle = 'rgba(255,106,31,0.42)'; g.lineWidth = 6; g.strokeRect(3,3,W-6,H-6);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = '#ff6a1f'; g.shadowBlur = 48;
  g.fillStyle = '#ffc266'; g.font = FACE(600, LANG === 'zh' && main.length > 3 ? 140 : 182);
  g.fillText(main, W/2, H/2 - 24);
  g.shadowBlur = 14; g.fillStyle = 'rgba(255,150,70,0.82)';
  g.font = FACE(300, 42);
  g.fillText(sub, W/2, H/2 + 118);
  g.shadowBlur = 0;
  boardTex.needsUpdate = true;
}
drawBoard('YF','WEST VANCOUVER');   // replaced on the first act change
{
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.0, 0.26),
    new THREE.MeshStandardMaterial({ color:0x0a0b11, roughness:.6 }));
  frame.position.set(-0.8, 1.55, -16.3); backWall.add(frame);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(4.26, 1.78),
    new THREE.MeshBasicMaterial({ map:boardTex }));
  face.position.set(-0.8, 1.55, -16.15); backWall.add(face);
  const spill = new THREE.PointLight(0xff7a2a, 13, 14, 2);
  spill.position.set(-0.8, 2.2, -15.2); backWall.add(spill);
}

/* ═══════════════════════════ light ═══════════════════════════ */
scene.add(new THREE.HemisphereLight(0x33435e, 0x05050a, 0.3));
const key = new THREE.DirectionalLight(0xc8d8f2, 0.62);
key.position.set(4, 14, 6); scene.add(key);
[[-3.2,-4.5],[3.2,-4.5],[-3.2,4.5],[3.2,4.5]].forEach(([x,z],i)=>{
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.2,0.08,1.1),
    new THREE.MeshBasicMaterial({ color:0x8fa8cc }));
  panel.position.set(x, 8.2, z); world.add(panel);
  if(!LOW || i < 2){
    const pl = new THREE.PointLight(0x9ab6e4, 11, 22, 2);
    pl.position.set(x, 7.9, z); world.add(pl);
  }
});

/* ═════════════════════ players — 3D silhouettes ═════════════════════ */
// Dark enough to read as silhouette, glossy enough to catch the shuttle's fire.
const skin = new THREE.MeshStandardMaterial({ color:0x0b0c11, roughness:.34, metalness:.12 });
function buildPlayer(){
  const root  = new THREE.Group();
  const hips  = new THREE.Group(); hips.position.y = 0.92; root.add(hips);

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.46, 6, 16), skin);
  torso.position.y = 0.26; hips.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.132, 20, 16), skin);
  head.position.y = 0.68; hips.add(head);

  // shoulders pivot at the joint so limbs swing instead of sliding
  const joint = (x,y,parent)=>{ const p = new THREE.Group(); p.position.set(x,y,0); parent.add(p); return p; };
  const limb = (r,len)=>{ const m = new THREE.Mesh(new THREE.CapsuleGeometry(r,len,4,10), skin);
                          m.position.y = -(len/2 + r*0.5); return m; };

  const shoulderR = joint( 0.25, 0.46, hips), shoulderL = joint(-0.25, 0.46, hips);
  const armR = limb(0.058, 0.42), armL = limb(0.058, 0.42);
  shoulderR.add(armR); shoulderL.add(armL);
  const hipR = joint( 0.1, 0.0, hips), hipL = joint(-0.1, 0.0, hips);
  const legR = limb(0.08, 0.6), legL = limb(0.08, 0.6);
  hipR.add(legR); hipL.add(legL);

  const racket = new THREE.Group();
  const head_ = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.014, 8, 26), skin);
  head_.position.y = -0.62; racket.add(head_);
  const strings = new THREE.Mesh(new THREE.CircleGeometry(0.118, 22),
    new THREE.MeshBasicMaterial({ color:0x2a2f3c, transparent:true, opacity:.3, side:THREE.DoubleSide }));
  strings.position.y = -0.62; racket.add(strings);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.02,0.44,8), skin);
  shaft.position.y = -0.3; racket.add(shaft);
  shoulderR.add(racket);

  root.userData = { hips, torso, head, shoulderR, shoulderL, hipR, hipL, racket };
  return root;
}
const players = [buildPlayer(), buildPlayer()];
players[0].position.set(-0.5, 0, 4.6);
players[1].position.set( 0.5, 0, -4.6); players[1].rotation.y = Math.PI;
players.forEach(p=>world.add(p));

/* ═════════════════════ shuttle, fire trail, impact ═════════════════════ */
const shuttle = new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 12),
  new THREE.MeshBasicMaterial({ color:0xfff0d8 }));
world.add(shuttle);
const shuttleLight = new THREE.PointLight(0xff8838, 14, 11, 2);
world.add(shuttleLight);

// ── particle fire ──
const PCOUNT = LOW ? 220 : 420;
const pPos = new Float32Array(PCOUNT*3);
const pCol = new Float32Array(PCOUNT*3);
const pSize = new Float32Array(PCOUNT);
const pVel = new Float32Array(PCOUNT*3);
const pLife = new Float32Array(PCOUNT);
const pMax  = new Float32Array(PCOUNT);
let pCursor = 0;

const fireGeo = new THREE.BufferGeometry();
fireGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
fireGeo.setAttribute('pcolor',   new THREE.BufferAttribute(pCol,3));
fireGeo.setAttribute('psize',    new THREE.BufferAttribute(pSize,1));
const fireMat = new THREE.ShaderMaterial({
  transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
  vertexShader:`
    attribute vec3 pcolor; attribute float psize; varying vec3 vC;
    void main(){ vC = pcolor;
      vec4 mv = modelViewMatrix * vec4(position,1.0);
      gl_PointSize = psize * (280.0 / max(-mv.z, 0.1));
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader:`
    varying vec3 vC;
    void main(){
      vec2 d = gl_PointCoord - 0.5;
      float r = length(d);
      if(r > 0.5) discard;
      float a = smoothstep(0.5, 0.0, r);
      gl_FragColor = vec4(vC, a * a); }`,
});
world.add(new THREE.Points(fireGeo, fireMat));

function emitFire(p, speed){
  const n = speed > 7 ? 3 : 2;
  for(let i=0;i<n;i++){
    const j = pCursor; pCursor = (pCursor+1) % PCOUNT;
    pPos[j*3]   = p.x + (Math.random()-.5)*0.05;
    pPos[j*3+1] = p.y + (Math.random()-.5)*0.05;
    pPos[j*3+2] = p.z + (Math.random()-.5)*0.05;
    pVel[j*3]   = (Math.random()-.5)*0.5;
    pVel[j*3+1] = 0.5 + Math.random()*0.9;
    pVel[j*3+2] = (Math.random()-.5)*0.5;
    pMax[j] = 0.55 + Math.random()*0.5;
    pLife[j] = pMax[j];
    pSize[j] = 0.1 + Math.random()*0.14;
  }
}
function stepFire(dt){
  for(let j=0;j<PCOUNT;j++){
    if(pLife[j] <= 0){ pSize[j] = 0; continue; }
    pLife[j] -= dt;
    const t = Math.max(pLife[j],0) / pMax[j];          // 1 → 0 as it cools
    pPos[j*3]   += pVel[j*3]   * dt;
    pPos[j*3+1] += pVel[j*3+1] * dt;
    pPos[j*3+2] += pVel[j*3+2] * dt;
    pVel[j*3]   *= 0.965; pVel[j*3+2] *= 0.965; pVel[j*3+1] += 0.35*dt;
    const c = t > 0.62 ? FLAME_HOT.clone().lerp(FLAME, (1-t)/0.38)
                       : FLAME.clone().lerp(FLAME_DEEP, (0.62-t)/0.62);
    const fade = t*t;
    pCol[j*3] = c.r*fade; pCol[j*3+1] = c.g*fade; pCol[j*3+2] = c.b*fade;
    pSize[j] *= 0.994;
  }
  fireGeo.attributes.position.needsUpdate = true;
  fireGeo.attributes.pcolor.needsUpdate   = true;
  fireGeo.attributes.psize.needsUpdate    = true;
}

// ── impact burst ──
const burst = new THREE.Mesh(
  new THREE.RingGeometry(0.1, 0.16, 32),
  new THREE.MeshBasicMaterial({ color:0xffb257, transparent:true, opacity:0,
    blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide })
);
world.add(burst);
const burstLight = new THREE.PointLight(0xff6a1f, 0, 14, 2); world.add(burstLight);
let burstT = 999;

/* ── rally simulation ── */
const RALLY = 2.15;               // seconds per exchange
const HIT_Y = 2.05;               // contact height
const base  = [-0.5, 0.5];
function rallyIndex(time){ return Math.floor(time / RALLY); }
function landingX(idx){ return Math.sin(idx*2.37)*1.9 + Math.sin(idx*0.83)*0.6; }

function hitPoints(idx){
  const hitterIsA = idx % 2 === 0;
  const fromZ = hitterIsA ?  4.6 : -4.6;
  const toZ   = hitterIsA ? -4.6 :  4.6;
  return {
    from: new THREE.Vector3(landingX(idx-1) + base[hitterIsA?0:1]*0.3, HIT_Y, fromZ),
    to:   new THREE.Vector3(landingX(idx)   + base[hitterIsA?1:0]*0.3, HIT_Y, toZ),
    hitter: hitterIsA ? 0 : 1, receiver: hitterIsA ? 1 : 0,
  };
}
function shuttleAt(time){
  const idx = rallyIndex(time), k = (time % RALLY) / RALLY;
  const { from, to } = hitPoints(idx);
  const hk = 1 - Math.pow(1-k, 2.35);                  // fast out, hangs on the way down
  const arc = 2.9;
  return new THREE.Vector3(
    THREE.MathUtils.lerp(from.x, to.x, hk),
    HIT_Y + arc * Math.sin(Math.PI * Math.pow(hk, 0.78)),
    THREE.MathUtils.lerp(from.z, to.z, hk)
  );
}

/* ═══════════════════════════ camera path ═══════════════════════════ */
const KEYS = [
  { p:[  0.0, 14.5,  19.0], t:[ 0.0, 0.60,   0.0] },  // 0 outside, high — the whole court
  { p:[  0.0,  2.40, 12.2], t:[ 0.0, 1.30,   2.0] },  // 1 dive to courtside
  { p:[  7.8,  1.75,  3.6], t:[ 0.0, 1.45,   0.0] },  // 2 slide along the sideline
  { p:[  1.5,  1.52,  4.3], t:[ 0.0, 1.75,   0.3] },  // 3 inside the lines — player eye level
  { p:[  0.0,  2.95,  8.6], t:[ 0.0, 2.95,   0.0] },  // 4 square on the net — spec panel
  { p:[ -7.6,  4.40, -5.2], t:[-3.0, 3.80, -14.5] },  // 5 fly over the net, face the back wall
  { p:[  0.0, 33.0, -26.0], t:[ 0.0, 0.00,  -1.0] },  // 6 away — the court is a lit box
  { p:[  0.0,  2.70,  25.0], t:[ 0.0, 2.70,  15.5] },  // 7 square on the archive wall
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map(k=>new THREE.Vector3(...k.p)), false, 'catmullrom', .4);
const tgtCurve = new THREE.CatmullRomCurve3(KEYS.map(k=>new THREE.Vector3(...k.t)), false, 'catmullrom', .4);
const N = KEYS.length, SPAN = 1/(N-1);

const BOARDS = {
  en: [['YF','WEST VANCOUVER'], ['2026','FOUNDED'], ['01','STUDENT PROJECT'],
       ['04','DESIGN STAGES'], ['03','MODELS'], ['JAN 28','OFFICIAL HANDOVER'],
       ['5%','PLEDGED'], ['10','DOCUMENTS']],
  zh: [['YF','西温哥华'], ['2026','创立'], ['01','学生项目'],
       ['04','设计阶段'], ['03','款型'], ['1月28日','正式交接'],
       ['5%','承诺投入'], ['10','档案文件']],
};

/* ═══════════════════════════ scroll ═══════════════════════════ */
let target = 0, eased = 0, currentAct = -1;
// pointer state lives here because readScroll() below clears it at module load
let hovered = null, focusOn = false, focusBlend = 0;
const focusPos = new THREE.Vector3(), focusLook = new THREE.Vector3();
const lookTmp = new THREE.Vector3();
const scroller = document.getElementById('scroller');
const actEls = [...document.querySelectorAll('.act')];
const scrim = document.getElementById('scrim');
const hint = document.getElementById('hint');
const rail = document.getElementById('rail');
actEls.forEach(()=> rail.appendChild(document.createElement('i')));
const dots = [...rail.children];
const hT = document.getElementById('h-t'), hA = document.getElementById('h-a'), hF = document.getElementById('h-f');

// dev hook: jump the camera straight to a progress value, skipping the damping
if(location.hostname==='localhost'||location.hostname==='127.0.0.1')
  window.__t = v => {
    target = eased = THREE.MathUtils.clamp(v, 0, 1);
    for(let i=0;i<6;i++) step(0.016, performance.now()/1000);   // rAF may be throttled
  };
if(location.hostname==='localhost'||location.hostname==='127.0.0.1')
  window.__dbg = () => ({
    gallery: gallery.length, displays: displays.length, clickable: clickable.length,
    cam: camera.position.toArray().map(n=>+n.toFixed(2)),
    eased: +eased.toFixed(3), SPAN: +SPAN.toFixed(4),
    firstGal: gallery[0] && { pos: gallery[0].gg.position.toArray().map(n=>+n.toFixed(2)),
                              op: gallery[0].gMat.opacity, vis: gallery[0].gg.visible },
    tris: renderer.info.render.triangles,
    calls: renderer.info.render.calls,
    worldKids: world.children.length,
    farZ: world.children.filter(o=>o.position.z > 10)
            .map(o=>({t:o.type, z:+o.position.z.toFixed(1), v:o.visible,
                      mat:o.material && o.material.type, op:o.material && o.material.opacity})),
    fov: camera.fov, near: camera.near, far: camera.far,
    dir: camera.getWorldDirection(new THREE.Vector3()).toArray().map(n=>+n.toFixed(3)),
  });
if(location.hostname==='localhost'||location.hostname==='127.0.0.1')
  window.__raw = () => { renderer.setRenderTarget(null); renderer.render(scene, camera); };
if(location.hostname==='localhost'||location.hostname==='127.0.0.1')
  Object.assign(window, { __gal: gallery, __scene: scene, __cam: camera, __world: world, __THREE: THREE });

function readScroll(){
  focusOn = false;                       // any scroll releases a focused board
  const max = scroller.offsetHeight - innerHeight;
  target = max > 0 ? THREE.MathUtils.clamp(scrollY / max, 0, 1) : 0;
  hint.style.opacity = target > 0.012 ? '0' : '1';
}
addEventListener('scroll', readScroll, { passive:true });
readScroll();

function paintActs(t){
  let nearest = 0, best = 9;
  actEls.forEach((el,i)=>{
    const d = Math.abs(t - i*SPAN);
    if(d < best){ best = d; nearest = i; }
    const on = d < SPAN*0.47;
    el.style.opacity = on ? String(1 - (d/(SPAN*0.47))*0.92) : '0';
    dots[i].classList.toggle('on', on);
  });
  if(nearest !== currentAct){
    currentAct = nearest;
    scrim.dataset.pos = actEls[nearest].dataset.pos;
    drawBoard(...(BOARDS[LANG] || BOARDS.en)[nearest]);
  }
  return nearest;
}

/* ═══════════════════ pointer: focus a board, open an image ═══════════════════ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pick(ev){
  pointer.set((ev.clientX/innerWidth)*2 - 1, -(ev.clientY/innerHeight)*2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(clickable.map(c=>c.mesh), false)[0];
  return hit ? clickable.find(c=>c.mesh === hit.object) : null;
}
canvas.addEventListener('pointermove', ev=>{
  hovered = pick(ev);
  canvas.style.cursor = hovered ? 'pointer' : '';
});
canvas.addEventListener('click', ev=>{
  const target = pick(ev);
  if(!target){ focusOn = false; return; }
  if(target.kind === 'gallery'){ window.openLightbox?.(target.src, capOf(target.d)); return; }
  // a board on the stands: fly the camera square onto it
  const g = target.group;
  const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion);
  focusPos.copy(g.position).addScaledVector(fwd, 2.55);
  focusLook.copy(g.position);
  focusOn = true;
});

/* ═══════════════════════════ post ═══════════════════════════ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight),
  LOW ? 0.58 : 0.82,   // strength
  0.62,                // radius
  0.78);               // threshold — only the hot things bloom
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.setSize(innerWidth, innerHeight);
composer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.4 : 2));

/* ═══════════════════════════ loop ═══════════════════════════ */
const clock = new THREE.Clock();
let lastRally = -1, fpsAcc = 0, frames = 0;
const prevShuttle = new THREE.Vector3();

function animatePlayers(now){
  const idx = rallyIndex(now), k = (now % RALLY) / RALLY;
  const { hitter, receiver, to } = hitPoints(idx);

  players.forEach((p,i)=>{
    const u = p.userData;
    const isReceiver = i === receiver;

    // footwork — the receiver travels to where the shuttle is going
    const wantX = isReceiver ? to.x : landingX(idx-1) + base[i]*0.3;
    p.position.x += (wantX - p.position.x) * Math.min(1, 6.5*(1/60));

    // swing phase: receiver winds up late and strikes on contact
    // wind up slowly, strike fast, then follow through
    const wind   = isReceiver ? Math.pow(THREE.MathUtils.smoothstep(k, 0.5, 0.9), 0.75) : 0;
    const strike = isReceiver ? Math.pow(THREE.MathUtils.smoothstep(k, 0.9, 1.0), 0.5)
                              : 1 - THREE.MathUtils.smoothstep(k, 0.0, 0.22);
    const swing  = wind - strike*1.9;

    u.shoulderR.rotation.x = -0.25 - swing*2.5;
    u.shoulderR.rotation.z = -0.3 + swing*0.55;
    u.racket.rotation.x    = -swing*0.8;
    u.shoulderL.rotation.x = 0.2 + swing*1.5;
    u.torso.rotation.y     = swing*0.45;
    u.hips.rotation.y      = swing*0.3;

    // split step + lunge
    const bob = Math.sin(now*5.2 + i*2.1);
    u.hips.position.y = 0.92 - Math.abs(bob)*0.05 - Math.max(swing,0)*0.07;
    u.hipR.rotation.x = -0.25 - bob*0.3 - Math.max(swing,0)*0.3;
    u.hipL.rotation.x =  0.25 + bob*0.3 + Math.max(swing,0)*0.15;

    // always face the shuttle's side
    p.rotation.y = (i === 0 ? 0 : Math.PI) + (isReceiver ? swing*0.25 : 0);
  });
}

function step(dt, now){

  eased += (target - eased) * Math.min(1, dt*5.4);
  const pathPos = posCurve.getPoint(eased), pathLook = tgtCurve.getPoint(eased);

  focusBlend += ((focusOn ? 1 : 0) - focusBlend) * Math.min(1, dt*3.6);
  if(focusBlend > 0.002){
    const e = focusBlend*focusBlend*(3 - 2*focusBlend);
    camera.position.lerpVectors(pathPos, focusPos, e);
    lookTmp.lerpVectors(pathLook, focusLook, e);
    camera.lookAt(lookTmp);
  } else {
    camera.position.copy(pathPos);
    camera.lookAt(pathLook);
  }

  animatePlayers(now);

  // shuttle + fire
  const sp = shuttleAt(now);
  const speed = prevShuttle.distanceTo(sp) / Math.max(dt, 1e-4);
  shuttle.position.copy(sp);
  shuttleLight.position.copy(sp);
  shuttleLight.intensity = 11 + Math.sin(now*14)*3;
  if(!CALM) emitFire(sp, speed);
  stepFire(dt);
  prevShuttle.copy(sp);

  // impact burst on every new exchange
  const idx = rallyIndex(now);
  if(idx !== lastRally){
    lastRally = idx;
    burstT = 0;
    const { from } = hitPoints(idx);
    burst.position.copy(from);
    burstLight.position.copy(from);
  }
  burstT += dt;
  if(burstT < 0.42){
    const b = burstT/0.42;
    burst.scale.setScalar(1 + b*4.5);
    burst.material.opacity = (1-b)*0.5;
    burst.lookAt(camera.position);
    burstLight.intensity = (1-b)*34;
  } else { burst.material.opacity = 0; burstLight.intensity = 0; }

  // spec panel rises out of the net during the product act
  const near = 1 - THREE.MathUtils.clamp(Math.abs(eased - 4*SPAN)/(SPAN*0.72), 0, 1);
  const grow = THREE.MathUtils.smoothstep(near, 0, 1);
  specPanel.material.opacity = grow;
  specPanel.scale.y = 0.02 + grow*0.98;
  specPanel.position.y = NET_H + 0.03 + grow*1.47;

  // the rackets stand up with the table and turn slowly so both faces read
  rackets.visible = grow > 0.02;
  if(rackets.visible){
    racketKey.intensity  = grow * 90;
    racketFill.intensity = grow * 7;
    SPEC_COL_X.forEach((x,i)=>{
      const r = rackets.children[3 + i];          // after plinth top, body, edge
      r.position.y = PLINTH_Y + 0.05 - (1-grow)*0.5;
      r.rotation.y = Math.sin(now*0.5 + i*0.9) * 0.45;
    });
  }

  // boards light up as the camera passes them, brighter still on hover
  for(const d of displays){
    const dist = d.g3.position.distanceTo(camera.position);
    const near = THREE.MathUtils.clamp(1 - (dist - 4.5)/13, 0, 1);
    const hot = hovered && hovered.group === d.g3 ? 1 : 0;
    d.mat.opacity = Math.max(0.07 + near*0.93, hot);
    d.edgeMat.opacity = Math.max(near*0.75, hot);
  }
  // the archive wall only exists for the final act — hidden, it can't be hovered,
  // raycast against, or flown through on the way past
  const galNear = THREE.MathUtils.clamp((eased - 6.1*SPAN)/(SPAN*0.75), 0, 1);
  archive.visible = galNear > 0.015;
  if(archive.visible){
    for(const g of gallery){
      const hot = hovered && hovered.group === g.gg ? 1 : 0;
      g.gMat.opacity  = galNear;
      g.gEdge.opacity = Math.max(galNear*0.26, hot*0.9) * galNear;
    }
  }

  const act = paintActs(eased);
  if(hT){ hT.textContent = eased.toFixed(3); hA.textContent = act; }
  frames++; fpsAcc += dt;
  if(fpsAcc >= 0.5 && hF){ hF.textContent = Math.round(frames/fpsAcc); frames = 0; fpsAcc = 0; }

  composer.render();
}

function tick(){
  requestAnimationFrame(tick);
  step(Math.min(clock.getDelta(), 0.05), CALM ? 0.42 : clock.elapsedTime);
}
tick();

// Portrait screens crop the court badly at 42°, so open the lens as the frame narrows.
function fitLens(){
  const a = innerWidth / innerHeight;
  camera.aspect = a;
  camera.fov = a < 1.3 ? THREE.MathUtils.clamp(42 * (1.3/a) * 0.72, 42, 70) : 42;
  camera.updateProjectionMatrix();
}
fitLens();

// Called by the page's language toggle; everything drawn into a canvas is redrawn.
window.setSceneLang = (lang)=>{
  LANG = lang === 'zh' ? 'zh' : 'en';
  drawSpec();
  repaints.forEach(fn => fn());
  const table = BOARDS[LANG] || BOARDS.en;
  drawBoard(...table[Math.min(Math.max(currentAct,0), table.length-1)]);
};
// the page may have restored Chinese before this module finished loading
if(document.documentElement.lang.startsWith('zh')) window.setSceneLang('zh');

addEventListener('resize', ()=>{
  fitLens();
  layoutGallery();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
  readScroll();
});
