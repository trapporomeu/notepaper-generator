const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const val = n => ($(`input[name=${n}]:checked`) || {}).value;
const show = (id, on) => $('#' + id).classList.toggle('hide', !on);

const TEXTURES = ['none', 'grain', 'fibers', 'speckle', 'linen', 'clouds'];
const TEX_NAMES = {grain:'Grão', fibers:'Fibras', speckle:'Pontilhado fino', linen:'Linho', clouds:'Nuvens'};
const APP_NAMES = {
  GoodNotes:'GoodNotes', Notability:'Notability', CollaNote:'CollaNote', Penly:'Penly',
  Xodo:'Xodo', NoteshelfAnd:'Noteshelf para Android', NoteshelfiPad:'Noteshelf para iPad'
};
const INSTRUCTIONS = {
  GoodNotes: ['Use o Safari no iPad.', 'Baixe o PDF gerado.', 'Abra o arquivo e escolha Abrir em → GoodNotes.', 'Importe como novo documento.'],
  Notability: ['Salve o PDF em Arquivos.', 'No Notability, toque em + → Importar.', 'Selecione o PDF.'],
  CollaNote: ['Salve o PDF em Arquivos.', 'No CollaNote, toque em + e importe o PDF.'],
  Penly: ['Baixe o PDF no Android.', 'No Penly, toque em + → Importar PDF.'],
  Xodo: ['Baixe o PDF no Android.', 'No Xodo, abra o menu e escolha Abrir arquivo.'],
  NoteshelfAnd: ['Baixe o PDF no Android.', 'No Noteshelf, toque em + → Importar.'],
  NoteshelfiPad: ['Salve o PDF em Arquivos.', 'No Noteshelf, toque em + → Importar.']
};
const SIZES = {default:[595.28, 841.89], A4:[595.28, 841.89], legal:[612, 1008], letter:[612, 792]};
const LINE_GAP = 22.68, LINE_FIRST = 24.8, LINE_WIDTH = 0.65;   // medidas do PDF de referência (pt)

// parâmetros de link, como no site base: ?custom=yes  ?orient=landscape
const params = new URLSearchParams(location.search);
const customParam = params.get('custom'), orient = params.get('orient');

let bgImg = null;

