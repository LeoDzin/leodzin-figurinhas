const TEAM_ORDER = [
  ["MEX", "Mexico"],
  ["RSA", "Africa do Sul"],
  ["KOR", "Coreia do Sul"],
  ["CZE", "Tchequia"],
  ["CAN", "Canada"],
  ["BIH", "Bosnia e Herzegovina"],
  ["QAT", "Catar"],
  ["SUI", "Suica"],
  ["BRA", "Brasil"],
  ["MAR", "Marrocos"],
  ["HAI", "Haiti"],
  ["SCO", "Escocia"],
  ["USA", "Estados Unidos"],
  ["PAR", "Paraguai"],
  ["AUS", "Australia"],
  ["TUR", "Turquia"],
  ["GER", "Alemanha"],
  ["CUW", "Curacao"],
  ["CIV", "Costa do Marfim"],
  ["ECU", "Equador"],
  ["NED", "Paises Baixos"],
  ["JPN", "Japao"],
  ["SWE", "Suecia"],
  ["TUN", "Tunisia"],
  ["BEL", "Belgica"],
  ["EGY", "Egito"],
  ["IRN", "Ira"],
  ["NZL", "Nova Zelandia"],
  ["ESP", "Espanha"],
  ["CPV", "Cabo Verde"],
  ["KSA", "Arabia Saudita"],
  ["URU", "Uruguai"],
  ["FRA", "Franca"],
  ["SEN", "Senegal"],
  ["IRQ", "Iraque"],
  ["NOR", "Noruega"],
  ["ARG", "Argentina"],
  ["ALG", "Argelia"],
  ["AUT", "Austria"],
  ["JOR", "Jordania"],
  ["POR", "Portugal"],
  ["COD", "RD Congo"],
  ["UZB", "Uzbequistao"],
  ["COL", "Colombia"],
  ["ENG", "Inglaterra"],
  ["CRO", "Croacia"],
  ["GHA", "Gana"],
  ["PAN", "Panama"],
];

const PREFIX_ALIASES = {
  SWI: "SUI",
  KAS: "KSA",
};

const VALID_PREFIXES = new Set([
  "FWC",
  "CC",
  ...TEAM_ORDER.map(([prefix]) => prefix),
  ...Object.keys(PREFIX_ALIASES),
]);

const FALLBACK_COLLECTION = {
  ownerName: "Leonardo",
  albumName: "Copa do Mundo FIFA 2026 - Panini Brasil",
  updatedAt: new Date().toISOString().slice(0, 10),
  missing: "",
  owned: "",
  duplicates: {},
  reserved: "",
  acquired: "",
};

const state = {
  collection: FALLBACK_COLLECTION,
  mineList: "missing",
  results: {
    offerMe: [],
    offerYou: [],
  },
};

const els = {};

document.addEventListener("DOMContentLoaded", async () => {
  bindElements();
  bindEvents();
  state.collection = await loadCollection();
  hydrateEditorFromCollection();
  renderAll();
});

function bindElements() {
  [
    "statOwned",
    "statMissing",
    "statDuplicates",
    "statAvailable",
    "updatedAt",
    "clearVisitor",
    "compareButton",
    "visitorHas",
    "visitorNeeds",
    "resultSummary",
    "resultText",
    "copyAllResults",
    "mineFilter",
    "mineListSummary",
    "copyMineList",
    "mineList",
    "ownerOwned",
    "ownerMissing",
    "ownerDuplicates",
    "ownerReserved",
    "previewOwnerData",
    "buildJson",
    "downloadJson",
    "jsonOutput",
    "toast",
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });

  els.mineTabs = Array.from(document.querySelectorAll("[data-list]"));
}

