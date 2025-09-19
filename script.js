function two(n){return String(n).padStart(2,'0')}

function getIsoWeek(date){
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // 1..7, Monday is 1
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return { year: d.getUTCFullYear(), week: weekNo };
}

function isLeap(y){return (y%4===0 && y%100!==0)|| (y%400===0)}

function dayOfYear(date){
    const start = new Date(date.getFullYear(),0,1);
    return Math.floor((date - start) / 86400000) + 1;
}

function preciseYearProgress(now){
    const yearStart = new Date(now.getFullYear(),0,1);
    const yearEnd = new Date(now.getFullYear()+1,0,1);
    return ((now - yearStart) / (yearEnd - yearStart)) * 100;
}

function preciseMonthProgress(now){
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth()+1, 1);
    return ((now - monthStart) / (monthEnd - monthStart)) * 100;
}

function preciseWeekProgress(now){
    // Monday 00:00 as start of week
    const day = (now.getDay() + 6) % 7; // 0..6 Monday=0
    const weekStart = new Date(now);
    weekStart.setHours(0,0,0,0);
    weekStart.setDate(now.getDate() - day);
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+7);
    return ((now - weekStart) / (weekEnd - weekStart)) * 100;
}

const DEFAULT_QUOTES = [
    '“决定不做什么”和“决定做什么”同样重要',
    '种一棵树最好的时间是十年前，其次是现在',
    '少即是多，慢即是快',
    '把注意力放在可控的事情上'
];
let quoteIndex = 0;

function save(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){} }
function load(key, fallback){ try{ const v = localStorage.getItem(key); return v? JSON.parse(v): fallback; }catch(e){ return fallback; } }

function setTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('btn-theme');
    const isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.textContent = isDark ? '🌞' : '🌛';
    save('theme', theme);
    // Re-apply per-theme saved colors
    const p = load(`primary:${theme}`, '#6b7280');
    applyPrimary(p);
    const card = load(`card:${theme}`, theme==='dark' ? '#17171a' : '#ffffff');
    applyCardBg(card);
    // Update swatch button colors if present
    const btnPrimary = document.getElementById('btn-primary');
    const btnCard = document.getElementById('btn-card');
    if (btnPrimary) btnPrimary.style.background = p;
    if (btnCard) btnCard.style.background = card;
}

function applyPrimary(color){
    const root = document.documentElement;
    root.style.setProperty('--accent-400', color);
    root.style.setProperty('--accent-500', color);
    root.style.setProperty('--text-strong', color);
    const theme = document.documentElement.getAttribute('data-theme')||'light';
    save(`primary:${theme}`, color);
}

function applyCardBg(color){
    const root = document.documentElement;
    // Slight tint scaling for related vars
    root.style.setProperty('--card-bg', color);
    save(`card:${document.documentElement.getAttribute('data-theme')||'light'}`, color);
}

// Solid background color control for whole page (replaces gradient)
function applyCanvasBg(color){
    document.documentElement.style.setProperty('--bg', color);
    const theme = document.documentElement.getAttribute('data-theme')||'light';
    save(`canvas:${theme}`, color);
}

function calc12WeekProgress(now, startDate){
    // startDate: Date at local 00:00
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(start); end.setDate(start.getDate() + 7*12);
    const pct = Math.max(0, Math.min(1, (now - start) / (end - start)));
    const weeksPassed = Math.floor(((now - start) / (7*86400000)) + 1);
    return { pct: pct*100, weeksPassed: Math.max(0, Math.min(12, weeksPassed)) };
}

function buildSwatches(kind){
    const palette = ['#ff6fa0','#ff85ab','#ff93b4','#ff4d6d','#f43f5e','#f97316','#22c55e','#06b6d4','#3b82f6','#a855f7','#111827','#ffffff'];
    const wrap = document.getElementById(kind==='primary'?'swatches-primary':'swatches-card');
    wrap.innerHTML = '';
    palette.forEach(c=>{
        const b = document.createElement('button');
        b.style.background = c; b.type='button';
        b.addEventListener('click', ()=>{
            document.getElementById(kind==='primary'?'picker-primary':'picker-card').value = c;
        });
        wrap.appendChild(b);
    });
}

