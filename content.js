// content.js
console.log("✅ SafeTalk content script loaded");

/* ===== PLATFORM DETECTION ===== */
const PLATFORM = window.location.hostname;

if (PLATFORM.includes("mail.google.com")) {
  initGmail();
} else if (PLATFORM.includes("youtube.com")) {
  initYouTube();
} else if (PLATFORM.includes("instagram.com")) {
  initInstagram();
}

/* ===== GLOBAL STATE ===== */
let LAST_SCANNED_TEXT = "";
let ALERT_SHOWN = false;
let LAST_SCAN_TIME = 0;

let FALSE_ALARM_MEMORY = new Set();

let PSYCH_HARM_SCORE = 0;
const PSYCH_HARM_DECAY = 0.85;
const PSYCH_HARM_TRIGGER = 1.5;

let LAST_DETECTED_TEXT = "";

let DETECTION_THRESHOLD = 0.12;
const SCAN_COOLDOWN = 2000;

/* ===== LOAD LEARNING ===== */
chrome.storage.local.get("falseAlarmSentences", (d) => {
  if (d.falseAlarmSentences) {
    FALSE_ALARM_MEMORY = new Set(d.falseAlarmSentences);
  }
});

chrome.storage.local.get("threshold", (d) => {
  if (d.threshold) DETECTION_THRESHOLD = d.threshold;
});

/* ===== PSYCHOLOGICAL HARM PATTERNS ===== */
const PSYCH_HARM_PATTERNS = [
  /no one would (care|miss)/i,
  /if you (just )?(disappear|were gone)/i,
  /world would be better without you/i,
  /you don'?t matter/i,
  /no one needs you/i,
  /nobody wants you/i,
  /people avoid you/i,
  /no one likes you/i,
  /you always ruin things/i,
  /you make everything worse/i,
  /you are a burden/i,
  /you don'?t belong/i,
  /you are too sensitive/i
];

/* =========================================================
   ================= PLATFORM INITIALIZERS =================
   ========================================================= */
