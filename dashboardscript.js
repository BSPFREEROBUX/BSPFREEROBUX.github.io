window.zyphorHalloweenModels=null
const zyphorHalloweenModelBase=new URL(".",document.currentScript&&document.currentScript.src?document.currentScript.src:document.baseURI)
window.zyphorHalloweenModelsPromise=Promise.all(["halloween-models-1.json","halloween-models-2.json","halloween-models-3.json"].map(file=>fetch(new URL(file,zyphorHalloweenModelBase)).then(response=>{if(!response.ok)throw new Error("Halloween model library request failed: "+file);return response.json()})))
.then(parts=>parts.flatMap(models=>Array.isArray(models)?models:[]))
.catch(error=>{console.error("Halloween model library could not be loaded",error);return []})
.then(models=>{
    window.zyphorHalloweenModels=Array.isArray(models)?models:[]
    if(document.body&&document.body.classList.contains("zyphor-halloween")&&typeof window.createHalloweenAtmosphere==="function"){
        halloweenAtmosphereReady=false
        createHalloweenAtmosphere()
    }
    return window.zyphorHalloweenModels
})

document.getElementById('zyphorFooterYear').textContent=String(new Date().getFullYear());

;

let token=localStorage.getItem('Token')||''
let selectedUser=''
let userData=null
let socialData=null
let ticketData=null
let selectedTicketId=''
let adminChangelogs=[]
let selectedChangelogId=''
let bulkSelected=new Set()
let visitData=null
const tabs=[...document.querySelectorAll('.admin-tab')]
tabs.forEach(x=>x.addEventListener('click',()=>{tabs.forEach(t=>t.classList.remove('active'));x.classList.add('active');document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('active'));document.getElementById(x.dataset.tab).classList.add('active');updateTargetUI()}))
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.id==='admin-targetInput'){e.preventDefault();searchAndSelectTarget()}})
function fmt(v){if(!v)return 'None';const d=new Date(v);return Number.isFinite(d.getTime())?d.toLocaleString():String(v)}
async function api(path,opt={}){const base=String(backend||'').trim().replace(/\/+$/,'');const target=/^https?:\/\//i.test(path)?path:base+(path.startsWith('/')?path:'/'+path);opt.headers=Object.assign({'Authorization':token},selectedUser?{'X-Admin-Target':selectedUser}:{},opt.headers||{});let r;try{r=await fetch(target,opt)}catch(e){return {success:false,error:'backend_unreachable'}}let d;try{d=await r.json()}catch{d={success:false,error:'invalid_json',status:r.status}}if(r.status===401||r.status===403){zyphorAlert('Administrator authorization failed.');return {success:false,error:'unauthorized'}}if(r.status===409&&d?.error==='selected_user_mismatch'){zyphorAlert('Selected user changed. Please use the current selected user shown at the top of the Admin Center.');return {success:false,error:'selected_user_mismatch'}}return d}
async function postAction(action,data={},confirmIt=false){if(!selectedUser)return {success:false,error:'no_user'};if(confirmIt&&!await zyphorConfirm('Are you sure?'))return {success:false,error:'cancelled'};return await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action,username:selectedUser},data))})}
function updateTargetUI(){
const nameEl=document.getElementById('admin-selectedUserDisplay')
const metaEl=document.getElementById('admin-selectedUserMeta')
const input=document.getElementById('admin-targetInput')
const selected=selectedUser||''
if(nameEl){nameEl.textContent=selected||'No user selected';nameEl.classList.toggle('admin-noTarget',!selected)}
if(metaEl){
if(!selected) metaEl.textContent='User-specific actions are waiting for a target.'
else if(userData) metaEl.textContent='ID '+(userData.id||'Unknown')+' • '+(userData.banned?'BANNED • ':'')+(userData.frozen?'FROZEN • ':'')+(userData.sessionActive?'Online':'Offline')
else metaEl.textContent='Loading selected user…'
}
if(input && document.activeElement!==input) input.value=selected
const values=document.querySelectorAll('[data-admin-target]')
values.forEach(x=>x.textContent=selected||'None')
const social=document.getElementById('admin-socialUser')
const tickets=document.getElementById('admin-ticketUser')
if(social)social.value=selected
if(tickets)tickets.value=selected
}
function clearSelectedUser(){
selectedUser=''
userData=null
socialData=null
ticketData=null
selectedTicketId=''
const box=document.getElementById('admin-targetMatches');if(box){box.innerHTML='';box.style.display='none'}
const panel=document.getElementById('admin-userPanel');const empty=document.getElementById('admin-emptyUser');if(panel)panel.style.display='none';if(empty){empty.style.display='block';empty.textContent='No user selected. Use the Current Admin Target selector above.'}
const dms=document.getElementById('admin-dmsBox');if(dms)dms.textContent='No user selected.'
const tv=document.getElementById('admin-ticketViewer');if(tv)tv.textContent='No user selected.'
updateTargetUI()
}
function openUserSelector(){
const usersTab=document.querySelector('.admin-tab[data-tab="admin-users"]')
if(usersTab)usersTab.click()
const input=document.getElementById('admin-userSearch')
const targetInput=document.getElementById('admin-targetInput')
if(input && selectedUser){input.value=selectedUser;loadUsers()}
setTimeout(()=>{if(targetInput){targetInput.focus();targetInput.select()}},30)
}
async function searchAndSelectTarget(){
const q=document.getElementById('admin-targetInput')?.value.trim()||''
if(!q){openUserSelector();return}
const d=await api('/admin/control/users?q='+encodeURIComponent(q)+'&status=all&limit=20')
const users=Array.isArray(d.users)?d.users:[]
const exact=users.find(x=>String(x.username||'').toLowerCase()===q.toLowerCase())
if(exact){selectUser(encodeURIComponent(exact.username));return}
const box=document.getElementById('admin-targetMatches')
if(box){box.innerHTML=users.slice(0,20).map(u=>`<div class="admin-targetMatch" onclick="selectUser('${encodeURIComponent(u.username)}')"><b>${esc(u.username)}</b><div class="admin-small">ID ${esc(u.id)} • ${u.sessionActive?'Online':'Offline'}${u.banned?' • BANNED':''}${u.frozen?' • FROZEN':''}</div></div>`).join('')||'<div class="admin-targetMatch">No matching users.</div>';box.style.display='block'}
}
function selectUser(name){
selectedUser=decodeURIComponent(name);
const box=document.getElementById('admin-targetMatches');if(box){box.innerHTML='';box.style.display='none'}
updateTargetUI();
refreshUser();
}

