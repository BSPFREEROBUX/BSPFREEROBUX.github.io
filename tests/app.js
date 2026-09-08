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

const savedQuotes = [
"Build small things until they become big things.",
"Persist the state. Refresh the page. Smile.",
"Every bug is just a feature waiting for a better name.",
"Ship the weird idea.",
"Make the UI fun enough to click twice."
];
const emojis=["⚡","🔥","💎","👾","🚀","🌙","🗿","🍀","🎯","🧪","🦆","⭐"];
const keyPrefix=P;

function ensureExtraDefaults(){
    const values={
        coinScore:0,coinPower:1,coinMult:1,coinPrestige:0,coinBest:0,
        reactionBest:0,reactionAttempts:0,
        memoryBest:0,memoryMatches:0,guessWins:0,guessTarget:Math.floor(Math.random()*100)+1,
        diceWins:0,diceLosses:0,diceDraws:0,
        rpsW:0,rpsL:0,rpsD:0,customSides:6,
        chestOpened:0,chestLoot:[],oreScore:0,orePower:1,autoMiners:0,
        quoteIndex:Math.floor(Math.random()*savedQuotes.length),
        xp:0,level:1,colorPattern:[],colorLevel:1,
        scrambleWord:"",scrambleScore:0,
        timerSeconds:60,timerRemaining:60,timerRunning:false,
        pomodoroCount:0,pomodoroRemaining:1500,pomodoroRunning:false,
        pollVotes:{Neon:0,Minimal:0,Retro:0},collection:[],
        statStrength:50,statSpeed:50,statLuck:50,statDefense:50,
        palette:"#9b5cff,#39d9ff",scores:[],journal:[],
        habitDay:new Date().toISOString().slice(0,10),habitRead:false,habitCode:false,habitExercise:false,habitWater:false,habitLearn:false,
        activePalette:0,lastChest:"",customThemeName:"Neon"
    };
    for(const [k,v] of Object.entries(values)) if(localStorage.getItem(P+k)===null) set(k,v);
}
ensureExtraDefaults();

$("coinScore").textContent=Math.floor(get("coinScore",0));
$("coinPower").textContent=get("coinPower",1);
$("coinMult").textContent=get("coinMult",1)+"x";
$("coinCost").textContent=25*get("coinPower",1)*get("coinPower",1);
function refreshCoin(){
    $("coinScore").textContent=Math.floor(get("coinScore",0));
    $("coinPower").textContent=get("coinPower",1);
    $("coinMult").textContent=get("coinMult",1)+"x";
    $("coinCost").textContent=25*get("coinPower",1)*get("coinPower",1);
}
$("coinButton").onclick=()=>{
    const coins=get("coinScore",0)+get("coinPower",1)*get("coinMult",1);
    set("coinScore",coins);set("coinBest",Math.max(get("coinBest",0),coins));refreshCoin();act();
};
$("coinUpgrade").onclick=()=>{
    const cost=25*get("coinPower",1)*get("coinPower",1);
    if(get("coinScore",0)<cost){toast("Not enough coins");return}
    set("coinScore",get("coinScore",0)-cost);set("coinPower",get("coinPower",1)+1);refreshCoin();toast("Power upgraded");act();
};
$("coinPrestige").onclick=()=>{
    if(get("coinScore",0)<1000){toast("Need 1000 coins");return}
    set("coinScore",0);set("coinPower",1);set("coinMult",get("coinMult",1)+1);set("coinPrestige",get("coinPrestige",0)+1);refreshCoin();toast("Prestige!");act();
};

