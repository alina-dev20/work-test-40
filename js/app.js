/* ============ СОСТОЯНИЕ ============ */
const LET = "АБВГДЕЖЗ";
const LS_KEY = "trenazher-rabota-v1";

let saved = {};
try { saved = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch(e){ saved = {}; }

let S = {
  screen:"home",
  shuffle: !!saved.shuffle,
  instant: saved.instant !== false,
  doneScores: saved.doneScores || {},
  testIdx:0, list:[], i:0, res:[], tmp:null, custom:null, customTitle:""
};

function persist(){
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({
      shuffle:S.shuffle, instant:S.instant, doneScores:S.doneScores
    }));
  } catch(e){}
}

const app = document.getElementById("app");
const bar = document.getElementById("bar");
const lightbox = document.getElementById("lightbox");

const parse = q => q.a.map((t,k) => ({t, c: k === q.c ? 1 : 0}));
const shuf = a => {const b=a.slice(); for(let i=b.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[b[i],b[j]]=[b[j],b[i]];} return b;};
const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;");

/* лайтбокс для картинок */
function zoom(src){
  lightbox.innerHTML = `<img src="${src}" alt="">`;
  lightbox.hidden = false;
}
lightbox.onclick = () => { lightbox.hidden = true; lightbox.innerHTML = ""; };
document.addEventListener("keydown", e => { if (e.key === "Escape") lightbox.onclick(); });

function build(list){
  S.list = (S.shuffle ? shuf(list) : list).map(q => {
    const opts = parse(q);
    return {...q, opts: S.shuffle ? shuf(opts) : opts};
  });
  S.i = 0; S.res = S.list.map(() => null); S.tmp = null;
  S.screen = "quiz"; render();
}
function startTest(k){ S.testIdx = k; S.custom = null;
  build(Q.filter(q => q.n >= TESTS[k].from && q.n <= TESTS[k].to)); }

/* ============ ЭКРАНЫ ============ */
function render(){ window.scrollTo(0,0);
  ({home:home, quiz:quiz, result:result})[S.screen](); }

function home(){
  const done = S.doneScores;
  app.innerHTML = `
    <p class="eyebrow">Подготовка · тестирование при трудоустройстве</p>
    <h1>Тренажёр: 40 вопросов для подготовки к тестированию</h1>
    <p class="lede">Четыре тематических блока — от русского языка до строительного надзора. Версия вопросов: ноябрь 2025. Отвечайте, проверка сразу после каждого ответа, разбор ошибок в конце.</p>
    <div class="grid two">
      ${TESTS.map((t,k)=>{
        const sc = done[k];
        const cls = sc ? (sc.p>=70?"good":"bad") : "";
        return `<button class="tcard" data-t="${k}">
          ${sc?`<span class="score ${cls}">${sc.c}/${sc.n}</span>`:""}
          <span class="num">Блок ${k+1} · ${t.to-t.from+1} вопросов</span>
          <div class="ttl">${t.title}</div>
          <div class="sub">${t.sub}</div>
        </button>`;
      }).join("")}
    </div>
    <div class="sechead">Режим</div>
    <div class="setting ${S.instant?"on":""}" id="s-instant">
      <div class="txt"><b>Проверять сразу</b><span>Ответ подсвечивается зелёным или красным сразу после выбора</span></div>
      <div class="switch"></div>
    </div>
    <div class="setting ${S.shuffle?"on":""}" id="s-shuffle">
      <div class="txt"><b>Перемешивать</b><span>Вопросы и варианты идут в случайном порядке</span></div>
      <div class="switch"></div>
    </div>
    <div class="sechead">Ещё</div>
    <div class="grid">
      <button class="tcard" data-all="1">
        <span class="num">Марафон · 40 вопросов</span>
        <div class="ttl">Все вопросы подряд</div>
        <div class="sub">Полный прогон перед настоящим тестированием</div>
      </button>
    </div>`;
  bar.innerHTML = "";
  app.querySelectorAll(".tcard[data-t]").forEach(b => b.onclick = () => startTest(+b.dataset.t));
  app.querySelector("[data-all]").onclick = () => { S.custom=1; S.customTitle="Марафон · все 40"; build(Q); };
  app.querySelector("#s-instant").onclick = () => { S.instant = !S.instant; persist(); home(); };
  app.querySelector("#s-shuffle").onclick = () => { S.shuffle = !S.shuffle; persist(); home(); };
}

