/* 63 modelos de página (medidas em pt, A4 retrato como referência).
   Cada modelo recebe um "pincel" P e o tamanho w x h; o mesmo código desenha
   a página inteira e a miniatura do índice.
   Pincel: P.line (tinta papel), P.sline (tinta estrutural = divisórias/margens),
   P.gline (tinta papel fina, usada nos grids), P.rect, P.rrect, P.dot(x, y, mul),
   P.text, P.dash, P.shift. P.thumb diz se é miniatura; P.s é a escala. */

const TOP = 24.8;
const GAP = {S: 22.68, M: 31.1, L: 36.51};   // espaçamentos medidos no PDF de referência
const lat = (a, c, n) => Array.from({length: n}, (_, k) => a + k * c);
// n células inteiras preenchendo exatamente [a, b] (tamanho ≈ c: sem quadrado cortado na borda)
const fillCells = (a, b, c) => {
  const n = Math.max(1, Math.round((b - a) / c));
  const s = (b - a) / n;
  return Array.from({length: n + 1}, (_, k) => a + k * s);
};

// ---- miniaturas do índice: versão esquemática (legível), como na referência ----
// gaps em coordenadas de página (a escala P.s converte para pt da miniatura)
const tgLines = g => g <= 27 ? 63.55 : g <= 33 ? 76.6 : 83.75;
const tgGrid = c => Math.max(c * 3.5, 63.5);

// n linhas horizontais distribuídas em [y0, y1] (página cheia exata ou esquemática)
const eachH = (P, y0, y1, g, tg, fn) => {
  if(!P.thumb){ const n = Math.max(1, Math.round((y1 - y0) / g) + 1); for(let k = 0; k < n; k++) fn(y0 + k * g); return; }
  const n = Math.max(1, Math.round((y1 - y0 - 6) / tg - 0.25));
  const first = y0 + ((y1 - y0) - (n - 1) * tg) / 2;
  for(let k = 0; k < n; k++) fn(first + k * tg);
};
const eachV = (P, x0, x1, g, tg, fn) => {
  if(!P.thumb){ const n = Math.max(1, Math.round((x1 - x0) / g) + 1); for(let k = 0; k < n; k++) fn(x0 + k * g); return; }
  const n = Math.max(1, Math.round((x1 - x0 - 6) / tg - 0.25));
  const first = x0 + ((x1 - x0) - (n - 1) * tg) / 2;
  for(let k = 0; k < n; k++) fn(first + k * tg);
};

const hLines = (P, x0, x1, y0, y1, g) =>
  eachH(P, y0, y1, g, tgLines(g), y => P.line(x0, y, x1, y));

// grid a partir das treliças exatas (xs, ys); x1H = alcance das horizontais;
// na miniatura vira esquemático
const gridArr = (P, xs, ys, cell, x1H) => {
  const x0 = xs[0], xa = xs[xs.length - 1], y0 = ys[0], ya = ys[ys.length - 1];
  if(!P.thumb){
    ys.forEach(y => P.gline(x0, y, x1H || xa, y));
    xs.forEach(x => P.gline(x, y0, x, ya));
    return;
  }
  eachH(P, y0, ya, cell, tgGrid(cell), y => P.gline(x0, y, x1H || xa, y));
  eachV(P, x0, xa, cell, tgGrid(cell), x => P.gline(x, y0, x, ya));
};

// pontos: página cheia exata; miniatura esquemática (passo ~6,3/7,4 pt)
const dotFill = (P, x0, x1, y0, y1, nx, ny, cell) => {
  if(!P.thumb){
    const dx = (x1 - x0) / (nx - 1), dy = (y1 - y0) / (ny - 1);
    for(let r = 0; r < ny; r++) for(let c = 0; c < nx; c++) P.dot(x0 + c * dx, y0 + r * dy);
    return;
  }
  const step = cell < 20 ? 6.25 : 7.4, s = P.s, st = step / s;
  const cols = Math.max(1, Math.floor(((x1 - x0) * s - 4.2) / step) + 1);
  const rows = Math.max(1, Math.floor(((y1 - y0) * s - 4.2) / step) + 1);
  const fx = x0 + ((x1 - x0) - (cols - 1) * st) / 2, fy = y0 + ((y1 - y0) - (rows - 1) * st) / 2;
  for(let r = 0; r < rows; r++) for(let c = 0; c < cols; c++) P.dot(fx + c * st, fy + r * st, step * 0.327);
};

