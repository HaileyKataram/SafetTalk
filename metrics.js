chrome.storage.local.get("metrics", (data) => {
  const m = data.metrics;
  document.getElementById("stats").innerHTML = `
    <p>Total Scans: ${m.totalScans}</p>
    <p>Detections: ${m.detections}</p>
    <p>SOS Triggered: ${m.sosTriggered}</p>
  `;
});
