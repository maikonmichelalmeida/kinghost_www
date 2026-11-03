'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=c=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c/100);
const time=t=>t?new Date(t).toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}):'—';
const dateTime=t=>new Date(t).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
const apiRoot='/api/entregas';
let token=localStorage.getItem('unifarma.token')||'',state=null,stops=[],quote=null,tab='today',map=null,marker=null,point=null,editIndex=null,searchResults=[],refreshing=false,toastTimer,orderSignature='',busy=0;
const statusNames={scheduled:'Encomendado',accepted:'Aceito · não visualizado',seen:'Visualizado',running:'Em entrega',done:'Concluído',cancelled:'Cancelado'};
function toast(message,error=false){$('toast').textContent=message;$('toast').classList.toggle('error',error);$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000);}
async function api(route,body){
 const response=await fetch(apiRoot+route,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(45000)});
 const data=await response.json();
 if(!response.ok){if(response.status===401&&route!='/login')logoutLocal();throw new Error(data.error||'Não foi possível completar a ação.');}return data;
}
async function run(button,fn){if(button?.disabled)return;busy++;if(button)button.disabled=true;try{return await fn();}catch(e){toast(e.name==='TimeoutError'?'A conexão demorou. Confira o estado antes de tentar novamente.':e.message,true);}finally{busy--;if(button?.isConnected)button.disabled=false;}}
function showTab(name){tab=name;for(const t of ['today','new','history','settings'])$('tab-'+t).hidden=t!==name;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));if(name==='new')renderDraft();}
function logoutLocal(){token='';localStorage.removeItem('unifarma.token');localStorage.removeItem('unifarma.expiresAt');state=null;stops=[];quote=null;orderSignature='';$('app').hidden=true;$('login-view').hidden=false;document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
async function refresh(){if(!token||refreshing||busy)return;refreshing=true;try{state=await api('/state');$('connection').hidden=true;renderState();}catch(e){if(token){$('connection').textContent='Sem atualização: '+e.message;$('connection').hidden=false;}}finally{refreshing=false;}}
function renderState(){
 const driver=state.user.role==='driver',av=state.availability;
 $('app').hidden=false;$('login-view').hidden=true;$('user-name').textContent=state.user.username;
 $('greeting').textContent=driver?'Olá, Maikon.':'Vamos entregar cuidado.';
 $('today').textContent=new Date(state.serverTime).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',weekday:'long',day:'numeric',month:'long'});
 $('new-tab').hidden=driver;$('settings-tab').hidden=!driver;
 if((tab==='settings'&&!driver)||(tab==='new'&&driver))showTab('today');
 const running=state.orders.some(o=>o.status==='running');
 const heading=av.open?(running?'Em rota · recebendo pedidos':'Disponível para entregas'):(av.scheduledAt?'Retorno programado':'Ocupado no momento');
 const description=av.open?'Atendimento aberto até 20h30. Novos pacotes entram na fila.':av.scheduledAt?`Abertura em ${dateTime(av.scheduledAt)}. Você já pode encomendar.`:'Aguarde uma nova abertura ou previsão de retorno.';
 const actions=driver?`<button class="primary" data-availability="${av.open?'close':'open'}">${av.open?'Pausar atendimento':'Abrir atendimento'}</button><button class="outline" data-schedule>Agendar abertura</button>${av.scheduledAt?'<button class="outline" data-availability="unschedule">Remover agendamento</button>':''}`:`<button class="primary" data-new ${!av.open&&!av.scheduledAt?'disabled':''}>${av.open?'＋ Solicitar entregas':'＋ Encomendar entregas'}</button>`;
 const availabilityHTML=`<div><span class="eyebrow"><span class="status-dot"></span>${av.open?'ATENDIMENTO ABERTO':'ATENDIMENTO PAUSADO'}</span><h2>${heading}</h2><p>${description}</p>${av.open&&av.scheduledAt?`<p>Próxima abertura: ${dateTime(av.scheduledAt)}</p>`:''}</div><div class="actions">${actions}</div>`;
 if($('availability-card').innerHTML!==availabilityHTML)$('availability-card').innerHTML=availabilityHTML;
 $('availability-card').classList.toggle('closed',!av.open);
 $('setup-notice').hidden=state.mapsReady&&!!state.settings.base;
 $('setup-notice').textContent=driver?(!state.mapsReady?'Configuração inicial: em Ajustes, cadastre a chave gratuita do Geoapify.':'Falta confirmar o ponto da farmácia/casa em Ajustes.'):'O atendimento está sendo preparado. Maikon precisa configurar o mapa e confirmar o ponto da farmácia.';
 $('order-count').textContent=state.orders.filter(o=>!['done','cancelled'].includes(o.status)).length;
 const signature=JSON.stringify([state.orders,driver]);
 if(orderSignature!==signature){$('orders').innerHTML=state.orders.length?state.orders.map(o=>orderCard(o,driver)).join(''):empty(driver?'Tudo pronto para o próximo chamado.':'Nenhuma entrega por aqui ainda.',driver?'Seus pacotes aparecerão aqui assim que a farmácia enviar.':'Adicione os endereços e organize a primeira viagem do dia.',!driver);orderSignature=signature;}
 $('day-total').innerHTML=`<div><b>Total do dia</b><p>Pacotes enviados hoje · cancelados não entram</p></div><strong>${money(state.totalCents)}</strong>`;
 $('credits').textContent=`Consumo reservado hoje: ${state.credits??0} créditos. Limite de segurança: 2.500/dia. Inclui buscas, mapas e cálculos.`;
 if(!$('history-day').value)$('history-day').value=state.day;
 $('calculate').disabled=!stops.length||(!av.open&&!av.scheduledAt)||!state.mapsReady||!state.settings.base;
 $('submit-order').disabled=!av.open&&!av.scheduledAt;
}
function empty(title,description,action=false){return `<div class="empty-state"><div class="empty-icon">↗</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${action?'<button class="primary" data-new>Adicionar primeira entrega</button>':''}</div>`;}
function stopLabel(p){return `${p.address} · nº ${p.number}${p.complement?' · '+p.complement:''}`;}
function coords(p){return `${p.lat},${p.lon}`;}
function mapsURL(points,origin){const u=new URL('https://www.google.com/maps/dir/');u.searchParams.set('api','1');u.searchParams.set('travelmode','driving');u.searchParams.set('dir_action','navigate');if(origin)u.searchParams.set('origin',coords(origin));u.searchParams.set('destination',coords(points.at(-1)));if(points.length>1)u.searchParams.set('waypoints',points.slice(0,-1).map(coords).join('|'));return u.href;}
function routeURL(o){const remaining=o.route.order.filter(i=>!o.delivered.some(d=>d.index===i)).map(i=>o.stops[i]);if(!remaining.length)return mapsURL([o.base]);const points=remaining.length<=3?[...remaining,o.base]:remaining.slice(0,4);return mapsURL(points,o.delivered.length?null:o.base);}
function orderCard(o,driver,history=false){
 const active=!['done','cancelled'].includes(o.status),next=o.route.order.find(i=>!o.delivered.some(d=>d.index===i));
 const btn=(a,label,cls='soft',extra='')=>`<button class="${cls}" data-order="${o.id}" data-action="${a}" ${extra}>${label}</button>`;
 let actions='';
 if(!history&&active){
  if(driver){
   if(!o.seenAt)actions+=btn('seen','✓ Visualizei');
   actions+=btn('delay','Vou em X minutos');
   if(['accepted','seen'].includes(o.status))actions+=btn('start','Iniciar rota no Google Maps ↗','primary');
   if(o.status==='running'){
    actions+=`<a class="navigation primary" href="${esc(routeURL(o))}" target="_blank" rel="noopener">${next===undefined?'Voltar para casa':'Abrir rota no Google Maps'} ↗</a>`;
    if(next!==undefined){actions+=`<a class="navigation outline" href="${esc(mapsURL([o.stops[next]]))}" target="_blank" rel="noopener">Navegar só até a próxima entrega ↗</a>`;actions+=btn('delivered','✓ Marcar próxima como entregue','soft',`data-index="${next}"`);}else actions+=btn('finish','Concluir pacote','primary');
   }
   actions+=btn('cancel','Cancelar pacote','plain');
  }else if(['accepted','scheduled'].includes(o.status))actions+=btn('cancel','Cancelar pacote','plain');
 }
 return `<article class="order-card"><div class="order-head"><div><h3>Pacote · ${o.stops.length} ${o.stops.length===1?'entrega':'entregas'}</h3><span class="small muted">${dateTime(o.createdAt)} · #${o.id.slice(0,6)}</span></div><span class="badge ${o.status}">${statusNames[o.status]||esc(o.status)}</span></div>${o.scheduledFor&&o.status==='scheduled'?`<div class="notice">Encomendado para ${dateTime(o.scheduledFor)}</div>`:''}${o.delayUntil?`<div class="notice">Maikon informou previsão para ${time(o.delayUntil)}.</div>`:''}${o.route.order.map((index,n)=>{const p=o.stops[index],delivered=o.delivered.find(d=>d.index===index);return `<div class="stop-line"><span class="stop-number">${delivered?'✓':n+1}</span><div class="stop-info"><strong>${esc(stopLabel(p))}</strong><p class="muted">${(p.meters/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})} km da farmácia${o.priority===index?' · Prioritária':''}${delivered?' · Entregue às '+time(delivered.at):''}</p>${p.note?`<p>${esc(p.note)}</p>`:''}${p.suggestedCents!==p.priceCents?`<p class="muted">Sugestão: ${money(p.suggestedCents)} · valor definido pela farmácia</p>`:''}</div><span class="stop-price">${money(p.priceCents)}</span></div>`;}).join('')}<div class="order-summary"><span class="small muted">Total do pacote<br>Trajeto estimado: ${Math.ceil(o.route.seconds/60)} min, com retorno</span><strong>${money(o.totalCents)}</strong></div><p class="order-timing">Aceito: ${time(o.acceptedAt)} · Visualizado: ${time(o.seenAt)}<br>Início: ${time(o.startedAt)} · Fim: ${time(o.finishedAt)}</p>${o.cancelReason?`<p class="small error">Cancelado: ${esc(o.cancelReason)}</p>`:''}${actions?`<div class="actions">${actions}</div>`:''}${driver&&o.status==='running'&&o.stops.length>3?'<p class="small muted">No navegador móvel, o link leva até 4 entregas por vez. Depois, abra a próxima; o retorno já foi considerado no cálculo.</p>':''}</article>`;
}
function invalidateQuote(){quote=null;$('quote').innerHTML='';$('submit-order').hidden=true;$('calculate').hidden=false;}
function renderDraft(){
 $('draft-stops').innerHTML=stops.map((p,i)=>`<article class="stop-card"><div class="stop-line"><span class="stop-number">${i+1}</span><div class="stop-info"><strong>${esc(stopLabel(p))}</strong><p class="muted">Ponto confirmado ✓</p>${p.note?`<p>${esc(p.note)}</p>`:''}</div></div><div class="actions"><button class="plain" data-edit="${i}">Editar</button><button class="plain error" data-remove="${i}">Remover</button></div></article>`).join('');
 $('add-stop').disabled=stops.length>=5;
 const selected=$('priority').value;
 $('priority').innerHTML='<option value="-1">Sem prioridade · melhor ordem</option>'+stops.map((p,i)=>`<option value="${i}">${i+1}. ${esc(p.address)}</option>`).join('');
 $('priority').value=Number(selected)<stops.length?selected:'-1';
 if(state)$('calculate').disabled=!stops.length||(!state.availability.open&&!state.availability.scheduledAt)||!state.mapsReady||!state.settings.base;
}
function readPrices(){return quote.stops.map((p,i)=>{const v=$('price-'+i).value.trim().replace(',','.');if(!/^\d+(\.\d{1,2})?$/.test(v))throw new Error('Informe cada preço com até duas casas decimais.');const cents=Math.round(Number(v)*100);if(cents<0||cents>100000)throw new Error('Cada preço deve ficar entre R$ 0 e R$ 1.000.');return cents;});}
function showQuote(){
 $('quote').innerHTML=`<article class="card quote-card"><h2>Confira os valores</h2><p class="muted">Preenchemos a sugestão. A farmácia pode corrigir o preço de cada entrega antes de enviar.</p>${quote.route.order.map((index,n)=>`<label>${n+1}. ${esc(quote.stops[index].address)}<input id="price-${index}" class="price-input" inputmode="decimal" value="${(quote.stops[index].priceCents/100).toFixed(2).replace('.',',')}" aria-label="Preço em reais da entrega ${index+1}"><small class="muted">Preço em R$ · sugestão ${money(quote.stops[index].suggestedCents)} · ${(quote.stops[index].meters/1000).toFixed(1).replace('.',',')} km</small></label>`).join('')}<div class="order-summary"><span>Total a enviar</span><strong id="quote-total">${money(quote.totalCents)}</strong></div><p class="small muted">Ordem otimizada com retorno à casa. Cotação válida por 15 minutos.</p><button class="plain" id="recalculate">Recalcular sugestão</button></article>`;
 $('calculate').hidden=true;$('submit-order').hidden=false;$('quote').scrollIntoView({behavior:'smooth',block:'start'});
}
function setPoint(p,recenter=true){point={lat:p.lat,lon:p.lon};$('point-confirmed').checked=false;if(marker)marker.setLatLng([p.lat,p.lon]);else{marker=L.marker([p.lat,p.lon],{draggable:true,icon:L.divIcon({className:'',html:'<div class="pin"></div>',iconSize:[28,28],iconAnchor:[14,28]})}).addTo(map);marker.on('dragend',()=>{const ll=marker.getLatLng();setPoint({lat:ll.lat,lon:ll.lng},false);});}if(recenter)map.setView([p.lat,p.lon],18);$('verify-google').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(coords(point));$('verify-google').hidden=false;}
function initMap(){
 if(map)return;if(!window.L)throw new Error('Não foi possível carregar o mapa. Atualize a página.');
 map=L.map('map',{scrollWheelZoom:false}).setView([-29.944,-50.991],13);
 const Tiles=L.GridLayer.extend({createTile(c,done){const img=document.createElement('img');img.alt='';fetch(`${apiRoot}/tiles/${c.z}/${c.x}/${c.y}`,{headers:{Authorization:'Bearer '+token}}).then(async r=>{if(!r.ok){const e=await r.json();throw new Error(e.error);}return r.blob();}).then(blob=>{const object=URL.createObjectURL(blob);img.onload=()=>{URL.revokeObjectURL(object);done(null,img);};img.onerror=()=>{URL.revokeObjectURL(object);done(new Error('Mapa indisponível'),img);};img.src=object;}).catch(e=>{$('map-help').textContent=e.message;done(e,img);});return img;}});
 new Tiles({attribution:'<a href="https://www.geoapify.com/">Geoapify</a> | <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>',maxZoom:20}).addTo(map);
 map.on('click',e=>setPoint({lat:e.latlng.lat,lon:e.latlng.lng},false));
}
function openAddress(index){
 editIndex=index;const base=index==='base',p=base?state.settings.base:stops[index];point=null;searchResults=[];
 $('address-title').textContent=base?'Confirme farmácia e casa':'Confirme o endereço';$('delivery-fields').hidden=base;
 $('search-address').value=base?state.settings.baseAddress:p?stopLabel(p):'';
 $('stop-address').value=p?.address||'';$('stop-number').value=p?.number||'';$('stop-complement').value=p?.complement||'';$('stop-note').value=p?.note||'';
 $('point-confirmed').checked=false;$('address-error').textContent='';$('search-results').innerHTML='';$('verify-google').hidden=true;$('map-help').textContent='Busque o endereço e arraste o marcador até a entrada correta.';
 $('address-dialog').showModal();initMap();if(marker){map.removeLayer(marker);marker=null;}map.invalidateSize();if(p)setPoint(p);else if(state.settings.base)map.setView([state.settings.base.lat,state.settings.base.lon],14);
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.dataset.tab)showTab(b.dataset.tab);
 if(b.hasAttribute('data-new'))showTab('new');
 if(b.hasAttribute('data-schedule')){$('schedule-dialog').showModal();}
 if(b.dataset.availability)run(b,async()=>{await api('/availability',{action:b.dataset.availability});state=await api('/state');renderState();});
 if(b.dataset.edit!==undefined)run(b,()=>openAddress(Number(b.dataset.edit)));
 if(b.dataset.remove!==undefined){stops.splice(Number(b.dataset.remove),1);$('priority').value='-1';invalidateQuote();renderDraft();}
 if(b.dataset.result!==undefined){const p=searchResults[Number(b.dataset.result)];setPoint(p);$('stop-address').value=p.address;$('stop-number').value=p.number||$('stop-number').value;$('map-help').textContent=p.exact?'Confira o número e a entrada no mapa.':'Número não confirmado pelo mapa. Ajuste o marcador na entrada correta.';$('search-results').innerHTML='';}
 if(b.dataset.order){const o=state.orders.find(o=>o.id===b.dataset.order);const action=b.dataset.action;let body={action};let navigationWindow=null;
  if(action==='cancel'){const reason=prompt('Motivo do cancelamento do pacote inteiro:');if(!reason)return;body.reason=reason;}
  if(action==='delay'){const minutes=prompt('Em quantos minutos você estará disponível?','10');if(minutes===null)return;body.minutes=Number(minutes);}
  if(action==='delivered')body.index=Number(b.dataset.index);
  if(action==='start')navigationWindow=window.open('about:blank','_blank');
  run(b,async()=>{try{const updated=await api(`/orders/${o.id}/action`,body);if(action==='start'){const url=routeURL(updated);if(navigationWindow)navigationWindow.location.replace(url);else toast('Rota iniciada. Toque em Abrir rota no Google Maps.');}state=await api('/state');renderState();}catch(error){navigationWindow?.close();throw error;}});
 }
 if(b.id==='recalculate'){invalidateQuote();$('calculate').click();}
});
$('login-form').addEventListener('submit',e=>{e.preventDefault();run(e.submitter,async()=>{try{const result=await api('/login',{username:$('username').value,password:$('password').value});token=result.token;localStorage.setItem('unifarma.token',token);localStorage.setItem('unifarma.expiresAt',result.expiresAt);$('password').value='';$('login-error').textContent='';state=await api('/state');renderState();}catch(e){$('login-error').textContent=e.message;throw e;}});});
$('show-password').onclick=()=>{const show=$('password').type==='password';$('password').type=show?'text':'password';$('show-password').textContent=show?'Ocultar':'Mostrar';};
$('logout').onclick=e=>run(e.currentTarget,async()=>{await api('/logout',{});logoutLocal();});
$('add-stop').onclick=e=>run(e.currentTarget,()=>openAddress(stops.length));
$('edit-base').onclick=e=>run(e.currentTarget,()=>openAddress('base'));
$('close-address').onclick=()=>$('address-dialog').close();
$('close-schedule').onclick=()=>$('schedule-dialog').close();
$('search-form').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{const result=await api('/search?q='+encodeURIComponent($('search-address').value));searchResults=result.results;$('search-results').innerHTML=searchResults.length?searchResults.map((p,i)=>`<button type="button" class="search-result" data-result="${i}">${esc(p.address)}${!p.exact?'<small>Confira o número e ajuste o ponto no mapa</small>':''}</button>`).join(''):'<p class="notice">Nenhum resultado. Tente o nome da rua sem abreviação. Você também pode marcar o ponto diretamente no mapa.</p>';});};
$('save-address').onclick=e=>run(e.currentTarget,async()=>{if(!point||!$('point-confirmed').checked)throw new Error('Confira o marcador e marque a confirmação.');if(editIndex==='base'){await api('/base',{...point,confirmed:true});state=await api('/state');renderState();}else{if(!$('stop-address').value.trim()||!$('stop-number').value.trim())throw new Error('Informe endereço e número (ou S/N).');stops[editIndex]={...point,address:$('stop-address').value.trim(),number:$('stop-number').value.trim(),complement:$('stop-complement').value.trim(),note:$('stop-note').value.trim(),confirmed:true};invalidateQuote();renderDraft();}$('address-dialog').close();});
for(const id of ['stop-address','stop-number'])$(id).addEventListener('input',()=>$('point-confirmed').checked=false);
$('priority').onchange=()=>{if($('priority').value!=='-1'&&!confirm('Colocar esta entrega em primeiro lugar, mesmo que aumente o percurso?'))$('priority').value='-1';invalidateQuote();};
$('calculate').onclick=e=>run(e.currentTarget,async()=>{quote=await api('/quote',{stops,priority:Number($('priority').value)});showQuote();});
$('quote').addEventListener('input',()=>{try{$('quote-total').textContent=money(readPrices().reduce((a,b)=>a+b,0));}catch{$('quote-total').textContent='Confira os valores';}});
$('submit-order').onclick=e=>run(e.currentTarget,async()=>{if(!quote)throw new Error('Calcule o pacote primeiro.');await api('/orders',{quoteId:quote.id,prices:readPrices()});stops=[];invalidateQuote();renderDraft();showTab('today');state=await api('/state');renderState();toast('Pacote enviado. A confirmação de visualização aparecerá aqui.');});
$('schedule-form').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{await api('/availability',{action:'schedule',at:$('schedule-at').value+':00-03:00'});$('schedule-dialog').close();state=await api('/state');renderState();toast('Abertura programada.');});};
$('key-form').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{await api('/configuration',{key:$('geo-key').value.trim()});$('geo-key').value='';state=await api('/state');renderState();if(map){map.remove();map=null;marker=null;}toast('Chave salva. Agora confirme o ponto da farmácia no mapa.');});};
$('history-form').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{const result=await api('/history?day='+encodeURIComponent($('history-day').value));const total=result.orders.filter(o=>o.status!=='cancelled').reduce((n,o)=>n+o.totalCents,0);$('history-orders').innerHTML=result.orders.length?`<div class="total-card"><b>Total arquivado</b><strong>${money(total)}</strong></div>`+result.orders.map(o=>orderCard(o,state.user.role==='driver',true)).join(''):empty('Nenhum registro arquivado.','Confira a data. Os pedidos de hoje estão na aba Hoje.');});};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
window.addEventListener('online',refresh);
setInterval(()=>{if(!document.hidden)refresh();},12000);
if(token)refresh();
if(location.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname)){
 $('login-error').textContent='Para entrar, use o endereço HTTPS com certificado válido.';
 const link=document.createElement('a');link.href='https://'+location.host+location.pathname;link.textContent='Abrir acesso seguro ↗';$('login-error').append(document.createElement('br'),link);
 $('login-form button[type="submit"]').disabled=true;
}
