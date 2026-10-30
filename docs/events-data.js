/* ═══════════════════════════════════════════════════════════
   すずらんテラス SOTTO ── イベントデータ（共通）
   このファイルの EVENTS を編集すれば、トップページのカレンダーと
   イベント一覧ページ（events.html）の両方に自動で反映されます。
   日付順に並んでいなくてもOK（自動で並び替えます）。

   date   : "YYYY-MM-DD"（必須）
   end    : 複数日開催のときの最終日 "YYYY-MM-DD"（任意）
   cat    : "event" / "workshop" / "cafe" / "other" のいずれか
   title  : イベント名
   time   : 開催時間など（任意）
   desc   : 説明文（任意）
   img    : 画像ファイル名（任意。無ければ文字だけで表示）
   link   : 申込/詳細URL（任意）
   linkLabel : リンクのボタン文言（任意・既定は「詳細・お申し込み」）
   ═══════════════════════════════════════════════════════════ */
const EVENTS = [
  {
    date: "2026-11-18",
    cat: "cafe",
    title: "交流喫茶＆Room3お披露目会",
    time: "11:30〜15:30",
    desc: "NATTER COFFEE による交流喫茶と、完成した ROOM3 のお披露目会を開催します。",
    img: "natter1118.png",
    link: "https://peatix.com/event/5211924",
    linkLabel: "Peatix で申し込む"
  },
  {
    date: "2026-11-18",
    cat: "workshop",
    title: "みんなで弔辞を書こう！〜今までの私を振り返る時間〜",
    time: "10:30〜／参加費 1,000円（ドーナツ＆コーヒー付き）",
    desc: "葬儀司会者による、自分の人生を振り返るワークショップ。“弔辞”を通して今までの私を見つめ直し、これからの私を輝かせる時間です。",
    img: "event/1118WS.png",
    link: "https://peatix.com/event/5237208",
    linkLabel: "Peatix で申し込む"
  },
  {
    date: "2026-12-12",
    cat: "event",
    title: "台湾ランタン祭り",
    time: "10:00〜16:00",
    desc: "台湾料理とランタン作りワークショップ。本場の味と手づくりランタンを楽しむ一日。すずらんテラスSOTTOにて開催します。",
    img: "event/1212taiwan-lantern.png"
  }
];

/* ── カテゴリ設定（色・表示名） ── */
const EVENT_CATS = {
  event:    { label: "Event",    color: "#a87070" },
  workshop: { label: "Workshop", color: "#b08898" },
  cafe:     { label: "Café",     color: "#b08a5c" },
  other:    { label: "Other",    color: "#8a9a8a" }
};
const EVENT_DOW = ["日","月","火","水","木","金","土"];

/* ── ユーティリティ ── */
function evParseDate(s){ const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }
const EV_TODAY = new Date(); EV_TODAY.setHours(0,0,0,0);
function evIsPast(ev){ const e = evParseDate(ev.end || ev.date); e.setHours(0,0,0,0); return e < EV_TODAY; }
function evFmtDateJP(d){
  const dt = evParseDate(d);
  return `${dt.getFullYear()}.${dt.getMonth()+1}.${dt.getDate()}（${EVENT_DOW[dt.getDay()]}）`;
}

/* 日付順に並べ、_id を付与 */
const EVENTS_SORTED = EVENTS
  .map((e,i)=>({ ...e, _idx:i }))
  .sort((a,b)=> a.date.localeCompare(b.date) || a._idx-b._idx)
  .map((e,i)=>({ ...e, _id:`ev-${i}` }));

/* 指定日に該当するイベント（end 考慮） */
function evOnDay(y, m, d){
  const t = new Date(y, m, d); t.setHours(0,0,0,0);
  return EVENTS_SORTED.filter(ev=>{
    const s = evParseDate(ev.date); s.setHours(0,0,0,0);
    const e = evParseDate(ev.end || ev.date); e.setHours(0,0,0,0);
    return t >= s && t <= e;
  });
}

/* 初期表示月：直近の開催予定がある月。無ければ今月 */
function evInitialView(){
  const up = EVENTS_SORTED.find(ev=> !evIsPast(ev));
  const base = up ? evParseDate(up.date) : new Date();
  return { y: base.getFullYear(), m: base.getMonth() };
}

/* ═══════════════════════════════════════════════════════════
   カレンダーを描画して月送りを有効化する共通関数。
   opts = {
     grid, title, prev, next   : 要素 or id（prev/next は省略可）
     initial                   : {y, m}（省略時は evInitialView）
     onEventClick(ev)          : カレンダー内イベントのクリック時
     onMonthChange(y, m)       : 表示月が変わるたびに呼ばれる
   }
   戻り値: { render(), goTo(y,m), state }
   ═══════════════════════════════════════════════════════════ */
function evMountCalendar(opts){
  const $ = s => (typeof s === "string" ? document.getElementById(s) : s);
  const grid = $(opts.grid), title = $(opts.title);
  const prev = opts.prev ? $(opts.prev) : null;
  const next = opts.next ? $(opts.next) : null;
  const state = opts.initial || evInitialView();

  function render(){
    if(title) title.innerHTML = `<span class="y">${state.y}</span>${state.m+1}月`;

    let html = "";
    EVENT_DOW.forEach((d,i)=>{
      const cls = i===0 ? "sun" : i===6 ? "sat" : "";
      html += `<div class="cal-dow ${cls}">${d}</div>`;
    });

    const startDow = new Date(state.y, state.m, 1).getDay();
    const dim = new Date(state.y, state.m+1, 0).getDate();
    for(let i=0;i<startDow;i++){ html += `<div class="cal-cell empty"></div>`; }

    for(let d=1; d<=dim; d++){
      const dow = new Date(state.y, state.m, d).getDay();
      const cls = dow===0 ? "sun" : dow===6 ? "sat" : "";
      const isToday = (state.y===EV_TODAY.getFullYear() && state.m===EV_TODAY.getMonth() && d===EV_TODAY.getDate());
      const dayEvents = evOnDay(state.y, state.m, d);
      const hasEv = dayEvents.length > 0 ? "has-ev" : "";
      let cell = `<div class="cal-cell ${cls} ${isToday?"today":""} ${hasEv}"><span class="cal-daynum">${d}</span>`;
      dayEvents.forEach(ev=>{
        const c = EVENT_CATS[ev.cat] || EVENT_CATS.other;
        const past = evIsPast(ev) ? "past" : "";
        cell += `<button class="cal-ev ${past}" style="background:${c.color}" data-ev="${ev._id}" title="${ev.title.replace(/"/g,'&quot;')}">${c.label}</button>`;
      });
      cell += `</div>`;
      html += cell;
    }
    grid.innerHTML = html;

    grid.querySelectorAll(".cal-ev").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const ev = EVENTS_SORTED.find(e=> e._id === btn.dataset.ev);
        if(ev && opts.onEventClick) opts.onEventClick(ev);
      });
    });

    if(opts.onMonthChange) opts.onMonthChange(state.y, state.m);
  }

  if(prev) prev.onclick = ()=>{ state.m--; if(state.m<0){state.m=11;state.y--;} render(); };
  if(next) next.onclick = ()=>{ state.m++; if(state.m>11){state.m=0;state.y++;} render(); };
  render();
  return { state, render, goTo:(y,m)=>{ state.y=y; state.m=m; render(); } };
}