async function loadUsers(){const q=encodeURIComponent(document.getElementById('admin-userSearch').value.trim());const status=encodeURIComponent(document.getElementById('admin-userStatus').value);const d=await api('/admin/control/users?q='+q+'&status='+status+'&limit=500');const box=document.getElementById('admin-userResults');box.innerHTML=(d.users||[]).map(u=>`<div class="admin-item admin-clickable ${selectedUser===u.username?'admin-selected':''}" onclick="selectUser('${encodeURIComponent(u.username)}')"><b>${esc(u.username)}</b><div class="admin-small">ID ${esc(u.id)} • ${u.sessionActive?'Online':'Offline'} • ${u.subscription?esc(u.subscription):'No subscription'} • ${u.banned?'BANNED':''}${u.frozen?' • FROZEN':''}</div></div>`).join('')||'<div class="admin-item">No users.</div>'}
async function refreshUser(){if(!selectedUser)return;const d=await api('/admin/control/user?username='+encodeURIComponent(selectedUser));if(!d.success)return;userData=d.user;updateTargetUI();renderUser();loadSocial();loadTickets();loadSelectedHistory();loadCloudLogs();loadSystemMetrics()}
function renderUser(){document.getElementById('admin-emptyUser').style.display='none';document.getElementById('admin-userPanel').style.display='block';document.getElementById('admin-selUserName').textContent=userData.username;document.getElementById('admin-selUserMeta').textContent='ID '+userData.id+' • Joined '+fmt(userData.createdAt);document.getElementById('admin-renameInput').value=userData.username;document.getElementById('admin-emailInput').value=userData.email||'';document.getElementById('admin-identityBox').textContent=JSON.stringify({username:userData.username,id:userData.id,createdAt:userData.createdAt,email:userData.email,emailVerifiedAt:userData.emailVerifiedAt,linkedDiscord:userData.linkedDiscord,roblox:userData.roblox,devicesCount:userData.devicesCount,permissions:userData.permissions},null,2);document.getElementById('admin-securityBox').textContent=JSON.stringify({twofa:userData.twofa,banned:userData.banned,banReason:userData.banReason,banMessage:userData.banMessage,banExpires:userData.banExpires,disabled:userData.disabled,muted:userData.muted,shadowBanned:userData.shadowBanned,frozen:userData.frozen,sessionActive:userData.sessionActive,latestIP:userData.latestIP,latestLoginAt:userData.latestLoginAt,latestSessionId:userData.latestSessionId,passwordSet:userData.passwordSet,passwordLength:userData.passwordLength,passwordChangedAt:userData.passwordChangedAt,activeResetCount:userData.activeResetCount},null,2);document.getElementById('admin-userKpis').innerHTML=[['Balance',userData.zyphium?.balance??0],['Transactions',(userData.zyphium?.transactions||[]).length],['Friends',(socialData?.friends||[]).length],['Tickets',(userData.tickets||[]).length],['Badges',Object.values(userData.badges||{}).filter(x=>x.earned).length],['Notifications',(userData.notifications||[]).length]].map(x=>`<div class="admin-kpi"><b>${esc(x[0])}</b><strong>${esc(x[1])}</strong></div>`).join('');document.getElementById('admin-permBox').innerHTML=Object.entries(userData.permissions||{}).map(([p,v])=>`<div class="admin-feature"><b>${esc(p)}</b><span>${v?'Granted':'Not granted'}</span><button class="admin-btn ${v?'red':'green'}" onclick="permission('${encodeURIComponent(p)}',${!v})">${v?'Revoke':'Grant'}</button></div>`).join('');document.getElementById('admin-badgeBox').innerHTML=Object.entries(userData.badges||{}).map(([n,b])=>`<div class="admin-item"><b>${esc(n)}</b><div class="admin-small">${b.earned?'Earned':'Not earned'} • Progress ${esc(b.current||0)}</div></div>`).join('')||'<div class="admin-item">No badges.</div>';document.getElementById('admin-badgesLarge').textContent=JSON.stringify(userData.badges||{},null,2);document.getElementById('admin-subscriptionBox').textContent=JSON.stringify(userData.subscription||{},null,2);document.getElementById('admin-resetBox').innerHTML=(userData.resetLinks||[]).map(x=>`<div class="admin-item"><b>Active reset link hidden</b><div class="admin-small">Expires ${fmt(x.expires)} • Prefix ${esc(x.tokenPrefix)}</div><button class="admin-btn red" onclick="revokeReset('${encodeURIComponent(x.tokenPrefix)}')">Revoke</button></div>`).join('')||'<div class="admin-item">No active reset links.</div>';document.getElementById('admin-giftBox').innerHTML=(userData.giftLinks||[]).map(g=>`<div class="admin-item"><b>${esc(g.amount)} Zyphium</b><div class="admin-small">${esc(g.link)} • ${g.claimed?'Claimed':'Active'}${g.revoked?' • Revoked':''}<br>${esc(g.message||'')}</div>${!g.claimed&&!g.revoked?`<button class="admin-btn red" onclick="revokeGift('${encodeURIComponent(g.id)}')">Revoke</button>`:''}</div>`).join('')||'<div class="admin-item">No gift links.</div>';document.getElementById('admin-notificationsBox').innerHTML=(userData.notifications||[]).map(n=>`<div class="admin-item"><b>${esc(n.type||'system')}</b><div class="admin-small">${fmt(n.time)} • ${n.seen?'Read':'Unread'}</div><div>${esc(n.message||'')}</div><button class="admin-btn red" onclick="deleteNotification('${encodeURIComponent(n.id||'')}')">Clear</button></div>`).join('')||'<div class="admin-item">No stored notifications.</div>';document.getElementById('admin-notesBox').innerHTML=(userData.adminNotes||[]).map(n=>`<div class="admin-item"><b>${fmt(n.time)}</b><div class="admin-small">${esc(n.by)}</div><div>${esc(n.text)}</div><button class="admin-btn red" onclick="clearNote('${encodeURIComponent(n.id)}')">Delete Note</button></div>`).join('')||'<div class="admin-item">No admin notes.</div>';document.getElementById('admin-loginHistory').textContent=JSON.stringify(userData.loginHistory||[],null,2);document.getElementById('admin-punishmentHistory').textContent=JSON.stringify({banHistory:userData.banHistory||[],punishmentHistory:userData.punishmentHistory||[]},null,2);document.getElementById('admin-storageBox').textContent=JSON.stringify(userData.storage||{},null,2);document.getElementById('admin-quickRelations').textContent=JSON.stringify({friends:socialData?.friends||[],incomingRequests:socialData?.incomingRequests||[],outgoingRequests:socialData?.outgoingRequests||[],dmCount:socialData?.chats?.length||0,tickets:userData.tickets||[]},null,2)}
async function act(action,data={},confirmIt=false){const d=await postAction(action,data,confirmIt);if(d.success){await refreshUser();await loadUsers();await loadAudit()}else if(d.error!=='cancelled')zyphorAlert(d.error||'Action failed');return d}
async function toggle(field){await act('toggle',{field})}
async function renameUser(){const v=document.getElementById('admin-renameInput').value.trim();if(!v||!selectedUser)return;const d=await postAction('rename',{newUsername:v});if(d.success){selectedUser=v;document.getElementById('admin-socialUser').value=v;document.getElementById('admin-ticketUser').value=v;await refreshUser();await loadUsers();await loadAudit()}else zyphorAlert(d.error||'Action failed')}
async function setEmail(){const v=document.getElementById('admin-emailInput').value.trim();if(v)await act('set_email',{email:v,verified:false})}
async function rotateSession(){await act('rotate_session')}
async function newAccountCode(){const d=await act('reset_code');if(d.code)await zyphorPrompt('New account code',d.code)}
async function banSelected(){await act('ban',{reason:document.getElementById('admin-banReason').value,banMessage:document.getElementById('admin-banMessage').value,durationMs:document.getElementById('admin-banDuration').value?Number(document.getElementById('admin-banDuration').value):null})}
async function unbanSelected(){await act('unban')}
async function permission(p,e){await act('set_permission',{permission:decodeURIComponent(p),enabled:e})}
async function setBadgeFromInputs(earned){const name=document.getElementById('admin-badgeName').value.trim();const current=Number(document.getElementById('admin-badgeCurrent').value);if(name)await act('set_badge',{badge:name,earned,current})}
async function reset2fa(){await act('reset_2fa',{},true)}
async function logoutTarget(){await act('logout')}
async function generateReset(){const d=await act('generate_reset');if(d.link)await openZyphorResetLink(d.link)}
async function revokeReset(prefix){await act('revoke_reset',{tokenPrefix:decodeURIComponent(prefix)})}
async function revokeAllResets(){await act('revoke_all_resets',{},true)}
async function money(action){if(!selectedUser){openUserSelector();return}const amount=Number(document.getElementById('admin-moneyAmount').value);const reason=document.getElementById('admin-moneyReason').value;const silent=document.getElementById('admin-moneySilent').checked;await act(action,{amount,reason,silent})}
async function generateCodes(){const plan=document.getElementById('admin-codePlan').value;const quantity=Math.max(1,Math.min(100,Number(document.getElementById('admin-codeQuantity').value)||1));const durationValue=Math.max(1,Number(document.getElementById('admin-codeDuration').value)||1);const durationUnit=document.getElementById('admin-codeUnit').value;const lifetime=document.getElementById('admin-codeLifetime').checked;const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'generate_codes',plan,quantity,durationValue,durationUnit,lifetime})});if(!d.success){zyphorAlert(d.error||'Failed');return}document.getElementById('admin-codesBox').innerHTML=(d.codes||[]).map(x=>`<div class="admin-item"><b>${esc(x.code)}</b><div class="admin-small">${esc(x.planName||x.plan)} • ${x.lifetime?'Lifetime':esc(String(x.durationValue||''))+' '+esc(x.durationUnit||'')}</div><button class="admin-btn red" onclick="deleteCode('${encodeURIComponent(x.code)}')">Delete</button></div>`).join('')||'<div class="admin-item">No codes generated.</div>';await loadAudit()}
async function loadCodes(){const d=await api('/admin/control/codes');document.getElementById('admin-codesBox').innerHTML=(d.codes||[]).slice(0,200).map(x=>`<div class="admin-item"><b>${esc(x.code)}</b><div class="admin-small">${esc(x.planName||x.plan)} • ${x.redeemedAt?'Redeemed':'Unused'} • ${x.lifetime?'Lifetime':esc(String(x.durationValue||''))+' '+esc(x.durationUnit||'')}</div><button class="admin-btn red" onclick="deleteCode('${encodeURIComponent(x.code)}')">Delete</button></div>`).join('')||'<div class="admin-item">No codes.</div>'}
async function deleteCode(code){if(!await zyphorConfirm('Delete this subscription code?'))return;const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete_code',code:decodeURIComponent(code)})});if(!d.success)zyphorAlert(d.error||'Failed');await loadCodes();await loadAudit()}
async function assignSub(){await act('set_subscription',{plan:document.getElementById('admin-subPlan').value,lifetime:document.getElementById('admin-subLifetime').checked,durationValue:Number(document.getElementById('admin-subDuration').value),durationUnit:document.getElementById('admin-subUnit').value})}
async function removeSub(){await act('remove_subscription')}
async function setPfp(enabled){await act('set_pfp_permission',{enabled})}
async function removePfp(){await act('remove_pfp',{},true)}
async function sendNotification(){await act('send_notification',{title:document.getElementById('admin-notifTitle').value,message:document.getElementById('admin-notifMessage').value,type:document.getElementById('admin-notifType').value,silent:false})}
async function sendPush(){await act('send_push',{title:document.getElementById('admin-pushTitle').value,message:document.getElementById('admin-pushMessage').value})}
async function clearNotifications(confirmIt=false){await act('clear_notifications',{},confirmIt)}
async function markNotificationsRead(){await act('mark_notifications_read')}
async function deleteNotification(id){await act('delete_notification',{notificationId:decodeURIComponent(id)})}
async function sendGift(){await act('send_gift',{amount:Number(document.getElementById('admin-giftAmount').value),message:document.getElementById('admin-giftMessage').value,silent:false})}
async function revokeGift(id){await act('revoke_gift',{giftId:decodeURIComponent(id)})}
async function revokeAllGifts(){await act('revoke_all_gifts',{},true)}
async function addNote(){await act('set_note',{reason:document.getElementById('admin-noteText').value})}
async function clearNote(id){await act('clear_note',{noteId:decodeURIComponent(id)})}
async function completeQuest(){await act('complete_quest',{questId:document.getElementById('admin-questId').value.trim()})}
async function exportUser(){if(!userData)return;downloadText((userData.username||'user')+'_admin_snapshot.json',JSON.stringify(userData,null,2),'application/json')}
function downloadText(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function loadSocial(){if(!selectedUser){openUserSelector();return}const name=selectedUser.trim();const d=await api('/admin/control/social?username='+encodeURIComponent(name));if(!d.success){zyphorAlert(d.error||'Failed');return}socialData=d;document.getElementById('admin-friendsBox').innerHTML=`<div class="admin-item"><b>Friends: ${d.friends.length}</b><div class="admin-small">Incoming ${d.incomingRequests.length} • Outgoing ${d.outgoingRequests.length} • Chats ${d.chats.length}</div></div>`+d.friends.map(x=>`<div class="admin-item admin-clickable" onclick="document.getElementById('admin-friendTarget').value='${esc(x)}'">${esc(x)}</div>`).join('');renderDms();if(userData)renderUser()}
function renderDms(){const q=document.getElementById('admin-dmSearch').value.trim().toLowerCase();if(!socialData){document.getElementById('admin-dmsBox').textContent='No user selected.';return}const chats=(socialData.chats||[]).map(c=>{const messages=(c.messages||[]).filter(m=>!q||String(m.text||'').toLowerCase().includes(q)||String(m.author||'').toLowerCase().includes(q));return Object.assign({},c,{messages})}).filter(c=>c.messages.length||!q);document.getElementById('admin-dmsBox').innerHTML=chats.map(c=>`<div style="margin-bottom:18px"><div><b>${esc(c.with)}</b> <span class="admin-pill">${c.areFriends?'Friends':'Not Friends'}</span><span class="admin-pill">${c.messages.length} shown</span></div>${c.messages.map(m=>`<div class="admin-msg"><div class="admin-meta">${fmt(m.time)} • ${esc(m.author||'Unknown')}</div><div>${esc(m.text||'')}</div>${m.attachment?`<div class="admin-small">Attachment: ${esc(m.attachment.name||'file')}</div>`:''}</div>`).join('')||'<div class="admin-small">No messages.</div>'}</div>`).join('')||'<div class="admin-small">No matching chats.</div>'}
async function forceFriend(){const other=document.getElementById('admin-friendTarget').value.trim();if(other)await act('force_friend',{otherUsername:other})}
async function removeFriend(){const other=document.getElementById('admin-friendTarget').value.trim();if(other)await act('remove_friend',{otherUsername:other},true)}
async function forceRequest(){const other=document.getElementById('admin-requestTarget').value.trim();if(other)await act('force_friend_request',{otherUsername:other})}
async function clearFriendRequests(){await act('clear_friend_requests',{},true)}
async function loadTickets(){if(!selectedUser){openUserSelector();return}const name=selectedUser.trim();const d=await api('/admin/control/tickets?username='+encodeURIComponent(name)+'&status='+encodeURIComponent(document.getElementById('admin-ticketStatus').value));ticketData=d;ticketsRender()}
function ticketsRender(){if(!ticketData){return}const q=document.getElementById('admin-ticketQuery').value.trim().toLowerCase();const list=(ticketData.tickets||[]).filter(t=>!q||String(t.title||'').toLowerCase().includes(q)||JSON.stringify(t.messages||[]).toLowerCase().includes(q));document.getElementById('admin-ticketList').innerHTML=list.map(t=>`<div class="admin-item admin-clickable ${selectedTicketId===t.id?'admin-selected':''}" onclick="selectTicket('${encodeURIComponent(t.id)}')"><b>${esc(t.title||'Untitled')}</b><div class="admin-small">${esc(t.id)} • ${esc(t.status)} • ${t.locked?'Locked':''}</div></div>`).join('')||'<div class="admin-item">No tickets.</div>'}
function selectTicket(id){selectedTicketId=decodeURIComponent(id);const t=(ticketData.tickets||[]).find(x=>x.id===selectedTicketId);if(!t)return;document.getElementById('admin-ticketViewer').innerHTML=`<div><b>${esc(t.title||'Untitled')}</b> <span class="admin-pill">${esc(t.status)}</span> <span class="admin-pill">${t.locked?'Locked':'Unlocked'}</span></div><div class="admin-small">Ticket ${esc(t.id)} • Created ${fmt(t.createdAt)} • Closed ${fmt(t.closedAt)}</div><div style="margin-top:10px">${(t.messages||[]).map(m=>`<div class="admin-msg"><div class="admin-meta">${fmt(m.time)} • ${esc(m.author||'Unknown')}</div><div>${esc(m.text||'')}</div></div>`).join('')||'<div class="admin-small">No messages.</div>'}</div>`}
async function ticketAction(action,confirmIt=false){if(!selectedTicketId)return;if(confirmIt&&!await zyphorConfirm('Are you sure?'))return;const data={action, ticketId:selectedTicketId};if(action==='assign')data.assignedTo=document.getElementById('admin-ticketAssign').value.trim();if(action==='tag')data.tag=document.getElementById('admin-ticketTag').value.trim();const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({username:selectedUser},data))});if(d.success){await loadTickets();await loadAudit()}else zyphorAlert(d.error||'Action failed')}
async function addChangelog(){const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'changelog_add',version:document.getElementById('admin-clVersion').value,title:document.getElementById('admin-clTitle').value,text:document.getElementById('admin-clText').value,published:document.getElementById('admin-clPublished').checked,pinned:document.getElementById('admin-clPinned').checked})});if(!d.success)zyphorAlert(d.error||'Failed');await adminLoadChangelogs();await loadAudit()}
async function adminLoadChangelogs(){const d=await api('/admin/control/changelogs');adminChangelogs=d.logs||[];document.getElementById('admin-changelogBox').innerHTML=adminChangelogs.map(c=>`<div class="admin-item admin-clickable ${selectedChangelogId===c.id?'admin-selected':''}" onclick="selectChangelog('${encodeURIComponent(c.id)}')"><b>${esc(c.version)} • ${esc(c.title)}</b><div class="admin-small">${c.published===false?'Unpublished':'Published'} • ${c.pinned?'Pinned':'Unpinned'} • ${fmt(c.time)}</div></div>`).join('')||'<div class="admin-item">No changelogs.</div>'}
function selectChangelog(id){selectedChangelogId=decodeURIComponent(id);const c=adminChangelogs.find(x=>x.id===selectedChangelogId);if(!c)return;document.getElementById('admin-editClVersion').value=c.version||'';document.getElementById('admin-editClTitle').value=c.title||'';document.getElementById('admin-editClText').value=c.text||'';adminLoadChangelogs()}
async function editChangelog(){if(!selectedChangelogId)return;const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'changelog_edit',changelogId:selectedChangelogId,version:document.getElementById('admin-editClVersion').value,title:document.getElementById('admin-editClTitle').value,text:document.getElementById('admin-editClText').value})});if(!d.success)zyphorAlert(d.error||'Failed');await adminLoadChangelogs();await loadAudit()}
async function toggleChangelog(action){if(!selectedChangelogId)return;const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'changelog_'+action,changelogId:selectedChangelogId})});if(!d.success)zyphorAlert(d.error||'Failed');await adminLoadChangelogs();await loadAudit()}
async function deleteChangelog(confirmIt=false){if(!selectedChangelogId)return;if(confirmIt&&!await zyphorConfirm('Delete selected changelog?'))return;const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'changelog_delete',changelogId:selectedChangelogId})});if(!d.success)zyphorAlert(d.error||'Failed');selectedChangelogId='';await adminLoadChangelogs();await loadAudit()}
async function duplicateChangelog(){if(!selectedChangelogId)return;const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'changelog_duplicate',changelogId:selectedChangelogId})});if(!d.success)zyphorAlert(d.error||'Failed');await adminLoadChangelogs();await loadAudit()}
function exportChangelogs(){downloadText('zyphor_changelogs.json',JSON.stringify(adminChangelogs,null,2),'application/json')}
async function loadBulkUsers(){const q=encodeURIComponent(document.getElementById('admin-bulkQuery').value.trim());const status=encodeURIComponent(document.getElementById('admin-bulkStatus').value);const d=await api('/admin/control/users?q='+q+'&status='+status+'&limit=500');document.getElementById('admin-bulkUsers').innerHTML=(d.users||[]).map(u=>`<label class="admin-item"><input type="checkbox" ${bulkSelected.has(u.username)?'checked':''} onchange="toggleBulk('${encodeURIComponent(u.username)}',this.checked)"> <b>${esc(u.username)}</b><div class="admin-small">${u.subscription?esc(u.subscription):'No subscription'} • ${u.sessionActive?'Online':'Offline'}</div></label>`).join('')||'<div class="admin-item">No users.</div>'}
function toggleBulk(name,checked){name=decodeURIComponent(name);if(checked)bulkSelected.add(name);else bulkSelected.delete(name)}
function selectAllBulk(){document.querySelectorAll('#admin-bulkUsers input[type=checkbox]').forEach(x=>{x.checked=true;const name=decodeURIComponent(x.closest('label').querySelector('b').textContent);bulkSelected.add(name)})}
function clearBulkSelection(){bulkSelected.clear();loadBulkUsers()}
async function bulkAction(subAction){const usernames=[...bulkSelected];if(!usernames.length){zyphorAlert('Select at least one user.');return}const d=await api('/admin/control/bulk-action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:subAction,usernames})});document.getElementById('admin-bulkResult').textContent=JSON.stringify(d,null,2);await loadUsers();await loadBulkUsers();await loadAudit()}
async function globalSearch(){const q=document.getElementById('admin-globalQuery').value.trim();if(!q)return;const d=await api('/admin/control/search-all?q='+encodeURIComponent(q));document.getElementById('admin-globalResults').textContent=JSON.stringify(d,null,2)}
async function loadSelectedHistory(){if(!selectedUser)return;const d=await api('/admin/page-history?username='+encodeURIComponent(selectedUser));document.getElementById('admin-pageHistoryBox').textContent=JSON.stringify(d,null,2)}
async function exportHistory(){const txt=document.getElementById('admin-pageHistoryBox').textContent||'[]';downloadText((selectedUser||'user')+'_page_history.json',txt,'application/json')}
async function loadCloudLogs(){if(!selectedUser)return;const d=await api('/admin/cloud-logs/'+encodeURIComponent(selectedUser));document.getElementById('admin-cloudLogBox').textContent=JSON.stringify(d.logs||d,null,2)}
async function loadVisits(){const from=document.getElementById('admin-visitFrom').value;const to=document.getElementById('admin-visitTo').value;const bucket=document.getElementById('admin-visitBucket').value;const qs=new URLSearchParams({bucket});if(from)qs.set('from',new Date(from).toISOString());if(to)qs.set('to',new Date(to).toISOString());const d=await api('/admin/control/visits?'+qs.toString());visitData=d;drawChart(d.points||[]);document.getElementById('admin-visitStats').textContent=`${d.total||0} visits • ${d.uniqueUsers||0} unique users • ${d.topPages?.length||0} top pages`;document.getElementById('admin-topPages').innerHTML=(d.topPages||[]).map(x=>`<div class="admin-item"><b>${esc(x.page)}</b><div class="admin-small">${esc(x.visits)} visits</div></div>`).join('')||'<div class="admin-item">No data.</div>';document.getElementById('admin-analyticsSummary').textContent=JSON.stringify(d,null,2)}
function drawChart(points){const c=document.getElementById('admin-visitChart');const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);if(!points.length)return;const max=Math.max(...points.map(x=>x.visits),1);const pad=30,w=c.width-2*pad,h=c.height-2*pad;ctx.strokeStyle='#273247';ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,pad+h);ctx.lineTo(pad+w,pad+h);ctx.stroke();ctx.strokeStyle='#00d5ff';ctx.lineWidth=2;ctx.beginPath();points.forEach((p,i)=>{const x=pad+(i/(Math.max(points.length-1,1)))*w;const y=pad+h-(p.visits/max)*h;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke();ctx.fillStyle='#8b96ab';ctx.font='11px system-ui';points.slice(0,12).forEach((p,i)=>{const x=pad+(i/(Math.max(Math.min(points.length,12)-1,1)))*w;ctx.fillText(String(p.visits),x,20)});ctx.lineWidth=1}
function visitPreset(days){const to=new Date();const from=new Date(Date.now()-days*86400000);document.getElementById('admin-visitFrom').value=from.toISOString().slice(0,16);document.getElementById('admin-visitTo').value=to.toISOString().slice(0,16);loadVisits()}
function applyAnalyticsRange(){const from=document.getElementById('admin-analyticsFrom').value;const to=document.getElementById('admin-analyticsTo').value;if(from)document.getElementById('admin-visitFrom').value=from;if(to)document.getElementById('admin-visitTo').value=to;loadVisits()}
async function loadSystemMetrics(){const d=await api('/admin/control/metrics');document.getElementById('admin-systemMetrics').textContent=JSON.stringify(d,null,2)}
async function loadAudit(){const d=await api('/admin/control/audit?limit=1000');document.getElementById('admin-auditBox').innerHTML=(d.logs||[]).map(x=>`<div class="admin-item"><b>${esc(x.action)}</b><div class="admin-small">${fmt(x.time)} • ${esc(x.admin)} → ${esc(x.target||'System')}</div><div class="admin-pre" style="margin-top:8px">${esc(JSON.stringify(x.details||{},null,2))}</div></div>`).join('')||'<div class="admin-item">No audit entries.</div>'}
async function clearAudit(confirmIt=false){if(confirmIt&&!await zyphorConfirm('Clear the administrator audit log?'))return;const d=await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'audit_cleanup'})});if(!d.success)zyphorAlert(d.error||'Failed');await loadAudit()}
async function loadOverview(){await loadSystemMetrics();await loadVisits();document.getElementById('admin-recentActivity').innerHTML=(userData?.pageHistory||[]).slice(0,20).map(x=>`<div class="admin-item"><b>${esc(x.page||'Unknown')}</b><div class="admin-small">${fmt(x.time)}</div></div>`).join('')||'<div class="admin-item">Select a user to show user activity.</div>'}
async function refreshEverything(){await loadUsers();await adminLoadChangelogs();await loadAudit();await loadSystemMetrics();await loadVisits();if(selectedUser)await refreshUser();}
async function logoutAdmin(){localStorage.removeItem('Token');location.href='/login.html'}
const POWER_FEATURES=[
["Ban account","Moderation","ban"],["Unban account","Moderation","unban"],["Permanent ban","Moderation","ban_perm"],["1 hour ban","Moderation","ban_1h"],["24 hour ban","Moderation","ban_24h"],["7 day ban","Moderation","ban_7d"],["30 day ban","Moderation","ban_30d"],["Force logout","Security","logout"],["Rotate session","Security","rotate_session"],["Disable account","Security","disable"],["Enable account","Security","enable"],["Mute user","Moderation","mute"],["Unmute user","Moderation","unmute"],["Shadow ban","Moderation","shadow"],["Remove shadow ban","Moderation","unshadow"],["Freeze account","Security","freeze"],["Unfreeze account","Security","unfreeze"],["Grant VIP","Entitlements","vip"],["Revoke VIP","Entitlements","unvip"],["Reset 2FA","Security","reset_2fa"],["Revoke all reset links","Security","revoke_all_resets"],["Generate reset link","Security","generate_reset"],["Regenerate link code","Security","resend_link_code"],["Reset account code","Security","reset_code"],["Unlink Discord","Connections","unlink_discord"],["Unlink Roblox","Connections","unlink_roblox"],["Remove profile picture","Profile","remove_pfp"],["Grant PFP permission","Entitlements","grant_pfp"],["Revoke PFP permission","Entitlements","revoke_pfp"],["Send account notification","Communications","send_notification"],["Send push notification","Communications","send_push"],["Clear notifications","Communications","clear_notifications"],["Mark notifications read","Communications","mark_notifications_read"],["Set email","Profile","set_email"],["Verify email","Profile","verify_email"],["Clear pending email","Security","clear_pending_email"],["Remove subscription","Entitlements","remove_subscription"],["Infinity subscription","Entitlements","sub_infinity"],["Endless subscription","Entitlements","sub_endless"],["Ascended subscription","Entitlements","sub_ascended"],["Lifetime Infinity","Entitlements","sub_inf_life"],["Lifetime Endless","Entitlements","sub_end_life"],["Lifetime Ascended","Entitlements","sub_asc_life"],["7 day subscription","Entitlements","sub_7d"],["30 day subscription","Entitlements","sub_30d"],["90 day subscription","Entitlements","sub_90d"],["Set Zyphium balance","Finance","set_balance"],["Credit Zyphium","Finance","credit"],["Debit Zyphium","Finance","debit"],["Send Zyphium gift","Finance","send_gift"],["Revoke gifts","Finance","revoke_all_gifts"],["Add admin note","Administration","set_note"],["Clear admin notes","Administration","clear_notes"],["Complete quest","Entitlements","complete_quest"],["Earn badge","Entitlements","badge_earn"],["Un-earn badge","Entitlements","badge_revoke"],["Force friendship","Social","force_friend"],["Remove friendship","Social","remove_friend"],["Force friend request","Social","force_friend_request"],["Clear friend requests","Social","clear_friend_requests"],["Close ticket","Tickets","ticket_close"],["Reopen ticket","Tickets","ticket_reopen"],["Lock ticket","Tickets","ticket_lock"],["Unlock ticket","Tickets","ticket_unlock"],["Escalate ticket","Tickets","ticket_escalate"],["Archive ticket","Tickets","ticket_archive"],["Unarchive ticket","Tickets","ticket_unarchive"],["Delete ticket","Tickets","ticket_delete"],["Grant Administrator","Permissions","perm_Administrator_on"],["Grant Support","Permissions","perm_Support_on"],["Grant VIP role","Permissions","perm_VIP_on"],["Grant Family","Permissions","perm_Family_on"],["Grant Moderator","Permissions","perm_Moderator_on"],["Revoke Administrator","Permissions","perm_Administrator_off"],["Revoke Support","Permissions","perm_Support_off"],["Revoke VIP role","Permissions","perm_VIP_off"],["Revoke Family","Permissions","perm_Family_off"],["Revoke Moderator","Permissions","perm_Moderator_off"],["Export snapshot","Tools","export"],["Reload user","Tools","reload"],["Load DMs","Tools","social"],["Load tickets","Tools","tickets"],["Load cloud logs","Tools","cloud"],["Load page history","Tools","history"],["Global search","Tools","search"],["Refresh metrics","Analytics","metrics"],["Refresh audit","Analytics","audit"],["Clear audit log","Analytics","audit_clear"],["Refresh visits","Analytics","visits"],["Create global message","Website","message_create"],["Expire all global messages","Website","message_expire"],["Delete all global messages","Website","message_clear"],["Pin latest global message","Website","message_pin_latest"],["Unpin latest global message","Website","message_unpin_latest"],["Maintenance mode","System","maintenance"],["Read-only mode","System","readonly"],["Lock registrations","System","registration"],["Lock logins","System","login_lock"],["System health","System","health"],["Refresh global messages","Website","message_refresh"],["Refresh system settings","System","settings_refresh"],["Refresh everything","Tools","everything"],["Open dashboard","Tools","dashboard"]
]

