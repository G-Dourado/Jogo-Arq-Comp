// ===============================================================
// Utilidades e progresso (salvo no navegador com localStorage)
// ===============================================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const CHAVE = "arqcomp-estudo-v1";

function carregarProgresso() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE));
    if (dados) return dados;
  } catch (e) { /* ignora dados corrompidos */ }
  return { caixas: {}, quizzes: [], associacoes: [], cruzadinhas: [] };
}

let progresso = carregarProgresso();

function salvarProgresso() {
  localStorage.setItem(CHAVE, JSON.stringify(progresso));
}

// "caixa" de domínio de 0 (não sabe) a 3 (domina)
function caixa(id) {
  return progresso.caixas[id] || 0;
}

function setCaixa(id, valor) {
  progresso.caixas[id] = Math.max(0, Math.min(3, valor));
  salvarProgresso();
}

function embaralhar(lista) {
  const copia = lista.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// termos menos dominados primeiro (repetição espaçada simplificada)
function ordenarPorDominio(lista) {
  return embaralhar(lista).sort((a, b) => caixa(a.id) - caixa(b.id));
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

// ===============================================================
// Navegação entre telas
// ===============================================================
const renderizadores = {};
const montadas = {};
// telas que sempre são redesenhadas ao abrir (dados mudam com o uso)
const sempreAtualizar = ["inicio", "glossario", "cartoes", "quiz", "progresso"];

function mostrar(tela) {
  document.querySelectorAll(".tela").forEach(s => s.classList.toggle("ativa", s.id === tela));
  document.querySelectorAll("#menu button").forEach(b => b.classList.toggle("ativo", b.dataset.tela === tela));
  if (sempreAtualizar.includes(tela) || !montadas[tela]) {
    renderizadores[tela]();
    montadas[tela] = true;
  }
  window.scrollTo(0, 0);
}

document.addEventListener("click", e => {
  const alvo = e.target.closest("[data-tela]");
  if (alvo) mostrar(alvo.dataset.tela);
});

// ===============================================================
// Início
// ===============================================================
function cartaoMenu(tela, icone, titulo, texto) {
  return `<button class="card" data-tela="${tela}">
    <span class="icone">${icone}</span><strong>${titulo}</strong><span>${texto}</span>
  </button>`;
}

renderizadores.inicio = function () {
  const dominados = TERMOS.filter(t => caixa(t.id) >= 3).length;
  $("#inicio").innerHTML = `
    <h2>O que você quer estudar hoje?</h2>
    <div class="cards">
      ${cartaoMenu("glossario", "📖", "Glossário", "Leia cada termo com a explicação completa.")}
      ${cartaoMenu("cartoes", "🃏", "Cartões de estudo", "Tente lembrar antes de ver a resposta. Os termos difíceis voltam mais vezes.")}
      ${cartaoMenu("quiz", "✅", "Quiz", "Perguntas de múltipla escolha, com explicação em cada resposta.")}
      ${cartaoMenu("cruzadinha", "🔤", "Cruzadinha", "Preencha o tabuleiro lendo as pistas.")}
      ${cartaoMenu("associacao", "🔗", "Associação", "Ligue cada pista ao termo correto.")}
      ${cartaoMenu("progresso", "📊", "Meu progresso", "Veja o que já domina e o que precisa revisar.")}
    </div>
    <p class="resumo">Termos dominados: <strong>${dominados}</strong> de ${TERMOS.length}</p>`;
};

// ===============================================================
// Glossário
// ===============================================================
renderizadores.glossario = function () {
  const sec = $("#glossario");
  sec.innerHTML = `
    <h2>Glossário</h2>
    <input id="busca" type="search" placeholder="Buscar termo ou explicação...">
    <div id="lista-glossario"></div>`;

  const desenhar = filtro => {
    const f = filtro.trim().toLowerCase();
    const filtrados = TERMOS.filter(t =>
      !f || t.nome.toLowerCase().includes(f) || t.definicao.toLowerCase().includes(f) || t.pista.toLowerCase().includes(f)
    );
    $("#lista-glossario").innerHTML = filtrados.map(t => `
      <article class="termo">
        <h3>${t.nome}</h3>
        <p>${t.definicao}</p>
        <span class="badge">Domínio ${caixa(t.id)}/3</span>
      </article>`).join("") || "<p>Nenhum termo encontrado.</p>";
  };

  desenhar("");
  $("#busca").addEventListener("input", e => desenhar(e.target.value));
};

// ===============================================================
// Cartões de estudo (lembrar antes de ver a resposta)
// ===============================================================
let sessaoCartoes = null;

function novaSessaoCartoes() {
  return {
    fila: ordenarPorDominio(TERMOS).map(t => t.id),
    jaVistos: [],
    feitos: 0,
    acertos: 0,
    mostrando: false
  };
}

renderizadores.cartoes = function () {
  const sec = $("#cartoes");
  if (!sessaoCartoes) sessaoCartoes = novaSessaoCartoes();
  const s = sessaoCartoes;

  if (s.fila.length === 0) {
    sec.innerHTML = `
      <h2>Cartões de estudo</h2>
      <div class="resultado">
        <p>Rodada concluída. Na primeira vez que viu cada termo, você lembrou de <strong>${s.acertos}</strong> de <strong>${s.feitos}</strong>.</p>
        <button class="btn" id="cart-nova">Nova rodada</button>
      </div>`;
    $("#cart-nova").addEventListener("click", () => {
      sessaoCartoes = null;
      renderizadores.cartoes();
    });
    return;
  }

  const t = TERMOS.find(x => x.id === s.fila[0]);
  sec.innerHTML = `
    <h2>Cartões de estudo</h2>
    <p class="progressoTxt">Restantes nesta rodada: ${s.fila.length} · Domínio deste termo: ${caixa(t.id)}/3</p>
    <div class="cartao ${s.mostrando ? "virado" : ""}">
      <p class="frente">${t.pista}</p>
      ${s.mostrando ? `<div class="verso"><h3>${t.nome}</h3><p>${t.definicao}</p></div>` : ""}
    </div>
    <div class="acoes">
      ${s.mostrando
        ? `<button class="btn erro" id="cart-errei">Errei</button>
           <button class="btn ok" id="cart-acertei">Acertei</button>`
        : `<button class="btn" id="cart-mostrar">Mostrar resposta</button>`}
    </div>
    <p class="dica" style="text-align:center">Tente responder em voz alta antes de mostrar a resposta.</p>`;

  if (!s.mostrando) {
    $("#cart-mostrar").addEventListener("click", () => {
      s.mostrando = true;
      renderizadores.cartoes();
    });
    return;
  }

  const primeiraVez = !s.jaVistos.includes(t.id);
  const registrar = acertou => {
    if (primeiraVez) {
      s.jaVistos.push(t.id);
      s.feitos++;
      if (acertou) s.acertos++;
    }
  };

  $("#cart-acertei").addEventListener("click", () => {
    registrar(true);
    setCaixa(t.id, caixa(t.id) + 1);
    s.fila.shift();
    s.mostrando = false;
    renderizadores.cartoes();
  });

  $("#cart-errei").addEventListener("click", () => {
    registrar(false);
    setCaixa(t.id, 0);
    // o termo volta para o fim da fila, para ser revisto nesta mesma rodada
    s.fila.push(s.fila.shift());
    s.mostrando = false;
    renderizadores.cartoes();
  });
};

// ===============================================================
// Quiz (múltipla escolha, com explicação e revisão dos erros)
// ===============================================================
let quiz = null;

renderizadores.quiz = function () {
  const sec = $("#quiz");
  if (!quiz) {
    sec.innerHTML = `
      <h2>Quiz</h2>
      <div class="quiz-config">
        <fieldset>
          <legend>Como quer ser perguntado?</legend>
          <label><input type="radio" name="modo" value="pista" checked> Ler a pista e escolher o termo</label>
          <label><input type="radio" name="modo" value="definicao"> Ler o termo e escolher a definição</label>
        </fieldset>
        <fieldset>
          <legend>Quantas perguntas?</legend>
          <label><input type="radio" name="qtd" value="5"> 5</label>
          <label><input type="radio" name="qtd" value="10" checked> 10</label>
          <label><input type="radio" name="qtd" value="16"> Todas (16)</label>
        </fieldset>
        <button class="btn" id="quiz-comecar">Começar</button>
      </div>`;
    $("#quiz-comecar").addEventListener("click", () => {
      const modo = document.querySelector('input[name="modo"]:checked').value;
      const qtd = Number(document.querySelector('input[name="qtd"]:checked').value);
      iniciarQuiz(modo, qtd);
    });
    return;
  }

  if (quiz.i >= quiz.perguntas.length) {
    if (!quiz.salvo) {
      progresso.quizzes.push({ data: hoje(), acertos: quiz.acertos, total: quiz.perguntas.length });
      salvarProgresso();
      quiz.salvo = true;
    }
    const lista = quiz.erros.length
      ? `<h3>Revise estes termos</h3><ul>${quiz.erros.map(e =>
          `<li><strong>${e.certo}</strong>: ${e.definicao}</li>`).join("")}</ul>`
      : "<p>Nenhum erro. Excelente!</p>";
    sec.innerHTML = `
      <h2>Resultado</h2>
      <div class="resultado">
        <p style="font-size:1.3rem"><strong>${quiz.acertos}</strong> de <strong>${quiz.perguntas.length}</strong> corretas</p>
        ${lista}
        <div class="acoes">
          <button class="btn" id="quiz-novo">Novo quiz</button>
          <button class="btn sec" data-tela="cartoes">Estudar com cartões</button>
        </div>
      </div>`;
    $("#quiz-novo").addEventListener("click", () => {
      quiz = null;
      renderizadores.quiz();
    });
    return;
  }

  const p = quiz.perguntas[quiz.i];
  const n = quiz.perguntas.length;
  const ehPista = p.modo === "pista";
  const enunciado = ehPista ? p.alvo.pista : p.alvo.nome;
  const rotulo = op => (ehPista ? op.nome : op.definicao);
  const titulo = ehPista ? "Qual termo corresponde a esta pista?" : "Qual definição corresponde a este termo?";
  const respondida = quiz.respondida !== null;

  sec.innerHTML = `
    <p class="contagem">Pergunta ${quiz.i + 1} de ${n} · Acertos: ${quiz.acertos}</p>
    <div class="barra"><div style="width:${(quiz.i / n) * 100}%"></div></div>
    <div class="pergunta">
      <p style="margin:0;color:var(--cinza)">${titulo}</p>
      <p class="enunciado">${enunciado}</p>
      <div class="opcoes">
        ${p.opcoes.map((op, k) => `
          <button class="opcao ${respondida && op.id === p.alvo.id ? "certa" : ""}
            ${respondida && k === quiz.escolha && op.id !== p.alvo.id ? "errada" : ""}"
            data-k="${k}" ${respondida ? "disabled" : ""}>${rotulo(op)}</button>`).join("")}
      </div>
      ${respondida ? `
        <p class="explicacao"><strong>${p.alvo.nome}:</strong> ${p.alvo.definicao}</p>
        <div class="acoes"><button class="btn" id="quiz-proxima">${quiz.i + 1 < n ? "Próxima" : "Ver resultado"}</button></div>`
        : ""}
    </div>`;

  if (!respondida) {
    sec.querySelectorAll(".opcao").forEach(b => {
      b.addEventListener("click", () => responderQuiz(Number(b.dataset.k)));
    });
  } else {
    $("#quiz-proxima").addEventListener("click", () => {
      quiz.i++;
      quiz.respondida = null;
      renderizadores.quiz();
    });
  }
};

function iniciarQuiz(modo, qtd) {
  const escolhidos = ordenarPorDominio(TERMOS).slice(0, qtd);
  const perguntas = escolhidos.map(t => {
    const distratores = embaralhar(TERMOS.filter(x => x.id !== t.id)).slice(0, 3);
    return { alvo: t, opcoes: embaralhar([t, ...distratores]), modo };
  });
  quiz = { perguntas, i: 0, acertos: 0, erros: [], respondida: null, escolha: null, salvo: false };
  renderizadores.quiz();
}

function responderQuiz(k) {
  const p = quiz.perguntas[quiz.i];
  const escolhida = p.opcoes[k];
  const acertou = escolhida.id === p.alvo.id;
  quiz.respondida = acertou;
  quiz.escolha = k;

  if (acertou) {
    quiz.acertos++;
    setCaixa(p.alvo.id, caixa(p.alvo.id) + 1);
  } else {
    setCaixa(p.alvo.id, 0);
    quiz.erros.push({ certo: p.alvo.nome, definicao: p.alvo.definicao });
  }
  renderizadores.quiz();
}

// ===============================================================
// Cruzadinha (layout gerado automaticamente a partir dos termos)
// ===============================================================
function tentarLayout(palavras) {
  const grade = new Map();   // "linha,coluna" -> { letra, dirs, r, c }
  const colocadas = [];
  const chave = (r, c) => r + "," + c;

  function podeColocar(p, r, c, dir) {
    const dr = dir === "V" ? 1 : 0;
    const dc = dir === "H" ? 1 : 0;
    const n = p.resposta.length;

    if (grade.has(chave(r - dr, c - dc)) || grade.has(chave(r + dr * n, c + dc * n))) return false;

    let cruzamentos = 0;
    for (let k = 0; k < n; k++) {
      const rr = r + dr * k;
      const cc = c + dc * k;
      const existente = grade.get(chave(rr, cc));
      if (existente) {
        if (existente.letra !== p.resposta[k]) return false;
        if (existente.dirs.includes(dir)) return false;
        cruzamentos++;
      } else if (grade.has(chave(rr + dc, cc + dr)) || grade.has(chave(rr - dc, cc - dr))) {
        return false;
      }
    }
    return cruzamentos >= 1;
  }

  function colocar(p, r, c, dir) {
    const dr = dir === "V" ? 1 : 0;
    const dc = dir === "H" ? 1 : 0;
    for (let k = 0; k < p.resposta.length; k++) {
      const rr = r + dr * k;
      const cc = c + dc * k;
      const existente = grade.get(chave(rr, cc));
      if (existente) existente.dirs.push(dir);
      else grade.set(chave(rr, cc), { letra: p.resposta[k], dirs: [dir], r: rr, c: cc });
    }
    colocadas.push({ resposta: p.resposta, pista: p.pista, r, c, dir });
  }

  const ordem = palavras.slice().sort((a, b) => b.resposta.length - a.resposta.length || Math.random() - 0.5);
  colocar(ordem[0], 0, 0, "H");

  for (const p of ordem.slice(1)) {
    const candidatos = [];
    for (const cel of grade.values()) {
      for (let i = 0; i < p.resposta.length; i++) {
        if (p.resposta[i] !== cel.letra) continue;
        if (podeColocar(p, cel.r, cel.c - i, "H")) candidatos.push({ p, r: cel.r, c: cel.c - i, dir: "H" });
        if (podeColocar(p, cel.r - i, cel.c, "V")) candidatos.push({ p, r: cel.r - i, c: cel.c, dir: "V" });
      }
    }
    if (candidatos.length > 0) {
      const e = candidatos[Math.floor(Math.random() * candidatos.length)];
      colocar(e.p, e.r, e.c, e.dir);
    }
  }
  return { colocadas, grade };
}

function gerarLayout(palavras) {
  let melhor = null;
  for (let t = 0; t < 400; t++) {
    const atual = tentarLayout(palavras);
    if (!melhor || atual.colocadas.length > melhor.colocadas.length) melhor = atual;
    if (melhor.colocadas.length >= 14) break;
  }
  return melhor;
}

function criarCruzadinha() {
  const { colocadas, grade } = gerarLayout(TERMOS.map(t => ({ resposta: t.resposta, pista: t.pista })));

  let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
  for (const cel of grade.values()) {
    minR = Math.min(minR, cel.r); maxR = Math.max(maxR, cel.r);
    minC = Math.min(minC, cel.c); maxC = Math.max(maxC, cel.c);
  }
  const linhas = maxR - minR + 1;
  const colunas = maxC - minC + 1;

  const letras = Array.from({ length: linhas }, () => Array(colunas).fill(null));
  for (const cel of grade.values()) letras[cel.r - minR][cel.c - minC] = cel.letra;

  for (const p of colocadas) { p.lr = p.r - minR; p.lc = p.c - minC; }

  const inicios = colocadas.map(p => [p.lr, p.lc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const numeroDe = new Map();
  let n = 0;
  for (const [r, c] of inicios) {
    const k = r + "," + c;
    if (!numeroDe.has(k)) numeroDe.set(k, ++n);
  }
  for (const p of colocadas) p.numero = numeroDe.get(p.lr + "," + p.lc);

  return { linhas, colunas, letras, numeroDe, colocadas, inputs: [], celulas: [] };
}

function desenharTabuleiro() {
  const tab = $("#cruz-tab");
  tab.innerHTML = "";
  tab.style.gridTemplateColumns = `repeat(${cruz.colunas}, var(--tam))`;
  cruz.inputs = [];
  cruz.celulas = [];

  const existe = (r, c) =>
    r >= 0 && r < cruz.linhas && c >= 0 && c < cruz.colunas && cruz.inputs[r][c] !== null;
  const focar = (r, c) => { if (existe(r, c)) cruz.inputs[r][c].focus(); };

  for (let r = 0; r < cruz.linhas; r++) {
    cruz.inputs[r] = [];
    cruz.celulas[r] = [];
    for (let c = 0; c < cruz.colunas; c++) {
      const div = document.createElement("div");
      if (cruz.letras[r][c]) {
        div.className = "celula";
        const num = cruz.numeroDe.get(r + "," + c);
        if (num) {
          const s = document.createElement("span");
          s.className = "numero";
          s.textContent = num;
          div.appendChild(s);
        }
        const inp = document.createElement("input");
        inp.type = "text";
        inp.maxLength = 1;
        inp.autocomplete = "off";
        inp.setAttribute("aria-label", `linha ${r + 1}, coluna ${c + 1}`);
        inp.addEventListener("input", () => {
          inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
          if (inp.value) {
            if (existe(r, c + 1)) focar(r, c + 1);
            else if (existe(r + 1, c)) focar(r + 1, c);
          }
        });
        inp.addEventListener("keydown", e => {
          const mov = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
          if (mov) { e.preventDefault(); focar(r + mov[0], c + mov[1]); return; }
          if (e.key === "Backspace" && inp.value === "") {
            e.preventDefault();
            if (existe(r, c - 1)) { cruz.inputs[r][c - 1].value = ""; focar(r, c - 1); }
            else if (existe(r - 1, c)) { cruz.inputs[r - 1][c].value = ""; focar(r - 1, c); }
          }
        });
        div.appendChild(inp);
        cruz.inputs[r][c] = inp;
      } else {
        div.className = "vazia";
        cruz.inputs[r][c] = null;
      }
      cruz.celulas[r][c] = div;
      tab.appendChild(div);
    }
  }

  const listaH = $("#cruz-h");
  const listaV = $("#cruz-v");
  listaH.innerHTML = "";
  listaV.innerHTML = "";
  for (const p of cruz.colocadas.slice().sort((a, b) => a.numero - b.numero)) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="num">${p.numero}.</span>`;
    li.appendChild(document.createTextNode(p.pista));
    li.addEventListener("click", () => focar(p.lr, p.lc));
    p.li = li;
    (p.dir === "H" ? listaH : listaV).appendChild(li);
  }
  atualizarContadorCruz(null);
}

function focar(r, c) {
  if (r >= 0 && r < cruz.linhas && c >= 0 && c < cruz.colunas && cruz.inputs[r][c]) {
    cruz.inputs[r][c].focus();
  }
}

function atualizarContadorCruz(acertos) {
  const total = cruz.colocadas.length;
  $("#cruz-contador").textContent = acertos === null
    ? `0 de ${total} palavras`
    : `${acertos} de ${total} palavras`;
}

function limparMarcasCruz() {
  cruz.celulas.forEach(linha => linha && linha.forEach(d => d && d.classList.remove("certa", "errada")));
  cruz.colocadas.forEach(p => p.li && p.li.classList.remove("certa", "errada"));
}

function conferirCruz() {
  limparMarcasCruz();
  const statusCasa = new Map();
  let acertos = 0;

  for (const p of cruz.colocadas) {
    const dr = p.dir === "V" ? 1 : 0;
    const dc = p.dir === "H" ? 1 : 0;
    let escrito = "";
    const casas = [];
    for (let k = 0; k < p.resposta.length; k++) {
      const rr = p.lr + dr * k;
      const cc = p.lc + dc * k;
      escrito += cruz.inputs[rr][cc].value;
      casas.push([rr, cc]);
    }
    const certa = escrito === p.resposta;
    if (certa) acertos++;
    p.li.classList.add(certa ? "certa" : "errada");
    for (const [rr, cc] of casas) {
      const k = rr + "," + cc;
      if (!certa) statusCasa.set(k, "errada");
      else if (!statusCasa.has(k)) statusCasa.set(k, "certa");
    }
  }

  for (const [k, status] of statusCasa) {
    const [r, c] = k.split(",").map(Number);
    cruz.celulas[r][c].classList.add(status);
  }

  progresso.cruzadinhas.push({ data: hoje(), acertos, total: cruz.colocadas.length });
  salvarProgresso();
  atualizarContadorCruz(acertos);
}

let cruz = null;

renderizadores.cruzadinha = function () {
  const sec = $("#cruzadinha");
  sec.innerHTML = `
    <h2>Cruzadinha</h2>
    <p class="dica">Digite as letras nas casas. Use as setas para se mover e clique numa pista para ir até a palavra.</p>
    <div class="cruz-wrap">
      <div id="cruz-tab"></div>
      <div class="cruz-pistas">
        <div><h3>Horizontais</h3><ol id="cruz-h"></ol></div>
        <div><h3>Verticais</h3><ol id="cruz-v"></ol></div>
      </div>
    </div>
    <div class="acoes">
      <button class="btn" id="cruz-conferir">Conferir</button>
      <button class="btn sec" id="cruz-reiniciar">Reiniciar</button>
      <button class="btn sec" id="cruz-novo">Novo tabuleiro</button>
      <span id="cruz-contador" class="contador"></span>
    </div>`;

  cruz = criarCruzadinha();
  desenharTabuleiro();

  $("#cruz-conferir").addEventListener("click", conferirCruz);
  $("#cruz-reiniciar").addEventListener("click", () => {
    cruz.inputs.forEach(linha => linha && linha.forEach(i => { if (i) i.value = ""; }));
    limparMarcasCruz();
    atualizarContadorCruz(null);
  });
  $("#cruz-novo").addEventListener("click", () => {
    cruz = criarCruzadinha();
    desenharTabuleiro();
  });
};

// ===============================================================
// Associação (ligar pista ao termo)
// ===============================================================
let assoc = null;

function novaRodadaAssoc() {
  const pares = embaralhar(TERMOS).slice(0, 6);
  return {
    pares,
    esquerda: embaralhar(pares.map(t => t.id)),
    direita: embaralhar(pares.map(t => t.id)),
    selecionadaE: null,
    feitos: [],
    erros: 0,
    piscando: null,
    salvo: false
  };
}

renderizadores.associacao = function () {
  const sec = $("#associacao");
  sec.innerHTML = `
    <h2>Associação</h2>
    <p class="dica">Clique numa pista e depois no termo correspondente.</p>
    <div class="assoc">
      <div id="assoc-e"></div>
      <div id="assoc-d"></div>
    </div>
    <div class="acoes">
      <span>Erros: <strong id="assoc-erros">0</strong></span>
      <button class="btn sec" id="assoc-nova">Nova rodada</button>
    </div>
    <div id="assoc-resultado"></div>`;
  if (!assoc) assoc = novaRodadaAssoc();
  desenharAssoc();
  $("#assoc-nova").addEventListener("click", () => {
    assoc = novaRodadaAssoc();
    renderizadores.associacao();
  });
};

function desenharAssoc() {
  const termo = id => TERMOS.find(t => t.id === id);
  const e = $("#assoc-e");
  const d = $("#assoc-d");
  e.innerHTML = assoc.esquerda.map(id => {
    const feito = assoc.feitos.includes(id);
    const sel = assoc.selecionadaE === id;
    return `<button data-id="${id}" class="${feito ? "feito" : ""} ${sel ? "selecionado" : ""}" ${feito ? "disabled" : ""}>${termo(id).pista}</button>`;
  }).join("");
  d.innerHTML = assoc.direita.map(id => {
    const feito = assoc.feitos.includes(id);
    const errado = assoc.piscando === id;
    return `<button data-id="${id}" class="${feito ? "feito" : ""} ${errado ? "errado" : ""}" ${feito ? "disabled" : ""}>${termo(id).nome}</button>`;
  }).join("");
  $("#assoc-erros").textContent = assoc.erros;

  e.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    assoc.selecionadaE = b.dataset.id;
    desenharAssoc();
  }));

  d.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    if (!assoc.selecionadaE) return;
    const id = b.dataset.id;
    if (id === assoc.selecionadaE) {
      assoc.feitos.push(id);
      assoc.selecionadaE = null;
      setCaixaSeMenor(id);
      if (assoc.feitos.length === assoc.pares.length) concluirAssoc();
      desenharAssoc();
    } else {
      assoc.erros++;
      assoc.piscando = id;
      assoc.selecionadaE = null;
      desenharAssoc();
      setTimeout(() => { assoc.piscando = null; desenharAssoc(); }, 600);
    }
  }));
}

function setCaixaSeMenor(id) {
  // acerto na associação conta como um pequeno reforço
  if (caixa(id) < 2) setCaixa(id, caixa(id) + 1);
}

function concluirAssoc() {
  if (!assoc.salvo) {
    progresso.associacoes.push({ data: hoje(), erros: assoc.erros });
    salvarProgresso();
    assoc.salvo = true;
  }
  $("#assoc-resultado").innerHTML = `
    <div class="resultado" style="margin-top:16px">
      <p>Concluído com <strong>${assoc.erros}</strong> erro(s).</p>
    </div>`;
}

// ===============================================================
// Progresso
// ===============================================================
renderizadores.progresso = function () {
  const sec = $("#progresso");
  const dominados = TERMOS.filter(t => caixa(t.id) >= 3);
  const revisar = TERMOS.filter(t => caixa(t.id) < 2);
  const quizzes = progresso.quizzes;
  const mediaQuiz = quizzes.length
    ? Math.round(quizzes.reduce((s, q) => s + q.acertos / q.total, 0) / quizzes.length * 100)
    : null;
  const ultimaCruz = progresso.cruzadinhas.slice(-1)[0];
  const ultimaAssoc = progresso.associacoes.slice(-1)[0];

  sec.innerHTML = `
    <h2>Meu progresso</h2>
    <div class="stats">
      <div class="stat"><strong>${dominados.length}/${TERMOS.length}</strong><span>termos dominados</span></div>
      <div class="stat"><strong>${mediaQuiz === null ? "-" : mediaQuiz + "%"}</strong><span>média nos quizzes</span></div>
      <div class="stat"><strong>${quizzes.length}</strong><span>quizzes feitos</span></div>
      <div class="stat"><strong>${ultimaCruz ? ultimaCruz.acertos + "/" + ultimaCruz.total : "-"}</strong><span>última cruzadinha</span></div>
      <div class="stat"><strong>${ultimaAssoc ? ultimaAssoc.erros : "-"}</strong><span>erros na última associação</span></div>
    </div>

    <div class="bloco">
      <h3>Termos para revisar</h3>
      ${revisar.length
        ? `<ul>${revisar.map(t => `<li>${t.nome} (domínio ${caixa(t.id)}/3)</li>`).join("")}</ul>
           <p class="dica">Use os Cartões de estudo para trabalhar esses termos.</p>`
        : "<p>Nenhum termo pendente. Muito bom!</p>"}
    </div>

    <div class="bloco">
      <h3>Últimos quizzes</h3>
      ${quizzes.length
        ? `<ul>${quizzes.slice(-5).reverse().map(q => `<li>${q.data}: ${q.acertos} de ${q.total}</li>`).join("")}</ul>`
        : "<p>Você ainda não fez nenhum quiz.</p>"}
    </div>

    <div class="acoes">
      <button class="btn perigo" id="zerar">Zerar progresso</button>
    </div>`;

  $("#zerar").addEventListener("click", () => {
    if (!confirm("Apagar todo o progresso salvo neste navegador?")) return;
    localStorage.removeItem(CHAVE);
    progresso = carregarProgresso();
    sessaoCartoes = null;
    quiz = null;
    assoc = null;
    renderizadores.progresso();
  });
};

// ===============================================================
// Início da aplicação
// ===============================================================
mostrar("inicio");
