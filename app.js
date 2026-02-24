import { decryptPlrBrowser } from "./decryptPlr.js";
import { parsePlayerFile } from "./parsePlayer.js";

let allItems = [];
let filteredItems = [];
let research = {};
let currentPage = 1;
const itemsPerPage = 50;

// UI elements
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const hideCompletedCheckbox = document.getElementById("hideCompleted");
const showOnlyCompletedCheckbox = document.getElementById("showOnlyCompleted");
const showOnlyUnresearchedCheckbox = document.getElementById("showOnlyUnresearched");

async function loadItems() {
  const res = await fetch("items.json");
  allItems = await res.json();

  const categories = [...new Set(allItems.map(i => i.category))].sort();
  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  }

  filteredItems = allItems;
  renderItems();
  renderPagination();
  updateSummary();
}

function normalizeName(name) {
  return name.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

function isCompleted(item) {
  const key = normalizeName(item.name);
  const count = research[key] || 0;
  return count >= item.research;
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  const hideCompleted = hideCompletedCheckbox.checked;
  const onlyCompleted = showOnlyCompletedCheckbox.checked;
  const onlyUnresearched = showOnlyUnresearchedCheckbox.checked;

  filteredItems = allItems.filter(item => {
    const matchesSearch =
      !query || item.name.toLowerCase().includes(query);

    const matchesCategory =
      !category || item.category === category;

    const completed = isCompleted(item);

    let matchesCompletion = true;

    if (hideCompleted) matchesCompletion = !completed;
    if (onlyCompleted) matchesCompletion = completed;
    if (onlyUnresearched) matchesCompletion = !completed;

    return matchesSearch && matchesCategory && matchesCompletion;
  });

  currentPage = 1;
  renderItems();
  renderPagination();
  updateSummary();
}

function renderItems() {
  const container = document.getElementById("items");
  container.innerHTML = "";

  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredItems.slice(start, start + itemsPerPage);

  for (const item of pageItems) {
    const div = document.createElement("div");
    div.className = "item-card";

    const completed = isCompleted(item);
    const key = normalizeName(item.name);

    div.innerHTML = `
      <img src="icons/${item.internalName}.png" class="item-icon" />
      <div class="item-name">${item.name}</div>
      <div class="item-progress">${research[key] || 0} / ${item.research}</div>
      <div class="item-status ${completed ? "done" : ""}">
        ${completed ? "Researched" : "Not Researched"}
      </div>
    `;

    container.appendChild(div);
  }
}

function renderPagination() {
  const container = document.getElementById("pagination");
  container.innerHTML = "";

  const pages = Math.ceil(filteredItems.length / itemsPerPage);

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentPage = i;
      renderItems();
      renderPagination();
    });

    container.appendChild(btn);
  }
}

function updateSummary() {
  const total = allItems.length;
  const completed = allItems.filter(isCompleted).length;

  document.getElementById("summary-count").textContent =
    `${completed} / ${total}`;

  const pct = (completed / total) * 100;
  document.getElementById("summary-bar").style.width = pct + "%";

  document.getElementById("itemCount").textContent =
    `${filteredItems.length} items shown`;
}

// NEW: Browser-based player import
document.getElementById("playerFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const encrypted = await file.arrayBuffer();
  const decrypted = await decryptPlrBrowser(encrypted);

  const result = parsePlayerFile(decrypted);
  research = result.research || {};

  applyFilters();
});

// Filter listeners
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
hideCompletedCheckbox.addEventListener("change", applyFilters);
showOnlyCompletedCheckbox.addEventListener("change", applyFilters);
showOnlyUnresearchedCheckbox.addEventListener("change", applyFilters);

// Start
loadItems();
