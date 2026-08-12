const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const adjectives = ['Blue','Silver','Crimson','Silent','Rapid','Neon','Golden','Arctic','Bright','Velvet'];
const animals = ['Wasp','Falcon','Otter','Fox','Lynx','Raven','Panda','Koala','Manta','Finch'];
const randomName = () => `${adjectives[Math.floor(Math.random()*adjectives.length)]} ${animals[Math.floor(Math.random()*animals.length)]}`;
const room = (() => {
  const p = new URLSearchParams(location.search);
  let r = p.get('room');
  if (!r) {
    r = crypto.randomUUID().replaceAll('-', '').slice(0,10).toUpperCase();
    const url = new URL(location.href); url.searchParams.set('room', r); history.replaceState({},'',url);
  }
  return r;
})();

const device = {
  id: null,
  name: localStorage.getItem('waveshare-name') || randomName(),
};
localStorage.setItem('waveshare-name', device.name);

const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
const peers = new Map();
const transfers = new Map();
let connected = false;

const $ = (id) => document.getElementById(id);
$('deviceName').textContent = device.name;
$('roomChip').textContent = room;

function setStatus(text, tone='idle') {
  $('connectionText').textContent = text;
  document.querySelector('.status-dot').style.color = tone === 'ok' ? '#6dff9a' : tone === 'error' ? '#ff6c78' : '#ffb84d';
}
function send(data){ if(ws.readyState===WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function peerEntry(id, name, state='Ready'){
  return `<div class="peer-card"><div class="peer-meta"><div class="peer-name">${escapeHtml(name)}</div><div class="peer-status">${state}</div></div><button class="peer-send" data-send="${id}">Kirim file</button></div>`;
}
function renderPeers(list){
  const filtered=list.filter(x=>x.id!==device.id);
  $('peerList').innerHTML = filtered.length ? filtered.map(p=>peerEntry(p.id,p.name)).join('') : '';
  document.querySelectorAll('[data-send]').forEach(btn => btn.onclick = () => pickFiles(btn.dataset.send));
  const rp=$('radarPeers'); rp.innerHTML='';
  filtered.slice(0,8).forEach((_,i)=>{
    const d=document.createElement('span'); d.className='peer-dot';
    const angle=(i/Math.max(1,filtered.length))*Math.PI*2; const radius=34 + (i%3)*8;
    d.style.left=`calc(50% + ${Math.cos(angle)*radius}%)`; d.style.top=`calc(50% + ${Math.sin(angle)*radius}%)`;
    rp.appendChild(d);
  });
}

ws.addEventListener('open',()=>{ connected=true; setStatus('Siap untuk berbagi','ok'); send({type:'join',room,name:device.name}); });
ws.addEventListener('close',()=>{ connected=false; setStatus('Server signaling terputus','error'); });
ws.addEventListener('error',()=>setStatus('Gagal menghubungkan','error'));
ws.addEventListener('message',async ({data})=>{
  const msg=JSON.parse(data);
  if(msg.type==='joined'){device.id=msg.id;}
  if(msg.type==='presence'){
    renderPeers(msg.devices);
    for(const p of msg.devices){if(p.id!==device.id && !peers.has(p.id)) peers.set(p.id,{name:p.name});}
  }
  if(msg.type==='signal') await handleSignal(msg.from,msg.data);
  if(msg.type==='signal-error') alert(msg.message);
});

$('deviceName').onclick=()=>openNameDialog();
$('nameBtn').onclick=()=>openNameDialog();
$('roomChip').onclick=async()=>{await navigator.clipboard.writeText(location.href); toast('Link room disalin');};
$('shareBtn').onclick=async()=>{if(navigator.share){try{await navigator.share({title:'WaveShare',text:'Buka room WaveShare ini',url:location.href});}catch{}}else{await navigator.clipboard.writeText(location.href);toast('Link room disalin')}};
$('qrBtn').onclick=()=>openQrDialog();
$('helpBtn').onclick=()=>openInfoDialog();
$('closeDialog').onclick=()=>$('dialog').close();
$('chooseBtn').onclick=()=>$('fileInput').click();
$('dropZone').onclick=(e)=>{if(!e.target.closest('button')) $('fileInput').click()};
$('dropZone').ondragover=(e)=>{e.preventDefault();$('dropZone').classList.add('dragover')};
$('dropZone').ondragleave=()=>$('dropZone').classList.remove('dragover');
$('dropZone').ondrop=(e)=>{e.preventDefault();$('dropZone').classList.remove('dragover'); chooseTargetAndSend([...e.dataTransfer.files])};
$('fileInput').onchange=()=>chooseTargetAndSend([...$('fileInput').files]);
$('clearTransfers').onclick=()=>{$('transferList').innerHTML='';$('transfers').hidden=true};

async function chooseTargetAndSend(files){
  if(!files.length) return;
  const ids=[...peers.keys()].filter(id=>document.querySelector(`[data-send="${id}"]`));
  if(ids.length===1) return sendFilesToPeer(ids[0],files);
  if(ids.length===0) return toast('Belum ada perangkat lain di room ini.');
  const html = `<p class="dialog-body">Pilih perangkat tujuan:</p>${ids.map(id=>`<button class="mini" style="width:100%;margin-top:8px;text-align:left" data-pick="${id}">${escapeHtml(peers.get(id)?.name||id)}</button>`).join('')}`;
  openDialog('Pilih perangkat',html);
  document.querySelectorAll('[data-pick]').forEach(btn=>btn.onclick=()=>{ $('dialog').close(); sendFilesToPeer(btn.dataset.pick,files); });
}
function pickFiles(peerId){ $('fileInput').value=''; $('fileInput').click(); $('fileInput').onchange=()=>{ const f=[...$('fileInput').files]; if(f.length) sendFilesToPeer(peerId,f); }; }

async function makeConnection(peerId, initiator){
  let state=peers.get(peerId); if(!state) {state={name:'Device',pc:null,dc:null};peers.set(peerId,state);}
  if(state.pc && state.pc.connectionState!=='closed') return state;
  const pc=new RTCPeerConnection(rtcConfig); state.pc=pc;
  pc.onicecandidate=e=>{if(e.candidate)send({type:'signal',to:peerId,data:{kind:'ice',candidate:e.candidate}})};
  pc.onconnectionstatechange=()=>{ if(['failed','disconnected','closed'].includes(pc.connectionState)) setStatus('Koneksi P2P terputus','error'); else if(pc.connectionState==='connected') setStatus('P2P terhubung','ok'); };
  pc.ondatachannel=e=>attachDataChannel(peerId,e.channel);
  if(initiator){const dc=pc.createDataChannel('files');attachDataChannel(peerId,dc); const offer=await pc.createOffer(); await pc.setLocalDescription(offer); send({type:'signal',to:peerId,data:{kind:'offer',description:pc.localDescription}})}
  return state;
}
async function handleSignal(from,data){
  const state=await makeConnection(from,false); const pc=state.pc;
  if(data.kind==='offer'){await pc.setRemoteDescription(data.description); const answer=await pc.createAnswer(); await pc.setLocalDescription(answer); send({type:'signal',to:from,data:{kind:'answer',description:pc.localDescription}})}
  else if(data.kind==='answer'){await pc.setRemoteDescription(data.description)}
  else if(data.kind==='ice'){try{await pc.addIceCandidate(data.candidate)}catch(e){console.warn(e)}}
}

function attachDataChannel(peerId,dc){
  const state=peers.get(peerId)||{}; state.dc=dc; peers.set(peerId,state);
  dc.binaryType='arraybuffer'; dc.onopen=()=>setStatus('Terhubung ke perangkat','ok');
  dc.onmessage=(e)=>onData(peerId,e.data);
  dc.onclose=()=>setStatus('Koneksi file ditutup','idle');
}

function createTransferCard(id,meta,dir){
  $('transfers').hidden=false;
  const el=document.createElement('div'); el.className='transfer-card'; el.id=`tx-${id}`;
  el.innerHTML=`<div class="transfer-top"><div style="min-width:0"><div class="transfer-name">${escapeHtml(meta.name)}</div><div class="transfer-meta">${dir==='send'?'Mengirim ke':'Menerima dari'} ${escapeHtml(meta.peerName||'Perangkat')} · ${formatBytes(meta.size)}</div></div><div class="transfer-meta" data-percent>0%</div></div><div class="bar"><span style="width:0%" data-bar></span></div><div class="transfer-actions"><button class="mini danger" data-cancel>Batal</button></div>`;
  $('transferList').prepend(el); el.querySelector('[data-cancel]').onclick=()=>{const t=transfers.get(id); if(t)t.cancel=true; el.remove();};
}
function updateTransfer(id,pct,label){const el=$(`tx-${id}`); if(!el)return; el.querySelector('[data-bar]').style.width=`${pct}%`; el.querySelector('[data-percent]').textContent=label||`${pct}%`;}

async function sendFilesToPeer(peerId,files){
  const state=await makeConnection(peerId,true); const dc=state.dc; if(!dc) return toast('Gagal membuat koneksi.');
  if(dc.readyState!=='open') await new Promise(resolve=>setTimeout(resolve,500));
  if(dc.readyState!=='open') return toast('Perangkat tujuan belum siap menerima file.');
  for(const file of files){
    const id=crypto.randomUUID(); createTransferCard(id,{name:file.name,size:file.size,peerName:peers.get(peerId)?.name},'send');
    const transfer={cancel:false};transfers.set(id,transfer);
    const meta={t:'start',id,name:file.name,size:file.size,mime:file.type||'application/octet-stream'}; dc.send(JSON.stringify(meta));
    const chunk=64*1024; let offset=0; const started=Date.now();
    while(offset<file.size){
      if(transfer.cancel) break;
      while(dc.bufferedAmount>4*1024*1024){await new Promise(r=>setTimeout(r,20));if(transfer.cancel)break;}
      const end=Math.min(offset+chunk,file.size); const buf=await file.slice(offset,end).arrayBuffer(); dc.send(buf); offset=end;
      const pct=Math.round(offset/file.size*100); const speed=offset/Math.max(1,(Date.now()-started)/1000); updateTransfer(id,pct,`${pct}% · ${formatBytes(speed)}/s`);
    }
    dc.send(JSON.stringify({t:'end',id,canceled:transfer.cancel}));
    if(!transfer.cancel) updateTransfer(id,100,'Selesai');
  }
}

const receiveBuffers=new Map();
function onData(peerId,data){
  if(typeof data==='string'){
    const msg=JSON.parse(data);
    if(msg.t==='start'){receiveBuffers.set(msg.id,{meta:msg,chunks:[],received:0});createTransferCard(msg.id,{name:msg.name,size:msg.size,peerName:peers.get(peerId)?.name},'recv');return;}
    if(msg.t==='end'){const r=receiveBuffers.get(msg.id); if(!r)return; receiveBuffers.delete(msg.id); if(msg.canceled){updateTransfer(msg.id,0,'Dibatalkan');return;} const blob=new Blob(r.chunks,{type:r.meta.mime}); const url=URL.createObjectURL(blob); updateTransfer(msg.id,100,'Selesai'); const el=$(`tx-${msg.id}`); if(el){const btn=document.createElement('button');btn.className='mini';btn.textContent='Unduh';btn.onclick=()=>{const a=document.createElement('a');a.href=url;a.download=r.meta.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};el.querySelector('.transfer-actions').appendChild(btn)} return;}
  }
  // Find most recently active inbound transfer for this peer.
  let target=[...receiveBuffers.values()].find(r=>r.peerId===peerId);
  if(!target) target=[...receiveBuffers.values()][0];
  if(!target)return;
  target.chunks.push(data); target.received+=data.byteLength; updateTransfer(target.meta.id,Math.round(target.received/target.meta.size*100));
}

function formatBytes(n){if(!Number.isFinite(n))return '0 B';const u=['B','KB','MB','GB','TB'];let i=0;while(n>=1024&&i<u.length-1){n/=1024;i++}return `${n<10&&i?n.toFixed(1):Math.round(n)} ${u[i]}`}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function openDialog(title,body){$('dialogTitle').textContent=title;$('dialogBody').innerHTML=body;$('dialog').showModal()}
function openNameDialog(){openDialog('Nama perangkat',`<p class="dialog-body">Nama ini akan terlihat oleh perangkat lain di room.</p><input class="dialog-input" id="nameInput" maxlength="40" value="${escapeHtml(device.name)}"><div class="dialog-actions"><button class="mini" id="saveName">Simpan</button></div>`);$('saveName').onclick=()=>{device.name=$('nameInput').value.trim()||randomName();localStorage.setItem('waveshare-name',device.name);$('deviceName').textContent=device.name;send({type:'rename',name:device.name});$('dialog').close()}}
function openQrDialog(){openDialog('Bagikan room',`<div class="qr-wrap"><canvas id="qrCanvas"></canvas></div><p class="dialog-body">Scan QR ini dari perangkat lain untuk masuk ke room yang sama.</p><div class="code">${escapeHtml(location.href)}</div>`);QRCode.toCanvas($('qrCanvas'),location.href,{width:260,margin:1,errorCorrectionLevel:'M'})}
function openInfoDialog(){openDialog('Privasi & cara kerja',`<div class="dialog-body"><p>WaveShare memakai server hanya untuk <b>presence</b> dan <b>signaling</b>. Isi file dikirim melalui WebRTC DataChannel secara peer-to-peer dan tidak sengaja disimpan ke server.</p><p>Untuk koneksi lintas jaringan, browser dapat membutuhkan STUN/TURN. Jika firewall/NAT sangat ketat, transfer P2P bisa gagal.</p><p><b>Langkah:</b> buka room yang sama → pilih perangkat → kirim file.</p></div>`)}
function toast(text){const t=document.createElement('div');t.textContent=text;t.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#101724;color:#eaf0ff;border:1px solid rgba(255,255,255,.1);padding:10px 14px;border-radius:12px;font-size:12px;z-index:100';document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}