function renderPowerFeatures(){
    const grid=document.getElementById('admin-powerGrid');
    if(!grid)return;
    const q=(document.getElementById('admin-powerSearch')?.value||'').trim().toLowerCase();
    grid.innerHTML=POWER_FEATURES.filter(x=>!q||x[0].toLowerCase().includes(q)||x[1].toLowerCase().includes(q)).map((x,i)=>`<div class="admin-power-card" data-power-name="${esc(x[0].toLowerCase())}"><b>${esc(x[0])}</b><span>${esc(x[1])} • administrative control</span><button class="admin-btn ${x[1]==='Moderation'?'red':x[1]==='Website'?'cyan':x[1]==='System'?'purple':''}" onclick="powerExecute('${encodeURIComponent(x[2])}')">Run</button></div>`).join('')||'<div class="admin-item">No matching admin features.</div>';
}
function filterPowerFeatures(){renderPowerFeatures()}
function powerNeedUser(){if(!selectedUser){openUserSelector();return false}return true}
async function powerExecute(encoded){
    const key=decodeURIComponent(encoded);
    if(['ban','ban_perm','ban_1h','ban_24h','ban_7d','ban_30d','unban','logout','rotate_session','disable','enable','mute','unmute','shadow','unshadow','freeze','unfreeze','vip','unvip','reset_2fa','revoke_all_resets','generate_reset','resend_link_code','reset_code','unlink_discord','unlink_roblox','remove_pfp','grant_pfp','revoke_pfp','send_notification','send_push','clear_notifications','mark_notifications_read','set_email','verify_email','clear_pending_email','remove_subscription','sub_infinity','sub_endless','sub_ascended','sub_inf_life','sub_end_life','sub_asc_life','sub_7d','sub_30d','sub_90d','set_balance','credit','debit','send_gift','revoke_all_gifts','set_note','clear_notes','complete_quest','badge_earn','badge_revoke','force_friend','remove_friend','force_friend_request','clear_friend_requests','ticket_close','ticket_reopen','ticket_lock','ticket_unlock','ticket_escalate','ticket_archive','ticket_unarchive','ticket_delete','perm_Administrator_on','perm_Support_on','perm_VIP_on','perm_Family_on','perm_Moderator_on','perm_Administrator_off','perm_Support_off','perm_VIP_off','perm_Family_off','perm_Moderator_off'].includes(key) && !powerNeedUser())return;
    const generic={};
    if(key==='ban'||key.startsWith('ban_')){await zyphorBanFlow(key);return}
    if(key==='generate_reset'){const d=await act('generate_reset');if(d.link)await openZyphorResetLink(d.link);return}
    if(key.startsWith('perm_')){const [_,perm,state]=key.split('_');await act('set_permission',{permission:perm,enabled:state==='on'});return}
    if(key.startsWith('sub_')){const plan=key.includes('infinity')||key.includes('inf_')?'infinity':key.includes('endless')||key.includes('end_')?'endless':'ascended';const life=key.includes('_life');const days=key==='sub_7d'?7:key==='sub_30d'?30:key==='sub_90d'?90:30;await act('set_subscription',{plan,lifetime:life,durationValue:days,durationUnit:'days'});return}
    if(key==='set_balance'||key==='credit'||key==='debit'||key==='send_gift'){const amount=Number(await zyphorPrompt('Amount','0'));if(!Number.isFinite(amount)||amount<=0)return;await act(key,{amount,reason:await zyphorPrompt('Reason','Admin action')||''});return}
    if(key==='set_note'){const text=await zyphorPrompt('Admin note');if(text)await act('set_note',{reason:text});return}
    if(key==='clear_notes'){if(await zyphorConfirm('Delete all admin notes for the selected user?')){const notes=userData?.adminNotes||[];for(const n of notes)await act('clear_note',{noteId:n.id});}return}
    if(key==='complete_quest'){const q=await zyphorPrompt('Quest ID');if(q)await act('complete_quest',{questId:q});return}
    if(key==='badge_earn'||key==='badge_revoke'){const name=await zyphorPrompt('Badge name');if(name)await act('set_badge',{badge:name,earned:key==='badge_earn'});return}
    if(key.startsWith('ticket_')){const ticketId=await zyphorPrompt('Ticket ID',userData?.tickets?.[0]?.id||'');if(ticketId)await act(key,{ticketId});return}
    if(key==='force_friend'||key==='remove_friend'||key==='force_friend_request'){const other=await zyphorPrompt('Other username');if(other)await act(key,{otherUsername:other});return}
    if(key==='set_email'){const email=await zyphorPrompt('Email',userData?.email||'');if(email)await act('set_email',{email,verified:false});return}
    if(key==='verify_email'){await act('set_email',{email:userData?.email||'',verified:true});return}
    if(key==='clear_pending_email'){await act('set_field',{field:'pendingEmail',value:false});return}
    if(key==='disable'||key==='enable'||key==='mute'||key==='unmute'||key==='shadow'||key==='unshadow'||key==='freeze'||key==='unfreeze'||key==='vip'||key==='unvip'){
        const map={disable:['disabled',true],enable:['disabled',false],mute:['muted',true],unmute:['muted',false],shadow:['shadowBanned',true],unshadow:['shadowBanned',false],freeze:['frozen',true],unfreeze:['frozen',false],vip:['vip',true],unvip:['vip',false]};const [field,value]=map[key];await act('set_field',{field,value});return;
    }
    if(key==='grant_pfp'||key==='revoke_pfp'){await act('set_pfp_permission',{enabled:key==='grant_pfp'});return}
    if(key==='send_notification'){const message=await zyphorPrompt('Notification');if(message)await act('send_notification',{title:'Zyphor',message,type:'admin',silent:false});return}
    if(key==='send_push'){const message=await zyphorPrompt('Push notification');if(message)await act('send_push',{title:'Zyphor',message});return}
    if(key==='social'){await loadSocial();return} if(key==='tickets'){await loadTickets();return} if(key==='cloud'){await loadCloudLogs();return} if(key==='history'){await loadSelectedHistory();return}
    if(key==='export'){exportUser();return} if(key==='reload'){await refreshUser();return} if(key==='metrics'){await loadSystemMetrics();return} if(key==='audit'){await loadAudit();return} if(key==='audit_clear'){await clearAudit(true);return} if(key==='visits'){await loadVisits();return} if(key==='search'){const q=await zyphorPrompt('Global search');if(q){document.getElementById('admin-globalQuery').value=q;await globalSearch()}return}
    if(key==='message_create'){document.getElementById('admin-globalTitle').focus();zyphorAlert('Use the Global Website Messages composer below to publish with a duration.');return}
    if(key==='message_expire'){await expireAllGlobalMessages();return} if(key==='message_clear'){await clearAllGlobalMessages();return}
    if(key==='message_pin_latest'||key==='message_unpin_latest'){const d=await api('/admin/control/site-messages');const last=(d.messages||[]).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0))[0];if(last)await adminSystemAction(key==='message_pin_latest'?'site_message_pin':'site_message_unpin',{messageId:last.id});await loadPowerMessages();return}
    if(key==='maintenance'||key==='readonly'||key==='registration'||key==='login_lock'){const k={maintenance:'maintenance',readonly:'readOnly',registration:'registrationLocked',login_lock:'loginLocked'}[key];const d=await api('/admin/control/system-settings');const current=d.settings?.[k]===true;await adminSystemAction('system_toggle',{key:k,enabled:!current});return}
    if(key==='health'){await loadSystemMetrics();const d=await api('/admin/control/system-settings');zyphorAlert('System health loaded.\n\n'+JSON.stringify(d,null,2));return}
    if(key==='message_refresh'){await loadPowerMessages();return} if(key==='settings_refresh'){const d=await api('/admin/control/system-settings');zyphorAlert(JSON.stringify(d.settings||{},null,2));return} if(key==='everything'){await refreshEverything();return} if(key==='dashboard'){openDashboardHome();return}
    await act(key,generic);
}

