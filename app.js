const DEFAULT_API_BASE = "http://127.0.0.1:1234";
const DEFAULT_MODEL = "qwen3-4b";

const apiBaseInput = document.getElementById("api-base");
const applyApiBtn = document.getElementById("apply-api-btn");
const modelSelect = document.getElementById("model-select");
const sourceLang = document.getElementById("source-lang");
const targetLang = document.getElementById("target-lang");
const sourceText = document.getElementById("source-text");
const targetText = document.getElementById("target-text");
const sourceCount = document.getElementById("source-count");
const statusText = document.getElementById("status-text");
const translateBtn = document.getElementById("translate-btn");
const clearBtn = document.getElementById("clear-btn");
const swapBtn = document.getElementById("swap-btn");

function normalizeApiBase(value) {
  const text = value.trim();
  const base = text || DEFAULT_API_BASE;
  return base.replace(/\/+$/, "");
}

function getModelsUrl() {
  return `${normalizeApiBase(apiBaseInput.value)}/v1/models`;
}

function getChatCompletionsUrl() {
  return `${normalizeApiBase(apiBaseInput.value)}/v1/chat/completions`;
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function updateCount() {
  sourceCount.textContent = `${sourceText.value.length} / 5000`;
}

function buildPrompt(text, from, to) {
  const sourceInstruction =
    from === "auto"
      ? "Detect the source language automatically."
      : `The source language is ${from}.`;

  return [
    "You are a precise translator.",
    sourceInstruction,
    `Translate the provided text into ${to}.`,
    "Return only the translated text with no explanations or notes.",
    "",
    "Text:",
    text
  ].join("\n");
}

function setModelOptions(models) {
  modelSelect.innerHTML = "";

  const seen = new Set();
  const orderedModels = [DEFAULT_MODEL, ...models].filter((name) => {
    if (!name || seen.has(name)) {
      return false;
    }
    seen.add(name);
    return true;
  });

  for (const model of orderedModels) {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    if (model === DEFAULT_MODEL) {
      option.selected = true;
    }
    modelSelect.appendChild(option);
  }
}

async function loadModels(showError = false) {
  try {
    const response = await fetch(getModelsUrl(), { method: "GET" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = Array.isArray(data?.data)
      ? data.data.map((item) => item?.id).filter(Boolean)
      : [];

    setModelOptions(models);
  } catch (_) {
    setModelOptions([]);
    if (showError) {
      setStatus("Unable to load models from this API address.", true);
    }
  }
}

function applyApiAddress() {
  const normalized = normalizeApiBase(apiBaseInput.value);
  if (!/^https?:\/\//i.test(normalized)) {
    setStatus("API address must start with http:// or https://", true);
    return;
  }

  apiBaseInput.value = normalized;
  setStatus("API address applied. Loading models...");
  loadModels(true);
}

async function translateOnce() {
  const input = sourceText.value.trim();
  const model = modelSelect.value.trim();

  if (!input) {
    setStatus("Enter text to translate.", true);
    targetText.value = "";
    return;
  }

  if (!model) {
    setStatus("Select a model.", true);
    return;
  }

  if (sourceLang.value !== "auto" && sourceLang.value === targetLang.value) {
    setStatus("Source and target languages must be different.", true);
    return;
  }

  translateBtn.disabled = true;
  setStatus("Translating...");
  targetText.value = "";

  const payload = {
    model,
    messages: [
      {
        role: "user",
        content: buildPrompt(input, sourceLang.value, targetLang.value)
      }
    ],
    temperature: 0.1
  };

  try {
    const response = await fetch(getChatCompletionsUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";

    if (!content) {
      throw new Error("Empty translation returned.");
    }

    targetText.value = content;
    setStatus("Done");
  } catch (error) {
    setStatus(`Translation failed: ${error.message}`, true);
  } finally {
    translateBtn.disabled = false;
  }
}

function clearAll() {
  sourceText.value = "";
  targetText.value = "";
  setStatus("Idle");
  updateCount();
}

function swapLanguages() {
  if (sourceLang.value === "auto") {
    return;
  }

  const previousSource = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = previousSource;

  const sourceValue = sourceText.value;
  sourceText.value = targetText.value;
  targetText.value = sourceValue;
  updateCount();
}

sourceText.addEventListener("input", updateCount);
applyApiBtn.addEventListener("click", applyApiAddress);
apiBaseInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    applyApiAddress();
  }
});
translateBtn.addEventListener("click", translateOnce);
clearBtn.addEventListener("click", clearAll);
swapBtn.addEventListener("click", swapLanguages);

apiBaseInput.value = normalizeApiBase(apiBaseInput.value);
updateCount();
loadModels();