function update(){
    const now = new Date();
    // Clock
    document.getElementById('clock').textContent = `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`;

    // Week badge shows 12-week current week
    const weekdayNames = ['周一','周二','周三','周四','周五','周六','周日'];
    const weekdayIndex = (now.getDay()+6)%7; // Monday=0
    const startStr = load('start12w', null);
    const startDate = startStr ? new Date(startStr) : new Date(now.getFullYear(), now.getMonth(), 1);
    const twForBadge = calc12WeekProgress(now, startDate);
    const currentWeek = Math.min(12, Math.max(1, twForBadge.weeksPassed));
    document.getElementById('week-badge').textContent = `第${currentWeek}周·${weekdayNames[weekdayIndex]}`;

    // Year
    const yPct = Math.max(0, Math.min(100, preciseYearProgress(now)));
    const yDays = isLeap(now.getFullYear()) ? 366 : 365;
    const yDay = dayOfYear(now);
    document.getElementById('bar-year').style.width = `${yPct.toFixed(1)}%`;
    document.getElementById('pct-year').textContent = `${yPct.toFixed(1)}%`;
    document.getElementById('days-year').textContent = `${yDay}/${yDays}`;

    // 12-week custom cycle
    // use same startDate as above
    const tw = calc12WeekProgress(now, startDate);
    document.getElementById('bar-12w').style.width = `${tw.pct.toFixed(1)}%`;
    document.getElementById('pct-12w').textContent = `${tw.pct.toFixed(1)}%`;
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const daysPassed = Math.min(84, Math.max(0, Math.floor((now - start)/86400000) + 1));
    document.getElementById('weeks-12w').textContent = `${daysPassed}/84`;

    // Week
    const wPct = Math.max(0, Math.min(100, preciseWeekProgress(now)));
    const dowForCounter = ((now.getDay()+6)%7)+1; // 1..7
    document.getElementById('bar-week').style.width = `${wPct.toFixed(1)}%`;
    document.getElementById('pct-week').textContent = `${wPct.toFixed(1)}%`;
    document.getElementById('days-week').textContent = `${dowForCounter}/7`;
}

update();
setInterval(update, 1000);

