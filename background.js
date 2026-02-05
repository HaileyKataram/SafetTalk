console.log("✅ SafeTalk background running");

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

  /* ================= AI BRIDGE ================= */
  if (req.action === "ANALYZE_TEXT") {
    fetch("http://127.0.0.1:9000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: req.text })
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({
          confidence: data.confidence || 0,
          labels: data.label ? [data.label] : []
        });
      })
      .catch(err => {
        console.error("❌ ML bridge error", err);
        sendResponse({ confidence: 0, labels: [] });
      });

    return true;
  }

  /* ================= METRICS ================= */
  if (req.action === "METRIC_EVENT") {
    chrome.storage.local.get("metrics", (d) => {
      const m = d.metrics || {
        totalScans: 0,
        detections: 0,
        sosTriggered: 0
      };

      if (req.type === "SCAN") m.totalScans++;
      if (req.type === "DETECTION") m.detections++;
      if (req.type === "SOS") m.sosTriggered++;

      chrome.storage.local.set({ metrics: m });
    });
  }
});
