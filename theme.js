const saved=localStorage.getItem("theme")||"light"
document.body.classList.add(saved)
function toggleTheme(){
const mode=document.body.classList.contains("light")?"dark":"light"
document.body.classList.remove("light","dark")
document.body.classList.add(mode)
localStorage.setItem("theme",mode)
}