// Init controls
window.addEventListener('DOMContentLoaded', () => {
    // Theme
    setTheme(load('theme', 'light'));
    document.getElementById('btn-theme').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(current === 'light' ? 'dark' : 'light');
    });

    // Primary color per-theme via modal
    const theme = document.documentElement.getAttribute('data-theme')||'light';
    const btnPrimary = document.getElementById('btn-primary');
    const btnCard = document.getElementById('btn-bg');

    const setSwatchBtn = (btn, color) => { btn.style.background = color; };

    const primaryColor = load(`primary:${theme}`, '#ff6fa0');
    applyPrimary(primaryColor); setSwatchBtn(btnPrimary, primaryColor);
    document.getElementById('btn-primary').addEventListener('click', () => {
        const modal = document.getElementById('modal-primary');
        const input = document.getElementById('picker-primary');
        input.value = load(`primary:${document.documentElement.getAttribute('data-theme')||'light'}`, primaryColor);
        buildSwatches('primary');
        modal.setAttribute('aria-hidden','false');
    });
    document.getElementById('save-primary').addEventListener('click', () => {
        const color = document.getElementById('picker-primary').value;
        applyPrimary(color); setSwatchBtn(btnPrimary, color);
        document.getElementById('modal-primary').setAttribute('aria-hidden','true');
    });

    // Card background per-theme via modal
    const defaultCard = load('theme','light')==='dark' ? '#0f172a' : '#f3f4f6';
    const cardColor = load(`canvas:${theme}`, defaultCard);
    applyCanvasBg(cardColor); setSwatchBtn(btnCard, cardColor);
    document.getElementById('btn-bg').addEventListener('click', () => {
        const modal = document.getElementById('modal-card');
        const input = document.getElementById('picker-card');
        input.value = load(`canvas:${document.documentElement.getAttribute('data-theme')||'light'}`, cardColor);
        buildSwatches('card');
        modal.setAttribute('aria-hidden','false');
    });
    document.getElementById('save-card').addEventListener('click', () => {
        const color = document.getElementById('picker-card').value;
        applyCanvasBg(color); setSwatchBtn(btnCard, color);
        document.getElementById('modal-card').setAttribute('aria-hidden','true');
    });

    document.querySelectorAll('[data-close]')?.forEach(el=>{
        el.addEventListener('click', ()=>{
            const sel = el.getAttribute('data-close');
            if (sel) document.querySelector(sel).setAttribute('aria-hidden','true');
        });
    });

    // 12w start date via modal
    const modal = document.getElementById('modal');
    const openModal = () => { modal.setAttribute('aria-hidden','false'); renderCalendar(); };
    const closeModal = () => { modal.setAttribute('aria-hidden','true'); };
    document.getElementById('btn-12w').addEventListener('click', openModal);
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    let calSelected = load('start12w', null) ? new Date(load('start12w')) : new Date();
    function renderCalendar(){
        const root = document.getElementById('calendar');
        root.innerHTML = '';
        const head = document.createElement('div'); head.className='cal__head';
        const title = document.createElement('div'); title.className='cal__title'; title.textContent = `${calSelected.getFullYear()}年${two(calSelected.getMonth()+1)}月`;
        const prev = document.createElement('button'); prev.textContent='‹'; prev.className='btn btn--ghost';
        const next = document.createElement('button'); next.textContent='›'; next.className='btn btn--ghost';
        head.appendChild(prev); head.appendChild(title); head.appendChild(next); root.appendChild(head);
        const grid = document.createElement('div'); grid.className='cal__grid';
        const dows=['一','二','三','四','五','六','日'];
        dows.forEach(d=>{const el=document.createElement('div');el.className='cal__dow';el.textContent=d;grid.appendChild(el);});
        const first = new Date(calSelected.getFullYear(), calSelected.getMonth(), 1);
        const startIdx = (first.getDay()+6)%7; // Monday first
        for(let i=0;i<startIdx;i++){const m=document.createElement('div');m.className='cal__day cal__day--muted';grid.appendChild(m);}
        const daysInMonth = new Date(calSelected.getFullYear(), calSelected.getMonth()+1, 0).getDate();
        for(let d=1; d<=daysInMonth; d++){
            const btn=document.createElement('div'); btn.className='cal__day'; btn.textContent=d;
            if (calSelected.getDate()===d) btn.classList.add('cal__day--sel');
            btn.addEventListener('click',()=>{calSelected.setDate(d); renderCalendar();});
            grid.appendChild(btn);
        }
        root.appendChild(grid);
        prev.onclick=()=>{calSelected.setMonth(calSelected.getMonth()-1); renderCalendar();};
        next.onclick=()=>{calSelected.setMonth(calSelected.getMonth()+1); renderCalendar();};
    }
    document.getElementById('modal-save').addEventListener('click', () => {
        const y = calSelected.getFullYear();
        const m = two(calSelected.getMonth()+1);
        const d = two(calSelected.getDate());
        const v = `${y}-${m}-${d}`;
        save('start12w', v);
        // 立即更新徽章与进度
        setTimeout(update, 0);
        closeModal();
    });

    // Quotes carousel
    const quotes = load('quotes', DEFAULT_QUOTES);
    const qEl = document.getElementById('quote-text');
    const setQuote = () => { qEl.textContent = quotes[quoteIndex % quotes.length]; };
    setQuote();
    setInterval(() => { quoteIndex = (quoteIndex + 1) % quotes.length; setQuote(); }, 8000);
});