async function adminSystemAction(action,data={}){return await api('/admin/control/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({action},data))})}

async function createGlobalMessage(){const title=document.getElementById('admin-globalTitle').value.trim();const message=document.getElementById('admin-globalMessage').value.trim();const type=document.getElementById('admin-globalType').value;const start=document.getElementById('admin-globalStart').value;const end=document.getElementById('admin-globalEnd').value;const d=await adminSystemAction('site_message_create',{title,message,type,startAt:start?new Date(start).toISOString():new Date().toISOString(),endAt:end?new Date(end).toISOString():null,pinned:false});if(d.success){document.getElementById('admin-globalMessage').value='';await loadPowerMessages()}else zyphorAlert(d.error||'Failed')}
async function loadPowerMessages(){const d=await api('/admin/control/site-messages');const list=document.getElementById('admin-globalMessagesList');if(!list)return;list.innerHTML=(d.messages||[]).sort((a,b)=>{const pa=a.pinned===true?1:0;const pb=b.pinned===true?1:0;if(pa!==pb)return pb-pa;return new Date(b.createdAt||0)-new Date(a.createdAt||0)}).map(m=>`<div class="admin-item"><b>${esc(m.title||'Zyphor')} <span class="admin-pill">${esc(m.type||'info')}</span>${m.pinned?'<span class="admin-pill admin-warn">Pinned • Top</span>':''}</b><div class="admin-small">${fmt(m.createdAt)} • Starts ${fmt(m.startAt)} • Ends ${m.endAt?fmt(m.endAt):'No expiry'} • ${m.active===false?'Inactive':'Active'}</div><div style="margin-top:5px">${esc(m.message||'')}</div><div class="admin-toolbar" style="margin-top:8px"><button class="admin-btn" onclick="adminSystemAction('site_message_update',{messageId:'${encodeURIComponent(m.id)}',active:${m.active===false}}).then(loadPowerMessages)">${m.active===false?'Enable':'Disable'}</button><button class="admin-btn cyan" onclick="adminSystemAction('${m.pinned?'site_message_unpin':'site_message_pin'}',{messageId:'${encodeURIComponent(m.id)}'}).then(loadPowerMessages)">${m.pinned?'Unpin from Top':'Pin to Top'}</button><button class="admin-btn red" onclick="adminSystemAction('site_message_delete',{messageId:'${encodeURIComponent(m.id)}'}).then(loadPowerMessages)">Delete</button></div></div>`).join('')||'<div class="admin-item">No website messages.</div>'}
async function expireAllGlobalMessages(){if(!await zyphorConfirm('Expire every global website message now?'))return;await adminSystemAction('site_message_expire_all');await loadPowerMessages()}
async function clearAllGlobalMessages(){if(!await zyphorConfirm('Delete every global website message?'))return;await adminSystemAction('site_message_clear_all');await loadPowerMessages()}

let adminInitialized=false
async function adminInit(){
if(adminInitialized)return
adminInitialized=true
document.getElementById('admin-adminIdentity').textContent='Administrator controls enabled'
updateTargetUI()
visitPreset(7)
await loadUsers()
renderPowerFeatures()
await loadPowerMessages()
await adminLoadChangelogs()
await loadAudit()
await loadSystemMetrics()
await loadCodes()
}
function openAdminCenter(){
if(window.zyphorIsAdmin!==true)return
const main=document.querySelector('.main')
if(!main)return
const top=main.querySelector(':scope > .top')
const homeGrid=main.querySelector(':scope > .grid')
if(top)top.style.display='none'
if(homeGrid)homeGrid.style.display='none'
const panel=document.getElementById('adminCenter')
if(panel)panel.style.display='block'
const nav=document.getElementById('adminNavItem')
if(nav)nav.classList.add('active')
adminInit()
}
function openDashboardHome(){
const main=document.querySelector('.main')
if(!main)return
const top=main.querySelector(':scope > .top')
const homeGrid=main.querySelector(':scope > .grid')
if(top)top.style.display=''
if(homeGrid)homeGrid.style.display=''
const panel=document.getElementById('adminCenter')
if(panel)panel.style.display='none'
const nav=document.getElementById('adminNavItem')
if(nav)nav.classList.remove('active')
}

;

let backend
let changelogs=[]
let clIndex=0
let lastUnread=0

const notificationSound = new Audio("Sounds/Notification.mp3")
notificationSound.preload="auto"
notificationSound.load()
notificationSound.volume=1

function escapeHtml(value){
    return String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;")
}


const THEME_STORAGE_KEY="zyphorDashboardTheme"
const defaultTheme={
    preset:"halloween",
    accent:"#ff8618",
    accent2:"#a855f7",
    bg:"#080407",
    bg2:"#180a16",
    panelOpacity:0.9,
    radius:18,
    blur:14,
    sidebar:258,
    density:1,
    glass:true,
    animations:true,
    grid:true,
    hover:true,
    bgImage:"",
    bgSize:"cover",
    customCss:""
}

const themePresets={
    midnight:{...defaultTheme,preset:"midnight",accent:"#9b6cff",accent2:"#52d9ff",bg:"#05060a",bg2:"#090b13",panelOpacity:.9,radius:18,blur:12,grid:false,hover:false},
    aurora:{...defaultTheme,preset:"aurora",accent:"#7774ff",accent2:"#52d9ff",bg:"#070813",bg2:"#101125",panelOpacity:.88,radius:20,blur:14,grid:false,hover:false},
    crimson:{...defaultTheme,preset:"crimson",accent:"#ff6f8c",accent2:"#9b6cff",bg:"#0b050a",bg2:"#160911",panelOpacity:.9,radius:18,blur:12,grid:false,hover:false},
    frost:{...defaultTheme,preset:"frost",accent:"#52d9ff",accent2:"#7774ff",bg:"#071019",bg2:"#111a2b",panelOpacity:.86,radius:20,blur:14,grid:false,hover:false},
    mono:{...defaultTheme,preset:"mono",accent:"#ffffff",accent2:"#9ba4bb",bg:"#050505",bg2:"#111111",panelOpacity:.92,radius:16,blur:10,grid:false,hover:false},
    halloween:{...defaultTheme,preset:"halloween",accent:"#ff8618",accent2:"#a855f7",bg:"#080407",bg2:"#180a16",panelOpacity:.9,radius:18,blur:14,grid:true,hover:true,animations:true}
}

let activeTheme={...defaultTheme}
let themeStoreHadValue=false
let deferredHalloweenTheme=null
let halloweenAtmosphereReady=false

function isHalloweenMonth(){return new Date().getMonth()===9}
function canUseHalloweenTheme(){return isHalloweenMonth()||window.zyphorIsAdmin===true}

function createHauntWebSvg(seed=0,corner="tr"){
    let state=((seed+1)*2654435761)>>>0
    const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296}
    const pick=a=>a[Math.floor(rand()*a.length)]
    const colors=["#f4eaff","#ded0f4","#e7d8c0","#c9c9df","#c2b0df","#ffcf9c","#e5d8f1"]
    const tint=pick(colors),tint2=pick(colors)
    const x0=corner.endsWith("r")?100:0,y0=corner.startsWith("b")?100:0
    const dx=x0===100?-1:1,dy=y0===100?-1:1
    const variant=Math.floor(rand()*6)
    const spokes=7+Math.floor(rand()*9),rings=5+Math.floor(rand()*6)
    const polar=(a,r)=>({x:x0+dx*r*Math.cos(a),y:y0+dy*r*Math.sin(a)})
    const angles=Array.from({length:spokes},(_,i)=>i/(spokes-1)*Math.PI/2+(rand()-.5)*.06)
    const lines=[]
    for(let i=0;i<spokes;i++){
        const a=angles[i],r=100/Math.max(Math.cos(a),Math.sin(a))
        const p=polar(a,r*(.83+rand()*.17))
        const bend=polar(a+(rand()-.5)*.12,r*.56)
        lines.push(`<path d="M${x0} ${y0} Q${bend.x.toFixed(2)} ${bend.y.toFixed(2)} ${p.x.toFixed(2)} ${p.y.toFixed(2)}"/>`)
    }
    for(let ring=0;ring<rings;ring++){
        const radius=11+ring*(79/(rings-1))+(rand()-.5)*7
        for(let i=0;i<angles.length-1;i++){
            const a=angles[i],b=angles[i+1]
            const p=polar(a,radius*(.94+rand()*.12)),q=polar(b,radius*(.94+rand()*.12))
            let d
            if(variant===0||variant===3){const m=polar((a+b)/2,radius*(1.01+(rand()-.5)*.25));d=`M${p.x.toFixed(2)} ${p.y.toFixed(2)} Q${m.x.toFixed(2)} ${m.y.toFixed(2)} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`}
            else if(variant===1){const m=polar((a+b)/2,radius*(.8+rand()*.48));d=`M${p.x.toFixed(2)} ${p.y.toFixed(2)} L${m.x.toFixed(2)} ${m.y.toFixed(2)} L${q.x.toFixed(2)} ${q.y.toFixed(2)}`}
            else if(variant===2){const m=polar((a+b)/2,radius*(.9+rand()*.22));d=`M${p.x.toFixed(2)} ${p.y.toFixed(2)} Q${m.x.toFixed(2)} ${m.y.toFixed(2)} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`}
            else{const m=polar((a+b)/2,radius*(.85+rand()*.3));d=`M${p.x.toFixed(2)} ${p.y.toFixed(2)} Q${m.x.toFixed(2)} ${m.y.toFixed(2)} ${q.x.toFixed(2)} ${q.y.toFixed(2)}`}
            lines.push(`<path d="${d}"/>`)
        }
    }
    const tears=[]
    const tearCount=5+Math.floor(rand()*9)
    for(let i=0;i<tearCount;i++){
        const a=pick(angles),r=15+rand()*70,p=polar(a,r),q=polar(a+(rand()-.5)*.22,r+8+rand()*18)
        tears.push(`<path class="haunt-web-thread" d="M${p.x.toFixed(2)} ${p.y.toFixed(2)} Q${((p.x+q.x)/2+rand()*8-4).toFixed(2)} ${((p.y+q.y)/2+rand()*8-4).toFixed(2)} ${q.x.toFixed(2)} ${q.y.toFixed(2)}" stroke="${tint2}" stroke-width=".55" opacity="${(.18+rand()*.42).toFixed(2)}"/>`)
    }
    const spiderAngle=pick(angles),spiderRadius=16+rand()*62,sp=polar(spiderAngle,spiderRadius)
    const spider=`<g class="haunt-web-spider" transform="translate(${sp.x.toFixed(2)} ${sp.y.toFixed(2)})"><ellipse cx="0" cy="2.8" rx="3.7" ry="4.8" fill="#211728" stroke="${tint}" stroke-width=".8"/><circle cx="0" cy="-2.4" r="2.3" fill="#120f18" stroke="${tint}" stroke-width=".6"/><g stroke="#19121e" stroke-width="1.25" stroke-linecap="round" fill="none"><path d="M-2 -1L-7 -5L-10 -3M-3 1L-8 2L-10 6M-3 3L-6 8L-9 9M2 -1L7 -5L10 -3M3 1L8 2L10 6M3 3L6 8L9 9"/></g><circle cx="-1" cy="-3" r=".65" fill="#ff9649"/><circle cx="1" cy="-3" r=".65" fill="#ff9649"/></g>`
    const extra=variant===4?`<path d="M${x0} ${y0}Q${x0+dx*17} ${y0+dy*5} ${x0+dx*21} ${y0+dy*23}T${x0+dx*43} ${y0+dy*42}" stroke="${tint2}" stroke-width=".8" opacity=".7" fill="none"/>`:
        variant===5?`<path d="M${x0} ${y0}q${dx*18} ${dy*16} ${dx*30} ${dy*8}t${dx*21} ${dy*18}" stroke="${tint2}" stroke-width="1.15" opacity=".58" fill="none"/>`:''
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="presentation" aria-hidden="true" class="haunt-svg haunt-web-svg"><g fill="none" stroke="${tint}" stroke-width="${(.44+rand()*.42).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" opacity="${(.45+rand()*.38).toFixed(2)}">${lines.join('')}</g>${tears.join('')}${extra}${spider}</svg>`
}

function createHalloweenAtmosphere(){
    if(halloweenAtmosphereReady){
        const existingAtmosphere=document.getElementById("halloweenAtmosphere")
        const existingWalkers=document.getElementById("halloweenWalkers")
        if(existingAtmosphere&&existingWalkers)return
        halloweenAtmosphereReady=false
    }
    const library=window.zyphorHalloweenModels
    if(!Array.isArray(library))return
    const buckets={}
    for(const model of library){if(!model||!model.t||!model.svg)continue;(buckets[model.t]||(buckets[model.t]=[])).push(model)}
    const choose=type=>{const bucket=buckets[type]||[];return bucket.length?bucket[Math.floor(Math.random()*bucket.length)]:null}
    const random=(min,max)=>min+Math.random()*(max-min)
    const mobile=window.innerWidth<700
    const atmosphere=document.createElement("div")
    atmosphere.id="halloweenAtmosphere"
    atmosphere.className="halloween-atmosphere"
    atmosphere.setAttribute("aria-hidden","true")
    const corners=["tl","tr","bl","br"]
    const addWeb=(parent,corner,seed,size,opacity,cls="")=>{
        const holder=document.createElement("div")
        holder.className=`haunt-screen-web ${corner} ${cls}`.trim()
        holder.style.setProperty("--scene-web-size",`${size}px`)
        holder.style.opacity=String(opacity)
        holder.style.animationDelay=`-${random(0,14).toFixed(2)}s`
        holder.innerHTML=createHauntWebSvg(seed,corner)
        parent.appendChild(holder)
        return holder
    }
    corners.forEach((corner,index)=>addWeb(atmosphere,corner,Math.floor(random(1,10000)),random(mobile?105:150,mobile?190:310),random(.24,.48)))
    const sideWebs=mobile?5:12
    for(let i=0;i<sideWebs;i++){
        const edge=i%4,corner=corners[edge]
        const holder=addWeb(atmosphere,corner,Math.floor(random(100,999999)),random(55,145),random(.16,.33),"haunt-screen-web-small")
        if(edge<2){holder.style.top=`${random(12,88)}%`}else{holder.style.top="auto";holder.style.bottom=`${random(12,88)}%`}
        if(edge%2===0){holder.style.left=`${random(0,9)}%`;holder.style.right="auto"}else{holder.style.right=`${random(0,9)}%`;holder.style.left="auto"}
    }
    const scenery=document.createElement("div")
    scenery.className="haunt-scenery"
    scenery.innerHTML=`<svg class="haunt-moon" viewBox="0 0 240 240" aria-hidden="true"><defs><radialGradient id="hauntMoonGlow"><stop stop-color="#e3d6ff" stop-opacity=".28"/><stop offset="1" stop-color="#b18dff" stop-opacity="0"/></radialGradient><linearGradient id="hauntMoonFace" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8edce"/><stop offset="1" stop-color="#aeb8ca"/></linearGradient></defs><circle cx="120" cy="120" r="120" fill="url(#hauntMoonGlow)"/><path d="M153 31Q89 40 88 108Q90 177 153 202Q105 214 74 179Q35 132 67 76Q99 27 153 31Z" fill="url(#hauntMoonFace)" opacity=".75"/><g fill="#8c8fa6" opacity=".22"><circle cx="88" cy="88" r="8"/><circle cx="113" cy="147" r="11"/><circle cx="77" cy="136" r="4"/></g></svg><svg class="haunt-horizon" viewBox="0 0 1800 280" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="hauntGround" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#20172a" stop-opacity=".18"/><stop offset="1" stop-color="#06050b" stop-opacity=".94"/></linearGradient></defs><path fill="url(#hauntGround)" d="M0 222L48 196L79 221L127 178L164 218L212 192L251 222L290 199L336 225L374 185L423 222L467 201L513 222L557 192L600 220L643 188L681 224L725 201L767 225L814 184L850 222L895 199L940 224L990 190L1030 222L1074 197L1110 224L1159 183L1202 222L1247 196L1290 220L1332 187L1373 222L1415 199L1459 222L1502 184L1542 219L1588 194L1628 223L1675 178L1712 220L1752 192L1800 222V280H0Z"/><g stroke="#07050a" stroke-width="5" fill="#08060d"><path d="M0 230L0 72L25 91L43 58L62 92L80 60L99 105L114 229Z"/><path d="M0 99L30 134L0 123M43 58L37 22L54 55M80 60L86 29L95 74M1800 228L1800 38L1780 77L1759 48L1740 88L1718 63L1702 104L1681 229Z"/><path d="M1741 88L1764 28L1763 95L1785 70M90 227Q118 196 145 226Q163 195 184 227"/></g></svg>`
    atmosphere.appendChild(scenery)
    const sparkCount=mobile?35:78
    const sparkLayer=document.createElement("div");sparkLayer.className="haunt-firefly-layer"
    for(let i=0;i<sparkCount;i++){
        const mote=document.createElement("i");mote.className="haunt-firefly"
        mote.style.left=`${random(0,100)}%`;mote.style.top=`${random(2,99)}%`
        mote.style.setProperty("--mote-duration",`${random(3,12).toFixed(2)}s`)
        mote.style.setProperty("--mote-delay",`${-random(0,16).toFixed(2)}s`)
        mote.style.setProperty("--mote-drift",`${random(-65,65).toFixed(1)}px`)
        mote.style.setProperty("--mote-size",`${random(1.5,4.8).toFixed(1)}px`)
        mote.style.setProperty("--mote-color",Math.random()>.58?"#a9e879":Math.random()>.5?"#ffad54":"#d7a8ff")
        sparkLayer.appendChild(mote)
    }
    atmosphere.appendChild(sparkLayer)
    const stillTypes=["pumpkin","spider","bat","tombstone","skull","web","blackcat","raven","cauldron","eyeball","hauntedhouse","candle"]
    const floatCount=mobile?26:54
    for(let i=0;i<floatCount;i++){
        const weighted=stillTypes.concat(["bat","bat","spider","pumpkin","blackcat","raven","eyeball","candle"])
        const type=weighted[Math.floor(Math.random()*weighted.length)],model=choose(type)
        if(!model)continue
        const item=document.createElement("div")
        item.className=`halloween-float haunt-${type}`
        item.innerHTML=model.svg
        item.style.setProperty("--haunt-left",`${random(0,98).toFixed(2)}%`)
        item.style.setProperty("--haunt-top",`${random(2,98).toFixed(2)}%`)
        const size=random(type==="hauntedhouse"?90:42,type==="hauntedhouse"?190:108)
        item.style.setProperty("--haunt-size",`${size.toFixed(1)}px`)
        item.style.setProperty("--haunt-width",`${(size*(type==="raven"?1.2:type==="hauntedhouse"?1.5:1)).toFixed(1)}px`)
        item.style.setProperty("--haunt-height",`${(size*(type==="raven"?.82:type==="eyeball"?.82:1.12)).toFixed(1)}px`)
        item.style.setProperty("--haunt-duration",`${random(5,17).toFixed(2)}s`)
        item.style.setProperty("--haunt-delay",`${-random(0,20).toFixed(2)}s`)
        item.style.setProperty("--haunt-rotation",`${random(-34,34).toFixed(1)}deg`)
        item.style.setProperty("--haunt-opacity",`${random(.28,.74).toFixed(2)}`)
        item.style.setProperty("--haunt-drift-x",`${random(-45,45).toFixed(1)}px`)
        item.style.setProperty("--haunt-drift-y",`${random(-45,45).toFixed(1)}px`)
        atmosphere.appendChild(item)
    }
    document.body.appendChild(atmosphere)

    let walkers=document.getElementById("halloweenWalkers")
    if(!walkers){
        walkers=document.createElement("div");walkers.id="halloweenWalkers";walkers.className="halloween-walker-layer";walkers.setAttribute("aria-hidden","true")
        const walkTypes=["zombie","skeleton","zombie","skeleton","ghost","zombie","skeleton","zombie","ghost","skeleton","zombie","witch","skeleton","witch","ghost","zombie"]
        const lanes=mobile?[18,37,56,76,87]:[12,22,33,45,56,67,78,88,28,61,81,39,72,17,51,84]
        walkTypes.forEach((type,index)=>{
            const model=choose(type);if(!model)return
            const walker=document.createElement("div")
            walker.className=`haunt-walker haunt-${type}`
            walker.innerHTML=model.svg
            const duration=type==="witch"?random(20,36):type==="ghost"?random(26,43):random(32,51)
            walker.style.top=`${lanes[index%lanes.length]}%`
            const width=type==="witch"?random(150,235):type==="ghost"?random(78,112):random(92,142)
            const height=type==="witch"?random(125,185):type==="ghost"?random(105,148):random(145,208)
            walker.style.width=`${width.toFixed(1)}px`;walker.style.height=`${height.toFixed(1)}px`
            walker.style.setProperty("--walker-duration",`${duration.toFixed(2)}s`)
            walker.style.setProperty("--walker-delay",`${-random(0,duration).toFixed(2)}s`)
            walker.style.setProperty("--walker-opacity",`${type==="ghost"?random(.49,.76):type==="witch"?random(.55,.78):random(.48,.72)}`)
            walker.style.setProperty("--walker-lift",`${random(8,27).toFixed(1)}px`)
            walker.style.setProperty("--walker-yaw",`${random(1,4).toFixed(1)}deg`)
            if(Math.random()>.5)walker.style.setProperty("--walker-mirror","-1")
            walkers.appendChild(walker)
        })
        document.body.appendChild(walkers)
    }

    const attachWebs=()=>{
        if(!document.body.classList.contains("zyphor-halloween"))return
        const selector=".card,.sidebar,.hero,.profile,.quickAction,.stat,.themeSection,.changeContent,.squirtleDashCard,.supportCard,.row,.item,.navButton,.notificationReadAll,.titleIcon,.linkCodeBox,.robloxBox,.integrationButton,.copyCodeButton,.settingsLauncher,.themeDrawerHeader,.themeDrawerFooter,.commandPanel,.commandResult,.admin-card,.admin-topbar,.admin-tabs,.admin-btn,.globalSiteMessage,.profileMeta,.notificationsHeader,.ban-card,.ban-meta,.themeField,.linkCodeActions"
        document.querySelectorAll(selector).forEach((target,index)=>{
            if(target.closest("#halloweenAtmosphere,#halloweenWalkers,#halloweenEventLayer"))return
            if(target.querySelector(":scope > .haunt-web-anchor"))return
            if(getComputedStyle(target).position==="static")target.style.position="relative"
            const corner=corners[Math.floor(Math.random()*corners.length)]
            const ornament=document.createElement("span")
            ornament.className=`haunt-web-anchor haunt-web-${corner} haunt-web-pattern-${Math.floor(Math.random()*6)}`
            ornament.setAttribute("aria-hidden","true")
            ornament.innerHTML=createHauntWebSvg(index*17+Math.floor(Math.random()*900000),corner)
            const isLarge=target.matches(".sidebar,.card,.hero,.supportCard,.themeSection,.changeContent,.globalSiteMessage,.profile,.squirtleDashCard,.admin-card,.commandPanel")
            const size=isLarge?random(43,94):random(24,52)
            ornament.style.setProperty("--haunt-web-size",`${size.toFixed(1)}px`)
            ornament.style.setProperty("--haunt-web-opacity",`${random(isLarge?.25:.13,isLarge?.52:.34).toFixed(2)}`)
            ornament.style.animationDelay=`-${random(0,15).toFixed(2)}s`
            target.appendChild(ornament)
        })
        document.querySelectorAll(".item,.quickAction,.themeAction,.navButton,.notificationReadAll,.settingsLauncher,.copyCodeButton,.integrationButton,.admin-btn").forEach((button,index)=>{
            button.classList.add("haunt-button-treated")
            if(!button.querySelector(":scope > .haunt-button-etch")){
                const etch=document.createElement("span");etch.className="haunt-button-etch";etch.setAttribute("aria-hidden","true");etch.innerHTML=createHauntWebSvg(index+4307,index%2?"tr":"tl");button.appendChild(etch)
            }
        })
    }
    attachWebs()
    if(!window.__zyphorHalloweenWebObserver){
        window.__zyphorHalloweenWebObserver=new MutationObserver(()=>{if(document.body.classList.contains("zyphor-halloween"))attachWebs()})
        window.__zyphorHalloweenWebObserver.observe(document.body,{childList:true,subtree:true})
    }

    const eventLayer=document.getElementById("halloweenEventLayer")||document.createElement("div")
    eventLayer.id="halloweenEventLayer";eventLayer.className="halloween-event-layer";eventLayer.setAttribute("aria-hidden","true")
    if(!eventLayer.isConnected)document.body.appendChild(eventLayer)
    const chooseAny=types=>choose(types[Math.floor(Math.random()*types.length)])
    const spawnFlyby=(type,options={})=>{
        if(!document.body.classList.contains("zyphor-halloween"))return
        const model=choose(type);if(!model)return
        if(eventLayer.childElementCount>(mobile?8:18))return
        const el=document.createElement("div")
        el.className=`haunt-event-sprite haunt-event-${type}`;el.innerHTML=model.svg
        const fromRight=Math.random()>.5,top=random(options.topMin??5,options.topMax??92)
        const size=random(options.minSize??70,options.maxSize??150)
        el.style.top=`${top.toFixed(2)}%`;el.style.width=`${size.toFixed(1)}px`
        el.style.height=`${(size*(type==="witch"?0.84:type==="bat"?.7:type==="raven"?.8:1.12)).toFixed(1)}px`
        el.style.setProperty("--event-duration",`${random(options.minDuration??5,options.maxDuration??12).toFixed(2)}s`)
        el.style.setProperty("--event-y",`${random(-50,45).toFixed(1)}px`)
        el.style.setProperty("--event-spin",`${random(-18,18).toFixed(1)}deg`)
        el.classList.toggle("from-right",fromRight)
        el.style.opacity=String(random(options.minOpacity??.68,options.maxOpacity??.96))
        eventLayer.appendChild(el)
        el.addEventListener("animationend",()=>el.remove(),{once:true})
        setTimeout(()=>el.remove(),18000)
    }
    const spawnBatSwarm=()=>{
        if(!document.body.classList.contains("zyphor-halloween")||eventLayer.childElementCount>(mobile?7:15))return
        const group=document.createElement("div");group.className="haunt-bat-swarm"+(Math.random()>.5?" from-right":"")
        group.style.top=`${random(4,74).toFixed(1)}%`;group.style.setProperty("--swarm-duration",`${random(6,11).toFixed(1)}s`)
        const n=mobile?random(3,6):random(5,10)
        for(let i=0;i<n;i++){
            const model=choose("bat");if(!model)continue
            const bat=document.createElement("span");bat.className="haunt-swarm-bat";bat.innerHTML=model.svg
            bat.style.left=`${(i*random(19,32)+random(0,20)).toFixed(1)}px`;bat.style.top=`${random(-35,35).toFixed(1)}px`
            bat.style.setProperty("--bat-delay",`${random(-2,.3).toFixed(2)}s`);bat.style.setProperty("--bat-scale",`${random(.5,1.15).toFixed(2)}`)
            group.appendChild(bat)
        }
        eventLayer.appendChild(group);group.addEventListener("animationend",()=>group.remove(),{once:true});setTimeout(()=>group.remove(),15000)
    }
    const spawnLightning=()=>{
        if(!document.body.classList.contains("zyphor-halloween"))return
        const bolt=document.createElement("div");bolt.className="haunt-lightning-flash";bolt.style.setProperty("--flash-x",`${random(12,88).toFixed(1)}%`)
        eventLayer.appendChild(bolt);setTimeout(()=>bolt.remove(),900)
    }
    const eventTypes=[()=>spawnFlyby("witch",{topMin:3,topMax:64,minSize:125,maxSize:205,minDuration:6,maxDuration:10}),()=>spawnFlyby("ghost",{minSize:75,maxSize:135,minDuration:7,maxDuration:13}),()=>spawnFlyby("reaper",{topMin:17,topMax:78,minSize:90,maxSize:150,minDuration:8,maxDuration:14}),()=>spawnFlyby("blackcat",{topMin:24,topMax:83,minSize:70,maxSize:112,minDuration:5,maxDuration:9}),()=>spawnFlyby("raven",{topMin:4,topMax:54,minSize:70,maxSize:138,minDuration:4,maxDuration:8}),()=>spawnFlyby("crawlinghand",{topMin:61,topMax:95,minSize:66,maxSize:110,minDuration:5,maxDuration:9}),spawnBatSwarm,()=>spawnFlyby("eyeball",{topMin:12,topMax:88,minSize:58,maxSize:100,minDuration:6,maxDuration:10}),()=>spawnFlyby("pumpkin",{topMin:40,topMax:95,minSize:58,maxSize:94,minDuration:5,maxDuration:9})]
    if(!window.__zyphorHalloweenRandomLoop){
        window.__zyphorHalloweenRandomLoop=true
        const scheduleRandomEvent=()=>{
            clearTimeout(window.__zyphorHalloweenEventTimer)
            window.__zyphorHalloweenEventTimer=setTimeout(()=>{
                if(document.body.classList.contains("zyphor-halloween")){
                    const howMany=Math.random()>.72?2:1
                    for(let j=0;j<howMany;j++)eventTypes[Math.floor(Math.random()*eventTypes.length)]()
                    if(Math.random()>.90)spawnLightning()
                }
                scheduleRandomEvent()
            },random(850,2800))
        }
        scheduleRandomEvent()
    }
    if(!window.__zyphorHauntCursorBound){
        window.__zyphorHauntCursorBound=true
        document.addEventListener("pointermove",event=>{
            if(!document.body.classList.contains("zyphor-halloween")||Math.random()>.018)return
            const mote=document.createElement("i");mote.className="haunt-cursor-wisp";mote.style.left=`${event.clientX}px`;mote.style.top=`${event.clientY}px`;eventLayer.appendChild(mote);setTimeout(()=>mote.remove(),1600)
        },{passive:true})
        document.addEventListener("click",event=>{
            if(!document.body.classList.contains("zyphor-halloween")||event.target.closest("button,a"))return
            if(Math.random()>.4)return
            for(let i=0;i<4;i++){const puff=document.createElement("i");puff.className="haunt-click-ember";puff.style.left=`${event.clientX+random(-25,25)}px`;puff.style.top=`${event.clientY+random(-25,25)}px`;puff.style.setProperty("--ember-delay",`${random(0,.3)}s`);eventLayer.appendChild(puff);setTimeout(()=>puff.remove(),1200)}
        })
    }
    const hangingSpider=choose("spider")
    if(hangingSpider){const hanger=document.createElement("div");hanger.className="halloween-float haunt-spider haunt-hanging-spider";hanger.style.setProperty("--haunt-left",`${random(5,94).toFixed(1)}%`);hanger.style.setProperty("--haunt-top","0");hanger.style.setProperty("--haunt-size",`${random(42,72).toFixed(1)}px`);hanger.style.setProperty("--haunt-opacity",".91");hanger.style.setProperty("--haunt-duration",`${random(4,7).toFixed(1)}s`);hanger.innerHTML=`<span class="haunt-spider-thread"></span>${hangingSpider.svg}`;atmosphere.appendChild(hanger)}
    halloweenAtmosphereReady=true
}
function syncHalloweenThemeAccess(afterAuth=false){
    const october=isHalloweenMonth()
    const available=october||window.zyphorIsAdmin===true
    const option=document.querySelector('#themePreset option[value="halloween"]')
    const select=document.getElementById("themePreset")
    if(option){option.disabled=!available;option.hidden=!available}
    if(october){
        if(activeTheme.preset!=="halloween")applyTheme(themePresets.halloween,false)
        if(select)select.value="halloween"
        return
    }
    if(!available&&activeTheme.preset==="halloween"){
        try{const raw=localStorage.getItem(THEME_STORAGE_KEY);const saved=raw?JSON.parse(raw):null;if(saved?.preset==="halloween")deferredHalloweenTheme=saved}catch{}
        applyTheme(themePresets.midnight,false)
    }
    if(select&&!available&&select.value==="halloween")select.value="midnight"
    if(available&&afterAuth){
        if(deferredHalloweenTheme?.preset==="halloween")applyTheme(deferredHalloweenTheme,false)
        else if(!themeStoreHadValue)applyTheme(themePresets.halloween,false)
    }
}

function mergeTheme(value){
    const source=value && typeof value==="object" ? value : {}
    return {...defaultTheme,...source}
}

function themeFieldValues(){
    return {
        preset:document.getElementById("themePreset").value,
        accent:document.getElementById("themeAccent").value,
        accent2:document.getElementById("themeAccent2").value,
        bg:document.getElementById("themeBg").value,
        bg2:document.getElementById("themeBg2").value,
        panelOpacity:Number(document.getElementById("themePanelOpacity").value),
        radius:Number(document.getElementById("themeRadius").value),
        blur:Number(document.getElementById("themeBlur").value),
        sidebar:Number(document.getElementById("themeSidebar").value),
        density:Number(document.getElementById("themeDensity").value),
        glass:document.getElementById("themeGlass").checked,
        animations:document.getElementById("themeAnimations").checked,
        grid:document.getElementById("themeGrid").checked,
        hover:document.getElementById("themeHover").checked,
        bgImage:document.getElementById("themeBgImage").value.trim(),
        bgSize:document.getElementById("themeBgSize").value,
        customCss:document.getElementById("themeCustomCss").value
    }
}

function setThemeFields(theme){
    document.getElementById("themePreset").value=theme.preset||"custom"
    document.getElementById("themeAccent").value=theme.accent
    document.getElementById("themeAccent2").value=theme.accent2
    document.getElementById("themeBg").value=theme.bg
    document.getElementById("themeBg2").value=theme.bg2
    document.getElementById("themePanelOpacity").value=theme.panelOpacity
    document.getElementById("themeRadius").value=theme.radius
    document.getElementById("themeBlur").value=theme.blur
    document.getElementById("themeSidebar").value=theme.sidebar
    document.getElementById("themeDensity").value=theme.density
    document.getElementById("themeGlass").checked=theme.glass!==false
    document.getElementById("themeAnimations").checked=theme.animations!==false
    document.getElementById("themeGrid").checked=theme.grid!==false
    document.getElementById("themeHover").checked=theme.hover!==false
    document.getElementById("themeBgImage").value=theme.bgImage||""
    document.getElementById("themeBgSize").value=theme.bgSize||"cover"
    document.getElementById("themeCustomCss").value=theme.customCss||""
}

function ensureThemeRuntime(){
    let style=document.getElementById("zyphorThemeRuntime")
    if(!style){
        style=document.createElement("style")
        style.id="zyphorThemeRuntime"
        document.head.appendChild(style)
    }
    return style
}

function applyTheme(theme,save=false){
    let requested=mergeTheme(theme)
    if(isHalloweenMonth()&&requested.preset!=="halloween")requested=mergeTheme(themePresets.halloween)
    if(requested.preset==="halloween"&&!canUseHalloweenTheme()){
        requested=mergeTheme(themePresets.midnight)
        save=false
    }
    activeTheme=requested
    const t=activeTheme
    document.body.classList.toggle("zyphor-halloween",t.preset==="halloween"&&canUseHalloweenTheme())
    if(t.preset==="halloween"&&canUseHalloweenTheme())createHalloweenAtmosphere()
    const root=document.documentElement
    root.style.setProperty("--theme-accent",t.accent)
    root.style.setProperty("--theme-accent-2",t.accent2)
    root.style.setProperty("--theme-bg",t.bg)
    root.style.setProperty("--theme-bg-2",t.bg2)
    root.style.setProperty("--theme-panel",`rgba(15,19,30,${t.panelOpacity})`)
    root.style.setProperty("--theme-panel-strong",`rgba(19,24,38,${Math.min(1,t.panelOpacity+.14)})`)
    root.style.setProperty("--theme-radius",`${t.radius}px`)
    root.style.setProperty("--theme-card-radius",`${t.radius}px`)
    root.style.setProperty("--theme-blur",`${t.glass?t.blur:0}px`)
    root.style.setProperty("--theme-sidebar",`${t.sidebar}px`)
    root.style.setProperty("--theme-density",`${t.density}`)

    document.body.classList.add("theme-ready")
    document.body.classList.toggle("theme-animations-off",t.animations===false)

    const runtime=ensureThemeRuntime()
    runtime.textContent=`
        body.theme-ready::before{display:${t.grid?"block":"none"} !important;opacity:${t.grid?.65:0} !important;}
        body.theme-ready .card:hover{transform:${t.hover?"translateY(-3px)":"none"} !important;}
        body.theme-ready .card{padding:${22*t.density}px !important;}
        body.theme-ready .stat{min-height:${145*t.density}px !important;}
        body.theme-ready .hero h2{filter:none;}
        body.theme-ready{background-image:${
            t.bgImage
            ? `linear-gradient(rgba(2,4,10,.48),rgba(2,4,10,.72)),url("${t.bgImage.replace(/"/g,'\\"')}")`
            : "none"
        },radial-gradient(circle at 12% 8%,color-mix(in srgb, ${t.accent} 12%, transparent),transparent 24%),radial-gradient(circle at 88% 10%,color-mix(in srgb, ${t.accent2} 12%, transparent),transparent 25%),linear-gradient(180deg,${t.bg2} 0%,${t.bg} 58%,#02040a 100%) !important;
        background-size:${t.bgImage?t.bgSize:"auto"} !important;
        background-attachment:${t.bgImage?"fixed":"scroll"} !important;
        }
        ${t.customCss||""}
        ${t.preset==="halloween"?`body.zyphor-halloween{background-image:radial-gradient(circle at 12% 8%,rgba(255,132,24,.13),transparent 26%),radial-gradient(circle at 88% 10%,rgba(168,85,247,.14),transparent 27%),radial-gradient(circle at 48% 100%,rgba(255,90,18,.08),transparent 32%),linear-gradient(180deg,#180a16 0%,#080407 55%,#030203 100%) !important;} body.zyphor-halloween::before{display:block!important;opacity:.34!important;} body.zyphor-halloween .item.active::before{background:linear-gradient(180deg,#ffb347,#ff7417 45%,#a855f7)!important;} body.zyphor-halloween .hero{border-color:rgba(255,132,24,.2)!important;} body.zyphor-halloween .heroBrand .heroDot{background:#ff8618!important;box-shadow:0 0 16px rgba(255,134,24,.9)!important;}`:""}
    `

    setThemeFields(t)

    if(save){
        localStorage.setItem(THEME_STORAGE_KEY,JSON.stringify(t))
    }
}

function saveTheme(notify=false){
    const theme=themeFieldValues()
    applyTheme(theme,true)
    if(notify){
        const button=document.querySelector(".themeAction.primary")
        if(button){
            const old=button.textContent
            button.textContent="Saved ✓"
            setTimeout(()=>button.textContent=old,1200)
        }
    }
}

function loadStoredTheme(){
    try{
        const raw=localStorage.getItem(THEME_STORAGE_KEY)
        themeStoreHadValue=!!raw
        if(raw){
            const saved=JSON.parse(raw)
            const isOldDefault=saved?.preset==="midnight"&&saved?.accent==="#00d5ff"&&saved?.accent2==="#8d4dff"&&saved?.bg==="#05070c"&&saved?.bg2==="#080b12"&&Number(saved?.radius)===24&&Number(saved?.blur)===24&&Number(saved?.panelOpacity)===0.72
            if(saved?.preset==="halloween")deferredHalloweenTheme=saved
            if(isOldDefault){
                const migrated={...saved,...themePresets.midnight,bgImage:saved.bgImage||"",customCss:saved.customCss||"",density:saved.density??1}
                applyTheme(migrated,true)
            }else if(saved?.preset==="halloween"&&!canUseHalloweenTheme()){
                applyTheme(themePresets.midnight,false)
            }else{
                applyTheme(mergeTheme(saved),false)
            }
        }else{
            applyTheme(canUseHalloweenTheme()?themePresets.halloween:themePresets.midnight,false)
        }
    }catch{
        themeStoreHadValue=false
        applyTheme(canUseHalloweenTheme()?themePresets.halloween:themePresets.midnight,false)
    }
    syncHalloweenThemeAccess(false)
}

function applySelectedPreset(){
    const key=document.getElementById("themePreset").value
    if(key==="halloween"&&!canUseHalloweenTheme()){
        document.getElementById("themePreset").value=activeTheme.preset||"midnight"
        if(typeof zyphorAlert==="function")zyphorAlert("Halloween Haunt is available in October, or year-round for administrators.")
        syncHalloweenThemeAccess(false)
        return
    }
    if(themePresets[key]){
        applyTheme(themePresets[key],false)
        saveTheme(false)
    }else{
        saveTheme(false)
    }
}

function exportTheme(){
    saveTheme(false)
    const blob=new Blob([JSON.stringify(activeTheme,null,2)],{type:"application/json"})
    const url=URL.createObjectURL(blob)
    const a=document.createElement("a")
    a.href=url
    a.download="zyphor-theme.json"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

function importTheme(event){
    const file=event.target.files?.[0]
    if(!file) return
    const reader=new FileReader()
    reader.onload=()=>{
        try{
            const imported=mergeTheme(JSON.parse(String(reader.result||"{}")))
            if(imported.preset==="halloween"&&!canUseHalloweenTheme()){
                zyphorAlert("Halloween Haunt is available in October, or year-round for administrators.")
                return
            }
            applyTheme(imported,true)
            toggleThemeDrawer(true)
        }catch{
            zyphorAlert("Invalid Zyphor theme JSON.")
        }
        event.target.value=""
    }
    reader.readAsText(file)
}

function resetTheme(){
    applyTheme(canUseHalloweenTheme()?themePresets.halloween:themePresets.midnight,true)
}

function openThemeDrawer(){
    document.getElementById("themeDrawer").classList.add("open")
    document.getElementById("themeOverlay").classList.add("open")
    document.getElementById("themeDrawer").setAttribute("aria-hidden","false")
}

function closeThemeDrawer(){
    document.getElementById("themeDrawer").classList.remove("open")
    document.getElementById("themeOverlay").classList.remove("open")
    document.getElementById("themeDrawer").setAttribute("aria-hidden","true")
}

function toggleThemeDrawer(forceClose=false){
    if(forceClose){
        closeThemeDrawer()
        return
    }
    const open=document.getElementById("themeDrawer").classList.contains("open")
    if(open) closeThemeDrawer()
    else openThemeDrawer()
}

function bindThemeControls(){
    syncHalloweenThemeAccess(false)
    setInterval(()=>syncHalloweenThemeAccess(false),60000)
    const ids=[
        "themeAccent","themeAccent2","themeBg","themeBg2","themePanelOpacity",
        "themeRadius","themeBlur","themeSidebar","themeDensity","themeGlass",
        "themeAnimations","themeGrid","themeHover","themeBgImage","themeBgSize","themeCustomCss"
    ]
    ids.forEach(id=>{
        const el=document.getElementById(id)
        if(!el) return
        el.addEventListener("input",()=>saveTheme(false))
        el.addEventListener("change",()=>saveTheme(false))
    })
    document.getElementById("themePreset").addEventListener("change",applySelectedPreset)
}

function copyText(value){
    const text=String(value||"")
    if(!text) return Promise.resolve(false)
    if(navigator.clipboard?.writeText){
        return navigator.clipboard.writeText(text).then(()=>true).catch(()=>false)
    }
    const area=document.createElement("textarea")
    area.value=text
    area.style.position="fixed"
    area.style.opacity="0"
    document.body.appendChild(area)
    area.focus()
    area.select()
    let ok=false
    try{ok=document.execCommand("copy")}catch{}
    area.remove()
    return Promise.resolve(ok)
}

async function copyDiscordCode(){
    const code=document.getElementById("discordLinkCodeValue")?.textContent||""
    if(!code || code==="—") return
    const ok=await copyText(code.trim())
    const button=document.getElementById("copyDiscordCode")
    if(button){
        const old=button.textContent
        button.textContent=ok?"Copied ✓":"Copy failed"
        setTimeout(()=>button.textContent=old,1200)
    }
}

function renderRobloxCard(roblox){
    const stat=document.getElementById("robloxStatValue")
    const meta=document.getElementById("robloxStatMeta")
    const box=document.getElementById("robloxBox")
    if(roblox && (roblox.username || roblox.name || roblox.id)){
        const username=roblox.username || roblox.name || "Linked Roblox"
        const id=roblox.id ?? "Unknown ID"
        if(stat){
            stat.textContent=username
            stat.classList.remove("statUnlinked")
            stat.classList.add("statLinked")
        }
        if(meta) meta.textContent=`ID ${id}`
        if(box){
            box.innerHTML=`
                <div class="robloxIcon">▣</div>
                <div class="robloxConnected">LINKED</div>
                <div class="robloxName">${escapeHtml(username)}</div>
                <div class="robloxId">Roblox ID: ${escapeHtml(id)}</div>
            `
        }
        return
    }

    if(stat){
        stat.textContent="Not linked"
        stat.classList.add("statUnlinked")
        stat.classList.remove("statLinked")
    }
    if(meta) meta.textContent="Roblox account"
    if(box){
        box.innerHTML=`
            <div class="robloxIcon">×</div>
            <div class="robloxName">No Roblox account linked</div>
            <div class="robloxId">Link Roblox from your Zyphor account flow.</div>
        `
    }
}

async function getBackend(){
    const r=await fetch("server.txt")
    return (await r.text()).trim()
}

async function safeJson(res){
    const text=await res.text()

    try{
        return JSON.parse(text)
    }catch{
        return null
    }
}

async function trackPage(page){
    const token=localStorage.getItem("Token")

    if(!token) return

    try{
        await fetch(backend+"/track/page",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                Authorization:token
            },
            body:JSON.stringify({page})
        })
    }catch{}
}

function applySubscriptionTheme(subscription){

    const avatarShell=document.getElementById("avatarShell")
    const subscriptionPill=document.getElementById("subscriptionPill")
    const subscriptionText=document.getElementById("subscriptionText")
    const heroSubscription=document.getElementById("heroSubscription")
    const heroSubscriptionText=document.getElementById("heroSubscriptionText")

    avatarShell.classList.remove(
        "subscription-ascended",
        "subscription-infinity",
        "subscription-endless"
    )

    subscriptionPill.classList.remove(
        "ascended",
        "infinity",
        "endless"
    )

    heroSubscription.classList.remove(
        "ascended",
        "infinity",
        "endless"
    )

    if(!subscription || subscription.active!==true){
        subscriptionText.textContent="No Subscription"
        heroSubscriptionText.textContent="Account Active"
        return
    }

    const plan=String(subscription.plan||"").toLowerCase()
    const name=subscription.name || "Zyphor Subscription"
    const lifetime=subscription.lifetime===true

    if(plan==="ascended"){
        avatarShell.classList.add("subscription-ascended")
        subscriptionPill.classList.add("ascended")
        heroSubscription.classList.add("ascended")
    }

    if(plan==="infinity"){
        avatarShell.classList.add("subscription-infinity")
        subscriptionPill.classList.add("infinity")
        heroSubscription.classList.add("infinity")
    }

    if(plan==="endless"){
        avatarShell.classList.add("subscription-endless")
        subscriptionPill.classList.add("endless")
        heroSubscription.classList.add("endless")
    }

    const lifetimeText=lifetime ? " • Lifetime" : ""

    subscriptionText.textContent=name+lifetimeText
    heroSubscriptionText.textContent=name+lifetimeText
}

async function loadPfp(){

    const avatarImage=document.getElementById("avatarImage")
    const avatarUploadText=document.getElementById("avatarUploadText")

    try{

        const token=localStorage.getItem("Token")

        const me=await fetch(backend+"/me",{
            headers:{
                Authorization:token
            }
        })

        const data=await safeJson(me)

        if(!data || !data.username) return

        const url=
            backend+"/account/pfp/"+encodeURIComponent(data.username)+"?v="+Date.now()

        const testImage=new Image()

        testImage.onload=()=>{
            avatarImage.src=url
            avatarImage.style.display="block"
            avatarUploadText.style.display="none"
        }

        testImage.onerror=()=>{
            avatarImage.removeAttribute("src")
            avatarImage.style.display="none"
            avatarUploadText.style.display="block"
        }

        testImage.src=url

    }catch{}
}

async function selectPfp(){

    const token=localStorage.getItem("Token")

    if(!token) return

    try{

        const r=await fetch(backend+"/account/pfp/status",{
            headers:{
                Authorization:token
            }
        })

        const data=await safeJson(r)

        if(!data){
            zyphorAlert("Failed to check PFP permissions.")
            return
        }

        if(!data.permission || data.permission.enabled!==true){
            zyphorAlert("You do not have permission to upload a profile picture.")
            return
        }

        if(data.cooldownRemaining>0){

            const hours=Math.floor(data.cooldownRemaining/3600000)
            const minutes=Math.ceil(
                (data.cooldownRemaining%3600000)/60000
            )

            zyphorAlert(
                "You can change your profile picture again in "+
                hours+"h "+minutes+"m."
            )

            return
        }

        document.getElementById("pfpInput").click()

    }catch{
        zyphorAlert("Failed to check PFP status.")
    }
}

async function uploadPfp(event){

    const file=event.target.files[0]

    if(!file) return

    const token=localStorage.getItem("Token")

    if(!token) return

    const formData=new FormData()
    formData.append("pfp",file)

    const avatar=document.getElementById("avatar")

    avatar.style.opacity=".6"
    avatar.style.pointerEvents="none"

    try{

        const r=await fetch(
            backend+"/account/pfp/upload",
            {
                method:"POST",
                headers:{
                    Authorization:token
                },
                body:formData
            }
        )

        const data=await safeJson(r)

        if(!r.ok){

            if(data && data.error==="cooldown"){

                const hours=Math.floor(data.remaining/3600000)
                const minutes=Math.ceil(
                    (data.remaining%3600000)/60000
                )

                zyphorAlert(
                    "You can change your profile picture again in "+
                    hours+"h "+minutes+"m."
                )

            }else if(data && data.error==="no_pfp_permission"){

                zyphorAlert("You do not have permission to upload a profile picture.")

            }else if(data && data.error==="gif_requires_administrator"){

                zyphorAlert("Only administrators can use GIF profile pictures.")

            }else if(data && data.error==="file_too_large"){

                const max=Math.round(data.maxSize/1024/1024)

                zyphorAlert("This file is too large. Maximum size: "+max+" MB.")

            }else{

                zyphorAlert("Failed to upload profile picture.")

            }

            return
        }

        const avatarImage=document.getElementById("avatarImage")
        const avatarUploadText=document.getElementById("avatarUploadText")

        avatarImage.src=backend+data.url
        avatarImage.style.display="block"
        avatarUploadText.style.display="none"

    }catch{

        zyphorAlert("Failed to upload profile picture.")

    }finally{

        avatar.style.opacity="1"
        avatar.style.pointerEvents="auto"
        event.target.value=""

    }
}

function logout(){
    localStorage.removeItem("Token")
    location.href="login.html"
}

function formatCompactZyphium(value){
    const suffixes=["","K","M","B","T","QA","QI","SX","SP","OC","NO","DC","UD","DD","TD","QAD","QID","SXD","SPD","OCD","NOD","VG","UVG","DVG","TVG","QAVG","QIVG","SXVG","SPVG","OCVG","NOVG","TG","UTG","DTG","TTG","QATG","QITG","SXTG","SPTG","OCTG","NOTG","QAG","QIG","SXG","SPG","OCG","NOG"];
    const amount=Number(value??0);
    if(!Number.isFinite(amount))return String(value??0);
    const absolute=Math.abs(amount);
    if(absolute<1000)return amount.toLocaleString(undefined,{maximumFractionDigits:2});
    let tier=Math.floor(Math.log10(absolute)/3);
    let scaled=absolute/Math.pow(1000,tier);
    if(scaled>=999.5&&tier<suffixes.length-1){tier+=1;scaled=absolute/Math.pow(1000,tier);}
    if(tier>=suffixes.length)return amount.toExponential(2).replace("e+","E").replace("e","E");
    const decimals=scaled>=100?0:scaled>=10?1:2;
    const short=Number(scaled.toFixed(decimals)).toString();
    return `${amount<0?"-":""}${short}${suffixes[tier]}`;
}

async function loadWallet(){

    const token=localStorage.getItem("Token")

    if(!token) return

    try{

        const r=await fetch(backend+"/zyphium/account",{
            headers:{
                Authorization:token
            }
        })

        const d=await r.json()

        if(!r.ok || !d.success){
            throw new Error(d.error||"wallet")
        }

        const walletBalance=document.getElementById("walletBalance")
        const rawBalance=d.balance??0
        const numericBalance=Number(rawBalance)
        walletBalance.textContent="Z "+formatCompactZyphium(rawBalance)
        walletBalance.title="Exact balance: Z "+(Number.isFinite(numericBalance)?numericBalance.toLocaleString(undefined,{maximumFractionDigits:2}):String(rawBalance))
        walletBalance.setAttribute("aria-label",walletBalance.title)

    }catch{

        document.getElementById("walletBalance").textContent="Z 0"

    }
}

function convertTime(time){
    return new Date(time).toLocaleString()
}

async function loadChangelogs(){

    try{

        const r=await fetch(backend+"/changelogs")

        changelogs=await r.json()

        if(!Array.isArray(changelogs)){
            changelogs=[]
        }

        clIndex=0
        renderCL()

    }catch{

        changelogs=[]
        renderCL()

    }
}

function renderCL(){

    const box=document.getElementById("cl_box")

    if(!changelogs.length){

        box.innerHTML=
            "<div class='row emptyState'>No changelogs.</div>"

        document.getElementById("clVersion").textContent=""

        return
    }

    const cl=changelogs[clIndex]

    document.getElementById("clVersion").textContent=
        "v"+escapeHtml(cl.version)

    box.innerHTML=`
        <div class="changeItem">
            <div class="dot"></div>

            <div class="changeContent">

                <div class="changeTop">
                    <h3>${escapeHtml(cl.title)}</h3>
                    <span>${escapeHtml(convertTime(cl.time))}</span>
                </div>

                <p class="changeText">${escapeHtml(cl.text)}</p>

                <div class="tags">
                    <span class="tag new">UPDATE</span>
                </div>

            </div>
        </div>
    `
}

function prevCL(){

    if(clIndex < changelogs.length-1){
        clIndex++
        renderCL()
    }

}

function nextCL(){

    if(clIndex>0){
        clIndex--
        renderCL()
    }

}

function openSupport(){
    document.getElementById("supportPopup").style.display="flex"
}

function closeSupport(){
    document.getElementById("supportPopup").style.display="none"
}

function emailSupport(){

    zyphorAlert(
        "Please email:\n\nZyphor@Zyphor.cc\n\nWe'll get back to you as soon as possible."
    )

    window.location.href="mailto:Zyphor@Zyphor.cc"
}

function goProfile(){

    const username=localStorage.getItem("username")

    if(!username) return

    window.location.href=
        `https://zyphor.cc/profile.html?username=${encodeURIComponent(username)}`
}