function bindEvents() {
  els.mineTabs.forEach((button) => {
    button.addEventListener("click", () => {
      state.mineList = button.dataset.list;
      els.mineTabs.forEach((item) =>
        item.classList.toggle("is-active", item === button),
      );
      renderMineList();
    });
  });

  els.compareButton.addEventListener("click", renderComparison);
  els.mineFilter.addEventListener("input", renderMineList);
  els.clearVisitor.addEventListener("click", () => {
    els.visitorHas.value = "";
    els.visitorNeeds.value = "";
    resetComparison();
  });

  els.copyAllResults.addEventListener("click", () => {
    const text = formatAllResults();
    copyText(text || "Sem resultados.");
  });

  els.copyMineList.addEventListener("click", () => {
    const mine = getMineData();
    const codes = getMineListCodes(mine, state.mineList);
    copyText(formatGroupedCodes(codes, getMineListCounts(mine, state.mineList)));
  });

  els.previewOwnerData.addEventListener("click", () => {
    state.collection = buildCollectionFromEditor();
    renderAll();
    showToast("Listas atualizadas neste navegador.");
  });

  els.buildJson.addEventListener("click", () => {
    els.jsonOutput.value = JSON.stringify(buildCollectionFromEditor(), null, 2);
    showToast("JSON gerado.");
  });

  els.downloadJson.addEventListener("click", () => {
    const payload = JSON.stringify(buildCollectionFromEditor(), null, 2);
    els.jsonOutput.value = payload;
    downloadText("collection.json", payload);
  });
}

async function loadCollection() {
  try {
    const response = await fetch("data/collection.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return {
      ...FALLBACK_COLLECTION,
      ...(await response.json()),
    };
  } catch (error) {
    console.warn("Nao foi possivel carregar data/collection.json.", error);
    return FALLBACK_COLLECTION;
  }
}

function renderAll() {
  renderStats();
  renderMineList();
  resetComparison();
}

function renderStats() {
  const mine = getMineData();
  els.statOwned.textContent = mine.owned.length;
  els.statMissing.textContent = mine.missing.length;
  els.statDuplicates.textContent = sumCounts(mine.duplicateTotal);
  els.statAvailable.textContent = sumCounts(mine.available);

  const updated = state.collection.updatedAt
    ? formatDate(state.collection.updatedAt)
    : "Sem data";
  els.updatedAt.textContent = `Atualizado em ${updated}`;
}

function renderMineList() {
  const mine = getMineData();
  const list = getMineListCodes(mine, state.mineList);
  const filter = normalizeSearch(els.mineFilter.value);
  const filtered = list.filter((item) => codeMatchesFilter(item, filter));

  const listName =
    state.mineList === "owned"
      ? "ja tenho"
      : state.mineList === "missing"
      ? "preciso dessas"
      : state.mineList === "duplicates"
        ? "minhas repetidas"
        : "reservadas";

  els.mineListSummary.textContent = `${filtered.length} ${listName}`;
  renderCodeList(els.mineList, filtered, {
    counts:
      state.mineList === "duplicates"
        ? mine.available
        : state.mineList === "reserved"
          ? mine.reserved
          : null,
    emptyText: "Nenhum codigo nesta lista.",
  });
}

function getMineListCounts(mine, listName) {
  if (listName === "duplicates") {
    return mine.available;
  }

  if (listName === "reserved") {
    return mine.reserved;
  }

  return null;
}

function renderComparison() {
  const mine = getMineData();
  const visitorHas = uniqueSortedCodes(parseCodes(els.visitorHas.value));
  const visitorNeeds = uniqueSortedCodes(parseCodes(els.visitorNeeds.value));

  const offerMe = intersectCodes(visitorHas, mine.missing);
  const offerYou = intersectCodes(visitorNeeds, Object.keys(mine.available));

  state.results.offerMe = sortCodes(offerMe);
  state.results.offerYou = sortCodes(offerYou);

  const hasAnyInput = visitorHas.length > 0 || visitorNeeds.length > 0;
  if (!hasAnyInput) {
    if (els.visitorHas.value.trim() || els.visitorNeeds.value.trim()) {
      els.resultSummary.textContent = "Nao encontrei codigos para comparar.";
      els.resultText.value =
        "Nao consegui identificar codigos nesses textos. Use formatos como BRA1, BRA15, FWC1 ou listas como BRA: 1, 15 e 20.";
      return;
    }

    resetComparison();
    return;
  }

  els.resultSummary.textContent = `${state.results.offerMe.length} para mim e ${state.results.offerYou.length} para voce.`;
  els.resultText.value = formatAllResults(mine.available);
}

function resetComparison() {
  state.results.offerMe = [];
  state.results.offerYou = [];
  els.resultSummary.textContent = "Cole uma lista para comparar.";
  els.resultText.value = "Resultado da comparacao aparecera aqui.";
}

