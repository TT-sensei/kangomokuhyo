"use strict";

const categoryList = document.querySelector("#category-list");
const goalList = document.querySelector("#goal-list");
const goalsDescription = document.querySelector("#goals-description");
const selectedList = document.querySelector("#selected-list");
const selectedCount = document.querySelector("#selected-count");
const clearButton = document.querySelector("#clear-button");
const copyButton = document.querySelector("#copy-button");
const copyStatus = document.querySelector("#copy-status");

let categories = [];
let activeCategoryId = null;
let selectedGoals = [];
let statusTimer;

function goalText(goal) {
  return typeof goal === "string" ? goal : goal.text;
}

function findCategory(categoryId) {
  return categories.find((category) => category.id === categoryId);
}

function isGoalSelected(text) {
  return selectedGoals.some((goal) => goal.text === text);
}

function renderCategories() {
  categoryList.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category-button";
      button.dataset.categoryId = category.id;
      button.setAttribute("aria-pressed", String(category.id === activeCategoryId));

      const icon = document.createElement("span");
      icon.className = "category-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = category.icon || "📌";

      const name = document.createElement("span");
      name.className = "category-name";
      name.textContent = category.name;

      const count = document.createElement("span");
      count.className = "category-count";
      count.textContent = category.goals.length;
      count.setAttribute("aria-label", `${category.goals.length}件`);

      button.append(icon, name, count);
      button.addEventListener("click", () => selectCategory(category.id));
      return button;
    }),
  );
}

function selectCategory(categoryId) {
  activeCategoryId = categoryId;
  const category = findCategory(categoryId);
  if (!category) return;
  renderCategories();
  renderGoals(category);
}

function renderGoals(category) {
  goalsDescription.textContent = `「${category.name}」の文例です。いくつでも選べます。`;
  goalList.replaceChildren(
    ...category.goals.map((goal, index) => {
      const text = goalText(goal);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "goal-button";
      button.dataset.goalIndex = String(index);
      button.setAttribute("aria-pressed", String(isGoalSelected(text)));

      const mark = document.createElement("span");
      mark.className = "goal-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = isGoalSelected(text) ? "✓" : "+";

      const textNode = document.createElement("span");
      textNode.className = "goal-text";
      textNode.textContent = text;

      button.append(mark, textNode);
      button.addEventListener("click", () => toggleGoal(text, category));
      return button;
    }),
  );
}

function toggleGoal(text, category) {
  const index = selectedGoals.findIndex((goal) => goal.text === text);

  if (index >= 0) {
    selectedGoals.splice(index, 1);
  } else {
    selectedGoals.push({ text, categoryId: category.id, categoryName: category.name });
  }

  renderGoals(category);
  updateSelectedGoals();
}

function updateSelectedGoals() {
  const count = selectedGoals.length;
  selectedCount.textContent = String(count);
  selectedCount.setAttribute("aria-label", `選択中 ${count}件`);
  clearButton.disabled = count === 0;
  copyButton.disabled = count === 0;

  if (count === 0) {
    selectedList.innerHTML = '<p class="selected-empty">まだ目標を選んでいません。<br><span>中央の文例をクリックしてください。</span></p>';
    return;
  }

  selectedList.replaceChildren(
    ...selectedGoals.map((goal, index) => {
      const item = document.createElement("article");
      item.className = "selected-item";

      const number = document.createElement("span");
      number.className = "selected-number";
      number.textContent = String(index + 1).padStart(2, "0");

      const body = document.createElement("div");
      body.className = "selected-item-body";

      const category = document.createElement("span");
      category.className = "selected-item-category";
      category.textContent = goal.categoryName;

      const text = document.createElement("p");
      text.className = "selected-item-text";
      text.textContent = goal.text;

      body.append(category, text);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove-button";
      remove.setAttribute("aria-label", `「${goal.text}」を選択から外す`);
      remove.textContent = "×";
      remove.addEventListener("click", () => removeGoal(index));

      item.append(number, body, remove);
      return item;
    }),
  );
}

function removeGoal(index) {
  selectedGoals.splice(index, 1);
  const category = findCategory(activeCategoryId);
  if (category) renderGoals(category);
  updateSelectedGoals();
}

function clearGoals() {
  selectedGoals = [];
  const category = findCategory(activeCategoryId);
  if (category) renderGoals(category);
  updateSelectedGoals();
  copyStatus.textContent = "";
}

async function copyGoals() {
  if (selectedGoals.length === 0) return;

  const text = selectedGoals.map((goal) => goal.text).join("\n");

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      copyStatus.textContent = "コピーできませんでした。選択した目標を手動でコピーしてください。";
      return;
    }
  }

  copyButton.innerHTML = '<span aria-hidden="true">✓</span> コピーしました！';
  copyStatus.textContent = `${selectedGoals.length}件の目標をコピーしました。`;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    copyButton.innerHTML = '<span aria-hidden="true">⧉</span> まとめてコピー';
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
    updateSelectedGoals();
  } catch (error) {
    console.error(error);
    categoryList.innerHTML = '<p class="empty-message">目標データを読み込めませんでした。<code>data/goals.json</code> を確認してください。</p>';
  }
}

clearButton.addEventListener("click", clearGoals);
copyButton.addEventListener("click", copyGoals);
initialize();