function getNotificationIcon(type){

    if(type==="friend") return "♣"
    if(type==="dm") return "✦"
    if(type==="support") return "?"
    if(type==="report") return "!"
    return "•"
}

async function readAllNotifications(){
    const token=localStorage.getItem("Token")
    if(!token || !backend) return

    const button=document.getElementById("readAllNotificationsButton")
    if(button){
        button.disabled=true
        button.textContent="Marking Read..."
    }

    try{
        const r=await fetch(backend+"/notifications/read-all",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                Authorization:token
            },
            body:JSON.stringify({})
        })

        let data={}
        try{data=await r.json()}catch{}

        if(!r.ok || !data.success){
            throw new Error(data.error||"Unable to mark notifications as read")
        }

        await loadNotifications()
    }catch(err){
        zyphorAlert(err?.message||"Unable to mark notifications as read")
    }finally{
        if(button){
            button.disabled=false
            button.textContent="Read All Notifications"
        }
    }
}

async function loadNotifications(){

    const token=localStorage.getItem("Token")

    if(!token) return

    let notifications=[]
    let unread=0
    let unreadMessages=0
    let hasReportNotifications=false

    try{

        const r=await fetch(backend+"/notifications",{
            headers:{
                Authorization:token
            }
        })

        const data=await r.json()

        if(Array.isArray(data.notifications)){

            data.notifications.forEach(n=>{

                notifications.push({
                    type:n.type||"system",
                    message:n.message,
                    ticketId:n.ticketId||null
                })

                if(n.type==="report"){
                    hasReportNotifications=true
                }

            })
        }

        unread+=Number(data.unread||0)

    }catch{}

    try{

        const r=await fetch(backend+"/dms/state",{
            headers:{
                Authorization:token
            }
        })

        const data=await r.json()

        if(Array.isArray(data.incomingRequests)){

            data.incomingRequests.forEach(req=>{

                notifications.push({
                    type:"friend",
                    message:`Friend request from ${req.from}`
                })

            })

            unread+=data.incomingRequests.length

        }

        if(Array.isArray(data.chats)){

            data.chats.forEach(chat=>{

                if(chat.unread>0){

                    notifications.push({
                        type:"dm",
                        message:
                            `${chat.unread} unread message${chat.unread===1?"":"s"} from ${chat.with}`
                    })

                    unread+=chat.unread
                    unreadMessages+=chat.unread

                }

            })

        }

    }catch{}

    document.getElementById("messageCount").textContent=
        unreadMessages.toLocaleString()

    const badge=document.getElementById("notificationBadge")

    if(unread>0){

        badge.style.display="inline-flex"
        badge.textContent=unread

    }else{

        badge.style.display="none"

    }

    const readAllButton=document.getElementById("readAllNotificationsButton")
    if(readAllButton){
        readAllButton.disabled=unread===0
    }

    if(unread>lastUnread){

        notificationSound.currentTime=0
        notificationSound.play().catch(()=>{})

    }

    lastUnread=unread

    const list=document.getElementById("notificationList")

    if(!notifications.length){

        list.innerHTML=
            "<div class='row emptyState'>You're all caught up.</div>"

    }else{

        list.innerHTML=
            notifications.map(n=>{

                let click=""

                if(n.type==="support" && n.ticketId){

                    click=`location.href='Support.html#${encodeURIComponent(n.ticketId)}'`

                }else if(
                    n.type==="dm" ||
                    n.type==="friend"
                ){

                    click=`location.href='dms.html'`

                }

                return `
                    <div
                        class="row"
                        style="${click?"cursor:pointer":""}"
                        ${click?`onclick="${click}"`:""}
                    >
                        <div class="rowIcon">${escapeHtml(getNotificationIcon(n.type))}</div>
                        <div class="rowText">${escapeHtml(n.message)}</div>
                    </div>
                `

            }).join("")
    }

    if(hasReportNotifications){

        fetch(backend+"/notifications/seen",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                Authorization:token
            },
            body:JSON.stringify({})
        }).catch(()=>{})

    }
}

