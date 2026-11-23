// ===== Ежеежемесячный дайджест Langame (отчёт «Посуточный отчет»). Вход: строки листа из «Читать xlsx» =====
const info = $('Классификация').first().json;

function colIdx(k){ if(/^\d+$/.test(k)) return +k; let n=0; for(const ch of String(k).toUpperCase()){ if(ch<'A'||ch>'Z') return -1; n=n*26+ch.charCodeAt(0)-64; } return n-1; }
const rows = $input.all().map(i=>{
  const j=i.json; let arr=[];
  if(Array.isArray(j.row)) arr=j.row.slice();
  else if(Array.isArray(j)) arr=j.slice();
  else for(const k of Object.keys(j)){ const ix=colIdx(k); if(ix>=0) arr[ix]=j[k]; }
  return arr;
});
const norm = s => String(s??'').replace(/\s+/g,' ').trim();
const num = v => { if(typeof v==='number') return v; const n=parseFloat(String(v??'').replace(/\s/g,'').replace(',','.')); return isNaN(n)?0:n; };
const L = rows.map(r=>norm(r[0]));

// Это не ежемесячный (посуточный) отчёт — молча выходим (сменные и недельные файлы разбирает другой воркфлоу)
if(!L.slice(0,8).some(x=>/^Посуточный отч[её]т/i.test(x))) return [];

const find  = (label, from=0) => { for(let i=from;i<L.length;i++) if(L[i]===label) return i; return -1; };
const findP = (prefix, from=0) => { for(let i=from;i<L.length;i++) if(L[i].startsWith(prefix)) return i; return -1; };
const need = (i, name) => { if(i<0) throw new Error('В файле не найдена строка «'+name+'». Формат отчёта изменился?'); return i; };

// ---------- даты (колонки дней) ----------
const toDate = v => {
  let y,m,d;
  if(typeof v==='number' && v>20000){ const t=new Date(Math.round((v-25569)*86400000)); y=t.getUTCFullYear(); m=t.getUTCMonth()+1; d=t.getUTCDate(); }
  else { const s=norm(v); let x=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/); if(x){ d=+x[1]; m=+x[2]; y=+x[3]; } else { x=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(!x) return null; y=+x[1]; m=+x[2]; d=+x[3]; } }
  const dow=(new Date(Date.UTC(y,m-1,d)).getUTCDay()+6)%7; // 0=Пн … 6=Вс
  return {y,m,d,dow};
};
const iDate = need(find('Дата'),'Дата');
const cols=[], dates=[];
for(let c=1;c<rows[iDate].length;c++){ const d=toDate(rows[iDate][c]); if(d){ cols.push(c); dates.push(d); } }
if(!cols.length) throw new Error('Не нашёл колонки с датами в строке «Дата».');
const ser = (i)=> i<0 ? cols.map(()=>0) : cols.map(c=>num(rows[i][c]));
const S = a=>a.reduce((x,y)=>x+y,0);
const sum = i=>S(ser(i));

