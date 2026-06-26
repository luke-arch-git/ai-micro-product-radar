const opportunities = window.OPPORTUNITIES || [];
const categories = window.RADAR_CATEGORIES || [];
const signals = window.RADAR_SIGNALS || [];

const scoreLabels = {
  pain: "痛感",
  frequency: "频率",
  ai_fit: "AI",
  mvp_speed: "MVP",
  payment: "付费",
  distribution: "分发"
};

const elements = {
  totalCount: document.querySelector("#totalCount"),
  averageScore: document.querySelector("#averageScore"),
  hotCount: document.querySelector("#hotCount"),
  topInput: document.querySelector("#topInput"),
  signalCount: document.querySelector("#signalCount"),
  inputMix: document.querySelector("#inputMix"),
  signalList: document.querySelector("#signalList"),
  grid: document.querySelector("#opportunityGrid"),
  lanes: document.querySelector("#lanes"),
  search: document.querySelector("#searchInput"),
  category: document.querySelector("#categoryFilter"),
  source: document.querySelector("#sourceFilter"),
  sort: document.querySelector("#sortSelect")
};

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function inputKind(text) {
  if (/评论|弹幕/.test(text)) return "评论";
  if (/截图|照片|图|图片/.test(text)) return "图片";
  if (/语音|录音|转写/.test(text)) return "语音";
  if (/表格|Excel|CSV|名单/.test(text)) return "表格";
  if (/PDF|文章|文档|简历|资料|文件/.test(text)) return "文档";
  if (/聊天|私信|客服/.test(text)) return "聊天";
  return "文本";
}

function fillFilters() {
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    elements.category.append(option);
  }

  const sources = unique(opportunities.flatMap((item) => item.signal_sources));
  for (const source of sources) {
    const option = document.createElement("option");
    option.value = source;
    option.textContent = source;
    elements.source.append(option);
  }
}

