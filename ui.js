window.onload = initUi;

function initUi() {
  document.getElementById("menutoggle").onclick = () => {document.getElementById("menu").classList.toggle("hide");};  
  document.getElementById("open-about").onclick = () => {document.getElementById("about-overlay").classList.remove("hide");};
  document.getElementById("close-about").onclick = () => {document.getElementById("about-overlay").classList.add("hide");};
}