function getMineData() {
  const ownedRaw = toCountMap(state.collection.owned || state.collection.acquired);
  const missingRaw = toCountMap(state.collection.missing);
  const duplicates = toCountMap(state.collection.duplicates);
  const reserved = toCountMap(state.collection.reserved);
  const acquired = toCountMap(state.collection.acquired);

  const missing = Object.keys(missingRaw).filter(
    (code) => !acquired[code] && !ownedRaw[code],
  );
  const available = { ...duplicates };
  const duplicateTotal = mergeCounts(duplicates, reserved);

  return {
    owned: sortCodes(Object.keys(ownedRaw)),
    missing: sortCodes(missing),
    duplicates,
    reserved,
    available,
    duplicateTotal,
  };
}

function getMineListCodes(mine, listName) {
  if (listName === "owned") {
    return mine.owned;
  }

  if (listName === "missing") {
    return mine.missing;
  }

  if (listName === "reserved") {
    return sortCodes(Object.keys(mine.reserved));
  }

  return sortCodes(Object.keys(mine.available));
}

function buildCollectionFromEditor() {
  const current = state.collection || FALLBACK_COLLECTION;
  const owned = toListString(els.ownerOwned.value);
  return {
    ownerName: current.ownerName || FALLBACK_COLLECTION.ownerName,
    albumName: current.albumName || FALLBACK_COLLECTION.albumName,
    updatedAt: new Date().toISOString().slice(0, 10),
    owned,
    missing: toListString(els.ownerMissing.value),
    duplicates: mapToSortedObject(toCountMap(els.ownerDuplicates.value)),
    reserved: mapToSortedObject(toCountMap(els.ownerReserved.value)),
    acquired: owned || current.acquired || "",
  };
}

function hydrateEditorFromCollection() {
  const mine = getMineData();
  els.ownerOwned.value = state.collection.owned || state.collection.acquired || "";
  els.ownerMissing.value = state.collection.missing || "";
  els.ownerDuplicates.value = formatCountInput(mine.duplicates);
  els.ownerReserved.value = formatCountInput(mine.reserved);
  els.jsonOutput.value = JSON.stringify(state.collection, null, 2);
}

function renderCodeList(target, codes, options = {}) {
  const { counts = null, reservedCounts = null, emptyText = "Sem codigos." } = options;
  target.innerHTML = "";
  target.classList.remove("grouped");

  if (!codes.length) {
    target.classList.add("empty");
    target.textContent = emptyText;
    return;
  }

  target.classList.remove("empty");

  if (target === els.mineList) {
    target.classList.add("grouped");
    renderGroupedCodeList(target, codes, { counts, reservedCounts });
    return;
  }

  codes.forEach((code) => {
    target.append(createCodeChip(code, { counts, reservedCounts }));
  });
}

function renderGroupedCodeList(target, codes, options = {}) {
  groupCodes(codes).forEach((group) => {
    const block = document.createElement("section");
    block.className = "code-group";

    const title = document.createElement("h4");
    title.className = "code-group-title";
    title.textContent = group.label;
    block.append(title);

    const list = document.createElement("div");
    list.className = "code-group-list";
    group.codes.forEach((code) => {
      list.append(createCodeChip(code, options));
    });

    block.append(list);
    target.append(block);
  });
}

function createCodeChip(code, options = {}) {
  const { counts = null, reservedCounts = null } = options;
  const chip = document.createElement("span");
  chip.className = "code-chip";

  if (isSpecialCode(code)) {
    chip.classList.add("is-special");
  }

  if (!albumIndex.has(code)) {
    chip.classList.add("is-unknown");
  }

  const reserved = reservedCounts?.[code] || 0;
  const count = counts?.[code] || 0;
  if (reserved > 0 && count <= reserved) {
    chip.classList.add("is-reserved");
  }

  chip.append(document.createTextNode(code));

  if (counts && count > 0) {
    const qty = document.createElement("span");
    qty.className = "qty";
    qty.textContent = `x${count}`;
    chip.append(qty);
  }

  if (reserved > 0) {
    chip.title = `${reserved} reservada(s)`;
  }

  return chip;
}

function parseCodes(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => parseCodes(String(item)));
  }

  if (typeof input === "object") {
    return Object.entries(input).flatMap(([code, count]) => {
      const normalized = normalizeCode(code);
      const amount = Math.max(0, Number(count) || 0);
      return normalized ? Array.from({ length: amount }, () => normalized) : [];
    });
  }

  const text = stripCodeRanges(String(input));
  const matches = text.match(/\b(?:00|[A-Za-z]{2,4}[-._]?0*\d{1,3})\b/g) || [];
  const directCodes = matches.map(normalizeCode).filter(Boolean);
  return directCodes.concat(parsePrefixedNumberLists(text));
}

