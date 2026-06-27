const gaps = window.GITHUB_GAP_SIGNALS || [];

const elements = {
  search: document.querySelector("#githubSearch"),
  risk: document.querySelector("#githubRisk"),
  price: document.querySelector("#githubPrice"),
  sort: document.querySelector("#githubSort"),
  grid: document.querySelector("#githubGrid"),
  gapCount: document.querySelector("#gapCount"),
  lowRiskCount: document.querySelector("#lowRiskCount"),
  serviceCount: document.querySelector("#serviceCount"),
  starCount: document.querySelector("#starCount")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compactStars(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

function riskRank(risk) {
  return { "较低": 1, "中等": 2, "谨慎": 3 }[risk] || 4;
}

function priceRank(price) {
  return Number(price.split("-")[0]) || 0;
}

function copyTextForGap(item) {
  return [
    item.listing_title,
    "",
    `适合：${item.chinese_user}`,
    `你给：你的场景、现有资料、想解决的问题`,
    `我交付：${item.deliverables.join("、")}`,
    `说明：参考开源能力做人工整理/配置建议，不倒卖代码，不承诺自动化结果。`,
    `边界：${item.boundary}`
  ].join("\n");
}

function matches(item, query) {
  if (!query) return true;
  const text = [
    item.repo_full_name,
    item.description,
    item.capability,
    item.gap_pattern,
    item.chinese_user,
    item.demand_translation,
    item.xianyu_service,
    item.listing_title,
    item.tags.join(" ")
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(query.toLowerCase());
}

function getFiltered() {
  const query = elements.search.value.trim();
  const risk = elements.risk.value;
  const price = elements.price.value;
  const sort = elements.sort.value;

  return gaps
    .filter((item) => matches(item, query))
    .filter((item) => risk === "all" || item.risk_level === risk)
    .filter((item) => price === "all" || item.test_price.startsWith(price))
    .sort((a, b) => {
      if (sort === "risk") return riskRank(a.risk_level) - riskRank(b.risk_level) || b.stars - a.stars;
      if (sort === "price") return priceRank(b.test_price) - priceRank(a.test_price) || b.stars - a.stars;
      return b.stars - a.stars;
    });
}

function updateMetrics(items) {
  elements.gapCount.textContent = items.length;
  elements.lowRiskCount.textContent = items.filter((item) => item.risk_level === "较低").length;
  elements.serviceCount.textContent = items.filter((item) => item.xianyu_service).length;
  const totalStars = items.reduce((sum, item) => sum + item.stars, 0);
  elements.starCount.textContent = compactStars(totalStars);
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "已复制";
    setTimeout(() => {
      button.textContent = "复制闲鱼文案";
    }, 1200);
  } catch {
    button.textContent = "复制失败";
  }
}

function renderCards(items) {
  if (items.length === 0) {
    elements.grid.innerHTML = `<div class="empty">没有匹配的 GitHub 信息差</div>`;
    return;
  }

  elements.grid.innerHTML = items
    .map(
      (item, index) => `
        <article class="github-card">
          <div class="github-card-head">
            <div>
              <span class="status">${escapeHtml(item.risk_level)}风险 / ${escapeHtml(item.test_price)}</span>
              <h3>${escapeHtml(item.repo_full_name)}</h3>
              <a href="${escapeHtml(item.repo_url)}" target="_blank" rel="noreferrer">${escapeHtml(item.repo_url)}</a>
            </div>
            <strong class="score">${compactStars(item.stars)}</strong>
          </div>

          <div class="translation-stack">
            <div><b>项目能力</b><p>${escapeHtml(item.capability)}</p></div>
            <div><b>信息差</b><p>${escapeHtml(item.gap_pattern)}</p></div>
            <div><b>中文需求</b><p>${escapeHtml(item.demand_translation)}</p></div>
            <div><b>闲鱼服务</b><p>${escapeHtml(item.xianyu_service)}</p></div>
          </div>

          <div class="deliverables">
            ${item.deliverables.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}
          </div>

          <div class="listing-line">
            <b>测试标题</b>
            <p>${escapeHtml(item.listing_title)}</p>
          </div>

          <div class="boundary-box">
            <b>边界</b>
            <p>${escapeHtml(item.boundary)}</p>
          </div>

          <div class="validation-actions">
            <button type="button" data-copy="${index}">复制闲鱼文案</button>
            <span>${escapeHtml(item.chinese_user)}</span>
          </div>
        </article>
      `
    )
    .join("");

  for (const button of elements.grid.querySelectorAll("[data-copy]")) {
    const item = items[Number(button.dataset.copy)];
    button.addEventListener("click", () => copyText(copyTextForGap(item), button));
  }
}

function render() {
  const items = getFiltered();
  updateMetrics(items);
  renderCards(items);
}

render();

for (const element of [elements.search, elements.risk, elements.price, elements.sort]) {
  element.addEventListener("input", render);
}