let globalSiteMessageRefreshTimer=null

async function loadGlobalSiteMessages(){
    try{
        const box=document.getElementById('globalSiteMessages')
        if(!box)return
        const headers={}
        const authToken=localStorage.getItem("Token")
        if(authToken)headers.Authorization=authToken
        const r=await fetch(backend+"/site/messages",{cache:"no-store",headers})
        const data=await safeJson(r)
        const messages=(Array.isArray(data?.messages)?data.messages:[]).filter(x=>x&&x.message).sort((a,b)=>{
            const pinnedA=a.pinned===true?1:0
            const pinnedB=b.pinned===true?1:0
            if(pinnedA!==pinnedB)return pinnedB-pinnedA
            return new Date(b.createdAt||0)-new Date(a.createdAt||0)
        })
        const iconByType={danger:'!',warning:'!',success:'✓',info:'i'}
        box.innerHTML=messages.map(m=>{
            const type=String(m.type||'info').toLowerCase()
            const icon=iconByType[type]||'i'
            const pinned=m.pinned===true
            const expiry=m.endAt?fmt(m.endAt):''
            return `<article class="globalSiteMessage ${esc(type)}${pinned?' pinned':''}" data-message-id="${esc(m.id||'')}">
                <div class="globalSiteMessageIcon">${icon}</div>
                <div class="globalSiteMessageContent">
                    <div class="globalSiteMessageTop"><span class="globalSiteMessageEyebrow">${pinned?'Pinned announcement':'Important announcement'}</span><strong>${esc(m.title||'Zyphor')}</strong></div>
                    <p>${esc(m.message)}</p>
                    <div class="globalSiteMessageBadges">${pinned?'<span class="globalSiteMessageBadge pin">◆ Pinned</span>':''}<span class="globalSiteMessageBadge">${esc(type)}</span></div>
                </div>
                <div class="globalSiteMessageMeta"><div class="globalSiteMessageMetaLabel">${expiry?'Expires':'Published'}</div><time>${expiry||fmt(m.createdAt)}</time></div>
            </article>`
        }).join('')
        box.style.display=messages.length?'grid':'none'
    }catch{}
}