const Y=dates[0].y, M=dates[0].m, key=`${Y}-${String(M).padStart(2,'0')}`;
const monthsN=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
const monthsD=['январю','февралю','марту','апрелю','маю','июню','июлю','августу','сентябрю','октябрю','ноябрю','декабрю'];
const monthsS=['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const dowS=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const label = `${monthsN[M-1]} ${Y}`;
const nDays = dates.length;
const expected = new Date(Date.UTC(Y,M,0)).getUTCDate();

// ---------- строки отчёта ----------
const iRev = need(find('Итого выручка'),'Итого выручка');
const iAdm = need(find('Касса администратора'),'Касса администратора');
const iLK  = find('Личный кабинет'), iMP = find('Мобильное приложение');
const iChecks = need(find('Количество чеков всего'),'Количество чеков всего');
const iOps = need(find('По операциям'),'По операциям');
const iSumChecks = need(find('Сумма чеков всего', iOps),'Сумма чеков всего');
const iCash = find('Наличными на кассе администратора', iSumChecks);
const iCard = find('Картой на кассе администратора', iSumChecks);
const iQR   = find('QR', iSumChecks);
const iOnl  = find('Картой онлайн', iSumChecks);
const iTC   = find('Наличными на терминале самообслуживания', iSumChecks);
const iTA   = find('Эквайринг на терминале самообслуживания', iSumChecks);
const iIncas = find('Инкассации');
const iBal = find('Статистика по балансам');
const iBonusIn = find('Пополнения бонусного баланса', iBal);
const iCashback = iBonusIn>=0 ? find('Кешбек по сессии', iBonusIn) : -1;
const iBonusOut = find('Списания бонусного баланса', iBal);
const iRetM = find('Возвраты денежного баланса', iBal);
const iRetB = find('Возвраты бонусного баланса', iBal);
const iG = need(find('Статистика по гостям'),'Статистика по гостям');
const iReg = find('Регистрации', iG), iNew = find('Новые гости', iG), iUniq = find('Уникальных гостей', iG);
const iPC = need(find('Статистика по ПК'),'Статистика по ПК');
const iLoad = findP('Загрузка в %', iPC);
const iHour = find('Средняя стоимость часа', iPC), iHourNB = find('Средняя стоимость часа без бонусов', iPC);
const iPcMin = find('Минуты сессий на ПК', iPC), iTvMin = find('Минуты сессий на ТВ', iPC);
const iSess = find('Активированных сессий', iPC), iBookA = find('Активированных бронирований', iPC), iBookM = find('Сделанных бронирований', iPC);
const iGen = need(find('Общая статистика'),'Общая статистика');
const iQty = find('Количество проданных товаров', iGen), iGoods = need(find('Сумма проданных товаров', iGen),'Сумма проданных товаров');

// напитки: блок «Товары» внутри «Статистика по операциям»
const iOpsStat = need(find('Статистика по операциям'),'Статистика по операциям');
const iGB = find('Товары', iOpsStat);
let drinksAll = [];
if(iGB>=0){
  for(let i=iGB+1;i<L.length;i++){
    if(['Услуги','Возвраты','Расходы','Инкассации'].includes(L[i])) break;
    if(!L[i]) continue;
    drinksAll.push({n:L[i], v:Math.round(sum(i))});
  }
}

// ---------- метрики ----------
const revDay = ser(iRev);
const rev = S(revDay);
const checks = sum(iChecks);
const avgCheck = checks? rev/checks : 0;
const chan = { adm:sum(iAdm), lk:sum(iLK), mp:sum(iMP) };
const meth = { cash:sum(iCash), card:sum(iCard), qr:sum(iQR), onl:sum(iOnl) };
const pcMin = sum(iPcMin);
const hourW = (iHour>=0 && pcMin) ? S(ser(iHour).map((v,i)=>v*ser(iPcMin)[i]))/pcMin : 0;
const hourNB = (iHourNB>=0 && pcMin) ? S(ser(iHourNB).map((v,i)=>v*ser(iPcMin)[i]))/pcMin : 0;
const loadAvg = iLoad>=0 ? S(ser(iLoad))/nDays : 0;
const goodsSum = sum(iGoods), goodsQty = iQty>=0? sum(iQty):0;
const choc = drinksAll.filter(x=>/шоколад/i.test(x.n));
const drinks = drinksAll.filter(x=>!/шоколад/i.test(x.n) && x.v>0).sort((a,b)=>b.v-a.v);
const chocSum = S(choc.map(x=>x.v));
const drinksSum = S(drinks.map(x=>x.v));

// дни недели, недели
const dowSum=Array(7).fill(0), dowCnt=Array(7).fill(0);
dates.forEach((d,i)=>{ dowSum[d.dow]+=revDay[i]; dowCnt[d.dow]++; });
const dowAvg = dowSum.map((s,i)=>dowCnt[i]? s/dowCnt[i] : 0);
const wkIdx = dates.map((d,i)=>i).filter(i=>dates[i].dow<5), weIdx = dates.map((d,i)=>i).filter(i=>dates[i].dow>=5);
const wkAvg = wkIdx.length? S(wkIdx.map(i=>revDay[i]))/wkIdx.length : 0;
const weAvg = weIdx.length? S(weIdx.map(i=>revDay[i]))/weIdx.length : 0;
const weeks=[]; { let cur=null; dates.forEach((d,i)=>{ if(!cur || d.dow===0){ cur={a:i,b:i}; weeks.push(cur); } cur.b=i; }); }
const weekRows = weeks.map(w=>{ const s=S(revDay.slice(w.a,w.b+1)); const n=w.b-w.a+1; const da=dates[w.a], db=dates[w.b];
  const nm = (da.d===db.d)? `${da.d} ${monthsS[M-1]}` : `${da.d}–${db.d} ${monthsS[M-1]}`; return {n:nm, s:Math.round(s), days:n, avg:Math.round(s/n)}; });
const order = revDay.map((v,i)=>i).sort((a,b)=>revDay[b]-revDay[a]);
const best = {i:order[0], v:revDay[order[0]]}, worst = {i:order[order.length-1], v:revDay[order[order.length-1]]};
const dayStr = i => `${String(dates[i].d).padStart(2,'0')}.${String(dates[i].m).padStart(2,'0')} (${dowS[dates[i].dow]})`;
const bi = dowAvg.map((v,i)=>i).filter(i=>dowCnt[i]).sort((a,b)=>dowAvg[b]-dowAvg[a]);
const strongD = bi[0], weakD = bi[bi.length-1];

// ---------- сверка ----------
const warns=[];
const chanSum = chan.adm+chan.lk+chan.mp;
if(Math.abs(rev-chanSum)>nDays) warns.push(`выручка ${rub0(rev)} ≠ сумма каналов ${rub0(chanSum)}`);
const methSum = meth.cash+meth.card+meth.qr+meth.onl+sum(iTC)+sum(iTA);
if(Math.abs(rev-methSum)>nDays) warns.push(`выручка ${rub0(rev)} ≠ сумма способов оплаты ${rub0(methSum)}`);
if(drinksAll.length && Math.abs(goodsSum-S(drinksAll.map(x=>x.v)))>nDays) warns.push(`товары ${rub0(goodsSum)} ≠ сумма позиций ${rub0(S(drinksAll.map(x=>x.v)))}`);
function rub0(x){ return Math.round(x)+' ₽'; }

// ---------- данные для таблицы ----------
const data = {
  key, label, days:nDays, expected, rev:Math.round(rev), checks, avgCheck:+avgCheck.toFixed(2),
  perDay:Math.round(rev/nDays), chan:{adm:Math.round(chan.adm),lk:Math.round(chan.lk),mp:Math.round(chan.mp)},
  meth:{cash:Math.round(meth.cash),card:Math.round(meth.card),qr:Math.round(meth.qr),onl:Math.round(meth.onl)},
  incas:Math.round(sum(iIncas)), guests:sum(iUniq), newGuests:sum(iNew), regs:sum(iReg), load:+loadAvg.toFixed(2),
  hour:Math.round(hourW), hourNB:Math.round(hourNB), pcMin:Math.round(pcMin), tvMin:Math.round(sum(iTvMin)), sessions:sum(iSess),
  bookA:sum(iBookA), bookM:sum(iBookM), goodsSum:Math.round(goodsSum), goodsQty, drinks, chocSum, drinksSum,
  wkAvg:Math.round(wkAvg), weAvg:Math.round(weAvg), dowAvg:dowAvg.map(Math.round), weeks:weekRows,
  best:{d:dayStr(best.i),v:Math.round(best.v)}, worst:{d:dayStr(worst.i),v:Math.round(worst.v)},
  bonusIn:Math.round(sum(iBonusIn)), bonusOut:Math.round(sum(iBonusOut)), cashback:Math.round(sum(iCashback)),
  retM:Math.round(sum(iRetM)), retB:Math.round(sum(iRetB))
};

// ---------- прошлый месяц из таблицы ----------
let prev=null, hadSame=false;
try{
  const stored = $('Прошлые месяцы (сводка)').first().json.rows || [];
  const parsed = [];
  for(const r of stored){ try{ const o=JSON.parse(r.data); if(o && o.key) parsed.push(o); }catch(e){} }
  hadSame = parsed.some(o=>o.key===key);
  const older = parsed.filter(o=>o.key<key).sort((a,b)=>a.key<b.key?1:-1);
  prev = older[0] || null;
}catch(e){ prev=null; }

// ---------- форматирование ----------
const f=(x,d=0)=>{ const neg=x<0; const s=Math.abs(x).toFixed(d); let [a,b]=s.split('.'); a=a.replace(/\B(?=(\d{3})+(?!\d))/g,' '); return (neg?'−':'')+a+(b?','+b:''); };
const rub=x=>`${f(Math.round(x))} ₽`;
const e=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const pct=(a,b)=>b?(a/b*100):0;
const dl=(a,b,d=0,unit='')=>{ if(!prev||b==null||b===0) return ''; const diff=a-b; if(Math.abs(diff)<Math.pow(10,-d)/2) return ' ➖ без изменений'; return ` ${diff>0?'▲ +':'▼ −'}${f(Math.abs(diff),d)}${unit} (${diff>0?'+':'−'}${f(Math.abs(pct(diff,Math.abs(b))),1)}%)`; };
const dpp=(a,b)=>{ if(!prev) return ''; const d=a-b; if(Math.abs(d)<0.05) return ' ➖'; return ` ${d>0?'▲ +':'▼ −'}${f(Math.abs(d),1)} п.п.`; };
const hrs=m=>`${f(m/60,1)} ч`;
const medal=['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
const pm = prev ? monthsD[parseInt(prev.key.slice(5,7),10)-1] : '';
const sameLen = !prev || prev.days===nDays;
const perDay = rev/nDays;

const sec=[]; // секции сообщения
const add=(...lines)=>sec.push(lines.join('\n'));

add(`📅 <b>Отчёт за месяц: ${e(label)}</b>`,
    `🗓 ${String(dates[0].d).padStart(2,'0')}.${String(dates[0].m).padStart(2,'0')}.${Y} → ${String(dates[nDays-1].d).padStart(2,'0')}.${String(dates[nDays-1].m).padStart(2,'0')}.${Y} · дней: ${nDays}`,
    prev ? `🆚 Сравнение с прошлым месяцем: <b>${e(prev.label)}</b>` : `🆚 Сравнить пока не с чем: прошлого месяца нет в таблице`);

add(`💰 <b>Выручка: ${rub(rev)}</b>${dl(rev,prev&&prev.rev)}`,
    `📆 В среднем за день: <b>${rub(perDay)}</b>${dl(perDay,prev&&prev.perDay)}`,
    `🧾 Чеков: <b>${f(checks)}</b>${dl(checks,prev&&prev.checks)}`,
    `🧮 Средний чек: <b>${f(avgCheck,2)} ₽</b>${dl(avgCheck,prev&&prev.avgCheck,2)}`,
    `🔝 Лучший день: ${dayStr(best.i)} — ${rub(best.v)}`,
    `🔻 Слабый день: ${dayStr(worst.i)} — ${rub(worst.v)}`);

{ const L2=['📈 <b>Динамика по неделям</b>'];
  weekRows.forEach((w,i)=>L2.push(`${i===weekRows.length-1?'└':'├'} ${w.n}: ${rub(w.s)} · ${rub(w.avg)}/день${w.days<7?` (${w.days} дн.)`:''}`));
  add(...L2); }

add(`📊 <b>Дни недели</b> (средняя выручка за день)`,
    `🟢 Выходные (Сб–Вс): <b>${rub(weAvg)}</b>${dl(weAvg,prev&&prev.weAvg)}`,
    `🔵 Будни (Пн–Пт): <b>${rub(wkAvg)}</b>${dl(wkAvg,prev&&prev.wkAvg)}`,
    `🔥 Сильнее всего: ${dowS[strongD]} — ${rub(dowAvg[strongD])}`,
    `🥶 Слабее всего: ${dowS[weakD]} — ${rub(dowAvg[weakD])}`);

{ const L3=['💳 <b>Структура оплат</b>'];
  const chs=[['🏧 Касса админа','adm'],['🖥 Личный кабинет','lk'],['📱 Приложение','mp']];
  for(const [nm,k] of chs){ if(chan[k]<=0) continue; L3.push(`${nm}: ${rub(chan[k])} (${f(pct(chan[k],rev),1)}%)${prev&&prev.chan? dpp(pct(chan[k],rev),pct(prev.chan[k],prev.rev)):''}`);
    if(k==='adm'){ L3.push(`   ├ 💵 Наличные: ${rub(meth.cash)}`); L3.push(`   └ 💳 Карта: ${rub(meth.card)}`); } }
  L3.push('');
  L3.push('🔀 <b>Способы оплаты</b> (доля)');
  const ms=[['🔳 QR','qr'],['💳 Карта на кассе','card'],['💵 Наличные','cash'],['🌐 Карта онлайн','onl']];
  ms.forEach(([nm,k],i)=>{ L3.push(`${nm}: ${rub(meth[k])} (${f(pct(meth[k],rev),1)}%)${prev&&prev.meth? dpp(pct(meth[k],rev),pct(prev.meth[k],prev.rev)):''}`); });
  L3.push(`🏦 Инкассировано: <b>${rub(data.incas)}</b>${dl(data.incas,prev&&prev.incas)}`);
  add(...L3); }

add('🎮 <b>Клуб</b>',
    `👥 Гостей (сумма по дням): <b>${f(data.guests)}</b> · в среднем ${f(data.guests/nDays)} в день${prev&&prev.guests? dl(data.guests/nDays,prev.guests/prev.days,0):''}`,
    `🆕 Новых гостей: <b>${f(data.newGuests)}</b> (регистраций ${f(data.regs)}) · в день ${f(data.newGuests/nDays,1)}${prev? dl(data.newGuests/nDays,prev.newGuests/prev.days,1):''}`,
    `⚡ Средняя загрузка: <b>${f(loadAvg,1)}%</b>${prev? dpp(loadAvg,prev.load):''}`,
    `🕹 Сессий: ${f(data.sessions)} · в день ${f(data.sessions/nDays)}${prev? dl(data.sessions/nDays,prev.sessions/prev.days,0):''}`,
    `🖥 Время ПК: ${hrs(data.pcMin)}${data.tvMin?` · 📺 ТВ: ${hrs(data.tvMin)}`:''}`,
    `⏱ Ср. стоимость часа: ${f(data.hour)} ₽${dl(data.hour,prev&&prev.hour)} (без бонусов ${f(data.hourNB)} ₽)`,
    `📆 Бронирований: ${f(data.bookM)} (активировано ${f(data.bookA)})`);

add('🥤 <b>Бар</b>',
    `🛒 Продано: <b>${f(goodsQty)} шт.</b> на <b>${rub(goodsSum)}</b>${dl(goodsSum,prev&&prev.goodsSum)}`,
    `📈 Доля в выручке: ${f(pct(goodsSum,rev),1)}%${prev? dpp(pct(goodsSum,rev),pct(prev.goodsSum,prev.rev)):''}`,
    goodsQty? `🧾 В среднем ${f(goodsSum/goodsQty)} ₽ за позицию · ${f(goodsQty/nDays,1)} шт. в день` : '');

// рейтинг напитков
{ const L4=['🏆 <b>Рейтинг напитков за месяц</b>'];
  const prevMap = {}; if(prev&&prev.drinks){ [...prev.drinks].sort((a,b)=>b.v-a.v).forEach((x,i)=>{ prevMap[x.n]={v:x.v,rank:i+1}; }); }
  drinks.slice(0,10).forEach((x,i)=>{
    const p=prevMap[x.n]; let mv='';
    if(prev){ if(!p) mv=' 🆕'; else if(p.rank>i+1) mv=` ▲${p.rank-(i+1)}`; else if(p.rank<i+1) mv=` ▼${(i+1)-p.rank}`; }
    L4.push(`${medal[i]} <b>${e(x.n)}</b>${mv}`);
    L4.push(`   └ ${rub(x.v)} · ${f(pct(x.v,drinksSum),1)}% напитков${p? dl(x.v,p.v,0,' ₽'):''}`);
  });
  add(...L4);
  const tail=drinks.slice(-3).reverse();
  const L5=[];
  if(drinks.length>10) L5.push(`🐢 Аутсайдеры: ${tail.map(x=>`${e(x.n)} (${rub(x.v)})`).join(', ')}`);
  if(drinksAll.length){ const zero=drinksAll.filter(x=>x.v===0&&!/шоколад/i.test(x.n)).map(x=>x.n); if(zero.length) L5.push(`🚫 Не продавались: ${e(zero.join(', '))}`); }
  if(chocSum) L5.push(`🍫 Шоколадки отдельно: ${rub(chocSum)}`);
  L5.push(`🥤 Всего напитков: ${rub(drinksSum)}${dl(drinksSum,prev&&prev.drinksSum)}`);
  add(...L5);
}

add('🔄 <b>Возвраты и бонусы</b>',
    `↩️ Возвраты: ${rub(data.retM)} + бонусами ${rub(data.retB)}`,
    `➕ Бонусов начислено: ${rub(data.bonusIn)}${dl(data.bonusIn,prev&&prev.bonusIn)}`,
    `➖ Бонусов списано: ${rub(data.bonusOut)}${dl(data.bonusOut,prev&&prev.bonusOut)}`,
    `🎁 Кешбек по сессиям: ${rub(data.cashback)}`);

// ---------- аналитика к прошлому месяцу ----------
const concl=[];
const numSecCount = sec.length;
if(prev){
  const A=['🔍 <b>Что изменилось к '+e(pm)+'</b>'];
  const diff=rev-prev.rev;
  const volume=(checks-prev.checks)*prev.avgCheck, price=(avgCheck-prev.avgCheck)*checks;
  A.push(`${diff>=0?'📈':'📉'} Выручка ${diff>=0?'выросла':'снизилась'} на ${rub(Math.abs(diff))}${sameLen?'':` (в месяце ${nDays} дн. против ${prev.days})`}`);
  A.push(`   ├ 🧾 за счёт числа чеков: ${volume>=0?'+':'−'}${rub(Math.abs(volume))}`);
  A.push(`   └ 🧮 за счёт среднего чека: ${price>=0?'+':'−'}${rub(Math.abs(price))}`);
  const chDiff=[['🏧 Касса админа','adm'],['🖥 Личный кабинет','lk'],['📱 Приложение','mp']].map(([nm,k])=>({nm,d:chan[k]-prev.chan[k]})).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d))[0];
  if(chDiff && Math.abs(chDiff.d)>0) A.push(`💳 Главное изменение по каналам: ${chDiff.nm} ${chDiff.d>=0?'+':'−'}${rub(Math.abs(chDiff.d))}`);
  if(prev.drinks){ const pmap={}; prev.drinks.forEach(x=>pmap[x.n]=x.v);
    const dd=drinks.map(x=>({n:x.n,d:x.v-(pmap[x.n]||0),v:x.v,pv:pmap[x.n]||0}));
    prev.drinks.forEach(x=>{ if(!drinks.find(y=>y.n===x.n)) dd.push({n:x.n,d:-x.v,v:0,pv:x.v}); });
    const up=dd.filter(x=>x.d>0).sort((a,b)=>b.d-a.d).slice(0,2), down=dd.filter(x=>x.d<0).sort((a,b)=>a.d-b.d).slice(0,2);
    if(up.length) A.push(`🚀 Выросли на баре: ${up.map(x=>`${e(x.n)} +${rub(x.d)}`).join(', ')}`);
    if(down.length) A.push(`🔻 Просели на баре: ${down.map(x=>`${e(x.n)} −${rub(Math.abs(x.d))}`).join(', ')}`);
  }
  add(...A);
}