function normalizeCode(code) {
  const raw = String(code).trim().toUpperCase().replace(/[-._]+/g, "");
  if (raw === "00") {
    return "00";
  }

  const match = raw.match(/^([A-Z]{2,4})(\d{1,3})$/);
  if (!match) {
    return "";
  }

  const prefix = PREFIX_ALIASES[match[1]] || match[1];
  if (prefix === "PG") {
    return "";
  }

  const number = Number.parseInt(match[2], 10);
  if (!Number.isFinite(number)) {
    return "";
  }

  return `${prefix}${number}`;
}

function stripCodeRanges(text) {
  return text.replace(
    /\b[A-Za-z]{2,4}[-._]?0*\d{1,3}\s*[\u2010-\u2015-]\s*[A-Za-z]{0,4}[-._]?0*\d{1,3}\b/g,
    " ",
  );
}

function parsePrefixedNumberLists(text) {
  const codes = [];
  const lines = String(text).split(/\r?\n/);

  lines.forEach((line) => {
    const match = line.match(/^\s*([A-Za-z]{2,4})(?::|\s+)(.+)$/);
    if (!match) {
      return;
    }

    const prefix = PREFIX_ALIASES[match[1].toUpperCase()] || match[1].toUpperCase();
    const numberList = match[2].trim();
    if (!VALID_PREFIXES.has(prefix) || !/^\d/.test(numberList)) {
      return;
    }

    const numbers = numberList.match(/\d{1,3}/g) || [];
    numbers.forEach((number) => {
      const normalized = normalizeCode(`${prefix}${number}`);
      if (normalized) {
        codes.push(normalized);
      }
    });
  });

  return codes;
}

function parseCountedCodes(input) {
  const counts = {};
  const text = stripCodeRanges(String(input));
  const matches = text.matchAll(
    /\b(00|[A-Za-z]{2,4}[-._]?0*\d{1,3})\b\s*\(\s*x\s*(\d+)\s*\)/gi,
  );

  for (const match of matches) {
    const normalized = normalizeCode(match[1]);
    const amount = Math.max(0, Number(match[2]) || 0);
    if (normalized && amount > 0) {
      counts[normalized] = (counts[normalized] || 0) + amount;
    }
  }

  return counts;
}

function toCountMap(input) {
  const counts = {};

  if (input && typeof input === "object" && !Array.isArray(input)) {
    Object.entries(input).forEach(([code, count]) => {
      const normalized = normalizeCode(code);
      const amount = Math.max(0, Number(count) || 0);
      if (normalized && amount > 0) {
        counts[normalized] = (counts[normalized] || 0) + amount;
      }
    });
    return counts;
  }

  const counted = parseCountedCodes(input);
  Object.entries(counted).forEach(([code, count]) => {
    counts[code] = (counts[code] || 0) + count;
  });

  parseCodes(stripCountedCodes(input)).forEach((code) => {
    counts[code] = (counts[code] || 0) + 1;
  });

  return counts;
}

function stripCountedCodes(input) {
  return String(input).replace(
    /\b(00|[A-Za-z]{2,4}[-._]?0*\d{1,3})\b\s*\(\s*x\s*\d+\s*\)/gi,
    " ",
  );
}

function uniqueSortedCodes(codes) {
  return sortCodes(Array.from(new Set(codes)));
}

function intersectCodes(left, right) {
  const rightSet = new Set(right);
  return left.filter((code) => rightSet.has(code));
}

function sortCodes(codes) {
  return Array.from(codes).sort(compareCodes);
}

function compareCodes(a, b) {
  const left = albumIndex.get(a);
  const right = albumIndex.get(b);

  if (left && right) {
    return left.order - right.order;
  }

  if (left) {
    return -1;
  }

  if (right) {
    return 1;
  }

  const parsedLeft = splitCode(a);
  const parsedRight = splitCode(b);
  if (parsedLeft.prefix !== parsedRight.prefix) {
    return parsedLeft.prefix.localeCompare(parsedRight.prefix);
  }
  return parsedLeft.number - parsedRight.number;
}