let reactionTimer=null,reactionStartTime=0,reactionState="idle";
$("reactionStart").onclick=()=>{
    clearTimeout(reactionTimer);reactionState="waiting";
    $("reactionBox").className="reaction-box ready";$("reactionBox").textContent="Wait...";
    const delay=900+Math.random()*2800;
    reactionTimer=setTimeout(()=>{reactionState="go";reactionStartTime=performance.now();$("reactionBox").className="reaction-box go";$("reactionBox").textContent="CLICK!";},delay);
};
$("reactionBox").onclick=()=>{
    if(reactionState==="go"){
        const ms=Math.round(performance.now()-reactionStartTime);
        const best=get("reactionBest",0);set("reactionBest",best?Math.min(best,ms):ms);set("reactionAttempts",get("reactionAttempts",0)+1);
        $("reactionResult").textContent=`${ms} ms · Best: ${get("reactionBest",ms)} ms`;reactionState="idle";$("reactionBox").className="reaction-box";$("reactionBox").textContent="Press start";act();
    }else if(reactionState==="waiting"){clearTimeout(reactionTimer);reactionState="idle";$("reactionBox").className="reaction-box fail";$("reactionBox").textContent="Too early!";toast("Too early")}
};

const memorySymbols=["🍕","⚡","🎮","💎","🚀","👾","🗿","🌙"];
let memoryCards=[],memoryOpen=[],memoryLock=false;
function newMemory(){
    memoryCards=[...memorySymbols,...memorySymbols].sort(()=>Math.random()-.5).map((v,i)=>({v,i,matched:false}));
    memoryOpen=[];memoryLock=false;renderMemory();
}
function renderMemory(){
    $("memoryBoard").innerHTML="";
    memoryCards.forEach((c,i)=>{
        const b=document.createElement("button");b.className="memory-card"+(c.matched||memoryOpen.includes(i)?" revealed":"")+(c.matched?" matched":"");b.textContent=c.v;
        b.onclick=()=>memoryFlip(i);$("memoryBoard").appendChild(b);
    });
    $("memoryResult").textContent=`Matches: ${get("memoryMatches",0)}`;
}
function memoryFlip(i){
    if(memoryLock||memoryCards[i].matched||memoryOpen.includes(i))return;
    memoryOpen.push(i);renderMemory();
    if(memoryOpen.length===2){
        memoryLock=true;const [a,b]=memoryOpen;
        if(memoryCards[a].v===memoryCards[b].v){memoryCards[a].matched=memoryCards[b].matched=true;set("memoryMatches",get("memoryMatches",0)+1);memoryOpen=[];memoryLock=false;renderMemory();act()}
        else setTimeout(()=>{memoryOpen=[];memoryLock=false;renderMemory()},550);
    }
}
$("memoryReset").onclick=()=>{newMemory();act()};newMemory();

function setGuess(){
    set("guessTarget",Math.floor(Math.random()*100)+1);$("guessHint").textContent="A number is waiting.";
}
$("guessBtn").onclick=()=>{
    const n=Number($("guessInput").value),t=get("guessTarget",50);
    if(!n||n<1||n>100){$("guessHint").textContent="Enter 1–100.";return}
    if(n===t){set("guessWins",get("guessWins",0)+1);$("guessHint").textContent="🎉 Correct! New number.";setGuess();act()}
    else $("guessHint").textContent=n<t?"Too low.":"Too high.";
    $("guessWins").textContent=get("guessWins",0);
};
$("guessWins").textContent=get("guessWins",0);

const diceFaces=["⚀","⚁","⚂","⚃","⚄","⚅"];
$("rollDice").onclick=()=>{
    const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);
    $("dieUser").textContent=diceFaces[a-1];$("dieCpu").textContent=diceFaces[b-1];
    if(a>b)set("diceWins",get("diceWins",0)+1);else if(a<b)set("diceLosses",get("diceLosses",0)+1);else set("diceDraws",get("diceDraws",0)+1);
    $("diceResult").textContent=`Wins: ${get("diceWins",0)} · Losses: ${get("diceLosses",0)} · Draws: ${get("diceDraws",0)}`;act();
};
$("customSides").value=get("customSides",6);
$("diceSides").value=get("customSides",6);
$("diceSides").onchange=()=>set("customSides",Number($("diceSides").value));
$("rollCustom").onclick=()=>{const n=1+Math.floor(Math.random()*Number($("diceSides").value));$("customDie").textContent=n;set("customLast",n);act()};

