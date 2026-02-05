document.getElementById("scanBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;

    chrome.tabs.sendMessage(tabs[0].id, {
      action: "SCAN_EMAIL"
    });
  });

  document.getElementById("status").innerText = "Scanning email...";
});
document.getElementById("openDashboard").onclick = () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("dashboard/dashboard.html")
  });
};

