let backend="";
let giftInfo=null;
let giftId="";

function token(){
    return localStorage.getItem("Token")||localStorage.getItem("SessionID")||"";
}

async function getBackend(){
    const r=await fetch("server.txt",{cache:"no-store"});
    if(!r.ok) throw new Error("backend_config");
    return (await r.text()).trim();
}

async function api(path,options={}){
    const liveToken=token();
    if(!liveToken) throw new Error("unauthorized");
    const headers=new Headers(options.headers||{});
    headers.set("Authorization",liveToken);
    if(options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")){
        headers.set("Content-Type","application/json");
    }
    return fetch(backend+path,{...options,headers,cache:"no-store"});
}

async function json(res){
    const text=await res.text();
    try{return JSON.parse(text)}catch{return null}
}

function setCreatorStatus(text,error=false){
    const el=document.getElementById("creatorStatus");
    el.textContent=text;
    el.className="status"+(error?" error":"");
}

function setRecipientStatus(text,error=false){
    const el=document.getElementById("recipientStatus");
    el.textContent=text;
    el.className="status"+(error?" error":"");
}

async function initCreator(){
    document.getElementById("creator").classList.remove("hidden");

    if(!token()){
        setCreatorStatus("You must be signed in to create a gift.",true);
        document.getElementById("createBtn").disabled=true;
        return;
    }

    document.getElementById("createBtn").addEventListener("click",createGift);
    document.getElementById("copyBtn").addEventListener("click",async()=>{
        const link=document.getElementById("giftLink").textContent;
        if(!link) return;
        await navigator.clipboard.writeText(link);
        setCreatorStatus("Gift link copied.");
    });
}

async function createGift(){
    const amount=Number(document.getElementById("amount").value);
    const message=document.getElementById("message").value.trim();
    const button=document.getElementById("createBtn");

    if(!Number.isFinite(amount)||amount<=0){
        setCreatorStatus("Enter a valid Zyphium amount.",true);
        return;
    }

    button.disabled=true;
    setCreatorStatus("Creating your gift...");

    try{
        const r=await api("/zyphium/gift/create",{
            method:"POST",
            body:JSON.stringify({amount,message})
        });
        const data=await json(r);

        if(!data||!data.success){
            const errors={
                insufficient_balance:"You do not have enough Zyphium.",
                invalid_amount:"Enter a valid amount.",
                amount_too_large:"That gift amount is too large.",
                unauthorized:"Your session has expired."
            };
            setCreatorStatus(errors[data?.error]||data?.error||"Could not create the gift.",true);
            return;
        }

        document.getElementById("giftLink").textContent=data.link;
        document.getElementById("linkBox").classList.add("show");
        document.getElementById("copyBtn").disabled=false;
        setCreatorStatus(`${data.amount} Zyphium reserved for this gift. Anyone who claims the link first gets it.`);
    }catch{
        setCreatorStatus("Could not connect to Zyphor.",true);
    }finally{
        button.disabled=false;
    }
}

async function initRecipient(){
    document.getElementById("recipient").classList.remove("hidden");

    const params=new URLSearchParams(location.search);
    giftId=String(params.get("ID")||"").trim();

    if(!/^[a-f0-9]{64}$/i.test(giftId)){
        setRecipientStatus("This gift link is invalid.",true);
        document.getElementById("openBtn").disabled=true;
        return;
    }

    try{
        const r=await fetch(backend+"/zyphium/gift/info?ID="+encodeURIComponent(giftId),{cache:"no-store"});
        const data=await json(r);

        if(!data||!data.success){
            setRecipientStatus("This gift could not be found.",true);
            document.getElementById("openBtn").disabled=true;
            return;
        }

        giftInfo=data;

        document.getElementById("giftAmount").innerHTML=Number(data.amount||0).toLocaleString(undefined,{maximumFractionDigits:2})+" <small>Zyphium</small>";
        document.getElementById("giftFrom").textContent=data.sender ? `Sent by ${data.sender}` : "A Zyphor user sent this gift";
        document.getElementById("giftMessage").textContent=data.message||"A surprise for you.";

        if(data.claimed){
            document.getElementById("openBtn").disabled=true;
            document.getElementById("openBtn").textContent="Already Claimed";
            const c=document.createElement("div");
            c.className="claimed";
            c.textContent="This gift has already been opened by the first person who claimed it.";
            document.getElementById("recipientState").appendChild(c);
            return;
        }

        document.getElementById("openBtn").addEventListener("click",openGift);
    }catch{
        setRecipientStatus("Could not connect to Zyphor.",true);
        document.getElementById("openBtn").disabled=true;
    }
}