(function injectSafeTalkStyles() {
  if (document.getElementById("safetalk-style")) return;

  const style = document.createElement("style");
  style.id = "safetalk-style";
  style.innerHTML = `

    .safetalk-view-btn {
      margin-left: 8px;
      font-size: 12px;
      cursor: pointer;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
})();

/* ===== GMAIL (UNCHANGED BEHAVIOR) ===== */
function initGmail() {
  console.log("📧 SafeTalk Gmail protection active");

  const observer = new MutationObserver(() => {
    const text = extractGmailText();
    if (!text || text === LAST_SCANNED_TEXT) return;

    LAST_SCANNED_TEXT = text;
    runDetection(text);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/* ===== YOUTUBE WEB COMMENTS ===== */
function initYouTube() {
  console.log("▶️ SafeTalk YouTube protection active");
  protectYouTubeComments();

  const observer = new MutationObserver(() => {
    const box = document.querySelector("#contenteditable-root");

    if (!box) return;

    console.log("✅ SafeTalk hooked into YouTube comment box");
  


    observer.disconnect(); // stop watching once found

    let timeout;
    box.addEventListener("input", () => {
      const text = box.innerText.trim();
      if (!text || text === LAST_SCANNED_TEXT) return;

      LAST_SCANNED_TEXT = text;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        runDetection(text);
      }, 800);
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  // 🔁 Pipeline B: scan existing & dynamic comments
setTimeout(scanYouTubeComments, 2000);

new MutationObserver(scanYouTubeComments).observe(document.body, {
  childList: true,
  subtree: true
});

}


function protectYouTubeComments() {
  console.log("🛡️ SafeTalk comment shielding active");

  // Wait until the comments container exists AND has children
  const waitForComments = new MutationObserver(() => {
    const commentsSection = document.querySelector("ytd-comments");
    if (!commentsSection) return;

    const commentRenderers =
      commentsSection.querySelectorAll("ytd-comment-renderer");

    if (commentRenderers.length === 0) return;

    waitForComments.disconnect();

    // Initial scan (after hydration)
    setTimeout(scanYouTubeComments, 2000);

    // Observe dynamic comment loads
    const observer = new MutationObserver(scanYouTubeComments);
    observer.observe(commentsSection, {
      childList: true,
      subtree: true
    });

    // Backup scan on scroll
    window.addEventListener("scroll", scanYouTubeComments);
  });

  waitForComments.observe(document.body, {
    childList: true,
    subtree: true
  });
}
function scanYouTubeComments() {
  const nodes = document.querySelectorAll("ytd-comment-view-model");

  nodes.forEach(node => {
    if (node.dataset.safetalkChecked === "true") return;

    const text = (node.innerText || "").toLowerCase();
    if (!text) return;

    const keywordHit =
      text.includes("kill") ||
      text.includes("die");

    if (keywordHit) {
      blurYouTubeRenderer(node);
    }

    node.dataset.safetalkChecked = "true";
  });
}
function blurYouTubeRenderer(renderer) {
  const textNode = renderer.querySelector("#content-text");
  if (!textNode) return;

  if (textNode.dataset.safetalkBlurred === "true") return;
  textNode.dataset.safetalkBlurred = "true";

  // ✅ blur ONLY the text
  textNode.style.setProperty("filter", "blur(6px)", "important");
  textNode.style.setProperty("user-select", "none", "important");

  // ✅ add View anyway button AFTER text
  const btn = document.createElement("button");
  btn.innerText = "View anyway";
  btn.style.marginLeft = "8px";
  btn.style.fontSize = "12px";
  btn.style.cursor = "pointer";

  btn.onclick = () => {
    textNode.style.removeProperty("filter");
    textNode.style.removeProperty("user-select");
    btn.remove();
  };

  textNode.parentElement.appendChild(btn);
}








/* ===== INSTAGRAM WEB COMMENTS ===== */
function initInstagram() {
  console.log("📸 SafeTalk Instagram protection active");

  const observer = new MutationObserver(() => {
    // Instagram comment input (correct one)
    const box = document.querySelector(
      "div[role='dialog'] div[contenteditable='true'][aria-label]"
    );

    if (!box) return;

    console.log("✅ SafeTalk hooked into Instagram comment box");

    observer.disconnect(); // attach only once

    let timeout;

    // Instagram does NOT always fire `input`, so use keyup
    box.addEventListener("keyup", () => {
      const text = box.innerText.trim();
      if (!text || text === LAST_SCANNED_TEXT) return;

      LAST_SCANNED_TEXT = text;

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        runDetection(text);
      }, 800);
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/* =========================================================
   ===================== CORE ENGINE ========================
   ========================================================= */

function runDetection(text) {
  const now = Date.now();
  if (now - LAST_SCAN_TIME < SCAN_COOLDOWN) return;
  LAST_SCAN_TIME = now;

  const sentences = text
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  sentences.forEach(sentence => {
    if (ALERT_SHOWN) return;

    const key = sentence.toLowerCase();

    if (FALSE_ALARM_MEMORY.has(key)) return;

    if (matchesPsychologicalHarm(sentence)) {
      PSYCH_HARM_SCORE += 0.6;
    } else {
      PSYCH_HARM_SCORE *= PSYCH_HARM_DECAY;
    }

    if (PSYCH_HARM_SCORE >= PSYCH_HARM_TRIGGER) {
      activateDefense(1, ["psychological_harm"], sentence);
      PSYCH_HARM_SCORE = 0;
      return;
    }

    fetch("http://127.0.0.1:9000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sentence })
    })
      .then(res => res.json())
      .then(data => {
        if (ALERT_SHOWN) return;

        let confidence = data.confidence || 0;
        if (matchesPsychologicalHarm(sentence)) confidence += 0.2;

        if (confidence >= DETECTION_THRESHOLD) {
          activateDefense(Math.min(confidence, 1), [data.label], sentence);
        }
      })
      .catch(() => {});
  });
}

/* ===== GMAIL EXTRACTOR (UNCHANGED) ===== */
function extractGmailText() {
  const blocks = document.querySelectorAll("div.a3s");
  let text = "";
  blocks.forEach(b => text += b.innerText + "\n");
  return text.trim();
}

/* ===== HEURISTIC ===== */
function matchesPsychologicalHarm(sentence) {
  return PSYCH_HARM_PATTERNS.some(p => p.test(sentence));
}

/* =========================================================
   ====================== UI LAYER ==========================
   ========================================================= */
   const isSocial =
  PLATFORM.includes("youtube.com") ||
  PLATFORM.includes("instagram.com");

const isTypingContext = isSocial; // for now
const isReadingContext = PLATFORM.includes("mail.google.com");


function activateDefense(confidence, labels, triggerSentence) {
  if (ALERT_SHOWN) return;
  ALERT_SHOWN = true;

  const isTypingContext =
    PLATFORM.includes("youtube.com") ||
    PLATFORM.includes("instagram.com");

  /* ===== OVERLAY ===== */
  const overlay = document.createElement("div");
  overlay.style = `
    position: fixed;
    inset: 0;
    backdrop-filter: blur(6px);
    background: rgba(0,0,0,0.25);
    z-index: 9998;
  `;

  /* ===== BOX ===== */
  const box = document.createElement("div");
  box.style = `
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border: 2px solid red;
    z-index: 9999;
    width: 380px;
    text-align: center;
    font-family: Arial;
  `;

  /* ===== CONTEXT-AWARE UI ===== */
  box.innerHTML = isTypingContext
    ? `
      ⚠️ <b>This comment may be harmful</b><br><br>
      "${triggerSentence}"<br><br>

      Posting messages like this can lead to reports or restrictions.<br>
      Please consider revising it.<br><br>

      <button id="editBtn">Edit Comment</button>
      <button id="rewriteBtn">Rewrite Suggestion</button><br><br>
      <button id="postDelayBtn" style="background:#f8d7da;">
        Post Anyway (10s delay)
      </button>
    `
    : `
      ⚠️ <b>Unsafe Communication Detected</b><br><br>
      "${triggerSentence}"<br><br>

      Confidence: ${(confidence * 100).toFixed(1)}%<br><br>

      <button id="viewBtn">View Anyway</button>
      <button id="falseBtn">False Alarm</button><br><br>
      <button id="sosBtn" style="background:red;color:white;">
        Get Help
      </button>
    `;

  document.body.appendChild(overlay);
  document.body.appendChild(box);

  /* ===== BUTTON HANDLERS ===== */
  if (isTypingContext) {
    document.getElementById("editBtn").onclick = close;

    document.getElementById("rewriteBtn").onclick = () => {
      alert("Suggested rewrite: Express disagreement without personal attacks.");
    };

    document.getElementById("postDelayBtn").onclick = () => {
      const btn = document.getElementById("postDelayBtn");
      btn.disabled = true;

      let seconds = 10;
      btn.innerText = `Wait ${seconds}s`;

      const timer = setInterval(() => {
        seconds--;
        btn.innerText = `Wait ${seconds}s`;

        if (seconds <= 0) {
          clearInterval(timer);
          close();
        }
      }, 1000);
    };
  } else {
    document.getElementById("viewBtn").onclick = close;

    document.getElementById("falseBtn").onclick = () => {
      FALSE_ALARM_MEMORY.add(triggerSentence.toLowerCase());
      chrome.storage.local.set({
        falseAlarmSentences: Array.from(FALSE_ALARM_MEMORY)
      });
      close();
    };

    document.getElementById("sosBtn").onclick = () => {
      window.open("https://cybercrime.gov.in", "_blank");
      close();
    };
  }

  function close() {
    overlay.remove();
    box.remove();
    ALERT_SHOWN = false;
  }
}