function startGlobalSiteMessageRefresh(){
    if(globalSiteMessageRefreshTimer)clearInterval(globalSiteMessageRefreshTimer)
    globalSiteMessageRefreshTimer=setInterval(loadGlobalSiteMessages,5000)
    document.addEventListener('visibilitychange',()=>{
        if(!document.hidden)loadGlobalSiteMessages()
    })
}
function showBanScreen(data){
    const screen=document.getElementById('banScreen'); if(!screen)return;
    document.getElementById('banMessageText').textContent=data.message||'Your account has been banned.'
    document.getElementById('banReasonText').textContent=data.reason||'No reason provided'
    const expiry=data.expiresAt?new Date(data.expiresAt):null
    document.getElementById('banExpiryText').textContent=expiry&&!isNaN(expiry.getTime())?`Expires ${expiry.toLocaleString()}`:'Permanent ban'
    screen.style.display='flex'
    document.body.style.overflow='hidden'
}

async function init(){

    try{

        backend=await getBackend()

        const token=localStorage.getItem("Token")

        if(!token){

            location.href="login.html"
            return

        }

        await trackPage("dashboard.html")

        const r=await fetch(backend+"/me",{
            headers:{
                Authorization:token
            }
        })

        const data=await safeJson(r)

        if(data?.banned){
            await loadGlobalSiteMessages()
            showBanScreen(data)
            return
        }

        if(!data || data.error){

            localStorage.removeItem("Token")
            location.href="login.html"
            return

        }

        await loadGlobalSiteMessages()
        startGlobalSiteMessageRefresh()

        document.getElementById("profileName").textContent=
            data.username || "Unknown"

        localStorage.setItem("username",data.username || "")

        applySubscriptionTheme(data.subscription)

        const adminNavItem=document.getElementById("adminNavItem")
        window.zyphorIsAdmin=data.permissions?.admin===true
        syncHalloweenThemeAccess(true)
        if(adminNavItem){
            adminNavItem.style.display=window.zyphorIsAdmin ? "flex" : "none"
        }

        await loadPfp()

        const discordStatValue=document.getElementById("discordStatValue")
        const discordStatMeta=document.getElementById("discordStatMeta")

        if(data.linkedDiscord){

            const discordName=
                data.linkedDiscord.username || "Unknown User"

            const discordId=
                data.linkedDiscord.id || ""

            if(discordStatValue){
                discordStatValue.textContent=discordName
                discordStatValue.classList.remove("statUnlinked")
                discordStatValue.classList.add("statLinked")
            }

            if(discordStatMeta){
                discordStatMeta.textContent=`ID ${discordId}`
            }

            document.getElementById("linkCodeBox").innerHTML=`
                <div class="discordIcon">◌</div>
                <div class="discordConnected">CONNECTED</div>
                <div class="discordName">${escapeHtml(discordName)}</div>
                <div class="discordId">${escapeHtml(discordId)}</div>
                <div class="linkCodeActions">
                    <button class="integrationButton" type="button" onclick="copyText('${escapeHtml(discordId)}')">Copy Discord ID</button>
                </div>
            `

        }else if(data.linkCode){

            if(discordStatValue){
                discordStatValue.textContent="Not linked"
                discordStatValue.classList.add("statUnlinked")
                discordStatValue.classList.remove("statLinked")
            }

            if(discordStatMeta){
                discordStatMeta.textContent="Link code available"
            }

            document.getElementById("linkCodeBox").innerHTML=`
                <div class="discordIcon">◌</div>
                <div class="linkTitle">Your Discord Link Code</div>
                <div id="discordLinkCodeValue" class="linkCode">${escapeHtml(data.linkCode)}</div>
                <div class="linkCodeActions">
                    <button id="copyDiscordCode" class="copyCodeButton" type="button" onclick="copyDiscordCode()">Copy Code</button>
                </div>
                <div class="linkHint">
                    Use <b>/linkdiscord</b> in the Zyphor Discord server.
                </div>
            `

        }else{

            if(discordStatValue){
                discordStatValue.textContent="Not linked"
                discordStatValue.classList.add("statUnlinked")
                discordStatValue.classList.remove("statLinked")
            }

            if(discordStatMeta){
                discordStatMeta.textContent="Zyphor Discord"
            }

            document.getElementById("linkCodeBox").innerHTML=`
                <div class="discordIcon">×</div>
                <div class="discordName">No Link Code</div>
                <div class="discordId">Your Discord account is not linked.</div>
            `

        }

        let linkedRoblox=null

        try{
            const profileResponse=await fetch(
                backend+"/profile?username="+encodeURIComponent(data.username)
            )
            const profileData=await safeJson(profileResponse)
            linkedRoblox=profileData?.roblox || null
        }catch{}

        renderRobloxCard(linkedRoblox)

        await loadWallet()
        await loadNotifications()

        setInterval(loadNotifications,5000)

        await loadChangelogs()

    }catch{

        const token=localStorage.getItem("Token")

        if(!token){
            location.href="login.html"
        }

    }
}



loadStoredTheme()
bindThemeControls()

document.getElementById("supportPopup").addEventListener("click",event=>{
    if(event.target.id==="supportPopup"){
        closeSupport()
    }
})

document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
        closeSupport()
        closeThemeDrawer()
    }
})

init()

;

let zyphorModalResolver=null;
let zyphorModalKeyHandler=null;

function closeZyphorModal(value=null){
    const overlay=document.getElementById('zyphorModalOverlay');
    if(!overlay)return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(zyphorModalKeyHandler){document.removeEventListener('keydown',zyphorModalKeyHandler);zyphorModalKeyHandler=null}
    const resolver=zyphorModalResolver;
    zyphorModalResolver=null;
    if(resolver)resolver(value);
}


async function zyphorAlert(message,options={}){
    const {title='Zyphor',subtitle='System notification',icon='✦',buttonText='OK'}=options;
    return new Promise(resolve=>{
        const overlay=document.getElementById('zyphorModalOverlay');
        const body=document.getElementById('zyphorModalBody');
        if(!overlay||!body){resolve();return}
        document.getElementById('zyphorModalIcon').textContent=icon;
        document.getElementById('zyphorModalTitle').textContent=title;
        document.getElementById('zyphorModalSubtitle').textContent=subtitle;
        body.innerHTML=`<div class="zyphorModalMessage">${esc(String(message)).replace(/\n/g,'<br>')}</div><div class="zyphorModalActions"><button type="button" class="zyphorModalButton primary" onclick="closeZyphorModal(true)">${esc(buttonText)}</button></div>`;
        zyphorModalResolver=resolve;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        zyphorModalKeyHandler=e=>{if(e.key==='Escape'||e.key==='Enter')closeZyphorModal(true)};
        document.addEventListener('keydown',zyphorModalKeyHandler);
        requestAnimationFrame(()=>document.querySelector('.zyphorModalButton.primary')?.focus());
    });
}

