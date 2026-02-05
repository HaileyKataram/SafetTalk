let chartInstance = null;

function updateDashboard(m) {
  document.getElementById("emailsScanned").textContent = m.totalScans;
  document.getElementById("detections").textContent = m.detections;
  document.getElementById("sos").textContent = m.sosTriggered;

  renderChart(m);
  renderSupportMessage(m);
}

document.addEventListener("DOMContentLoaded", () => {
  // Initial load
  chrome.storage.local.get("metrics", (d) => {
    updateDashboard(d.metrics || {
      totalScans: 0,
      detections: 0,
      sosTriggered: 0
    });
  });

  // 🔥 LIVE UPDATES (THIS WAS MISSING)
  chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.metrics) {
    const m = changes.metrics.newValue;

    document.getElementById("emailsScanned").textContent = m.totalScans;
    document.getElementById("detections").textContent = m.detections;
    document.getElementById("sos").textContent = m.sosTriggered;
    ["emailsScanned", "detections", "sos"].forEach(id => {
  const el = document.getElementById(id);
  el.classList.add("updated");
  setTimeout(() => el.classList.remove("updated"), 300);
});


    renderChart(m);
    renderSupportMessage(m);
  }
});


});

function renderChart(m) {
  const ctx = document.getElementById("riskChart").getContext("2d");

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Safe Messages", "Harmful Messages"],
      datasets: [{
        data: [
          Math.max(m.totalScans - m.detections, 0),
          m.detections
        ],
        backgroundColor: ["#4caf50", "#e53935"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

function renderSupportMessage(m) {
  const el = document.getElementById("supportMessage");

  if (m.sosTriggered > 0) {
    el.textContent =
      "🫂 You reached out when things got heavy. That takes strength. I’ve got you — one step at a time.";
  }
  else if (m.detections >= 5) {
    el.textContent =
      "💙 Looks like you’ve been dealing with a lot lately. You’re not weak for feeling this — you’re human.";
  }
  else if (m.detections > 0) {
    el.textContent =
      "🌱 Some moments were uncomfortable, but you stayed steady. Proud of how you handled it.";
  }
  else {
    el.textContent =
      "✨ All clear so far. Keep protecting your peace — you’re doing great.";
  }
}

