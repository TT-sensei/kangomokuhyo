"use strict";

const categoryList = document.querySelector("#category-list");
const goalList = document.querySelector("#goal-list");
const goalsDescription = document.querySelector("#goals-description");
const selectedCategory = document.querySelector("#selected-category");
const selectedText = document.querySelector("#selected-text");
const copyButton = document.querySelector("#copy-button");
const copyStatus = document.querySelector("#copy-status");

let categories = [];
let activeCategoryId = null;
let activeGoalText = null;
let statusTimer;

function goalText(goal) {
  return typeof goal === "string" ? goal : goal.text;
}

function renderCategories() {
  categoryList.replaceChildren(...categories.map((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-card";
    button.dataset.categoryId = category.id;
    button.setAttribute("aria-pressed", String(category.id === activeCategoryId));
    button.innerHTML = `<span class="category-icon" aria-hidden="true">${category.icon || "📌"}</span><span>${category.name}</span>`;
    button.addEventListener("click", () => selectCategory(category.id));
    return button;
  }));
}

function selectCategory(categoryId) {
  activeCategoryId = categoryId;
  activeGoalText = null;
  const category = categories.find((item) => item.id === categoryId);
  renderCategories();
  renderGoals(category);
  updateSelectedGoal();
}

function renderGoals(category) {
  goalsDescription.textContent = `「${category.name}」の目標から、ひとつ選んでください。`;
  goalList.replaceChildren(...category.goals.map((goal) => {
    const text = goalText(goal);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "goal-button";
    button.textContent = text;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      activeGoalText = text;
      goalList.querySelectorAll(".goal-button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      updateSelectedGoal();
    });
    return button;
  }));
}

function updateSelectedGoal() {
  const category = categories.find((item) => item.id === activeCategoryId);
  const isSelected = Boolean(activeGoalText);
  selectedCategory.hidden = !isSelected;
  selectedCategory.textContent = isSelected ? `分野：${category.name}` : "";
  selectedText.textContent = isSelected ? `「${activeGoalText}」` : "目標を選ぶと、ここに表示されます。";
  copyButton.disabled = !isSelected;
  copyStatus.textContent = "";
}

async function copyGoal() {
  if (!activeGoalText) return;
  try {
    await navigator.clipboard.writeText(activeGoalText);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = activeGoalText;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) {
      copyStatus.textContent = "コピーできませんでした。手動でコピーしてください。";
      return;
    }
  }
  copyButton.innerHTML = "<span aria-hidden=\"true\">✓</span> コピーしました！";
  copyStatus.textContent = "目標本文をクリップボードにコピーしました。";
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    copyButton.innerHTML = "<span aria-hidden=\"true\">⧉</span> コピーする";
    copyStatus.textContent = "";
  }, 2500);
}

async function initialize() {
  try {
    const response = await fetch("data/goals.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.categories)) throw new Error("カテゴリーデータが不正です。");
    categories = data.categories;
    renderCategories();
  } catch (error) {
    console.error(error);
    categoryList.innerHTML = '<p class="empty-message">目標データを読み込めませんでした。<code>data/goals.json</code> を確認してください。</p>';
  }
}

copyButton.addEventListener("click", copyGoal);
initialize();
