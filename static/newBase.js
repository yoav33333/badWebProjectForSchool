// script.js
const sidebar = document.getElementById("sidebar");
const content = document.getElementById("content");

document.body.addEventListener("mousemove", (e) => {
  if (e.clientX < 50) {
    sidebar.style.left = "0";
    content.style.marginLeft = "150px"; // Move content right when sidebar is shown
  } else if (e.clientX > 150) {
    sidebar.style.left = "-150px";
    content.style.marginLeft = "0"; // Reset content margin when sidebar is hidden
  }
});
