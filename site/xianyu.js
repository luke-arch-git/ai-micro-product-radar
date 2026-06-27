const opportunities = window.OPPORTUNITIES || [];
const categories = window.RADAR_CATEGORIES || [];

const elements = {
  search: document.querySelector("#xianyuSearch"),
  category: document.querySelector("#xianyuCategory"),
  price: document.querySelector("#xianyuPrice"),
  sort: document.querySelector("#xianyuSort"),
  grid: document.querySelector("#xianyuGrid"),
  listingCount: document.querySelector("#listingCount"),
  readyCount: document.querySelector("#readyCount"),
  firstBatch: document.querySelector("#firstBatch"),
  floorPrice: document.querySelector("#floorPrice")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeServiceName(title) {
  return title
    .replace(/生成器|整理器|提取器|清洗器|检查器|助手|复盘助手|解释卡/g, "")
    .replace(/AI|自动/g, "")
    .trim();
}

function priceBand(item) {
  if (item.scores.payment >= 5 && item.scores.pain >= 5) {
    return { id: "pro", label: "99-299", anchor: "99" };
  }
  if (item.scores.payment >= 4 || item.landing_score >= 85) {
    return { id: "standard", label: "29-99", anchor: "39" };
  }
  return { id: "entry", label: "9.9-29", anchor: "19.9" };
}

function riskLevel(item) {
  const text = `${item.title} ${item.input} ${item.output} ${item.tags.join(" ")}`;
  if (/保险|宠物|健身|房源|理赔|简历|聊天记录|客服/.test(text)) {
    return "谨慎";
  }
  if (/评论|文案|标题|表格|菜单|资料|直播/.test(text)) {
    return "较低";
  }
  return "中等";
}

function makeListing(item) {
  const serviceName = normalizeServiceName(item.title);
  const price = priceBand(item);
  const title = `帮做${serviceName}｜先发样例`;
  const deliverables = item.output
    .split(/[、，,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);

  const body = [
    `适合：${item.target_user}`,
    `你发：${item.input}`,
    `我交付：${item.output}`,
    `流程：先看 1 份样例，确认能做后再下单。`,
    `说明：人工整理 + AI 辅助，不做爬虫、不碰隐私数据、不承诺成交或收益。`
  ].join("\n");

  return {
    ...item,
    serviceName,
    listingTitle: title.length > 30 ? `${title.slice(0, 29)}…` : title,
    listingBody: body,
    deliverables,
    price,
    risk: riskLevel(item),
    priority: item.landing_score + item.scores.mvp_speed * 3 + item.scores.payment * 4
  };
}

const listings = opportunities.map(makeListing);

function fillFilters() {
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    elements.category.append(option);
  }
}

function matches(item, query) {
  if (!query) return true;
  const text = [
    item.title,
    item.listingTitle,
    item.target_user,
    item.input,
    item.output,
    item.current_workaround,
    item.mvp_scope,
    item.tags.join(" ")
  ]
    .join(" ")
    .toLowerCase();
  return text.includes(query.toLowerCase());
}

function getFiltered() {
  const query = elements.search.value.trim();
  const category = elements.category.value;
  const price = elements.price.value;
  const sort = elements.sort.value;

  return listings
    .filter((item) => matches(item, query))
    .filter((item) => category === "all" || item.category === category)
    .filter((item) => price === "all" || item.price.id === price)
    .sort((a, b) => {
      if (sort === "payment") return b.scores.payment - a.scores.payment || b.priority - a.priority;
      if (sort === "mvp") return b.scores.mvp_speed - a.scores.mvp_speed || b.priority - a.priority;
      return b.priority - a.priority;
    });
}

function updateMetrics(items) {
  elements.listingCount.textContent = items.length;
  elements.readyCount.textContent = items.filter((item) => item.landing_score >= 80 && item.risk !== "谨慎").length;
  elements.firstBatch.textContent = Math.min(10, items.length);
  elements.floorPrice.textContent = items.some((item) => item.price.id === "entry") ? "9.9" : "29";
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "已复制";
    setTimeout(() => {
      button.textContent = "复制文案";
    }, 1200);
  } catch {
    button.textContent = "复制失败";
  }
}

function renderCards(items) {
  if (items.length === 0) {
    elements.grid.innerHTML = `<div class="empty">没有匹配的闲鱼测试服务</div>`;
    return;
  }

  elements.grid.innerHTML = items
    .map(
      (item, index) => `
        <article class="xianyu-card" data-index="${index}">
          <div class="xianyu-card-head">
            <div>
              <span class="status">${escapeHtml(item.risk)}风险 / ${escapeHtml(item.price.label)}</span>
              <h3>${escapeHtml(item.listingTitle)}</h3>
            </div>
            <strong class="score">${item.landing_score}</strong>
          </div>
          <div class="listing-line">
            <b>闲鱼标题</b>
            <p>${escapeHtml(item.listingTitle)}</p>
          </div>
          <div class="listing-line">
            <b>测试价</b>
            <p>建议先挂 ${escapeHtml(item.price.anchor)} 元，复杂单再报价。</p>
          </div>
          <div class="deliverables">
            ${item.deliverables.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}
          </div>
          <pre>${escapeHtml(item.listingBody)}</pre>
          <div class="validation-actions">
            <button type="button" data-copy="${index}">复制文案</button>
            <span>${escapeHtml(item.mvp_scope)}</span>
          </div>
        </article>
      `
    )
    .join("");

  for (const button of elements.grid.querySelectorAll("[data-copy]")) {
    const item = items[Number(button.dataset.copy)];
    button.addEventListener("click", () => copyText(`${item.listingTitle}\n\n${item.listingBody}`, button));
  }
}

function render() {
  const items = getFiltered();
  updateMetrics(items);
  renderCards(items);
}

fillFilters();
render();

for (const element of [elements.search, elements.category, elements.price, elements.sort]) {
  element.addEventListener("input", render);
}