$("openChest").onclick=()=>{
    const loot=["💰 25 coins","💎 Rare crystal","⚡ +5 power","🧪 Mystery potion","👾 Tiny pet","🍀 Lucky charm"];
    const r=loot[Math.floor(Math.random()*loot.length)];
    const list=get("chestLoot",[]);list.push(r);set("chestLoot",list);set("chestOpened",get("chestOpened",0)+1);set("lastChest",r);
    $("chest").textContent="📦";$("chestResult").textContent=`Found: ${r}`;setTimeout(()=>$("chest").textContent="🔒",500);act();
};

function refreshOre(){
    $("oreScore").textContent=Math.floor(get("oreScore",0));$("orePower").textContent=get("orePower",1);$("autoMiners").value=get("autoMiners",0);$("orePerSec").textContent=get("autoMiners",0)*get("orePower",1);
}
$("mineOre").onclick=()=>{set("oreScore",get("oreScore",0)+get("orePower",1));refreshOre();act()};
$("autoMiners").onchange=()=>{set("autoMiners",Math.max(0,Math.min(100,Number($("autoMiners").value)||0)));refreshOre();act()};
refreshOre();
setInterval(()=>{const add=get("autoMiners",0)*get("orePower",1);if(add){set("oreScore",get("oreScore",0)+add);refreshOre()}},1000);

function refreshQuote(){const q=savedQuotes[get("quoteIndex",0)%savedQuotes.length];$("quoteText").textContent=`“${q}”`}
$("newQuote").onclick=()=>{set("quoteIndex",Math.floor(Math.random()*savedQuotes.length));refreshQuote();act()};refreshQuote();

function refreshHabits(){
    const today=new Date().toISOString().slice(0,10);
    if(get("habitDay","")!==today){["Read","Code","Exercise","Water","Learn"].forEach(x=>set("habit"+x,false));set("habitDay",today)}
    ["Read","Code","Exercise","Water","Learn"].forEach(x=>{$("habit"+x).checked=get("habit"+x,false);$("habit"+x).onchange=()=>{set("habit"+x,$("habit"+x).checked);act()}});
}
$("clearHabits").onclick=()=>{["Read","Code","Exercise","Water","Learn"].forEach(x=>set("habit"+x,false));refreshHabits();act()};refreshHabits();

function refreshXp(){
    const xp=get("xp",0),lvl=Math.floor(xp/100)+1,cur=xp%100;
    set("level",lvl);$("levelValue").textContent=lvl;$("xpValue").textContent=`${cur} / 100 XP`;$("xpBar").style.width=cur+"%";
}
$("gainXp").onclick=()=>{set("xp",get("xp",0)+25);refreshXp();act()};refreshXp();

function achievementData(){
    return [
        ["🖱️","First click",get("coinBest",0)>=1],
        ["💰","100 coins",get("coinBest",0)>=100],
        ["🏆","Prestige",get("coinPrestige",0)>=1],
        ["⚡","Reaction < 300ms",get("reactionBest",9999)>0&&get("reactionBest",9999)<300],
        ["🧠","Memory match",get("memoryMatches",0)>=1],
        ["🎲","Dice win",get("diceWins",0)>=1],
        ["🎁","Open chest",get("chestOpened",0)>=1],
        ["📈","Reach level 2",get("level",1)>=2],
        ["🗃️","Collect 5",get("collection",[]).length>=5],
        ["🔥","10 actions",get("actionCount",0)>=10]
    ];
}
function refreshAchievements(){
    $("achievements").innerHTML=achievementData().map(a=>`<div class="achievement ${a[2]?"unlocked":""}">${a[2]?"✓":"○"} ${a[0]} ${a[1]}</div>`).join("");
}
setInterval(refreshAchievements,500);refreshAchievements();

