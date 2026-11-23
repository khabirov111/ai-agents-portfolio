// ===== Расчёт отчёта Langame (shift / week). Вход: items Extract From File (строки листа "Отчет") =====
const typeInfo = $('Классификация').first().json;
const kind = typeInfo.kind; // 'shift' | 'week'

function colIdx(k){ if(/^\d+$/.test(k)) return +k; let n=0; for(const ch of String(k).toUpperCase()){ if(ch<'A'||ch>'Z') return -1; n=n*26+ch.charCodeAt(0)-64;} return n-1; }
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
const find = (label, from=0, to=rows.length) => { for(let i=from;i<to;i++) if(L[i]===label) return i; return -1; };

// колонки смен
let cols;
if(kind==='shift') cols=[1];
else { const ir=find('ID'); const idRow=rows[find('ID',find('ID')+1)] ; cols=[]; for(let c=1;c<idRow.length;c++) if(typeof idRow[c]==='number'||/^\d+$/.test(String(idRow[c]))) cols.push(c); }
if(!cols.length || rows.length<50) throw new Error('Не удалось разобрать структуру файла: колонок смен='+cols.length+', строк='+rows.length);
const vals = (i)=> i<0 ? cols.map(()=>0) : cols.map(c=>num(rows[i][c]));
const sum = a=>a.reduce((x,y)=>x+y,0);
const sec = {};
for(const n of ['Статистика по балансам','Статистика по гостям','Статистика по ПК','Общая статистика','Статистика по операциям']) sec[n]=find(n);
for(const [n,i] of Object.entries(sec)) if(i<0) throw new Error('Не найден раздел «'+n+'» — формат файла изменился');
const g = (label, from, to) => vals(find(label, from, to));
const S = (label, from, to) => sum(g(label, from, to));

const revI = find('Итого выручка'); if(revI<0) throw new Error('Не найдена строка «Итого выручка»');
const revByShift = vals(revI);
const end1 = sec['Статистика по балансам'];
const chan = {};
for(const n of ['Касса администратора','Личный кабинет','Терминал самообслуживания','QR','Мобильное приложение','Планшет']) chan[n]=S(n,revI,end1);
const cashI = find('Касса администратора',revI,end1);
const cashAdmin = S('Наличные',cashI,end1);
const cardAdmin = S('Безналичные',cashI,end1);
const incas = S('Инкассации',cashI,end1);

