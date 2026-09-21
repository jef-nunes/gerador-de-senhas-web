"use strict";

const LENGTH_MIN = 8;
const LENGTH_MAX = 64;

const CHARSETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+",
};

const STRENGTH_LEVELS = [
  { id: "weak", label: "Fraca", maxBits: 36 },
  { id: "fair", label: "Média", maxBits: 60 },
  { id: "strong", label: "Forte", maxBits: 90 },
  { id: "excellent", label: "Excelente", maxBits: Infinity },
];

const passwordOutput = document.getElementById("password-output");
const copyStatus = document.getElementById("copy-status");
const generateBtn = document.getElementById("generate-btn");
const copyBtn = document.getElementById("copy-btn");
const lengthInput = document.getElementById("length-input");
const lengthValue = document.getElementById("length-value");
const strengthBox = document.getElementById("strength");
const strengthLabel = document.getElementById("strength-label");
const charsetInputs = {
  lower: document.getElementById("opt-lower"),
  upper: document.getElementById("opt-upper"),
  digits: document.getElementById("opt-digits"),
  symbols: document.getElementById("opt-symbols"),
};

function randomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

function randomChar(charset) {
  return charset[randomInt(charset.length)];
}

function shuffle(chars) {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars;
}

function getSelectedSets() {
  return Object.entries(CHARSETS)
    .filter(([key]) => charsetInputs[key].checked)
    .map(([, charset]) => charset);
}

function getLength() {
  const length = Number(lengthInput.value);
  return Math.min(LENGTH_MAX, Math.max(LENGTH_MIN, length));
}

function generatePassword() {
  const sets = getSelectedSets();

  if (sets.length === 0) {
    return "";
  }

  const length = getLength();
  const pool = sets.join("");
  const chars = sets.map((set) => randomChar(set));

  if (length < chars.length) {
    return shuffle(chars).slice(0, length).join("");
  }

  while (chars.length < length) {
    chars.push(randomChar(pool));
  }

  return shuffle(chars).join("");
}

function getStrength(length, poolSize) {
  const bits = poolSize > 1 ? length * Math.log2(poolSize) : 0;
  const level = STRENGTH_LEVELS.find((item) => bits < item.maxBits) || STRENGTH_LEVELS.at(-1);
  const percent = Math.max(8, Math.min(100, Math.round((bits / 120) * 100)));

  return { ...level, bits, percent };
}

function updateStrength() {
  const sets = getSelectedSets();
  const poolSize = sets.reduce((total, set) => total + set.length, 0);
  const strength = getStrength(getLength(), poolSize);

  strengthBox.dataset.level = strength.id;
  strengthBox.style.setProperty("--strength-width", `${strength.percent}%`);
  strengthBox.setAttribute("aria-valuenow", String(strength.percent));
  strengthLabel.textContent = strength.label;
}

function showPassword(password) {
  passwordOutput.textContent = password || "—";
}

function generateAndShow() {
  copyStatus.textContent = "";
  showPassword(generatePassword());
  updateStrength();
}

function updateLengthDisplay() {
  const length = getLength();
  lengthValue.textContent = String(length);
  lengthInput.setAttribute("aria-valuenow", String(length));
}

async function copyPassword() {
  const password = passwordOutput.textContent;

  if (!password || password === "—") {
    copyStatus.textContent = "Gere uma senha primeiro.";
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(password);
    } else if (!fallbackCopy(password)) {
      throw new Error("fallback copy failed");
    }
  } catch {
    if (!fallbackCopy(password)) {
      copyStatus.textContent = "Não foi possível copiar. Selecione a senha.";
      return;
    }
  }

  copyStatus.textContent = "Copiado para a área de transferência.";
}

function fallbackCopy(text) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();
  return copied;
}

lengthInput.addEventListener("input", () => {
  updateLengthDisplay();
  generateAndShow();
});

Object.values(charsetInputs).forEach((input) => {
  input.addEventListener("change", () => {
    if (getSelectedSets().length === 0) {
      input.checked = true;
      copyStatus.textContent = "Selecione ao menos um tipo de caractere.";
      updateStrength();
      return;
    }

    generateAndShow();
  });
});

generateBtn.addEventListener("click", generateAndShow);
copyBtn.addEventListener("click", copyPassword);

updateLengthDisplay();
generateAndShow();