/* ---------- papel ---------- */
function rng(seed){return () => {seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296}}
function isDark(hex){
  const n = parseInt(hex.replace('#', ''), 16);
  return (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128;
}
function paintTexture(g, w, h, kind, k, dark){
  if(kind === 'none') return;
  const r = rng(777), ink = dark ? 255 : 0;
  if(kind === 'grain' || kind === 'speckle' || kind === 'linen'){
    const img = g.getImageData(0, 0, w, h), d = img.data, cell = kind === 'speckle' ? 2 : 3;
    for(let y = 0; y < h; y += cell) for(let x = 0; x < w; x += cell){
      let n;
      if(kind === 'speckle'){ if(r() > .08) continue; n = (r() - .5) * 200 * k; }
      else if(kind === 'linen') n = ((Math.floor(x / cell) % 4 === 0 ? 1 : 0) + (Math.floor(y / cell) % 4 === 0 ? 1 : 0) - .8) * 45 * k + (r() - .5) * 20 * k;
      else n = (r() - .5) * 80 * k;
      for(let dy = 0; dy < cell && y + dy < h; dy++) for(let dx = 0; dx < cell && x + dx < w; dx++){
        const i = ((y + dy) * w + x + dx) * 4; d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
    }
    g.putImageData(img, 0, 0);
  } else if(kind === 'fibers'){
    g.lineWidth = 1; g.strokeStyle = `rgb(${ink},${ink},${ink})`; g.globalAlpha = .14 * k;
    const n = Math.floor(w * h / 3500) + 100;
    for(let i = 0; i < n; i++){
      const x = r() * w, y = r() * h, a = r() * 6.28, l = 10 + r() * 30;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * l / 2 + r() * 6, y + Math.sin(a) * l / 2 + r() * 6, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    g.globalAlpha = 1;
  } else if(kind === 'clouds'){
    for(let i = 0; i < 60; i++){
      const x = r() * w, y = r() * h, rad = (.08 + r() * .18) * Math.max(w, h);
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, `rgba(${ink},${ink},${ink},${.08 * k})`);
      grd.addColorStop(1, `rgba(${ink},${ink},${ink},0)`);
      g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }
}
function pageHex(){
  const v = $('#customhex').value.replace('#', '');
  return /^[0-9a-f]{6}$/i.test(v) ? '#' + v : '#' + CONFIG.presets[0];
}
function sizeKey(){ return val('sizePlanner') || 'default'; }
function pageQty(){
  let q = parseInt(($('#pageqtyinput') || {}).value, 10);
  if(!(q >= 1)) q = 1;
  if(q > 5) q = 5;
  return q;
}
function checkQty(){
  const v = parseInt(($('#pageqtyinput') || {}).value, 10);
  show('qtywarn', v > 5);
}
function hexRgb(h){const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]}
function textureCanvas(w, h){
  const tex = val('PaperPlanner') || 'none';
  if(tex === 'none' && !bgImg) return null;
  const f = 2.5, W = Math.round(w * f), H = Math.round(h * f);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), page = pageHex(), op = +$('#customopacity').value;
  g.fillStyle = page; g.fillRect(0, 0, W, H);
  if(bgImg){
    const s = Math.max(W / bgImg.width, H / bgImg.height);
    g.globalAlpha = 1 - op / 100;
    g.drawImage(bgImg, (W - bgImg.width * s) / 2, (H - bgImg.height * s) / 2, bgImg.width * s, bgImg.height * s);
    g.globalAlpha = 1;
  }
  paintTexture(g, W, H, tex, op / 80, isDark(page));
  return c;
}
function makePen(pdf, ox, oy, s, withText, paper, struct){
  const usePaper = thin => {
    pdf.setDrawColor(paper[0], paper[1], paper[2]);
    pdf.setFillColor(paper[0], paper[1], paper[2]);
    pdf.setLineWidth(withText ? (thin ? 0.5 : 0.65) : 1.0);
  };
  const useStruct = () => {
    pdf.setDrawColor(struct[0], struct[1], struct[2]);
    pdf.setFillColor(struct[0], struct[1], struct[2]);
    pdf.setLineWidth(withText ? 2.0 : 1.0);
  };
  return {
    s, thumb: !withText,
    line: (a, b, c, d) => { usePaper(false); pdf.line(ox + a * s, oy + b * s, ox + c * s, oy + d * s); },
    sline: (a, b, c, d) => { useStruct(); pdf.line(ox + a * s, oy + b * s, ox + c * s, oy + d * s); },
    gline: (a, b, c, d) => { usePaper(true); pdf.line(ox + a * s, oy + b * s, ox + c * s, oy + d * s); },
    rect: (x, y, w, h) => { usePaper(false); pdf.rect(ox + x * s, oy + y * s, w * s, h * s, 'S'); },
    rrect: (x, y, w, h, r) => { usePaper(false); pdf.roundedRect(ox + x * s, oy + y * s, w * s, h * s, r * s, r * s, 'S'); },
    dot: (x, y, mul) => { usePaper(false); pdf.circle(ox + x * s, oy + y * s, withText ? 1.0 * (mul || 1) : Math.max(.35, .35 * (mul || 1)), 'F'); },
    dotD: (x, y, d) => { usePaper(false); pdf.circle(ox + x * s, oy + y * s, Math.max(.2, d * s / 2), 'F'); },
    text: (t, x, y, size) => { if(withText){ pdf.setFont('FluffyHand', 'normal'); pdf.setFontSize(size); pdf.setTextColor(paper[0], paper[1], paper[2]); pdf.text(t, ox + x * s, oy + y * s); } },
    dash: on => pdf.setLineDashPattern(on ? [1.946 * s, 1.296 * s] : [], 0),
    dashT: on => pdf.setLineDashPattern(on ? [3.038, 2.038] : [], 0),
    shift: (dx, dy, fn) => { ox += dx * s; oy += dy * s; fn(); ox -= dx * s; oy -= dy * s; }
  };
}
function buildPdf(){
  let [w, h] = SIZES[sizeKey()];
  if(orient === 'landscape') [w, h] = [h, w];
  const {jsPDF} = window.jspdf;
  const pdf = new jsPDF({unit:'pt', format:[w, h], orientation:w > h ? 'l' : 'p', compress:true});
  if(typeof FLUFFY_B64 === 'string' && FLUFFY_B64){
    pdf.addFileToVFS('FluffyHand-Bold.ttf', FLUFFY_B64);
    pdf.addFont('FluffyHand-Bold.ttf', 'FluffyHand', 'normal');
  }
  const tc = textureCanvas(w, h), img = tc && tc.toDataURL('image/jpeg', .9);
  const [pr, pg, pb] = hexRgb(pageHex()), [lr, lg, lb] = hexRgb(CONFIG.line.color);
  const background = () => {
    pdf.setFillColor(pr, pg, pb); pdf.rect(0, 0, w, h, 'F');
    if(img) pdf.addImage(img, 'JPEG', 0, 0, w, h, 'bg');
  };
  const ink = () => { pdf.setDrawColor(lr, lg, lb); pdf.setFillColor(lr, lg, lb); pdf.setTextColor(lr, lg, lb); };
  const N = TEMPLATES.length, Q = pageQty();
  const paperFull = [lr, lg, lb], structFull = [lr, lg, lb];   // páginas 2+: tinta do tema
  const paperThumb = hexRgb(CONFIG.thumbInk), structThumb = hexRgb(CONFIG.thumbStruct);

  // página 1: índice com miniaturas clicáveis (mesma estrutura no dark e no light,
  // muda só o fundo; medidas proporcionais às do PDF de referência)
  background();
  const cols = 7;
  const tw = w * 0.07408, th = h * 0.07482;                    // miniatura 44,1 x 63,0 pt em A4
  const ix0 = w * 0.06415, iy0 = h * 0.04507;                  // primeira miniatura (38,19 / 37,95)
  const pitchX = w * 0.13334, pitchY = h * 0.10437;            // passo 79,37 x 87,875
  const [br, bg2, bb] = hexRgb(CONFIG.thumbBorder);
  TEMPLATES.forEach((fn, i) => {
    const x = ix0 + (i % cols) * pitchX, y = iy0 + Math.floor(i / cols) * pitchY;
    pdf.setFillColor(255, 255, 255); pdf.setDrawColor(br, bg2, bb); pdf.setLineWidth(1); pdf.rect(x, y, tw, th, 'FD');
    const pen = makePen(pdf, x, y, tw / w, false, paperThumb, structThumb);
    if(!(typeof thumbDraw === 'function' && thumbDraw(pen, i))) fn(pen, w, h);
    pdf.link(x - w * 0.02466, y - h * 0.01547, w * 0.12101, h * 0.10407, {pageNumber: 2 + i * Q});
  });
  pdf.link(-w * 0.00887, h * 0.95796, w * 0.06388, h * 0.04516, {pageNumber: 1});

  // páginas dos modelos (cada modelo repetido Q vezes), cada uma com link de volta ao índice (canto inferior esquerdo)
  TEMPLATES.forEach(fn => {
    for(let k = 0; k < Q; k++){
      pdf.addPage([w, h]); background(); ink();
      fn(makePen(pdf, 0, 0, 1, true, paperFull, structFull), w, h);
      pdf.link(-w * 0.00887, h * 0.95796, w * 0.06388, h * 0.04516, {pageNumber: 1});
    }
  });
  return pdf;
}

/* ---------- comportamento da página ---------- */
function productCode(){
  const code = [pageHex().slice(1), CONFIG.line.code, val('PaperPlanner') || 'none', val('appBuy'), sizeKey(), 'x' + pageQty()].join('-');
  $('#result').textContent = code;
  return code;
}
function showAppInstructions(){
  $$('#allvideos .inst').forEach(d => d.classList.toggle('hide', d.dataset.app !== val('appBuy')));
}
function showCustom(){
  const open = !$('#custom').classList.contains('hide');
  show('custom', !open); show('presets', open);
  $('#custombutton').textContent = open ? 'Mostrar seção Custom' : 'Mostrar Presets';
}
function selectPreset(c){
  $('#customcolor').checked = true;
  $('#customhex').value = c;
  $('#customhexsq').style.backgroundColor = '#' + c;
}

function buildPresets(){
  const box = $('#presetList');
  box.innerHTML = '<br>' + CONFIG.presets.map(c =>
    `<label><input type="radio" name="presetoptions" value="${c}"> <span class="bar" style="background:#${c}"></span></label><br>`).join('');
  $$('input[name=presetoptions]').forEach(i => i.onclick = () => selectPreset(i.value));
}
function buildTextures(){
  const box = $('#texList');
  TEXTURES.forEach((t, i) => {
    const l = document.createElement('label');
    l.innerHTML = `<input type="radio" name="PaperPlanner" value="${t}" ${i === 0 ? 'checked' : ''}> `;
    if(t === 'none') l.append('Nenhuma');
    else {
      const c = document.createElement('canvas'); c.width = 200; c.height = 60; c.className = 'tex';
      const g = c.getContext('2d'); g.fillStyle = '#f1ede4'; g.fillRect(0, 0, 200, 60);
      paintTexture(g, 200, 60, t, .8, false); l.append(c); l.append(' ' + TEX_NAMES[t]);
    }
    l.querySelector('input').onclick = () => show('opacitysection', t !== 'none' || !!bgImg);
    box.appendChild(l); box.appendChild(document.createElement('br'));
  });
}
function buildInstructions(){
  $('#allvideos').innerHTML = Object.keys(INSTRUCTIONS).map(k =>
    `<div class="choicesdiv inst hide" data-app="${k}"><b>Instruções — ${APP_NAMES[k]}</b><ol>` +
    INSTRUCTIONS[k].map(s => `<li>${s}</li>`).join('') + '</ol></div>').join('');
}

/* ---------- gerar ---------- */
// Mesmo fluxo do site base: coleta as escolhas, pede o PDF e mostra o link.
// Sem CONFIG.backendUrl o PDF é feito aqui no navegador; com backendUrl o pedido vai ao servidor.
function selection(){
  return {
    filename: Math.random().toString(36).replace(/[^a-z]+/g, '').slice(0, 10) + '.pdf',
    colorhex: pageHex().slice(1),
    type: CONFIG.line.code,
    app: val('appBuy'),
    size: sizeKey(),
    qty: pageQty(),
    pagesC: TEMPLATES.length * pageQty() + 1,
    texture: val('PaperPlanner') || 'none',
    opacity: $('#customopacity').value,
    custom: $('#file').value.split(/[\/]/).pop(),
    orient: orient || ''
  };
}
async function requestPdf(sel){
  if(!CONFIG.backendUrl) return {ok: true, url: URL.createObjectURL(buildPdf().output('blob'))};
  const body = new FormData();
  Object.entries(sel).forEach(([k, v]) => body.append(k, v));
  if($('#file').files[0]) body.append('file', $('#file').files[0]);
  const res = await fetch(CONFIG.backendUrl, {method: 'POST', body});
  return res.json();                       // esperado: {ok:true,url:"..."} ou {ok:false,message:"..."}
}
async function generate(){
  window.scrollTo(0, 0);
  show('buttondiv', false); show('presets', false); show('custom', false); show('genbutton', false);
  const sel = selection(), link = $('#resultlink');
  $('#resultlinkdiv').textContent = 'Gerando...';
  let out;
  try { out = await requestPdf(sel); } catch(e){ out = {ok: false, message: 'Não foi possível gerar. Tente novamente.'}; }
  if(!out.ok){
    $('#resultlinkdiv').textContent = out.message || 'Erro ao gerar.';
    show('genbutton', true); return;
  }
  link.href = out.url; link.target = '_blank'; link.rel = 'noopener'; link.removeAttribute('download'); link.classList.add('ready');
  $('#resultlinkdiv').textContent = 'Baixar Notepaper';
  $('#resultlinkmessagediv').textContent = 'Se tiver algum problema, envie o código abaixo:';
  const d = new Date();
  $('#resultlinkenddiv').textContent = productCode() + '-' + d.getUTCHours() + d.getUTCMinutes() + '-' + sel.filename;
  show('refreshbutton', true);
}

/* ---------- eventos ---------- */
$('#custombutton').onclick = showCustom;
$('#genbutton').onclick = generate;
$('#repick').onclick = () => location.reload();
$('#customhex').addEventListener('change', e => {
  const v = e.target.value.replace('#', '');
  $('#customhexsq').style.backgroundColor = '#' + v;
  $('#customcolor').checked = true; productCode();
});
$('#customopacity').addEventListener('input', e => { $('#customopacitynum').textContent = e.target.value; });
$('#pageqtyinput').addEventListener('input', checkQty);
$('#file').addEventListener('change', e => {
  const f = e.target.files[0]; if(!f) return;
  const im = new Image();
  im.onload = () => { bgImg = im; $('#imgPreview').src = im.src; show('imgPreview', true); show('opacitysection', true); productCode(); };
  im.src = URL.createObjectURL(f);
});
$$('input[name=appBuy]').forEach(i => i.onclick = showAppInstructions);
document.addEventListener('click', productCode);   // o código é recalculado a cada clique, como no base

/* ---------- início ---------- */
$('#CustomerLink').textContent = `Obrigado por usar o ${CONFIG.title}. Este bundle tem várias páginas de notepaper para escolher. Para ajudar na escolha, selecione as opções abaixo.`;
buildPresets(); buildTextures(); buildInstructions();
document.querySelector('input[name=presetoptions]').click();
showAppInstructions();
if(orient === 'landscape') show('sizePlanner', true);
if(customParam){
  show('custom', true); show('customimage', true); show('opacitysection', true);
  show('presets', false); show('buttondiv', false); show('pagecolor', false);
}
productCode();


/* ---------- tela de senha (GATE) ---------- */
async function sha256(txt){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function openGate(){ $('#gate').classList.add('hide'); $('#builder').classList.remove('hide'); }
async function tryGate(){
  const v = $('#gatepass').value.trim();
  try {
    if(await sha256(v) === CONFIG.passHash){
      try { sessionStorage.setItem('np_ok_' + CONFIG.title, '1'); } catch(e){}
      openGate(); return;
    }
    $('#gatemsg').textContent = 'Senha incorreta.';
  } catch(e){ $('#gatemsg').textContent = 'Abra a página por http(s) ou localhost para validar a senha.'; }
  $('#gatepass').value = '';
}
$('#gatebtn').onclick = tryGate;
$('#gatepass').addEventListener('keydown', e => { if(e.key === 'Enter') tryGate(); });
try { if(sessionStorage.getItem('np_ok_' + CONFIG.title) === '1') openGate(); } catch(e){}
