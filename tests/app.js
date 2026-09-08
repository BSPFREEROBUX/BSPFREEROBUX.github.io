const P = "zyphor.practice.";
const $ = id => document.getElementById(id);
const get = (key, fallback) => {
    const v = localStorage.getItem(P + key);
    if (v === null) return fallback;
    try { return JSON.parse(v); } catch { return v; }
};
const set = (key, value) => {
    localStorage.setItem(P + key, typeof value === "string" ? value : JSON.stringify(value));
    $("saveState").textContent = "Saved";
    refreshStorage();
};
const del = key => { localStorage.removeItem(P + key); refreshStorage(); };
let actionCount = get("actionCount", 0) || 0;
const act = () => { actionCount++; set("actionCount", actionCount); $("actionCount").textContent = actionCount; };

function toast(text) {
    const t = $("toast");
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => t.classList.remove("show"), 1500);
}
function bindText(id, key, fallback="") {
    const el = $(id);
    el.value = get(key, fallback);
    el.addEventListener("input", () => { if ($("autosave").checked) set(key, el.value); act(); });
    el.addEventListener("change", () => { set(key, el.value); act(); });
}
function bindCheckbox(id, key, fallback=false) {
    const el = $(id);
    el.checked = !!get(key, fallback);
    el.addEventListener("change", () => { set(key, el.checked); applySettings(); act(); });
}
function bindSelect(id, key, fallback) {
    const el = $(id);
    el.value = get(key, fallback);
    el.addEventListener("change", () => { set(key, el.value); applySettings(); act(); });
}

function defaults() {
    const d = {
        displayName:"Zyphor", favoriteColor:"#9b5cff", bio:"Practicing browser persistence.", favoriteEmoji:"⚡",
        theme:"dark", accent:"purple", animations:true, compact:false, sound:false, autosave:true,
        counter:0, tasks:[{text:"Test localStorage",done:true},{text:"Add a random feature",done:false}],
        notes:"Welcome to the localStorage lab.\nTry changing everything.", links:[{name:"Zyphor",url:"https://zyphor.cc"}],
        spinResult:"None", spinDate:"", colorA:"#9b5cff", colorB:"#39d9ff",
        favGame:"", codingHours:5, dreamProject:"", streak:0, streakDate:"",
        radius:18, glow:55, fontScale:100, density:"normal", lastGenerated:"Ready",
        lastVisit:Date.now(), visitCount:0, lastAction:"", toggleA:true, toggleB:false, sliderA:50, sliderB:75,
        favoriteNumber:42, randomSeed:"zyphor", panelMode:"standard", pinned:true, soundVolume:50, launchCount:0
    };
    for (const [k,v] of Object.entries(d)) {
        if (localStorage.getItem(P+k) === null) set(k,v);
    }
}
defaults();