const lined = (y0, y1, g) => (P, w, h) => hLines(P, 0, w, y0, y1, g);
const dashed = (y0, y1, g) => (P, w, h) => { P.dash(true); hLines(P, 0, w, y0, y1, g); P.dash(false); };
const colLines = (segs, y0, y1, g) => (P, w, h) => segs.forEach(([a, b]) => hLines(P, a, b, y0, y1, g));

// checklist: caixas 12x12 à esquerda da linha; miniatura com 8 fileiras
const checklist = (cols, n) => (P, w, h) => {
  let y0 = 48.3, y1 = 813.7, rows = n;
  if(P.thumb){ y0 = 106.8; y1 = 776.4; rows = 8; }
  const st = (y1 - y0) / (rows - 1);
  for(let k = 0; k < rows; k++){
    const y = y0 + k * st;
    cols.forEach(([bx, a, b]) => { P.rect(bx, y - 12, 12, 12); P.line(a, y, b, y); });
  }
};

// cabeçalho (linhas + rótulos em inglês, como na referência)
const header = labels => P => {
  P.line(25.5, 24.8, 413.9, 24.8); P.line(434.6, 24.8, 571.5, 24.8);
  P.line(25.5, 47.5, 413.9, 47.5); P.line(434.6, 47.5, 571.5, 47.5);
  P.text(labels[0], 25.5, 19, 10); P.text(labels[1], 25.5, 41.5, 10);
  P.text(labels[2], 434.6, 19, 10); P.text(labels[3], 434.6, 41.5, 10);
};
const TOPIC = ['Tema:', 'Aula:', 'Data:', 'Turma:'];
const MEET = ['Reunião:', 'Participantes:', 'Data:', 'Local:'];
const withHead = (labels, inner) => (P, w, h) => { header(labels)(P); inner(P, w, h); };

// família "caixa": divisória vertical + borda inferior (linhas estruturais)
const DIV = 164, BBOT = 659.8;