function splitCode(code) {
  if (code === "00") {
    return { prefix: "", number: 0 };
  }

  const match = code.match(/^([A-Z]+)(\d+)$/);
  return {
    prefix: match?.[1] || code,
    number: match ? Number(match[2]) : Number.MAX_SAFE_INTEGER,
  };
}

function codeMatchesFilter(code, filter) {
  if (!filter) {
    return true;
  }

  const meta = albumIndex.get(code);
  const haystack = `${code} ${meta?.group || ""}`.toUpperCase();
  return haystack.includes(filter);
}

function normalizeSearch(value) {
  return String(value || "").trim().toUpperCase();
}

function toListString(value) {
  return uniqueSortedCodes(parseCodes(value)).join(" ");
}

function objectToRepeatedText(map) {
  return sortCodes(Object.keys(map))
    .flatMap((code) => Array.from({ length: map[code] }, () => code))
    .join(" ");
}

function mapToSortedObject(map) {
  return sortCodes(Object.keys(map)).reduce((acc, code) => {
    acc[code] = map[code];
    return acc;
  }, {});
}

function sumCounts(map) {
  return Object.values(map).reduce((total, count) => total + count, 0);
}

function mergeCounts(...maps) {
  return maps.reduce((merged, map) => {
    Object.entries(map).forEach(([code, count]) => {
      merged[code] = (merged[code] || 0) + count;
    });
    return merged;
  }, {});
}

function formatCountInput(map) {
  return sortCodes(Object.keys(map))
    .map((code) => `${code} (x${map[code]})`)
    .join(" ");
}

function isSpecialCode(code) {
  const meta = albumIndex.get(code);
  return meta?.special || false;
}

function formatAllResults(availableCounts = getMineData().available) {
  const offerMe = formatCodesForText(state.results.offerMe);
  const offerYou = formatCodesForText(state.results.offerYou, availableCounts);

  return [
    "Resultado da comparacao",
    "",
    `Voce tem e me falta (${state.results.offerMe.length}):`,
    offerMe || "-",
    "",
    `Eu tenho e voce precisa (${state.results.offerYou.length}):`,
    offerYou || "-",
  ].join("\n");
}

function formatCodesForText(codes, counts = null) {
  return codes
    .map((code) => {
      const count = counts?.[code] || 0;
      return count > 1 ? `${code} (x${count})` : code;
    })
    .join(" ");
}

function formatGroupedCodes(codes, counts = null) {
  if (!codes.length) {
    return "Sem resultados.";
  }

  return groupCodes(codes)
    .map((group) => {
      return `${group.label}\n${formatCodesForText(group.codes, counts)}`;
    })
    .join("\n\n");
}

function groupCodes(codes) {
  const groups = new Map();

  sortCodes(codes).forEach((code) => {
    const key = getCodeGroupKey(code);
    if (!groups.has(key)) {
      groups.set(key, {
        label: getCodeGroupLabel(key, code),
        codes: [],
      });
    }

    groups.get(key).codes.push(code);
  });

  return Array.from(groups.values());
}

function getCodeGroupKey(code) {
  if (code === "00") {
    return "00";
  }

  return splitCode(code).prefix;
}

function getCodeGroupLabel(key, sampleCode) {
  return key;
}

function copyCodes(codes) {
  copyText(codes.length ? codes.join(" ") : "Sem resultados.");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copiado.");
  } catch {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.append(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    showToast("Copiado.");
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 1800);
}

function formatDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function buildAlbumIndex() {
  const entries = [];

  entries.push({
    code: "00",
    group: "Especiais",
    order: entries.length,
    special: true,
  });

  for (let number = 1; number <= 19; number += 1) {
    entries.push({
      code: `FWC${number}`,
      group: number <= 8 ? "Abertura" : "FIFA Museum",
      order: entries.length,
      special: true,
    });
  }

  for (let number = 1; number <= 14; number += 1) {
    entries.push({
      code: `CC${number}`,
      group: "Coca-Cola",
      order: entries.length,
      special: true,
    });
  }

  TEAM_ORDER.forEach(([prefix, name]) => {
    for (let number = 1; number <= 20; number += 1) {
      entries.push({
        code: `${prefix}${number}`,
        group: name,
        order: entries.length,
        special: number === 1,
      });
    }
  });

  return new Map(entries.map((entry) => [entry.code, entry]));
}

const albumIndex = buildAlbumIndex();