async function openGift(){
    const button=document.getElementById("openBtn");
    const scene=document.getElementById("giftScene");

    if(!token()){
        setRecipientStatus("Sign in first, then open this gift again.",true);
        return;
    }

    button.disabled=true;
    setRecipientStatus("Opening your gift...");
    scene.classList.remove("open");
    void scene.offsetWidth;
    scene.classList.add("open");

    await new Promise(r=>setTimeout(r,750));

    try{
        const r=await api("/zyphium/gift/claim",{
            method:"POST",
            body:JSON.stringify({id:giftId})
        });
        const data=await json(r);

        if(!data||!data.success){
            if(data?.error==="gift_claimed"){
                setRecipientStatus("Too late — someone else already claimed this gift.",true);
            }else if(data?.error==="unauthorized"){
                setRecipientStatus("Your session expired. Sign in and reopen the link.",true);
            }else{
                setRecipientStatus("This gift could not be opened.",true);
            }
            button.disabled=true;
            return;
        }

        document.getElementById("recipientState").innerHTML=`
            <div class="amount">${Number(data.amount||0).toLocaleString(undefined,{maximumFractionDigits:2})} <small>Zyphium</small></div>
            <div class="from">Gift received from ${escapeHtml(data.sender||"a Zyphor user")}</div>
            <div class="message">${escapeHtml(data.message||"You received a gift.")}</div>
            <div class="success">✓ ${Number(data.amount||0).toLocaleString(undefined,{maximumFractionDigits:2})} Zyphium has been added to your wallet.</div>
        `;

        confetti();
    }catch{
        setRecipientStatus("Could not connect to Zyphor.",true);
    }
}

function escapeHtml(value){
    return String(value??"")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function confetti(){
    const count=85;
    for(let i=0;i<count;i++){
        const piece=document.createElement("div");
        piece.style.position="fixed";
        piece.style.width=(5+Math.random()*7)+"px";
        piece.style.height=(8+Math.random()*10)+"px";
        piece.style.left=(50+((Math.random()-.5)*12))+"%";
        piece.style.top="42%";
        piece.style.zIndex="99";
        piece.style.pointerEvents="none";
        piece.style.background=`hsl(${Math.random()*360},90%,65%)`;
        piece.style.borderRadius="3px";
        piece.style.transform=`rotate(${Math.random()*360}deg)`;
        document.body.appendChild(piece);

        const x=(Math.random()-.5)*900;
        const y=260+Math.random()*650;
        piece.animate([
            {transform:`translate(0,0) rotate(0deg)`,opacity:1},
            {transform:`translate(${x}px,${y}px) rotate(${360+Math.random()*720}deg)`,opacity:0}
        ],{duration:1300+Math.random()*1200,easing:"cubic-bezier(.1,.7,.2,1)"});

        setTimeout(()=>piece.remove(),2800);
    }
}

(async()=>{
    try{
        backend=await getBackend();
        const params=new URLSearchParams(location.search);
        if(params.get("create")==="1"){
            await initCreator();
        }else{
            await initRecipient();
        }
    }catch{
        document.getElementById("creator").classList.remove("hidden");
        setCreatorStatus("Could not load the Zyphor backend.",true);
    }
})();
