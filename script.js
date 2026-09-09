"use strict";

const categoryList = document.querySelector("#category-list");
const goalList = document.querySelector("#goal-list");
const goalsDescription = document.querySelector("#goals-description");
const selectedList = document.querySelector("#selected-list");
const selectedCount = document.querySelector("#selected-count");
const clearButton = document.querySelector("#clear-button");
const copyButton = document.querySelector("#copy-button");
const copyStatus = document.querySelector("#copy-status");
const goalSearch = document.querySelector("#goal-search");
const clearSearch = document.querySelector("#clear-search");
const searchStatus = document.querySelector("#search-status");
const headerVisuals = document.querySelector(".header-visuals");

let categories = [];
let activeCategoryId = null;
let selectedGoals = [];
let searchQuery = "";
let statusTimer;

const headerImages = [
  ["https://tt-sensei.github.io/navi-character-/assets/web/groups/daily/group-daily-arrival.webp", "登校・朝の出会い"],
  ["https://tt-sensei.github.io/navi-character-/assets/web/groups/daily/group-daily-cleanup.webp", "掃除・協力"],
  ["https://tt-sensei.github.io/navi-character-/assets/web/groups/daily/group-daily-classroom.webp", "教室・授業前の準備"],
  ["https://tt-sensei.github.io/navi-character-/assets/web/groups/daily/group-daily-recess.webp", "休み時間・遊び"],
];

function renderRandomHeaderImage() {
  if (!headerVisuals) return;
  const [src, alt] = headerImages[Math.floor(Math.random() * headerImages.length)];
  const image = document.createElement("img");
  image.src = src;
  image.className = "navi-character";
  image.alt = alt;
  image.style.display = "block";
  image.style.height = "52px";
  image.style.width = "auto";
  image.style.maxWidth = "100%";
  image.style.objectFit = "contain";
  image.style.objectPosition = "right center";
  headerVisuals.style.height = "60px";
  headerVisuals.style.display = "flex";
  headerVisuals.style.alignItems = "center";
  headerVisuals.style.justifyContent = "flex-end";
  headerVisuals.style.overflow = "hidden";
  headerVisuals.replaceChildren(image);
}

function goalText(goal) {
  return typeof goal === "string" ? goal : goal.text;
}

function findCategory(categoryId) {
  return categories.find((category) => category.id === categoryId);
}

function goalKey(categoryId, text) {
  return `${categoryId}::${text}`;
}

function isGoalSelected(categoryId, text) {
  return selectedGoals.some((goal) => goal.key === goalKey(categoryId, text));
}

function normalizeSearch(value) {
  return value.trim().toLocaleLowerCase("ja-JP");
}

function renderCategories() {
  categoryList.replaceChildren(
    ...categories.map((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category-button";
      button.dataset.categoryId = category.id;
      button.setAttribute("aria-pressed", String(category.id === activeCategoryId && !searchQuery));

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
      button.addEventListener("click", () => {
        goalSearch.value = "";
        searchQuery = "";
        updateSearchControls();
        selectCategory(category.id);
      });
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

function createGoalButton(category, goal, index) {
  const text = goalText(goal);
  const selected = isGoalSelected(category.id, text);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "goal-button";
  button.dataset.goalIndex = String(index);
  button.setAttribute("aria-pressed", String(selected));

  const mark = document.createElement("span");
  mark.className = "goal-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = selected ? "✓" : "+";

  const textNode = document.createElement("span");
  textNode.className = "goal-text";
  textNode.textContent = text;

  button.append(mark, textNode);
  button.addEventListener("click", () => toggleGoal(text, category));
  return button;
}

function renderGoals(category) {
  if (searchQuery) {
    renderSearchResults();
    return;
  }

  goalsDescription.textContent = `「${category.name}」の文例です。いくつでも選べます。`;
  goalList.replaceChildren(
    ...category.goals.map((goal, index) => createGoalButton(category, goal, index)),
  );
}

function renderSearchResults() {
  const query = normalizeSearch(searchQuery);
  const results = [];

  categories.forEach((category) => {
    category.goals.forEach((goal, index) => {
      const text = goalText(goal);
      if (text.toLocaleLowerCase("ja-JP").includes(query)) {
        results.push({ category, goal, index });
      }
    });
  });

  goalsDescription.textContent = `「${searchQuery.trim()}」を含む目標を検索しています。`;
  searchStatus.textContent = `${results.length}件の目標が見つかりました。`;

  if (results.length === 0) {
    goalList.innerHTML = '<p class="empty-message">該当する目標がありません。別の言葉で検索してみてください。</p>';
    return;
  }

  goalList.replaceChildren(
    ...results.map(({ category, goal, index }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "search-result-item";

      const categoryLabel = document.createElement("span");
      categoryLabel.className = "search-result-category";
      categoryLabel.textContent = category.name;

      wrapper.append(categoryLabel, createGoalButton(category, goal, index));
      return wrapper;
    }),
  );
}

function updateSearchControls() {
  const hasQuery = Boolean(searchQuery);
  clearSearch.hidden = !hasQuery;
  if (!hasQuery) searchStatus.textContent = "";
}

function handleSearch() {
  searchQuery = goalSearch.value;
  updateSearchControls();

  if (normalizeSearch(searchQuery)) {
    renderSearchResults();
  } else {
    searchQuery = "";
    const category = findCategory(activeCategoryId);
    if (category) {
      renderCategories();
      renderGoals(category);
    } else {
      renderCategories();
      goalsDescription.textContent = "左の分野を選ぶと、文例が表示されます。";
      goalList.innerHTML = '<p class="empty-message">まずは左の分野を選んでください。</p>';
    }
  }
}

function clearSearchInput() {
  goalSearch.value = "";
  searchQuery = "";
  updateSearchControls();
  const category = findCategory(activeCategoryId);
  if (category) {
    renderCategories();
    renderGoals(category);
  } else {
    renderCategories();
    goalsDescription.textContent = "左の分野を選ぶと、文例が表示されます。";
    goalList.innerHTML = '<p class="empty-message">まずは左の分野を選んでください。</p>';
  }
  goalSearch.focus();
}

function toggleGoal(text, category) {
  const key = goalKey(category.id, text);
  const index = selectedGoals.findIndex((goal) => goal.key === key);

  if (index >= 0) {
    selectedGoals.splice(index, 1);
  } else {
    selectedGoals.push({ key, text, categoryId: category.id, categoryName: category.name });
  }

  if (searchQuery) renderSearchResults();
  else renderGoals(category);
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
  if (searchQuery) renderSearchResults();
  else {
    const category = findCategory(activeCategoryId);
    if (category) renderGoals(category);
  }
  updateSelectedGoals();
}

function clearGoals() {
  selectedGoals = [];
  if (searchQuery) renderSearchResults();
  else {
    const category = findCategory(activeCategoryId);
    if (category) renderGoals(category);
  }
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
  renderRandomHeaderImage();
  const headerInner = document.querySelector(".header-inner");
  if (headerInner) headerInner.style.minHeight = "72px";

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
goalSearch.addEventListener("input", handleSearch);
clearSearch.addEventListener("click", clearSearchInput);
initialize();