function quiz(){
  const q = S.list[S.i], r = S.res[S.i], n = S.list.length;
  const shown = S.instant && r !== null;
  if (!S.instant && r && S.tmp === null) S.tmp = r.pick.slice();
  const title = S.custom ? S.customTitle : TESTS[S.testIdx].title;

  const ticks = S.list.map((_,k)=>{
    const rr = S.res[k]; let c = "";
    if (rr) c = S.instant ? (rr.ok?"hit":"miss") : "done";
    return `<i class="${c}"></i>`;
  }).join("");

  const fig = q.img ? `<figure class="qfig">
      <img src="${q.img}" alt="Иллюстрация к вопросу ${q.n}" data-zoom="${q.img}">
      <figcaption>Нажмите на картинку, чтобы увеличить</figcaption>
    </figure>` : "";

  const body = `<div class="opts">${q.opts.map((o,k)=>{
    let cls = "";
    const sel = (!S.instant && S.tmp) ? S.tmp : (r ? r.pick : (S.tmp||[]));
    const picked = sel.includes(k);
    if (shown){
      if (o.c) cls += " correct";
      else if (picked) cls += " wrong";
      else cls += " dim";
    } else if (picked) cls += " picked";
    const mk = shown ? (o.c ? "✓" : (picked ? "✕" : LET[k])) : (picked ? "●" : LET[k]);
    return `<button class="opt ${cls}" data-k="${k}" ${shown?"disabled":""}>
      <span class="mark">${mk}</span><span>${esc(o.t)}</span></button>`;
  }).join("")}</div>`;

  let verdict = "";
  if (shown){
    const right = q.opts.filter(o=>o.c).map(o=>o.t).join(" · ");
    verdict = `<div class="verdict ${r.ok?"hit":"miss"}">
      <b>${r.ok?"Верно":"Неверно"}</b>${r.ok?"" : "Правильный ответ: " + esc(right)}</div>`;
  }

  app.innerHTML = `
    <div class="topbar">
      <div class="topline">
        <button class="back" id="back">← К блокам</button>
        <span class="counter"><b>${S.i+1}</b> / ${n}</span>
      </div>
      <div class="ruler"><div class="ticks">${ticks}</div>
        <div class="fill" style="width:${(S.i)/n*100}%"></div></div>
    </div>
    <p class="qmeta">${title} · вопрос ${q.n}</p>
    <h2 class="qtext">${esc(q.q)}</h2>
    ${fig}${body}${verdict}`;

  /* нижняя панель */
  const last = S.i === n-1;
  const needCheck = S.instant && r === null;
  let right;
  if (needCheck) right = `<button class="btn" disabled>Выберите ответ</button>`;
  else right = `<button class="btn" id="next">${last?"Показать результат":"Дальше →"}</button>`;

  bar.innerHTML = `<div class="bottom"><div class="inner">
    ${S.i>0?`<button class="btn ghost" id="prev" style="flex:0 0 84px">← Назад</button>`:""}
    ${right}</div></div>`;

  /* обработчики */
  app.querySelector("#back").onclick = () => { S.tmp=null; S.screen="home"; render(); };
  const zi = app.querySelector("[data-zoom]");
  if (zi) zi.onclick = () => zoom(zi.dataset.zoom);
  const prev = bar.querySelector("#prev");
  if (prev) prev.onclick = () => { S.tmp=null; S.i--; render(); };

  app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const k = +b.dataset.k;
    if (S.instant){
      commit([k]);
    } else {
      S.tmp = [k]; render();
    }
  });
  const nx = bar.querySelector("#next");
  if (nx) nx.onclick = () => {
    if (!S.instant && S.tmp && S.tmp.length) commit(S.tmp, true);
    S.tmp=null;
    if (last){ S.screen="result"; } else { S.i++; }
    render();
  };
}