function includesQuery(item, query) {
  if (!query) return true;
  const haystack = [
    item.title,
    item.target_user,
    item.user_scene,
    item.input,
    item.output,
    item.current_workaround,
    item.ai_product,
    item.mvp_scope,
    item.charge_model,
    item.why_now,
    ...item.tags,
    ...item.signal_sources,
    ...item.trigger_phrases
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function getFiltered() {
  const query = elements.search.value.trim();
  const category = elements.category.value;
  const source = elements.source.value;
  const sort = elements.sort.value;

  return opportunities
    .filter((item) => includesQuery(item, query))
    .filter((item) => category === "all" || item.category === category)
    .filter((item) => source === "all" || item.signal_sources.includes(source))
    .sort((a, b) => {
      if (sort === "score") return b.landing_score - a.landing_score;
      if (sort === "mvp") return b.scores.mvp_speed - a.scores.mvp_speed || b.landing_score - a.landing_score;
      if (sort === "payment") return b.scores.payment - a.scores.payment || b.landing_score - a.landing_score;
      if (sort === "frequency") return b.scores.frequency - a.scores.frequency || b.landing_score - a.landing_score;
      return 0;
    });
}

function summarize(items) {
  elements.totalCount.textContent = opportunities.length;
  elements.averageScore.textContent = items.length
    ? Math.round(items.reduce((sum, item) => sum + item.landing_score, 0) / items.length)
    : 0;
  elements.hotCount.textContent = items.filter((item) => item.landing_score >= 80).length;
  elements.signalCount.textContent = signals.length;

  const inputTokens = items
    .map((item) => item.input)
    .join(" ")
    .match(/评论|截图|照片|语音|字幕|票据|简历|菜单|聊天/g);

  if (!inputTokens || inputTokens.length === 0) {
    elements.topInput.textContent = "-";
  } else {
    const counts = inputTokens.reduce((map, token) => {
      map[token] = (map[token] || 0) + 1;
      return map;
    }, {});
    elements.topInput.textContent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
}

function renderSignalBoard(items) {
  const filteredIds = new Set(items.map((item) => item.id));
  const activeSignals = signals
    .filter((signal) => filteredIds.has(signal.linked_opportunity))
    .sort((a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id));

  const mix = items.reduce((map, item) => {
    const kind = inputKind(`${item.input} ${item.output}`);
    map[kind] = (map[kind] || 0) + 1;
    return map;
  }, {});

  elements.inputMix.innerHTML = Object.entries(mix)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([kind, count]) => `
        <div class="mix-row">
          <span>${escapeHtml(kind)}</span>
          <strong>${count}</strong>
          <i style="width: ${(count / Math.max(items.length, 1)) * 100}%"></i>
        </div>
      `
    )
    .join("");

  elements.signalList.innerHTML = activeSignals.length
    ? activeSignals
        .slice(0, 6)
        .map(
          (signal) => `
            <article class="signal-item">
              <div>
                <span>${escapeHtml(signal.platform)} / confidence ${signal.confidence}</span>
                <strong>${escapeHtml(signal.user_type)}</strong>
              </div>
              <p>${escapeHtml(signal.pain_signal)}</p>
            </article>
          `
        )
        .join("")
    : `<div class="empty slim">没有匹配的需求信号</div>`;
}

function renderLanes(items) {
  const lanes = [
    { label: "优先验证", range: "80-100", count: items.filter((item) => item.landing_score >= 80).length },
    { label: "观察测试", range: "65-79", count: items.filter((item) => item.landing_score >= 65 && item.landing_score < 80).length },
    { label: "需要收窄", range: "50-64", count: items.filter((item) => item.landing_score >= 50 && item.landing_score < 65).length },
    { label: "暂不投入", range: "0-49", count: items.filter((item) => item.landing_score < 50).length }
  ];

  elements.lanes.innerHTML = lanes
    .map(
      (lane) => `
        <div class="lane">
          <span>${lane.label}<br><small>${lane.range}</small></span>
          <strong>${lane.count}</strong>
        </div>
      `
    )
    .join("");
}

function renderScores(scores) {
  return Object.entries(scoreLabels)
    .map(([key, label]) => {
      const value = scores[key];
      return `
        <div class="bar">
          <span>${label}</span>
          <span class="bar-track"><span class="bar-fill" style="width: ${(value / 5) * 100}%"></span></span>
          <b>${value}</b>
        </div>
      `;
    })
    .join("");
}

function renderCards(items) {
  if (items.length === 0) {
    elements.grid.innerHTML = `<div class="empty">没有匹配的机会卡</div>`;
    return;
  }

  elements.grid.innerHTML = items
    .map(
      (item) => `
        <article class="card">
          <div class="card-head">
            <div>
              <span class="status">${escapeHtml(item.status)}</span>
              <h3>${escapeHtml(item.title)}</h3>
            </div>
            <div class="score">${item.landing_score}</div>
          </div>
          <p>${escapeHtml(item.user_scene)}</p>
          <div class="meta-grid">
            <div class="meta"><b>输入</b>${escapeHtml(item.input)}</div>
            <div class="meta"><b>输出</b>${escapeHtml(item.output)}</div>
            <div class="meta"><b>笨办法</b>${escapeHtml(item.current_workaround)}</div>
            <div class="meta"><b>MVP</b>${escapeHtml(item.mvp_scope)}</div>
          </div>
          <div class="score-bars">${renderScores(item.scores)}</div>
          <p><strong>产品形态：</strong>${escapeHtml(item.ai_product)}</p>
          <p><strong>收费：</strong>${escapeHtml(item.charge_model)}</p>
          <div class="tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </article>
      `
    )
    .join("");
}

function render() {
  const items = getFiltered();
  summarize(items);
  renderLanes(items);
  renderSignalBoard(items);
  renderCards(items);
}

fillFilters();
render();

for (const element of [elements.search, elements.category, elements.source, elements.sort]) {
  element.addEventListener("input", render);
}