const patternColors=["#9b5cff","#39d9ff","#ff4fb8","#a4ff4f","#ffb84f","#ff5571"];
let colorSeq=[],colorGuess=[];
function startColorGame(){
    const len=Math.min(6,2+get("colorLevel",1));
    colorSeq=Array.from({length:len},()=>Math.floor(Math.random()*patternColors.length));colorGuess=[];
    $("colorGameResult").textContent="Watch...";
    $("colorPattern").innerHTML="";
    colorSeq.forEach((idx,i)=>setTimeout(()=>{$("colorPattern").innerHTML="";const s=document.createElement("span");s.style.background=patternColors[idx];$("colorPattern").appendChild(s);},i*350));
    setTimeout(()=>{ $("colorPattern").innerHTML="";$("colorChoices").innerHTML=patternColors.map((c,i)=>`<button data-c="${i}" style="background:${c}"></button>`).join("");document.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>guessColor(Number(b.dataset.c))) },len*350+300);
}
function guessColor(i){
    colorGuess.push(i);const pos=colorGuess.length-1;
    if(i!==colorSeq[pos]){$("colorGameResult").textContent="Wrong!";set("colorLevel",1);act();return}
    if(colorGuess.length===colorSeq.length){set("colorLevel",get("colorLevel",1)+1);$("colorGameResult").textContent="Perfect!";toast("Pattern cleared");act()}
}
$("startColorGame").onclick=startColorGame;

const words=["javascript","storage","browser","zyphor","glitch","button","pixel","local","future","neon","cookie","server","console"];
function scrambleWord(){
    const w=words[Math.floor(Math.random()*words.length)],s=w.split("").sort(()=>Math.random()-.5).join("");
    set("scrambleWord",w);$("scrambledWord").textContent=s;$("scrambleInput").value="";$("scrambleResult").textContent="Unscramble it.";
}
$("scrambleNew").onclick=()=>{scrambleWord();act()};
$("scrambleCheck").onclick=()=>{
    if($("scrambleInput").value.trim().toLowerCase()===get("scrambleWord","")){set("scrambleScore",get("scrambleScore",0)+1);$("scrambleResult").textContent="Correct!";act()}else $("scrambleResult").textContent="Nope.";
};
if(!get("scrambleWord",""))scrambleWord();else $("scrambledWord").textContent=get("scrambleWord","").split("").sort(()=>Math.random()-.5).join("");

let timerInt=null;
function showTimer(){const s=Math.max(0,get("timerRemaining",60)),m=String(Math.floor(s/60)).padStart(2,"0"),r=String(s%60).padStart(2,"0");$("timerDisplay").textContent=`${m}:${r}`}
$("timerStart").onclick=()=>{if(timerInt)return;set("timerRunning",true);timerInt=setInterval(()=>{let s=get("timerRemaining",60)-1;set("timerRemaining",Math.max(0,s));showTimer();if(s<=0){clearInterval(timerInt);timerInt=null;set("timerRunning",false);toast("Timer finished!")}},1000);act()};
$("timerPause").onclick=()=>{clearInterval(timerInt);timerInt=null;set("timerRunning",false);act()};
$("timerReset").onclick=()=>{clearInterval(timerInt);timerInt=null;const s=Number($("timerSeconds").value)||60;set("timerRemaining",s);set("timerSeconds",s);showTimer();act()};
$("timerSeconds").onchange=()=>{$("timerReset").click()};
showTimer();

let pomoInt=null;
function showPomo(){const s=Math.max(0,get("pomodoroRemaining",1500));$("pomodoroDisplay").textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;$("pomodoroCount").textContent=get("pomodoroCount",0)}
$("pomodoroStart").onclick=()=>{if(pomoInt)return;pomoInt=setInterval(()=>{let s=get("pomodoroRemaining",1500)-1;set("pomodoroRemaining",Math.max(0,s));showPomo();if(s<=0){clearInterval(pomoInt);pomoInt=null;set("pomodoroCount",get("pomodoroCount",0)+1);set("pomodoroRemaining",1500);showPomo();toast("Pomodoro done!")}},1000);act()};showPomo();