const p=[];
if(prev){
  const dd=pct(perDay-prev.perDay,prev.perDay);
  if(dd>=15) p.push(`🔥 Сильный месяц: в день выручка ${rub(perDay)}, это на ${f(dd,1)}% выше, чем в ${e(prev.label)}.`);
  else if(dd>=3) p.push(`👍 Месяц лучше прошлого: ${rub(perDay)} в день (+${f(dd,1)}%).`);
  else if(dd>-3) p.push(`➖ Месяц в ровном темпе: ${rub(perDay)} в день, почти как в ${e(prev.label)} (${dd>0?'+':''}${f(dd,1)}%).`);
  else if(dd>-15) p.push(`📉 Месяц слабее прошлого: ${rub(perDay)} в день (${f(dd,1)}%).`);
  else p.push(`🥶 Заметная просадка: ${rub(perDay)} в день, это ${f(dd,1)}% к ${pm}.`);
  const dc=checks/nDays-prev.checks/prev.days, da=avgCheck-prev.avgCheck;
  if(dc>0&&da>0) p.push('🧾 Чеков в день больше и средний чек вырос — растём и по трафику, и по качеству 💪');
  else if(dc>0&&da<=0) p.push('🧾 Чеков в день больше, но средний чек просел — деньги дал объём, а не чек.');
  else if(dc<=0&&da>0) p.push('🧾 Чеков в день меньше, зато средний чек выше — гости тратят больше.');
  else p.push('🧾 И чеков в день, и средний чек ниже прошлого месяца — слабовато.');
  const gn=data.newGuests/nDays-prev.newGuests/prev.days;
  if(gn>0.05) p.push(`🆕 Новых гостей в день больше: ${f(data.newGuests/nDays,1)} против ${f(prev.newGuests/prev.days,1)} 🙌`);
  else if(gn<-0.05) p.push(`🆕 Новых гостей в день меньше: ${f(data.newGuests/nDays,1)} против ${f(prev.newGuests/prev.days,1)} — можно подтолкнуть акциями.`);
  if(loadAvg-prev.load>=2) p.push(`⚡ Загрузка выросла до ${f(loadAvg,1)}%.`); else if(loadAvg-prev.load<=-2) p.push(`⚡ Загрузка снизилась до ${f(loadAvg,1)}%.`);
} else {
  p.push(`💰 ${e(label.charAt(0).toUpperCase()+label.slice(1))} закрыт на ${rub(rev)}: в среднем ${rub(perDay)} в день. Сравнить пока не с чем — со следующего месяца здесь появятся стрелки ▲▼.`);
}
if(wkAvg>0) p.push(`🔥 Выходные приносят на ${f(pct(weAvg-wkAvg,wkAvg),0)}% больше будней: ${rub(weAvg)} против ${rub(wkAvg)} в день.`);
const full = weekRows.filter(w=>w.days===7);
if(full.length>=2){ const bw=[...full].sort((a,b)=>b.avg-a.avg)[0]; const lw=weekRows[weekRows.length-1];
  if(lw.days>=4 && lw.avg<bw.avg*0.95) p.push(`📉 Последняя неделя (${lw.n}) просела до ${rub(lw.avg)}/день против ${rub(bw.avg)}/день в лучшую (${bw.n}).`); }