function applySettings() {
    document.body.className = get("theme","dark");
    if (get("compact",false)) document.body.classList.add("compact");
    if (!get("animations",true)) document.body.classList.add("no-animations");
    const accents = {purple:"#9b5cff",cyan:"#39d9ff",pink:"#ff4fb8",lime:"#a4ff4f"};
    document.documentElement.style.setProperty("--accent", accents[get("accent","purple")] || accents.purple);
    document.documentElement.style.setProperty("--radius", `${get("radius",18)}px`);
    document.documentElement.style.setProperty("--glow", `${get("glow",55)}%`);
    document.documentElement.style.setProperty("--fontScale", `${get("fontScale",100)}%`);
}
function renderBasic() {
    $("counterValue").textContent = get("counter",0);
    $("counterBar").style.width = `${Math.min(100,Math.max(0,get("counter",0)))}%`;
    $("visitCount").textContent = get("visitCount",0);
    $("actionCount").textContent = get("actionCount",0);
    $("streakValue").textContent = get("streak",0);
    $("lastSpin").textContent = get("spinResult","None");
    $("randomOutput").textContent = get("lastGenerated","Ready");
    $("colorA").value = get("colorA","#9b5cff");
    $("colorB").value = get("colorB","#39d9ff");
    updateMix();
}
function setup() {
    bindText("displayName","displayName","Zyphor");
    bindText("bio","bio","");
    bindText("favoriteEmoji","favoriteEmoji","⚡");
    bindText("notes","notes","");
    bindText("favGame","favGame","");
    bindText("codingHours","codingHours",5);
    bindText("dreamProject","dreamProject","");
    bindSelect("theme","theme","dark");
    bindSelect("accent","accent","purple");
    bindSelect("density","density","normal");
    bindCheckbox("animations","animations",true);
    bindCheckbox("compact","compact",false);
    bindCheckbox("sound","sound",false);
    bindCheckbox("autosave","autosave",true);
    $("favoriteColor").value=get("favoriteColor","#9b5cff");
    $("favoriteColor").addEventListener("input",()=>{set("favoriteColor",$("favoriteColor").value);act()});
    $("radius").value=get("radius",18); $("glow").value=get("glow",55); $("fontScale").value=get("fontScale",100);
    ["radius","glow","fontScale"].forEach(id=>$(id).addEventListener("input",()=>{set(id,Number($(id).value));applySettings();act()}));
    renderTasks(); renderLinks();
}
function saveBulk() {
    set("notes",$("notes").value); set("favGame",$("favGame").value);
    set("codingHours",Number($("codingHours").value)||0); set("dreamProject",$("dreamProject").value);
    toast("Answers saved"); act();
}
function renderTasks() {
    const tasks=get("tasks",[]);
    $("tasks").innerHTML="";
    tasks.forEach((task,i)=>{
        const row=document.createElement("div"); row.className="task"+(task.done?" done":"");
        row.innerHTML=`<input type="checkbox" ${task.done?"checked":""}><span></span><button>✕</button>`;
        row.querySelector("span").textContent=task.text;
        row.querySelector("input").addEventListener("change",()=>{tasks[i].done=!tasks[i].done;set("tasks",tasks);renderTasks();act()});
        row.querySelector("button").addEventListener("click",()=>{tasks.splice(i,1);set("tasks",tasks);renderTasks();act()});
        $("tasks").appendChild(row);
    });
}
$("addTask").addEventListener("click",()=>{
    const text=$("taskInput").value.trim(); if(!text)return;
    const tasks=get("tasks",[]); tasks.push({text,done:false});
    set("tasks",tasks); $("taskInput").value=""; renderTasks(); toast("Task added"); act();
});
$("taskInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("addTask").click()});
function renderLinks() {
    const links=get("links",[]);
    $("linkList").innerHTML="";
    links.forEach((link,i)=>{
        const row=document.createElement("div"); row.className="link-item";
        row.innerHTML=`<a target="_blank" rel="noopener"></a><button>✕</button>`;
        row.querySelector("a").href=link.url; row.querySelector("a").textContent=link.name||link.url;
        row.querySelector("button").onclick=()=>{links.splice(i,1);set("links",links);renderLinks();act()};
        $("linkList").appendChild(row);
    });
}
$("saveLink").onclick=()=>{
    const name=$("linkName").value.trim(), url=$("linkUrl").value.trim();
    if(!url)return;
    const links=get("links",[]); links.push({name,url}); set("links",links);
    $("linkName").value=""; $("linkUrl").value=""; renderLinks(); toast("Link saved"); act();
};
$("minus").onclick=()=>updateCounter(-1); $("plus").onclick=()=>updateCounter(1);
$("counter10").onclick=()=>updateCounter(10); $("counterReset").onclick=()=>{set("counter",0);renderBasic();act()};
function updateCounter(delta){set("counter",get("counter",0)+delta);renderBasic();act()}
$("stampNote").onclick=()=>{$("notes").value+=`${$("notes").value?"\n":""}[${new Date().toLocaleTimeString()}]`;set("notes",$("notes").value);act()};
$("clearNotes").onclick=()=>{$("notes").value="";set("notes","");act()};
const spins=["⚡ Zap","🗿 Gigachad","🌙 Midnight","🔥 Chaos","💎 Rare","🧠 Big Brain","👾 Glitch","🎯 Lucky","🦆 Duck","🚀 Boost"];
$("spinBtn").onclick=()=>{const r=spins[Math.floor(Math.random()*spins.length)];set("spinResult",r);set("spinDate",new Date().toISOString());$("spinResult").textContent=r;$("lastSpin").textContent=r;toast(r);act()};
function hexRgb(h){return h.replace("#","").match(/.{2}/g).map(x=>parseInt(x,16))}
function updateMix(){const a=$("colorA").value,b=$("colorB").value;$("mixPreview").style.background=`linear-gradient(90deg,${a},${b})`}
$("colorA").oninput=()=>{set("colorA",$("colorA").value);updateMix();act()};$("colorB").oninput=()=>{set("colorB",$("colorB").value);updateMix();act()};
$("mixRandom").onclick=()=>{const r=()=>"#"+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0");$("colorA").value=r();$("colorB").value=r();set("colorA",$("colorA").value);set("colorB",$("colorB").value);updateMix();act()};
$("copyMix").onclick=async()=>{const txt=`${$("colorA").value} + ${$("colorB").value}`;try{await navigator.clipboard.writeText(txt);toast("Copied")}catch{toast(txt)}act()};
$("saveQuiz").onclick=saveBulk;
$("claimStreak").onclick=()=>{
    const today=new Date().toISOString().slice(0,10), last=get("streakDate","");
    if(last===today){$("streakMessage").textContent="Already claimed today.";return}
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    const streak=last===yesterday?get("streak",0)+1:1;
    set("streak",streak);set("streakDate",today);$("streakValue").textContent=streak;$("streakMessage").textContent="Streak claimed!";act();
};
const names=["Nova","Pixel","Shadow","Echo","Vortex","Rogue","Blaze","Mochi","Zen","Orbit"];
$("genName").onclick=()=>generate("lastGenerated",names[Math.floor(Math.random()*names.length)]);
$("genColor").onclick=()=>generate("lastGenerated","#"+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0"));
$("genNumber").onclick=()=>generate("favoriteNumber",Math.floor(Math.random()*1000));
function generate(key,val){set(key,val);$("randomOutput").textContent=val;toast("Generated");act()}
$("saveLayout").onclick=()=>{set("radius",Number($("radius").value));set("glow",Number($("glow").value));set("fontScale",Number($("fontScale").value));set("density",$("density").value);applySettings();toast("Layout saved");act()};
$("randomLayout").onclick=()=>{$("radius").value=4+Math.floor(Math.random()*29);$("glow").value=Math.floor(Math.random()*101);$("fontScale").value=80+Math.floor(Math.random()*41);$("density").value=["cozy","normal","tight"][Math.floor(Math.random()*3)];$("saveLayout").click()};
function refreshStorage(){
    const q=$("storageSearch").value.toLowerCase();
    const rows=[];
    Object.keys(localStorage).filter(k=>k.startsWith(P)&&k.toLowerCase().includes(q)).sort().forEach(k=>{
        let v=localStorage.getItem(k); rows.push(`<tr><td>${k.slice(P.length)}</td><td class="value-cell">${escapeHtml(v)}</td><td><button class="btn" data-delete="${k}">Delete</button></td></tr>`);
    });
    $("storageTable").innerHTML=`<table><thead><tr><th>Key</th><th>Value</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
    $("keyCount").textContent=Object.keys(localStorage).filter(k=>k.startsWith(P)).length;
    document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{del(b.dataset.delete);refreshStorage();act()});
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
$("storageSearch").oninput=refreshStorage;$("refreshStorage").onclick=refreshStorage;
$("exportStorage").onclick=()=>{
    const out={};Object.keys(localStorage).filter(k=>k.startsWith(P)).forEach(k=>out[k.slice(P.length)]=get(k,null));
    const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"}),a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download="zyphor-localstorage.json";a.click();URL.revokeObjectURL(a.href);toast("Exported");act();
};
$("randomizeBtn").onclick=()=>{
    set("favoriteColor","#"+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0"));
    set("accent",["purple","cyan","pink","lime"][Math.floor(Math.random()*4)]);
    set("counter",Math.floor(Math.random()*101));
    set("radius",4+Math.floor(Math.random()*29));
    set("glow",Math.floor(Math.random()*101));
    set("fontScale",80+Math.floor(Math.random()*41));
    set("favoriteEmoji",["⚡","🔥","👾","💎","🚀","🗿","🌙"][Math.floor(Math.random()*7)]);
    applySettings(); $("favoriteColor").value=get("favoriteColor");
    $("accent").value=get("accent");$("radius").value=get("radius");$("glow").value=get("glow");$("fontScale").value=get("fontScale");$("favoriteEmoji").value=get("favoriteEmoji");
    renderBasic();toast("Randomized");act();
};
$("resetBtn").onclick=()=>{
    if(!confirm("Reset every zyphor.practice value?"))return;
    Object.keys(localStorage).filter(k=>k.startsWith(P)).forEach(k=>localStorage.removeItem(k));
    defaults();location.reload();
};

let visits=get("visitCount",0)+1;set("visitCount",visits);set("lastVisit",Date.now());set("launchCount",get("launchCount",0)+1);
$("actionCount").textContent=actionCount;
setup();applySettings();renderBasic();refreshStorage();

setInterval(()=>{if($("autosave").checked){set("lastAction",new Date().toISOString())}},15000);