const TEMPLATES = [
  /* 1-3: pautado cheio S/M/L */
  lined(24.8, 818.5, GAP.S), lined(33.2, 810.8, GAP.M), lined(38.6, 805.4, GAP.L),
  /* 4-6: pautado + margem */
  (P, w, h) => { hLines(P, 0, w, 24.8, 818.5, GAP.S); P.sline(94.2, 0, 94.2, h); },
  (P, w, h) => { hLines(P, 0, w, 33.2, 810.8, GAP.M); P.sline(94.2, 0, 94.2, h); },
  (P, w, h) => { hLines(P, 0, w, 38.6, 805.4, GAP.L); P.sline(94.2, 0, 94.2, h); },
  /* 7-8: metade superior / inferior */
  lined(24.8, 410.3, GAP.S), lined(433.0, 818.5, GAP.S),
  /* 9-11: tracejados S/M/L */
  dashed(24.8, 818.5, GAP.S), dashed(33.2, 810.8, GAP.M), dashed(38.6, 805.4, GAP.L),
  /* 12-13: sólido + tracejado */
  (P, w, h) => { hLines(P, 0, w, 18.0, 814.8, 26.56); P.dash(true); hLines(P, 0, w, 31.2, 827.9, 26.56); P.dash(false); },
  (P, w, h) => { hLines(P, 0, w, 18.0, 810.2, 31.69); P.dash(true); hLines(P, 0, w, 33.8, 826.0, 31.69); P.dash(false); },
  /* 14: em branco */
  (P, w, h) => {},
  /* 15-16: metade esquerda / direita (S) */
  colLines([[0, 297.6]], 24.8, 818.5, GAP.S), colLines([[297.6, 595.3]], 24.8, 818.5, GAP.S),
  /* 17-18: metade esquerda / direita (M) */
  colLines([[0, 297.6]], 33.2, 810.8, GAP.M), colLines([[297.6, 595.3]], 33.2, 810.8, GAP.M),
  /* 19: caixa + pautado à direita */
  (P, w, h) => { P.sline(DIV, 0, DIV, 659); P.sline(0, BBOT, 595.3, BBOT); hLines(P, 164.8, 595.3, 23.5, 637.1, 22.73); },
  /* 20: caixa + pautado à esquerda */
  (P, w, h) => { P.sline(DIV, 0, DIV, 659); P.sline(0, BBOT, 595.3, BBOT); hLines(P, 0, 163.3, 23.5, 637.1, 22.73); },
  /* 21: divisória total + pautado à direita */
  (P, w, h) => { P.sline(DIV, 0, DIV, h); hLines(P, 164.8, 595.3, 23.5, 818.9, 22.73); },
  /* 22: caixa + grid à direita (cél ~17.83, inteira até a borda) */
  (P, w, h) => {
    P.sline(DIV, 18.3, DIV, 642.4); P.sline(164, 660.5, 595.3, 660.5);
    if(P.thumb){ gridArr(P, lat(164, 17.83, 25), lat(18.3, 17.83, 36), 17.83, 595.3); return; }
    gridArr(P, fillCells(164, 595.28, 17.83), fillCells(18.3, 660.5, 17.83), 17.83);
  },
  /* 23: caixa + grid à direita (cél ~22.73, inteira até a borda) */
  (P, w, h) => {
    P.sline(DIV, 22, DIV, 636.6); P.sline(164, 659, 595.3, 659);
    if(P.thumb){ gridArr(P, lat(164, 22.73, 19), lat(22.8, 22.73, 28), 22.73, 595.3); return; }
    gridArr(P, fillCells(164, 595.28, 22.73), fillCells(22.8, 659, 22.73), 22.73);
  },
  /* 24: grid altura total à direita (cél ~17.86) */
  (P, w, h) => {
    P.sline(164.4, 10.2, 164.4, 849.6);
    if(P.thumb){ gridArr(P, lat(164.4, 17.86, 25), lat(10.3, 17.86, 48), 17.86); return; }
    gridArr(P, fillCells(164.4, 595.28, 17.86), fillCells(10.3, 841.89, 17.86), 17.86);
  },
  /* 25: grid altura total à direita (cél ~22.73) */
  (P, w, h) => {
    P.sline(164.4, 11.6, 164.4, 853.4);
    if(P.thumb){ gridArr(P, lat(164.4, 22.73, 20), lat(12.3, 22.73, 38), 22.73); return; }
    gridArr(P, fillCells(164.4, 595.28, 22.73), fillCells(12.3, 841.89, 22.73), 22.73);
  },
  /* 26: caixa + dots à direita (25x38) */
  (P, w, h) => { P.sline(DIV, 0, DIV, 659); P.sline(0, BBOT, 595.3, BBOT); dotFill(P, 174.8, 586.9, 11.4, 646.8, 25, 38, 17.17); },
  /* 27: caixa + dots à direita (18x28) */
  (P, w, h) => { P.sline(DIV, 0, DIV, 659); P.sline(0, BBOT, 595.3, BBOT); dotFill(P, 185.7, 571.3, 22.5, 634.8, 18, 28, 22.68); },
  /* 28: divisória total + dots à direita (18x36) */
  (P, w, h) => { P.sline(DIV, 0, DIV, h); dotFill(P, 185.7, 571.3, 22.5, 816.2, 18, 36, 22.68); },
  /* 29: pautado esq. + grid dir. (cél ~17.86, mesma treliça dos dois lados) */
  (P, w, h) => {
    P.sline(162.3, 0, 162.3, 642.5); P.sline(162.3, 660.1, 591, 660.1);
    if(P.thumb){
      hLines(P, 0.1, 162.3, -0.7, 642.2, 17.86);
      gridArr(P, lat(162.3, 17.86, 25), lat(-0.7, 17.86, 37), 17.86);
      return;
    }
    const ys = fillCells(0, 660.1, 17.86), xs = fillCells(162.3, 595.28, 17.86);
    ys.forEach(y => { P.gline(0.1, y, 162.3, y); P.gline(162.3, y, xs[xs.length - 1], y); });
    xs.forEach(x => P.gline(x, 0, x, ys[ys.length - 1]));
  },
  /* 30: caixa + pautado esq. + dots dir. */
  (P, w, h) => {
    P.sline(DIV, 0, DIV, 659); P.sline(0, BBOT, 595.3, BBOT);
    hLines(P, 0, 163.3, 23.5, 637.1, 22.73);
    dotFill(P, 174.8, 586.9, 11.4, 646.8, 25, 38, 17.17);
  },
  /* 31-34: colunas */
  colLines([[0, 289.1], [306.1, 595.3]], 24.8, 818.5, GAP.S),
  colLines([[0, 181.4], [206.9, 388.3], [413.9, 595.3]], 24.8, 818.5, GAP.S),
  colLines([[0, 181.4], [206.9, 595.3]], 24.8, 818.5, GAP.S),
  colLines([[0, 388.3], [413.9, 595.3]], 24.8, 818.5, GAP.S),
  /* 35: grid página cheia (cél ~22.76, inteira de borda a borda) */
  (P, w, h) => {
    if(P.thumb){ gridArr(P, lat(-9.9, 22.76, 28), lat(-12, 22.76, 40), 22.76); return; }
    gridArr(P, fillCells(0, 595.28, 22.76), fillCells(0, 841.89, 22.76), 22.76);
  },
  /* 36: grid página cheia (cél ~26.4, inteira de borda a borda) */
  (P, w, h) => {
    if(P.thumb){ gridArr(P, [-15.2, 595.3], [-14.2, 857.7], 26.4); return; }
    gridArr(P, fillCells(0, 595.28, 26.36), fillCells(0, 841.89, 26.42), 26.4);
  },
  /* 37: grid página cheia (cél ~30.1, inteira de borda a borda) */
  (P, w, h) => {
    if(P.thumb){ gridArr(P, [-11.3].concat(lat(11.4, 30.1, 21)), lat(-16.3, 30.1, 31), 30.1); return; }
    gridArr(P, fillCells(0, 595.28, 30.1), fillCells(0, 841.89, 30.1), 30.1);
  },
  /* 38-39: dots página cheia */
  (P, w, h) => dotFill(P, 7.8, 586.1, 10, 826.4, 35, 49, 17.01),
  (P, w, h) => dotFill(P, 12.8, 579.7, 10, 826.4, 26, 37, 22.68),
  /* 40: pautado + faixa central */
  (P, w, h) => {
    hLines(P, 0, w, 23.5, 818.8, 24.1);
    P.sline(0, 91.7, w, 91.7); P.sline(0, 705.2, w, 705.2); P.sline(164, 92.4, 164, 704.4);
  },
  /* 41: duas colunas + margens */
  (P, w, h) => {
    hLines(P, 0, 289.1, 24.8, 818.5, GAP.S); hLines(P, 306.1, 595.3, 24.8, 818.5, GAP.S);
    P.sline(45.5, 0, 45.5, h); P.sline(351.7, 0, 351.7, h);
  },
  /* 42-46: quadros */
  (P, w, h) => { P.line(0, 421.3, w, 421.3); P.line(297.6, 0, 297.6, h); },
  (P, w, h) => { P.line(0, 281.1, w, 281.1); P.line(0, 561.5, w, 561.5); P.line(297.6, 0, 297.6, h); },
  (P, w, h) => { [211.0, 421.3, 631.6].forEach(y => P.line(0, y, w, y)); P.line(297.6, 0, 297.6, h); },
  (P, w, h) => {
    for(let k = 0; k < 6; k++) P.line(0, 120.2 + k * 120.16, w, 120.2 + k * 120.16);
    [118.9, 237.8, 356.7, 475.6].forEach(x => P.line(x, 0, x, h));
  },
  (P, w, h) => { for(let k = 0; k < 6; k++) P.line(0, 120.2 + k * 120.16, w, 120.2 + k * 120.16); },
  /* 47-48: caixas arredondadas */
  (P, w, h) => [[21.2, 20.3], [305.3, 20.3], [21.2, 429.3], [305.3, 429.3]]
    .forEach(([x, y]) => P.rrect(x, y, 268.8, 393.7, 12)),
  (P, w, h) => [20.3, 224.8, 429.3, 633.9].forEach(y =>
    [21.2, 305.3].forEach(x => P.rrect(x, y, 268.8, 189.2, 12))),
  /* 49: pautado esq. + divisória + dots dir. */
  (P, w, h) => {
    hLines(P, 0, 296.9, 24.8, 818.5, GAP.S); P.sline(297.6, 0, 297.6, h);
    dotFill(P, 309.7, 581.8, 10, 826.4, 17, 49, 17.0);
  },
  /* 50: pautado esq. + divisória */
  (P, w, h) => { hLines(P, 0, 296.9, 24.8, 818.5, GAP.S); P.sline(297.6, 0, 297.6, h); },
  /* 51: pautado esq. + grid dir. (cél ~22.6, inteira, sem corte) */
  (P, w, h) => {
    if(P.thumb){
      P.sline(162.4, 21.5, 162.4, 838.9);
      hLines(P, 0.6, 161.5, -1.2, 861.6, 22.71);
      gridArr(P, [163.5, 590.2], [-1.2, 861.6], 22.46);
      return;
    }
    P.sline(162.4, 0, 162.4, 841.89);
    const ys = fillCells(0, 841.89, 22.71), xs = fillCells(163.5, 595.28, 22.55);
    ys.forEach(y => {
      P.gline(0.6, y, 161.5, y);
      P.gline(163.5, y, xs[xs.length - 1], y);
    });
    xs.slice(1).forEach(x => P.gline(x, 0, x, ys[ys.length - 1]));
  },
  /* 52: divisória + pautado dir. + verticais finas */
  (P, w, h) => {
    P.sline(297.6, 0, 297.6, h);
    hLines(P, 298.4, 595.3, 24.8, 818.5, GAP.S);
    if(P.thumb){ eachV(P, 298.4, 595.3, 22.7, tgGrid(22.7), x => P.line(x, 0, x, h)); return; }
    for(let k = 0; k < 13; k++) P.line(320.2 + k * ((592.9 - 320.2) / 12), 0, 320.2 + k * ((592.9 - 320.2) / 12), h);
  },
  /* 53-55: checklists */
  checklist([[14.8, 32.2, 289.1], [306.9, 324.3, 581.2]], 31),
  checklist([[14.8, 32.2, 289.1], [306.9, 324.3, 581.2]], 30),
  checklist([[14.8, 32.2, 581.2]], 31),
  /* 56: cabeçalho + pautado + margem */
  withHead(TOPIC, (P, w, h) => { hLines(P, 0, w, 70.2, 819.2, 22.7); P.sline(94.2, 71, 94.2, h); }),
  /* 57: cabeçalho + grid (cél ~22.77, inteira de borda a borda) */
  withHead(TOPIC, (P, w, h) => {
    if(P.thumb){ gridArr(P, lat(-32.7, 22.78, 29), lat(68.3, 22.73, 35), 22.75); return; }
    gridArr(P, fillCells(0, 595.28, 22.78), fillCells(68.3, 841.89, 22.73), 22.75);
  }),
  /* 58: cabeçalho + grid (cél ~30.05, inteira de borda a borda) */
  withHead(TOPIC, (P, w, h) => {
    if(P.thumb){ gridArr(P, lat(-17.65, 30.05, 21), lat(61.1, 30.05, 27), 30.05); return; }
    gridArr(P, fillCells(0, 595.28, 30.05), fillCells(61.1, 841.89, 30.05), 30.05);
  }),
  /* 59: cabeçalho + duas colunas */
  withHead(TOPIC, (P, w, h) => {
    hLines(P, 0, 289.1, 70.2, 818.5, GAP.S); hLines(P, 306.1, 595.3, 70.2, 818.5, GAP.S);
  }),
  /* 60: cabeçalho + pautado */
  withHead(TOPIC, (P, w, h) => hLines(P, 0, w, 70.2, 819.2, GAP.S)),
  /* 61-62: cabeçalho + dots */
  withHead(TOPIC, (P, w, h) => dotFill(P, 7.4, 585.7, 61.8, 827.1, 35, 46, 17.0)),
  withHead(TOPIC, (P, w, h) => dotFill(P, 13.7, 580.7, 57.5, 828.5, 26, 35, 22.68)),
  /* 63: cabeçalho (reunião) + pautado + margem */
  withHead(MEET, (P, w, h) => { hLines(P, 0, w, 70.2, 819.2, 22.7); P.sline(94.2, 71, 94.2, h); }),
];