p.push(`🔝 Рекордный день — ${dayStr(best.i)}: ${rub(best.v)}; самый тихий — ${dayStr(worst.i)}: ${rub(worst.v)}.`);
if(drinks.length>=2) p.push(`🥤 Бар дал ${f(pct(goodsSum,rev),1)}% выручки. Лидеры: ${e(drinks[0].n)} и ${e(drinks[1].n)} — вместе ${f(pct(drinks[0].v+drinks[1].v,drinksSum),1)}% напитков.`);
add('📝 <b>Итог</b>\n'+p.join('\n'));

// ---------- предупреждения и разбивка на сообщения ----------
const head=[];
if(warns.length) head.push(`⚠️ <b>Сверка не сошлась</b> (${e(warns.join('; '))}). Проверьте файл ${e(info.fileName)}.`);
if(nDays<expected) head.push(`⚠️ <b>Неполный месяц</b>: в файле ${nDays} дн. из ${expected}. Сравнение идёт в пересчёте на день.`);
if(hadSame) head.push(`🔁 Этот месяц уже был в таблице — данные обновлены.`);
const fullText = (head.length? head.join('\n')+'\n\n' : '') + sec.filter(Boolean).join('\n\n');

const LIM=3800;
const pack=(arr)=>{ const out=[]; let cur=''; for(const x of arr){ if(!x) continue; if(cur && (cur.length+2+x.length)>LIM){ out.push(cur); cur=x; } else cur = cur? cur+'\n\n'+x : x; } if(cur) out.push(cur); return out; };
const numSec = (head.length?[head.join('\n')]:[]).concat(sec.slice(0,numSecCount));
const anSec = sec.slice(numSecCount);               // «Что изменилось» + «Итог»
let parts = pack(numSec);
if(prev){ parts = parts.concat(pack(anSec)); }       // аналитика отдельным сообщением
else { const last=parts.pop()||''; parts = parts.concat(pack([last].concat(anSec))); }

return parts.map((t,i)=>({json:{ text: parts.length>1 ? t+`\n\n<i>Часть ${i+1} из ${parts.length}</i>` : t, part:i+1, total:parts.length, key, label, fullText, data: JSON.stringify(data) }}));