function commit(pick, silent){
  const q = S.list[S.i];
  const need = q.opts.map((o,k)=>o.c?k:-1).filter(k=>k>=0);
  const ok = pick.length===need.length && need.every(k=>pick.includes(k));
  S.res[S.i] = {pick, ok};
  S.tmp = null;
  if (silent) return;
  if (S.instant) render();
  else { if (S.i===S.list.length-1){S.screen="result";} else S.i++; render(); }
}

function result(){
  const n = S.list.length;
  const c = S.res.filter(r=>r&&r.ok).length;
  const p = Math.round(c/n*100);
  const wrong = S.list.map((q,k)=>({q,r:S.res[k]})).filter(x=>!x.r||!x.r.ok);
  const mood = p===100?"Идеально. Все ответы верны.":p>=85?"Отличный результат — материал держится крепко."
    :p>=70?"Хорошо. Осталось закрыть несколько тем."
    :p>=50?"Половина есть. Разберите ошибки ниже и пройдите ещё раз."
    :"Пока тяжело. Пройдите разбор ошибок и повторите тест.";
  if (!S.custom){ S.doneScores[S.testIdx] = {c,n,p}; persist(); }

  app.innerHTML = `
    <p class="eyebrow">Результат · ${S.custom?S.customTitle:TESTS[S.testIdx].title}</p>
    <div class="scorebox">
      <div class="big" style="color:${p>=70?"var(--ok)":p>=50?"var(--amber)":"var(--no)"}">${p}%</div>
      <div class="of">${c} из ${n} верно</div>
      <div class="pct">${mood}</div>
    </div>
    ${wrong.length?`<div class="sechead">Ошибки · ${wrong.length}</div>`:`<div class="sechead">Разбор</div><div class="rev ok">Ошибок нет — разбирать нечего.</div>`}
    ${wrong.map(({q,r})=>{
      const yours = r&&r.pick.length ? r.pick.map(k=>q.opts[k].t).join(" · ") : "— без ответа —";
      const right = q.opts.filter(o=>o.c).map(o=>o.t).join(" · ");
      return `<div class="rev">
        <div class="rq"><span>№${q.n}</span>${esc(q.q)}</div>
        ${q.img?`<img class="rimg" src="${q.img}" alt="Иллюстрация к вопросу ${q.n}" data-zoom="${q.img}">`:""}
        <div class="row you"><em>Ваш ответ</em>${esc(yours)}</div>
        <div class="row right"><em>Правильно</em>${esc(right)}</div>
      </div>`;
    }).join("")}`;

  app.querySelectorAll("[data-zoom]").forEach(el => el.onclick = () => zoom(el.dataset.zoom));

  bar.innerHTML = `<div class="bottom"><div class="inner">
    <button class="btn ghost" id="home">К блокам</button>
    ${wrong.length?`<button class="btn" id="again">Повторить ошибки</button>`
      :`<button class="btn" id="retry">Пройти заново</button>`}
  </div></div>`;
  bar.querySelector("#home").onclick = () => { S.custom=null; S.screen="home"; render(); };
  const ag = bar.querySelector("#again");
  if (ag) ag.onclick = () => { const src=wrong.map(x=>Q.find(z=>z.n===x.q.n));
    S.custom=1; S.customTitle="Работа над ошибками"; build(src); };
  const rt = bar.querySelector("#retry");
  if (rt) rt.onclick = () => S.custom ? build(S.list.map(x=>Q.find(z=>z.n===x.n))) : startTest(S.testIdx);
}

render();