async function zyphorConfirm(message,options={}){
    const {title='Confirm action',subtitle='Please confirm this Zyphor action.',icon='⚠️',confirmText='Confirm',danger=false}=options;
    return new Promise(resolve=>{
        const overlay=document.getElementById('zyphorModalOverlay');
        const body=document.getElementById('zyphorModalBody');
        if(!overlay||!body){resolve(false);return}
        document.getElementById('zyphorModalIcon').textContent=icon;
        document.getElementById('zyphorModalTitle').textContent=title;
        document.getElementById('zyphorModalSubtitle').textContent=subtitle;
        body.innerHTML=`<div class="zyphorModalMessage">${esc(String(message)).replace(/\n/g,'<br>')}</div><div class="zyphorModalActions"><button type="button" class="zyphorModalButton" onclick="closeZyphorModal(false)">Cancel</button><button type="button" class="zyphorModalButton ${danger?'danger':'primary'}" onclick="closeZyphorModal(true)">${esc(confirmText)}</button></div>`;
        zyphorModalResolver=resolve;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        zyphorModalKeyHandler=e=>{if(e.key==='Escape')closeZyphorModal(false);else if(e.key==='Enter')closeZyphorModal(true)};
        document.addEventListener('keydown',zyphorModalKeyHandler);
        requestAnimationFrame(()=>document.querySelector('.zyphorModalButton.primary,.zyphorModalButton.danger')?.focus());
    });
}

async function zyphorPrompt(message,defaultValue='',options={}){
    return await openZyphorInput({title:options.title||'Zyphor input',subtitle:options.subtitle||message,icon:options.icon||'✎',label:options.label||'Value',value:defaultValue,placeholder:options.placeholder||'',hint:options.hint||'',multiline:!!options.multiline,confirmText:options.confirmText||'Continue',danger:!!options.danger});
}

function openZyphorInput({title='Zyphor',subtitle='Enter the requested information.',icon='✦',label='Value',value='',placeholder='',hint='',multiline=false,confirmText='Continue',danger=false}={}){
    return new Promise(resolve=>{
        const overlay=document.getElementById('zyphorModalOverlay');
        const body=document.getElementById('zyphorModalBody');
        document.getElementById('zyphorModalIcon').textContent=icon;
        document.getElementById('zyphorModalTitle').textContent=title;
        document.getElementById('zyphorModalSubtitle').textContent=subtitle;
        const field=multiline?`<textarea id="zyphorModalField" class="zyphorModalTextarea" placeholder="${esc(String(placeholder))}">${esc(String(value))}</textarea>`:`<input id="zyphorModalField" class="zyphorModalInput" value="${esc(String(value))}" placeholder="${esc(String(placeholder))}" autocomplete="off">`;
        body.innerHTML=`<label class="zyphorModalLabel" for="zyphorModalField">${esc(label)}</label>${field}${hint?`<div class="zyphorModalHint">${esc(hint)}</div>`:''}<div class="zyphorModalActions"><button type="button" class="zyphorModalButton" onclick="closeZyphorModal(null)">Cancel</button><button type="button" class="zyphorModalButton ${danger?'danger':'primary'}" onclick="submitZyphorInput()">${esc(confirmText)}</button></div>`;
        zyphorModalResolver=resolve;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        zyphorModalKeyHandler=e=>{if(e.key==='Escape'){closeZyphorModal(null)}else if(e.key==='Enter'&&!multiline&&document.activeElement?.id==='zyphorModalField'){e.preventDefault();submitZyphorInput()}};
        document.addEventListener('keydown',zyphorModalKeyHandler);
        requestAnimationFrame(()=>{const input=document.getElementById('zyphorModalField');input?.focus();input?.select()});
    });
}

function submitZyphorInput(){const input=document.getElementById('zyphorModalField');closeZyphorModal(input?input.value:null)}

function openZyphorResetLink(link){
    return new Promise(resolve=>{
        const overlay=document.getElementById('zyphorModalOverlay');
        const body=document.getElementById('zyphorModalBody');
        document.getElementById('zyphorModalIcon').textContent='🔐';
        document.getElementById('zyphorModalTitle').textContent='Password reset link';
        document.getElementById('zyphorModalSubtitle').textContent='A secure one-time link has been generated for the selected account.';
        body.innerHTML=`<div class="zyphorModalLabel">One-time reset link</div><div class="zyphorLinkBox"><div id="zyphorResetLinkValue" class="zyphorLinkValue">${esc(String(link))}</div><button type="button" class="zyphorCopyButton" title="Copy reset link" onclick="copyZyphorResetLink()">⧉</button></div><div class="zyphorModalHint">This link is shown here only so you can copy it. It is not stored in the admin panel.</div><div class="zyphorModalActions"><button type="button" class="zyphorModalButton primary" onclick="closeZyphorModal(true)">Done</button></div>`;
        zyphorModalResolver=resolve;
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden','false');
        document.body.style.overflow='hidden';
        zyphorModalKeyHandler=e=>{if(e.key==='Escape')closeZyphorModal(true)};
        document.addEventListener('keydown',zyphorModalKeyHandler);
        requestAnimationFrame(()=>document.querySelector('.zyphorModalButton.primary')?.focus());
    });
}

async function copyZyphorResetLink(){
    const value=document.getElementById('zyphorResetLinkValue')?.textContent||'';
    try{await navigator.clipboard.writeText(value);const b=document.querySelector('.zyphorCopyButton');if(b){b.textContent='✓';setTimeout(()=>{if(b)b.textContent='⧉'},1200)}}catch{}
}

async function zyphorBanFlow(key){
    const durations={ban_perm:null,ban_1h:3600000,ban_24h:86400000,ban_7d:604800000,ban_30d:2592000000};
    const reason=await openZyphorInput({title:'Ban user',subtitle:selectedUser?`Choose the reason for banning ${selectedUser}.`:'Choose a ban reason.',icon:'⛔',label:'Ban reason',value:userData?.banReason||'Administrative action',placeholder:'Enter the ban reason...',hint:'This reason is recorded with the moderation action.',confirmText:'Continue',danger:true});
    if(reason===null)return;
    const cleanReason=String(reason).trim()||'Administrative action';
    const message=await openZyphorInput({title:'Ban screen message',subtitle:'Choose what the banned user will see on the ban screen.',icon:'💬',label:'Ban screen message',value:userData?.banMessage||cleanReason,placeholder:'Enter the message...',hint:'This message is displayed to the affected account.',confirmText:'Ban user',danger:true,multiline:true});
    if(message===null)return;
    await act('ban',{reason:cleanReason,banMessage:String(message).trim()||cleanReason,durationMs:durations[key]??null});
}

;

(function(){
    const overlay=document.getElementById('commandOverlay');
    const search=document.getElementById('commandSearch');
    const results=document.getElementById('commandResults');
    const sectionLabel=document.getElementById('commandSectionLabel');
    const closeButton=document.getElementById('commandClose');
    const toast=document.getElementById('dashboardUxToast');
    if(!overlay||!search||!results)return;
    let selection=0;
    let activeResults=[];
    let previousOverflow='';
    let toastTimer=null;

    const commands=[
        {title:'Dashboard overview',description:'Return to the main account overview.',keywords:'home main overview start',icon:'⌂',category:'Navigation',action:()=>{openDashboardHome();window.scrollTo({top:0,behavior:scrollBehavior()});}},
        {title:'Profile',description:'Open your public Zyphor profile.',keywords:'account user avatar profile',icon:'◉',category:'Account',action:()=>goProfile()},
        {title:'Messages',description:'Open direct messages and conversations.',keywords:'dm chat inbox direct messages',icon:'✦',category:'Navigation',action:()=>location.href='dms.html'},
        {title:'Wallet',description:'Manage your Zyphium balance and transactions.',keywords:'money balance zyphium coins transactions',icon:'◈',category:'Navigation',action:()=>location.href='Wallet.html'},
        {title:'Cloud storage',description:'Open your Zyphor Cloud files.',keywords:'cloud files photos images storage',icon:'☁',category:'Navigation',action:()=>location.href='Cloud.html'},
        {title:'Squirtle Event',description:'Open the global boss event page.',keywords:'squirtle boss event damage badge',icon:'🐢',category:'Event',action:()=>location.href='SquirtleEvent.html'},
        {title:'App Center',description:'Browse Zyphor apps and downloads.',keywords:'apps downloads windows android',icon:'↓',category:'Navigation',action:()=>location.href='download.html'},
        {title:'Account settings',description:'Manage your account preferences and security.',keywords:'settings password security account',icon:'⚙',category:'Account',action:()=>location.href='Settings.html'},
        {title:'Notifications',description:'Jump to recent account activity.',keywords:'alerts updates unread activity',icon:'✧',category:'Dashboard',action:()=>jumpTo(document.querySelector('.notificationsHeader'))},
        {title:'Discord integration',description:'View your Discord connection or link code.',keywords:'discord integration code connected link',icon:'◌',category:'Dashboard',action:()=>jumpTo(document.querySelector('.discordCard'))},
        {title:'Roblox integration',description:'View the Roblox account connected to Zyphor.',keywords:'roblox integration linked account',icon:'▣',category:'Dashboard',action:()=>jumpTo(document.querySelector('.integrationGrid .card:nth-child(2)'))},
        {title:'Latest changelog',description:'Read the latest Zyphor release notes.',keywords:'release notes version update changelog',icon:'↗',category:'Dashboard',action:()=>jumpTo(document.querySelector('.changelog'))},
        {title:'Customize appearance',description:'Adjust colors, density, and dashboard effects.',keywords:'theme colors design appearance customize',icon:'◐',category:'Preferences',action:()=>toggleThemeDrawer()},
        {title:'Contact support',description:'Open support options for your account.',keywords:'help ticket support email',icon:'?',category:'Help',action:()=>openSupport()},
        {title:'Read all notifications',description:'Mark your account notifications as read.',keywords:'clear unread read all alerts',icon:'✓',category:'Dashboard',action:()=>readAllNotifications()},
        {title:'Copy username',description:'Copy your current Zyphor username.',keywords:'copy clipboard profile account username',icon:'⧉',category:'Utility',action:async()=>{const username=localStorage.getItem('username')||document.getElementById('profileName')?.textContent?.trim();if(!username||username==='Loading...')throw new Error('Your username is not available yet.');await copyToClipboard(username);showToast('Username copied to clipboard.');}},
        {title:'Refresh dashboard',description:'Reload account details and dashboard data.',keywords:'reload refresh update data',icon:'↻',category:'Utility',action:()=>location.reload()},
        {title:'Log out',description:'End your current Zyphor session.',keywords:'sign out logout leave account',icon:'↪',category:'Account',action:()=>logout()},
        {title:'Admin Center',description:'Open administrator tools.',keywords:'admin management control panel',icon:'◆',category:'Admin',admin:true,action:()=>{openAdminCenter();window.scrollTo({top:0,behavior:scrollBehavior()});}}
    ];

    function scrollBehavior(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}
    function showToast(message){
        toast.textContent=message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer=setTimeout(()=>toast.classList.remove('show'),2600);
    }
    async function copyToClipboard(value){
        if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);return;}
        const input=document.createElement('textarea');
        input.value=value;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';
        document.body.appendChild(input);input.select();
        const copied=document.execCommand('copy');input.remove();
        if(!copied)throw new Error('Clipboard access is unavailable in this browser.');
    }
    function jumpTo(element){
        if(!element){showToast('That dashboard section is not available right now.');return;}
        if(document.getElementById('adminCenter')?.style.display==='block')openDashboardHome();
        setTimeout(()=>element.scrollIntoView({behavior:scrollBehavior(),block:'start'}),20);
    }
    function getRecent(){
        try{return JSON.parse(localStorage.getItem('zyphorDashboardRecentCommands')||'[]').filter(x=>typeof x==='string');}catch{return [];}
    }
    function render(){
        const query=search.value.trim().toLowerCase();
        const recent=getRecent();
        activeResults=commands.filter(command=>(!command.admin||window.zyphorIsAdmin===true)&&`${command.title} ${command.description} ${command.keywords} ${command.category}`.toLowerCase().includes(query));
        if(!query){activeResults.sort((a,b)=>{const ai=recent.indexOf(a.title),bi=recent.indexOf(b.title);return (ai<0?999:ai)-(bi<0?999:bi)});}
        selection=Math.max(0,Math.min(selection,activeResults.length-1));
        sectionLabel.textContent=query?'Search results':(recent.length?'Recent and available actions':'Available actions');
        if(!activeResults.length){results.innerHTML='<div class="commandEmpty">No matching dashboard actions.<br>Try “wallet”, “messages”, “support” or “appearance”.</div>';return;}
        results.innerHTML=activeResults.map((command,index)=>`<button type="button" class="commandResult${index===selection?' selected':''}" role="option" aria-selected="${index===selection?'true':'false'}" data-command-index="${index}"><span class="commandResultIcon" aria-hidden="true">${escapeHtml(command.icon)}</span><span class="commandResultText"><span class="commandResultTitle">${escapeHtml(command.title)}</span><span class="commandResultDescription">${escapeHtml(command.description)}</span></span><span class="commandResultCategory">${escapeHtml(command.category)}</span></button>`).join('');
        const selected=results.querySelector('.commandResult.selected');
        if(selected)selected.scrollIntoView({block:'nearest'});
    }
    function open(){
        previousOverflow=document.body.style.overflow;
        overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');
        search.value='';selection=0;render();
        document.body.style.overflow='hidden';
        setTimeout(()=>search.focus(),30);
    }
    function close(){
        overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');
        document.body.style.overflow=previousOverflow;
    }
    async function execute(command){
        if(!command)return;
        try{
            const recent=[command.title,...getRecent().filter(title=>title!==command.title)].slice(0,6);
            localStorage.setItem('zyphorDashboardRecentCommands',JSON.stringify(recent));
        }catch{}
        close();
        try{await command.action();}
        catch(error){showToast(error?.message||'That action could not be completed.');}
    }

    window.openCommandPalette=open;
    document.getElementById('commandLauncher')?.addEventListener('click',open);
    closeButton?.addEventListener('click',close);
    overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
    search.addEventListener('input',()=>{selection=0;render();});
    results.addEventListener('mousemove',event=>{
        const item=event.target.closest('[data-command-index]');
        if(!item)return;
        const next=Number(item.dataset.commandIndex);
        if(next===selection)return;
        selection=next;
        results.querySelectorAll('.commandResult').forEach((result,index)=>{
            const active=index===selection;
            result.classList.toggle('selected',active);
            result.setAttribute('aria-selected',active?'true':'false');
        });
    });
    results.addEventListener('click',event=>{
        const item=event.target.closest('[data-command-index]');
        if(item)execute(activeResults[Number(item.dataset.commandIndex)]);
    });
    document.addEventListener('keydown',event=>{
        const typing=event.target instanceof HTMLElement&&(event.target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName));
        if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
            event.preventDefault();overlay.classList.contains('open')?close():open();return;
        }
        if(!typing&&event.key==='/'&&!overlay.classList.contains('open')){event.preventDefault();open();return;}
        if(!overlay.classList.contains('open'))return;
        if(event.key==='Escape'){event.preventDefault();close();return;}
        if(event.key==='ArrowDown'){event.preventDefault();selection=Math.min(selection+1,activeResults.length-1);render();return;}
        if(event.key==='ArrowUp'){event.preventDefault();selection=Math.max(selection-1,0);render();return;}
        if(event.key==='Enter'){event.preventDefault();execute(activeResults[selection]);}
    });

    const greeting=document.getElementById('dashboardGreeting');
    const date=document.getElementById('dashboardDate');
    function updateHeaderDate(){
        const now=new Date();
        if(greeting){const hour=now.getHours();greeting.textContent=hour<12?'Good morning.':hour<18?'Good afternoon.':'Good evening.';}
        if(date)date.textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'short',day:'numeric'}).format(now);
    }
    updateHeaderDate();
    setInterval(updateHeaderDate,60000);
    document.addEventListener('DOMContentLoaded',()=>{if(date&&!date.textContent.trim())updateHeaderDate();});
})();