const B=sec['Статистика по балансам'], G=sec['Статистика по гостям'], P=sec['Статистика по ПК'], O=sec['Общая статистика'], X=sec['Статистика по операциям'];
const m = {
  revenue: sum(revByShift),
  checks: S('Количество чеков',O,X),
  guests: S('Уникальных гостей',G,P),
  newGuests: S('Новые гости',G,P),
  regs: S('Регистрации',G,P),
  goodsSum: S('Сумма проданных товаров',O,X),
  goodsQty: S('Количество проданных товаров',O,X),
  goodsCost: S('Сумма проданных товаров по себестоимости',O,X),
  written: S('Количество списанных товаров',O,X),
  topup: S('Сумма пополнения на аккаунты',O,X),
  sessions: S('Активированных сессий',P,O),
  minutesPC: S('Минуты сессий на ПК',P,O),
  minutesTV: S('Минуты сессий на ТВ',P,O),
  bookDone: S('Сделанных бронирований',P,O),
  bookAct: S('Активированных бронирований',P,O),
  bonusIn: S('Пополнения бонусного баланса',B,G),
  cashback: S('Кешбек по сессии',find('Пополнения бонусного баланса',B,G),G),
  moneyOut: S('Списания денежного баланса',B,G),
  bonusOut: S('Списания бонусного баланса',B,G),
  moneyRet: S('Возвраты денежного баланса',B,G),
  bonusRet: S('Возвраты бонусного баланса',B,G),
  cash: cashAdmin, card: cardAdmin, incas, chan,
  qr: S('QR',O,X), online: S('Картой онлайн',find('Сумма от способов пополнения',O,X),X),
};
const loadArr = g('Загрузка в %',P,O).filter(x=>x>0);
m.load = loadArr.length? sum(loadArr)/loadArr.length : 0;
const hp = g('Средняя стоимость часа',P,O).filter(x=>x>0); m.hourPrice = hp.length? sum(hp)/hp.length:0;
const hpn = g('Средняя стоимость часа без бонусов',P,O).filter(x=>x>0); m.hourPriceNB = hpn.length? sum(hpn)/hpn.length:0;
m.avgCheck = m.checks? m.revenue/m.checks : 0;
// товары по позициям
const tI = find('Товары', X, rows.length);
let tEnd = find('Услуги', tI, rows.length);
const products=[];
for(let i=tI+1;i<tEnd;i++){ const t=sum(vals(i)); if(L[i]) products.push({name:L[i], sum:t}); }
products.sort((a,b)=>b.sum-a.sum);
// шапка
const hdr = (label)=>{ const i=find(label); return i<0?'':rows[i][1]; };
let meta, perShift=[];
if(kind==='shift'){
  meta={ id:hdr('ID'), start:hdr('Дата начала'), end:hdr('Дата окончания'), admin:hdr('Администратор') };
} else {
  const i2=find('ID',find('ID')+1);
  meta={ id:hdr('ID'), start:hdr('Дата начала'), end:hdr('Дата окончания') };
  const A=rows[find('Администратор')], ids=rows[i2], st=rows[find('Дата начала',i2)];
  const gs=g('Сумма проданных товаров',O,X), gq=g('Количество проданных товаров',O,X), ch=g('Количество чеков',O,X);
  perShift = cols.map((c,k)=>({id:ids[c], admin:norm(A[c]), start:st[c], revenue:revByShift[k], goods:gs[k], qty:gq[k], checks:ch[k]}));
  meta.shifts=cols.length; meta.firstShift=perShift[0].id; meta.lastShift=perShift[perShift.length-1].id;
}
// рейтинг админов по товарам
const adm={};
for(const s of perShift){ const a=adm[s.admin]=adm[s.admin]||{name:s.admin,shifts:0,goods:0,qty:0,revenue:0}; a.shifts++; a.goods+=s.goods; a.qty+=s.qty; a.revenue+=s.revenue; }
const ranking = Object.values(adm).filter(a=>a.goods>0).sort((a,b)=>b.goods-a.goods||b.qty-a.qty);
// сверка
const checksList=[];
const chanSum=sum(Object.values(chan)); if(Math.abs(chanSum-m.revenue)>1) checksList.push(`сумма по каналам ${chanSum} ≠ выручка ${m.revenue}`);
if(kind==='week'){ const rs=sum(perShift.map(s=>s.goods)); if(Math.abs(rs-m.goodsSum)>1) checksList.push('товары по сменам ≠ итог'); if(ranking.length && Math.abs(sum(ranking.map(a=>a.goods))-m.goodsSum)>1) checksList.push('рейтинг админов ≠ итог товаров'); }
if(products.length && Math.abs(sum(products.map(p=>p.sum))-m.goodsSum)>1) checksList.push(`позиции товаров ${sum(products.map(p=>p.sum))} ≠ ${m.goodsSum}`);
if(!(m.revenue>0)) checksList.push('нулевая выручка');
if(m.checks<=0) checksList.push('нет чеков');