function refreshPoll(){
    const v=get("pollVotes",{Neon:0,Minimal:0,Retro:0}),total=Object.values(v).reduce((a,b)=>a+b,0)||1;
    $("pollResults").innerHTML=Object.entries(v).map(([k,n])=>`<div class="poll-bar"><span>${k}</span><i style="width:${Math.round(n/total*100)}%"></i><span>${n}</span></div>`).join("");
}
document.querySelectorAll(".poll").forEach(b=>b.onclick=()=>{const v=get("pollVotes",{Neon:0,Minimal:0,Retro:0});v[b.dataset.poll]++;set("pollVotes",v);refreshPoll();act()});refreshPoll();

function refreshCollection(){$("collection").innerHTML=get("collection",[]).map(x=>`<div class="collectible" title="${x}">${x}</div>`).join("")||"<span class='muted'>Nothing collected yet.</span>"}
$("findCollectible").onclick=()=>{const list=get("collection",[]);const unowned=emojis.filter(x=>!list.includes(x));if(!unowned.length){toast("Collection complete!");return}const x=unowned[Math.floor(Math.random()*unowned.length)];list.push(x);set("collection",list);refreshCollection();act()};refreshCollection();

["Strength","Speed","Luck","Defense"].forEach(k=>{const id="stat"+k;$(id).value=get(id,50);$(id).oninput=()=>set(id,Number($(id).value))});
$("statRandom").onclick=()=>{["Strength","Speed","Luck","Defense"].forEach(k=>{$("stat"+k).value=1+Math.floor(Math.random()*99);set("stat"+k,Number($("stat"+k).value))});toast("Stats rerolled");act()};

const palettes=[["Neon","#9b5cff","#39d9ff"],["Sunset","#ff4f88","#ffb84f"],["Forest","#4dff9a","#58a6ff"],["Candy","#ff63dc","#9b8cff"],["Lime","#a4ff4f","#39d9ff"]];
$("paletteButtons").innerHTML=palettes.map((p,i)=>`<button data-pal="${i}" style="background:linear-gradient(90deg,${p[1]},${p[2]})"></button>`).join("");
function usePalette(i){const p=palettes[i];document.documentElement.style.setProperty("--accent",p[1]);document.documentElement.style.setProperty("--accent2",p[2]);set("activePalette",i);set("palette",p[1]+","+p[2]);$("palettePreview").style.background=`linear-gradient(90deg,${p[1]},${p[2]})`;act()}
document.querySelectorAll("[data-pal]").forEach(b=>b.onclick=()=>usePalette(Number(b.dataset.pal)));
usePalette(get("activePalette",0));

function refreshScores(){
    const scores=get("scores",[]).sort((a,b)=>b.points-a.points).slice(0,10);set("scores",scores);
    $("scoreList").innerHTML=scores.map((x,i)=>`<div class="score-row"><span>#${i+1} ${escapeHtml(x.name)}</span><b>${x.points}</b></div>`).join("")||"<span class='muted'>No scores yet.</span>";
}
$("saveScore").onclick=()=>{const scores=get("scores",[]);scores.push({name:$("scorePlayer").value||"You",points:Number($("scorePoints").value)||0,date:new Date().toISOString()});set("scores",scores);refreshScores();act()};refreshScores();

function refreshJournal(){
    $("journal").innerHTML=get("journal",[]).slice().reverse().map(x=>`<div class="journal-row"><span>${escapeHtml(x.text)}</span><span>${new Date(x.date).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span></div>`).join("")||"<span class='muted'>No entries.</span>";
}
$("journalAdd").onclick=()=>{const j=get("journal",[]);j.push({text:`Session action #${get("actionCount",0)} · ${get("displayName","Zyphor")}`,date:new Date().toISOString()});set("journal",j.slice(-30));refreshJournal();act()};refreshJournal();

const originalRefresh=refreshStorage;
refreshStorage=function(){originalRefresh();refreshAchievements()};
refreshStorage();
