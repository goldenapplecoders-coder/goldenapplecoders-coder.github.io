window.addEventListener("load", () => {
  setTimeout(() => {
    const modal = document.getElementById("henryAdModal");
    const closeBtn = document.getElementById("henryCloseBtn");
    modal.style.display = "block";

    // Show exit button after 5 seconds
    setTimeout(() => {
      closeBtn.style.opacity = 1;
    }, 5000);

    // Close modal on click
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }, 20000); // Show ad after 20 seconds
});