// ===== сравнение с предыдущим (хранится в staticData) =====
const key = kind==='shift'?'prevShift':'prevWeek';
const cur = { id:meta.id, revenue:m.revenue, checks:m.checks, avgCheck:+m.avgCheck.toFixed(2), goodsSum:m.goodsSum, goodsQty:m.goodsQty, guests:m.guests, newGuests:m.newGuests, load:+m.load.toFixed(1), sessions:m.sessions, start:meta.start };
// прошлое значение читаем из Google Таблицы (колонка «Данные», JSON)
let prevData=null, prevRaw='';
try{ prevRaw = $(kind==='shift'?'Прошлая смена':'Прошлая неделя').first().json['Данные'] || ''; }catch(e){}
try{ prevData = prevRaw? JSON.parse(prevRaw) : null; }catch(e){ prevData=null; }
// если пришёл повтор того же отчёта — сравниваем с тем, что было до него
let prev = null;
if(prevData && prevData.cur){ prev = String(prevData.cur.id)===String(cur.id) ? (prevData.prev||null) : prevData.cur; }
const newPrevOfPrev = prevData && prevData.cur && String(prevData.cur.id)!==String(cur.id) ? prevData.cur : (prevData?prevData.prev:null);

// ===== формат =====
const e=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const f=(n,d=0)=>Number(n).toLocaleString('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d}).replace(/ /g,' ');
const rub=n=>f(n)+' ₽';
const pct=(a,b)=>b? Math.round(a/b*1000)/10 : 0;
const dd=(t)=>String(t||'').slice(0,16);
const pk=(arr,seed)=>arr[Math.abs(parseInt(String(seed).replace(/\D/g,''))||0)%arr.length];
const hours=(min)=>`${f(min/60,1)} ч`;
const dl=(a,b,d=0,unit='')=>{ if(b==null||b===0) return ''; const diff=a-b; if(!diff) return ' ➖ без изменений'; const p=pct(diff,Math.abs(b)); return ` ${diff>0?'▲ +':'▼ −'}${f(Math.abs(diff),d)}${unit} (${diff>0?'+':'−'}${f(Math.abs(p),1)}%)`; };
const medal=['🥇','🥈','🥉','4️⃣','5️⃣'];
const chIcon={'Касса администратора':'🏧 Касса админа','Личный кабинет':'🖥 Личный кабинет','Терминал самообслуживания':'🧮 Терминал','QR':'🔳 QR','Мобильное приложение':'📱 Приложение','Планшет':'📟 Планшет'};
let out=[]; const P_=(s)=>out.push(s);
const payBlock=()=>{ for(const [k,v] of Object.entries(chan)){ if(v<=0) continue; P_(`${chIcon[k]}: ${rub(v)} (${f(pct(v,m.revenue),1)}%)`); if(k==='Касса администратора'){ P_(`   ├ 💵 Наличные: ${rub(m.cash)}`); P_(`   └ 💳 Карта: ${rub(m.card)}`); } } };
const topProducts=(n)=>{ const tp=products.filter(p=>p.sum>0).slice(0,n); tp.forEach((p,i)=>P_(`   ${i+1}. ${e(p.name)} — ${rub(p.sum)}`)); };
if(kind==='shift'){
  const startH=parseInt(String(meta.start).slice(11,13)); const night = startH>=18 || startH<5;
  P_(`${night?'🌙':'☀️'} <b>Отчёт за смену №${e(meta.id)}</b> · ${night?'ночная':'дневная'}`);
  P_(`📅 ${e(dd(meta.start))} → ${e(dd(meta.end))}`);
  P_(`👤 Админ: <b>${e(norm(meta.admin))}</b>`);
  P_('');
  P_(`💰 <b>Выручка: ${rub(m.revenue)}</b>${prev?dl(m.revenue,prev.revenue):''}`);
  P_(`🧾 Чеков: <b>${f(m.checks)}</b>${prev?dl(m.checks,prev.checks):''}`);
  P_(`🧮 Средний чек: <b>${f(m.avgCheck,2)} ₽</b>${prev?dl(m.avgCheck,prev.avgCheck,2):''}`);
  P_('');
  P_('💳 <b>Структура оплат</b>'); payBlock();
  P_(`🏦 Инкассировано: <b>${rub(m.incas)}</b>${m.incas===m.cash?' ✅ равно наличным':''}`);
  P_('');
  P_('🎮 <b>Клуб</b>');
  P_(`👥 Гостей: <b>${f(m.guests)}</b>${prev?dl(m.guests,prev.guests):''}`);
  P_(`🆕 Новых: ${f(m.newGuests)} (регистраций ${f(m.regs)})`);
  P_(`⚡ Загрузка: <b>${f(m.load,1)}%</b>${prev?dl(m.load,prev.load,1,' п.п.'):''}`);
  P_(`🕹 Сессий: ${f(m.sessions)}`);
  P_(`🖥 Время ПК: ${hours(m.minutesPC)}${m.minutesTV?` · 📺 ТВ: ${hours(m.minutesTV)}`:''}`);
  P_(`⏱ Ср. стоимость часа: ${f(m.hourPrice)} ₽ (без бонусов ${f(m.hourPriceNB)} ₽)`);
  if(m.bookDone) P_(`📆 Бронирований: ${f(m.bookDone)} (активировано ${f(m.bookAct)})`);
  P_('');
  P_('🥤 <b>Бар</b>');
  P_(`🛒 Продано: <b>${f(m.goodsQty)} шт.</b> на <b>${rub(m.goodsSum)}</b>${prev?dl(m.goodsSum,prev.goodsSum):''}`);
  if(products.some(p=>p.sum>0)){ P_('🔝 Позиции:'); topProducts(5); }
  if(m.written) P_(`🗑 Списано: ${f(m.written)} шт.`);
  P_('');
  P_('🔄 <b>Балансы и бонусы</b>');
  P_(`💸 Списано с баланса: ${rub(m.moneyOut)}`);
  P_(`↩️ Возвраты: ${rub(m.moneyRet)} + бонусами ${rub(m.bonusRet)}`);
  P_(`➕ Бонусов начислено: ${rub(m.bonusIn)}`);
  P_(`➖ Бонусов списано: ${rub(m.bonusOut)}`);
  P_('');
  const sid=meta.id; const parts=[];
      if(prev){ const d=pct(m.revenue-prev.revenue,prev.revenue);
        if(d>=30) parts.push(pk([`🔥 Вот это смена! Выручка ${rub(m.revenue)} — на ${f(d,0)}% больше, чем в прошлой.`,`🚀 Отличный результат: ${rub(m.revenue)}, это на ${f(d,0)}% выше прошлой смены.`],sid));
        else if(d>=10) parts.push(pk([`👍 Смена получилась лучше предыдущей: ${rub(m.revenue)} (+${f(d,1)}%).`,`📈 Приятный рост к прошлой смене — +${f(d,1)}%, итого ${rub(m.revenue)}.`],sid));
        else if(d>-10) parts.push(pk([`😌 Ровная смена: ${rub(m.revenue)}, почти как в прошлый раз (${d>0?'+':''}${f(d,1)}%).`,`➖ Без сюрпризов: выручка ${rub(m.revenue)}, на уровне прошлой смены.`],sid));
        else if(d>-30) parts.push(pk([`📉 Просадка к прошлой смене: ${rub(m.revenue)} (${f(d,1)}%). Стоит глянуть, что было с трафиком.`,`⚠️ Выручка ниже прошлой смены на ${f(Math.abs(d),1)}% — ${rub(m.revenue)}.`],sid));
        else parts.push(pk([`🥶 Тихая смена: ${rub(m.revenue)}, это на ${f(Math.abs(d),0)}% меньше прошлой. Стоит разобраться, почему.`,`🔻 Сильная просадка (${f(d,0)}%) к прошлой смене — ${rub(m.revenue)}.`],sid));
      } else parts.push(`💰 Выручка смены — ${rub(m.revenue)}, сравнить пока не с чем: в таблице нет прошлой смены.`);
      if(prev){ const dc=m.checks-prev.checks, da=m.avgCheck-prev.avgCheck;
        if(dc>0&&da>0) parts.push('🧾 Чеков стало больше и средний чек вырос — растём и по количеству, и по качеству 💪');
        else if(dc>0&&da<=0) parts.push('🧾 Гостей прошло больше, но средний чек просел — деньги дают объём, а не чек.');
        else if(dc<=0&&da>0) parts.push('🧾 Чеков меньше, зато средний чек выше — гости тратят больше.');
        else parts.push('🧾 Чеков и средний чек ниже прошлой смены — слабовато.'); }
      if(m.load>=40) parts.push(`⚡ Клуб был загружен на ${f(m.load,1)}% — почти полный зал 🎮`);
      else if(m.load<20) parts.push(`⚡ Загрузка всего ${f(m.load,1)}% — зал большую часть смены пустовал.`);
      else if(prev && m.load-prev.load>=3) parts.push(`⚡ Загрузка выросла до ${f(m.load,1)}%.`);
      if(m.newGuests>=3) parts.push(`🆕 Приятно: ${f(m.newGuests)} новых гостей 🙌`);
      if(products.length&&products[0].sum>0) parts.push(`🥤 На баре лидировал ${products[0].name} (${rub(products[0].sum)}).`);
      if(m.goodsSum===0) parts.push('Бар сегодня без продаж — стоит напомнить админу про допродажи 🥤');
      const concl=parts;
  
  P_('📝 <b>Итог</b>'); P_(e(concl.join('\n')));
} else {
  P_(`📊 <b>Отчёт за неделю №${e(meta.id)}</b>`);
  P_(`📅 ${e(dd(meta.start))} → ${e(dd(meta.end))}`);
  P_(`🔢 Смен: ${meta.shifts} (№${meta.firstShift}–${meta.lastShift})`);
  P_('');
  const best=[...perShift].sort((a,b)=>b.revenue-a.revenue)[0], worst=[...perShift].sort((a,b)=>a.revenue-b.revenue)[0];
  P_(`💰 <b>Выручка: ${rub(m.revenue)}</b>${prev?dl(m.revenue,prev.revenue):''}`);
  P_(`🧾 Чеков: <b>${f(m.checks)}</b>${prev?dl(m.checks,prev.checks):''}`);
  P_(`🧮 Средний чек: <b>${f(m.avgCheck,2)} ₽</b>${prev?dl(m.avgCheck,prev.avgCheck,2):''}`);
  P_(`📆 В среднем за смену: ${rub(m.revenue/meta.shifts)}`);
  P_(`🔝 Лучшая смена: №${best.id} — ${rub(best.revenue)} (${e(best.admin.split(' ').slice(0,2).join(' '))})`);
  P_(`🔻 Слабая смена: №${worst.id} — ${rub(worst.revenue)}`);
  P_('');
  P_('💳 <b>Структура оплат</b>'); payBlock();
  P_(`🏦 Инкассировано за неделю: <b>${rub(m.incas)}</b>`);
  P_('');
  P_('🎮 <b>Клуб</b>');
  P_(`👥 Гостей: <b>${f(m.guests)}</b>${prev?dl(m.guests,prev.guests):''}`);
  P_(`🆕 Новых: <b>${f(m.newGuests)}</b>${prev?dl(m.newGuests,prev.newGuests):''}`);
  P_(`⚡ Средняя загрузка: <b>${f(m.load,1)}%</b>${prev?dl(m.load,prev.load,1,' п.п.'):''}`);
  P_(`🕹 Сессий: ${f(m.sessions)}`);
  P_(`🖥 Время ПК: ${hours(m.minutesPC)}`);
  P_(`⏱ Ср. стоимость часа: ${f(m.hourPrice)} ₽`);
  P_('');
  P_('🥤 <b>Бар</b>');
  P_(`🛒 Продано: <b>${f(m.goodsQty)} шт.</b> на <b>${rub(m.goodsSum)}</b>${prev?dl(m.goodsSum,prev.goodsSum):''}`);
  P_(`📈 Доля в выручке: ${f(pct(m.goodsSum,m.revenue),1)}%`);
  if(products.some(p=>p.sum>0)){ P_('🔝 Топ позиций:'); topProducts(5); }
  P_('');
  P_('🏆 <b>ТОП админов по продаже товаров</b>');
  ranking.slice(0,5).forEach((a,i)=>{ P_(`${medal[i]} <b>${e(a.name)}</b>`); P_(`   └ ${rub(a.goods)} · ${f(a.qty)} шт. · ${a.shifts} см. · ${rub(Math.round(a.goods/a.shifts))}/смена`); });
  P_('');
  P_('🔄 <b>Возвраты и бонусы</b>');
  P_(`↩️ Возвраты: ${rub(m.moneyRet)} + бонусами ${rub(m.bonusRet)}`);
  P_(`➕ Бонусов начислено: ${rub(m.bonusIn)}`);
  P_(`➖ Бонусов списано: ${rub(m.bonusOut)}`);
  P_('');
  const sid=meta.id; const parts=[];
      if(prev){ const d=pct(m.revenue-prev.revenue,prev.revenue);
        if(d>=15) parts.push(pk([`🔥 Сильная неделя: ${rub(m.revenue)}, это на ${f(d,1)}% больше прошлой.`,`🚀 Рост к прошлой неделе +${f(d,1)}% — итого ${rub(m.revenue)}.`],sid));
        else if(d>=3) parts.push(`👍 Неделя лучше прошлой: ${rub(m.revenue)} (+${f(d,1)}%).`);
        else if(d>-3) parts.push(`➖ Неделя в ровном темпе: ${rub(m.revenue)}, почти как прошлая (${d>0?'+':''}${f(d,1)}%).`);
        else if(d>-15) parts.push(`📉 Неделя слабее прошлой на ${f(Math.abs(d),1)}% — ${rub(m.revenue)}.`);
        else parts.push(`🥶 Заметная просадка: ${f(d,1)}% к прошлой неделе, итого ${rub(m.revenue)}.`);
      } else parts.push(`💰 Выручка недели — ${rub(m.revenue)}, сравнить пока не с чем: в таблице нет прошлой недели.`);
      parts.push(`📆 В среднем ${rub(m.revenue/meta.shifts)} за смену, лучшая — №${best.id} (${rub(best.revenue)}), слабее всех — №${worst.id} (${rub(worst.revenue)}).`);
      if(prev){ const dn=m.newGuests-prev.newGuests; if(dn>0) parts.push(`🆕 Новых гостей на ${f(dn)} больше, чем неделей раньше — всего ${f(m.newGuests)} 🙌`); else if(dn<0) parts.push(`🆕 Новых гостей стало меньше (${f(m.newGuests)}) — можно подтолкнуть акциями.`); }
      if(ranking[0]){ const r0=ranking[0]; parts.push(`🏆 По бару выше всех ${r0.name.split(' ').slice(0,2).join(' ')} — ${rub(r0.goods)} за ${r0.shifts} см.`);
        const eff=[...ranking].sort((a,b)=>b.goods/b.shifts-a.goods/a.shifts)[0]; if(eff && eff.name!==r0.name) parts.push(`⭐ А по выручке бара на одну смену впереди ${eff.name.split(' ').slice(0,2).join(' ')} — ${rub(Math.round(eff.goods/eff.shifts))}.`); }
      parts.push(`🥤 Бар дал ${f(pct(m.goodsSum,m.revenue),1)}% выручки.`);
      const concl=parts;
  
  P_('📝 <b>Итог</b>'); P_(e(concl.join('\n')));
}
let text = out.join('\n');
if(checksList.length){
  text = `⚠️ <b>Сверка не сошлась</b> (${e(checksList.join('; '))}). Проверьте файл ${e(typeInfo.fileName)}.\n\n`+text;
}
const data = checksList.length && prevRaw ? prevRaw : JSON.stringify({cur, prev:newPrevOfPrev||null});
return [{json:{text, data, kind, meta, metrics:m, checks:checksList, ranking, cur, prev}}];
