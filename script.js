const chatContainer = document.getElementById("chat-container");
const input = document.getElementById("inputText");
const sendBtn = document.getElementById("sendBtn");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");

let lastSummary = "";

/* ✅ FILE UPLOAD: TXT, PDF, DOCX */
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "text/plain" || name.endsWith(".txt")) {
    input.value = await file.text();
    return;
  }

  if (name.endsWith(".pdf")) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const typedArray = new Uint8Array(e.target.result);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map(item => item.str);
        fullText += strings.join(" ") + "\n\n";
      }
      input.value = fullText.trim();
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  if (name.endsWith(".docx")) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
      input.value = result.value.trim();
    };
    reader.readAsArrayBuffer(file);
    return;
  }

  alert("Supported files: TXT, PDF, DOCX");
});

/* ✅ SUMMARIZE */
async function summarize() {
  const text = input.value.trim();
  if (!text) return;

  const userMsg = document.createElement("div");
  userMsg.className = "user-msg";
  userMsg.innerText = text;
  chatContainer.appendChild(userMsg);

  input.value = "";

  const aiMsg = document.createElement("div");
  aiMsg.className = "ai-msg";
  aiMsg.innerText = "Summarizing...";
  chatContainer.appendChild(aiMsg);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const res = await fetch("http://127.0.0.1:8000/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    lastSummary = data.summary || "";

    // ✅ Convert to bullets
    const bullets = lastSummary
      .split(". ")
      .filter(l => l.trim())
      .map(line => "• " + line.trim())
      .join("\n");

    aiMsg.innerText = bullets;
    downloadBtn.disabled = !lastSummary;

  } catch (err) {
    aiMsg.innerText = "Backend error.";
    lastSummary = "";
    downloadBtn.disabled = true;
  }

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

sendBtn.addEventListener("click", summarize);

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    summarize();
  }
});

/* ✅ DOWNLOAD PDF */
downloadBtn.addEventListener("click", () => {
  if (!lastSummary) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const lines = doc.splitTextToSize(lastSummary, pageWidth - margin * 2);

  doc.setFontSize(12);
  doc.text(lines, margin, margin);
  doc.save("summary.pdf");
});

/* ✅ CLEAR CHAT */
clearBtn.addEventListener("click", () => {
  chatContainer.innerHTML = "";
  lastSummary = "";
  downloadBtn.disabled = true;
});
