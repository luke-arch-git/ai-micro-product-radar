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

let activeSegment = "all";

const focusSegments = [
  {
    id: "all",
    label: "全部机会",
    title: "从机会清单到今天先试什么",
    description: "先按你能接触到的人群收窄，再看输入、输出、验证动作。雷达只服务一个目标：找到能在 24 小时内被真实用户理解的小产品。",
    match: () => true
  },
  {
    id: "edu",
    label: "教培 / 机构",
    title: "教培优先：先找老师、助教、机构运营每天重复做的事",
    description: "这个方向适合福州本地教培圈先试。重点不是做大平台，而是把家长群、报名表、资料包、课程内容这些重复任务压成小交付。",
    match: (item) => textBlob(item).match(/教培|老师|助教|课程|机构|家长|托管|学习|资料包|报名|讲课|绘本|班主任/)
  },
  {
    id: "local",
    label: "本地小商家",
    title: "本地小商家：先做能换钱的报价、回复、价目卡",
    description: "适合维修、家政、餐饮、美业、门店服务。输入通常是照片、差评、聊天记录；输出要能直接发给客户。",
    match: (item) => textBlob(item).match(/本地|商家|门店|维修|家政|装修|餐饮|外卖|美甲|美睫|物业|报价/)
  },
  {
    id: "commerce",
    label: "内容 / 电商",
    title: "内容和电商：别做代运营，拆成评论、卖点、标题的小模块",
    description: "这个方向流量感强，但也最容易变成空泛承诺。优先看评论整理、差评原因、商品图卖点和直播复盘这类明确输入输出。",
    match: (item) =>
      ["social-comments", "content-repurpose"].includes(item.category) ||
      item.tags.some((tag) => /ecommerce|xiaohongshu|douyin|live|creator|listing|product/.test(tag)) ||
      /电商|卖家|主播|博主|带货|内容账号/.test(item.target_user)
  },
  {
    id: "ops",
    label: "表格 / 客服 / 文档",
    title: "表格、客服、文档：最容易做成低摩擦代处理服务",
    description: "这些机会不性感，但好落地。用户已经有文件、名单、聊天记录或会议文本，只缺一个把它整理成结果的人或工具。",
    match: (item) => textBlob(item).match(/表格|名单|Excel|CSV|客服|聊天|会议|语音|文档|PDF|资料|知识库|清单/)
  },
  {
    id: "low-risk",
    label: "低风险先试",
    title: "低风险先试：只碰整理、改写、清单，不碰承诺结果",
    description: "适合先做手工交付或半自动服务。避开医疗、法律、金融、隐私采集和平台违规承诺，先验证用户愿不愿意交素材。",
    match: (item) => riskProfile(item).level === "低"
  }
];

const elements = {
  totalCount: document.querySelector("#totalCount"),
  averageScore: document.querySelector("#averageScore"),
  hotCount: document.querySelector("#hotCount"),
  topInput: document.querySelector("#topInput"),
  signalCount: document.querySelector("#signalCount"),
  focusTitle: document.querySelector("#focusTitle"),
  focusDescription: document.querySelector("#focusDescription"),
  segmentChips: document.querySelector("#segmentChips"),
  coverageMetric: document.querySelector("#coverageMetric"),
  coverageText: document.querySelector("#coverageText"),
  strongestSignalTitle: document.querySelector("#strongestSignalTitle"),
  strongestSignalText: document.querySelector("#strongestSignalText"),
  debtMetric: document.querySelector("#debtMetric"),
  debtText: document.querySelector("#debtText"),
  validationDeck: document.querySelector("#validationDeck"),
  briefOutput: document.querySelector("#briefOutput"),
  briefTitle: document.querySelector("#briefTitle"),
  briefText: document.querySelector("#briefText"),
  inputMix: document.querySelector("#inputMix"),
  signalList: document.querySelector("#signalList"),
  grid: document.querySelector("#opportunityGrid"),
  lanes: document.querySelector("#lanes"),
  search: document.querySelector("#searchInput"),
  category: document.querySelector("#categoryFilter"),
  source: document.querySelector("#sourceFilter"),
  evidence: document.querySelector("#evidenceFilter"),
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

function textBlob(item) {
  return [
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
  ].join(" ");
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

function signalStats(item) {
  const linked = signals.filter((signal) => signal.linked_opportunity === item.id);
  const averageConfidence = linked.length
    ? linked.reduce((sum, signal) => sum + signal.confidence, 0) / linked.length
    : 0;

  return {
    count: linked.length,
    averageConfidence
  };
}

function evidenceTier(item) {
  const stats = signalStats(item);
  if (stats.count > 0) return "signal-backed";
  if (item.landing_score >= 80) return "evidence-debt";
  return "seed-only";
}

function evidenceLabel(item) {
  const labels = {
    "signal-backed": "有信号",
    "evidence-debt": "缺证据",
    "seed-only": "种子假设"
  };
  return labels[evidenceTier(item)];
}

function riskProfile(item) {
  const blob = textBlob(item);
  const highRisk = /医疗|法律|金融|保险|理赔|诊断|投资|借贷|学术\/考试作弊|考试作弊/.test(blob);
  const mediumRisk = /隐私|身份证|手机号|地址|简历|聊天截图|聊天记录|名单|录音|宠物就诊|差评|招聘/.test(blob);

  if (highRisk) {
    return {
      level: "高",
      className: "risk-high",
      boundary: "只做资料整理和问题清单，不给诊断、法律、金融或结果承诺。"
    };
  }

  if (mediumRisk) {
    return {
      level: "中",
      className: "risk-mid",
      boundary: "先提醒打码和授权，只处理用户自己提供、自己有权处理的内容。"
    };
  }

  return {
    level: "低",
    className: "risk-low",
    boundary: "只承诺整理、改写、清单或样例，不承诺涨粉、成交、收益或平台效果。"
  };
}

function segmentPriorityBoost(item, segmentId) {
  const blob = textBlob(item);

  if (segmentId === "edu") {
    const opsFit = /家长|老师|助教|课程|机构|托管|报名|资料包|学习社群|班主任|绘本馆/.test(blob);
    const adminFit = /报名|接龙|名单|家长群|通知|资料包|客服|知识库|助教|作业|课程表/.test(blob);
    const marketingTilt = /直播|带货|小红书招聘|爆款|短视频/.test(blob);
    return (opsFit ? 12 : 0) + (adminFit ? 16 : 0) - (marketingTilt ? 24 : 0);
  }

  if (segmentId === "local") {
    return /报价|价目|门店|维修|家政|餐饮|美甲|物业|本地/.test(blob) ? 8 : 0;
  }

  if (segmentId === "ops") {
    return /表格|名单|客服|会议|语音|文档|资料|知识库|清单/.test(blob) ? 8 : 0;
  }

  if (segmentId === "low-risk") {
    return riskProfile(item).level === "低" ? 6 : 0;
  }

  return 0;
}

function priorityScore(item, segmentId = activeSegment) {
  const stats = signalStats(item);
  const risk = riskProfile(item);
  const riskPenalty = risk.level === "高" ? 12 : risk.level === "中" ? 5 : 0;
  return (
    item.landing_score +
    item.scores.payment * 3 +
    item.scores.mvp_speed * 2 +
    stats.count * 4 +
    stats.averageConfidence * 2 -
    riskPenalty +
    segmentPriorityBoost(item, segmentId)
  );
}

function compactText(value, max = 36) {
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function validationPlan(item) {
  const kind = inputKind(`${item.input} ${item.output}`);
  const output = item.output.split(/[、，]/).slice(0, 2).join(" + ");
  const sampleByKind = {
    评论: "拿 50-100 条评论或截图做 1 份样例报告。",
    图片: "拿 3 张真实图片做 1 份可复制交付。",
    语音: "拿 1 段 3-10 分钟转写文本做清单。",
    表格: "拿 1 个真实表格或接龙截图做清洗样例。",
    文档: "拿 1 份文档或目录做结构化样例。",
    聊天: "拿 1 段打码聊天记录做回复或总结。",
    文本: "拿 1 段真实文本做前后对比。"
  };

  return {
    pitch: `我可以把「${compactText(item.input)}」整理成「${compactText(output)}」，先做 1 份样例给你看。`,
    firstMove: sampleByKind[kind] || sampleByKind["文本"],
    pass: "24 小时内有 3 人愿意发素材，或 1 人愿意为样例继续付费。",
    boundary: riskProfile(item).boundary
  };
}

function validationBrief(item) {
  const plan = validationPlan(item);
  const risk = riskProfile(item);
  const stats = signalStats(item);
  return [
    `【AI 小产品验证】${item.title}`,
    "",
    `目标用户：${item.target_user}`,
    `用户场景：${item.user_scene}`,
    `输入：${item.input}`,
    `输出：${item.output}`,
    "",
    `验证话术：${plan.pitch}`,
    `第一步：${plan.firstMove}`,
    `通过标准：${plan.pass}`,
    `风险边界：${plan.boundary}`,
    "",
    `落地分：${item.landing_score}/100`,
    `证据：${stats.count ? `${stats.count} 条需求信号` : "暂无真实信号，需要先补证据"}`,
    `风险：${risk.level}`,
    `MVP：${item.mvp_scope}`,
    `收费假设：${item.charge_model}`
  ].join("\n");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Fall through to the textarea copy path. Some embedded browsers expose
      // the Clipboard API but still block writes without a focused editable.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy command was rejected.");
}

async function copyBriefFromButton(button) {
  const item = opportunities.find((opportunity) => opportunity.id === button.dataset.copyBrief);
  if (!item) return;

  const originalText = button.textContent;
  const brief = validationBrief(item);
  elements.briefOutput.hidden = false;
  elements.briefTitle.textContent = item.title;
  elements.briefText.value = brief;
  button.disabled = true;

  try {
    await copyText(brief);
    button.textContent = "已复制";
  } catch (error) {
    button.textContent = "已生成";
    elements.briefText.focus();
    elements.briefText.select();
  }

  window.setTimeout(() => {
    button.disabled = false;
    button.textContent = originalText;
  }, 1400);
}

function bindCopyButtons() {
  for (const button of document.querySelectorAll("[data-copy-brief]")) {
    button.addEventListener("click", () => copyBriefFromButton(button));
  }
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
  const haystack = textBlob(item).toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function sortItems(items, sort) {
  return [...items].sort((a, b) => {
    if (sort === "score") return b.landing_score - a.landing_score;
    if (sort === "mvp") return b.scores.mvp_speed - a.scores.mvp_speed || b.landing_score - a.landing_score;
    if (sort === "payment") return b.scores.payment - a.scores.payment || b.landing_score - a.landing_score;
    if (sort === "frequency") return b.scores.frequency - a.scores.frequency || b.landing_score - a.landing_score;
    return 0;
  });
}

function getBaseFiltered() {
  const query = elements.search.value.trim();
  const category = elements.category.value;
  const source = elements.source.value;
  const evidence = elements.evidence.value;

  return opportunities
    .filter((item) => includesQuery(item, query))
    .filter((item) => category === "all" || item.category === category)
    .filter((item) => source === "all" || item.signal_sources.includes(source))
    .filter((item) => evidence === "all" || evidenceTier(item) === evidence);
}

function getFiltered() {
  const sort = elements.sort.value;
  const segment = focusSegments.find((item) => item.id === activeSegment) || focusSegments[0];
  return sortItems(getBaseFiltered().filter((item) => segment.match(item)), sort);
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

function renderFocusSystem(baseItems) {
  const active = focusSegments.find((segment) => segment.id === activeSegment) || focusSegments[0];
  elements.focusTitle.textContent = active.title;
  elements.focusDescription.textContent = active.description;

  elements.segmentChips.innerHTML = focusSegments
    .map((segment) => {
      const count = baseItems.filter((item) => segment.match(item)).length;
      return `
        <button class="focus-chip ${segment.id === activeSegment ? "is-active" : ""}" type="button" data-segment="${segment.id}">
          <span>${escapeHtml(segment.label)}</span>
          <strong>${count}</strong>
        </button>
      `;
    })
    .join("");

  for (const button of elements.segmentChips.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      activeSegment = button.dataset.segment;
      render();
    });
  }
}

function renderEvidenceBoard(items) {
  const ids = new Set(items.map((item) => item.id));
  const backed = items.filter((item) => signalStats(item).count > 0);
  const debts = items
    .filter((item) => evidenceTier(item) === "evidence-debt")
    .sort((a, b) => b.landing_score - a.landing_score);
  const activeSignals = signals
    .filter((signal) => ids.has(signal.linked_opportunity))
    .sort((a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id));
  const strongest = activeSignals[0];
  const strongestOpportunity = strongest
    ? opportunities.find((item) => item.id === strongest.linked_opportunity)
    : null;

  elements.coverageMetric.textContent = `${backed.length}/${items.length}`;
  elements.coverageText.textContent = items.length
    ? `${Math.round((backed.length / items.length) * 100)}% 的当前机会有至少 1 条需求信号。`
    : "当前筛选下没有机会。";

  elements.strongestSignalTitle.textContent = strongestOpportunity ? strongestOpportunity.title : "-";
  elements.strongestSignalText.textContent = strongest
    ? `${strongest.platform} / confidence ${strongest.confidence}：${strongest.pain_signal}`
    : "当前筛选下没有匹配的需求信号。";

  elements.debtMetric.textContent = debts.length;
  elements.debtText.textContent = debts.length
    ? debts
        .slice(0, 3)
        .map((item) => item.title)
        .join(" / ")
    : "没有高分缺证据机会。";
}

function renderValidationDeck(items) {
  const shortlist = [...items].sort((a, b) => priorityScore(b) - priorityScore(a)).slice(0, 3);

  elements.validationDeck.innerHTML = shortlist.length
    ? shortlist
        .map((item, index) => {
          const plan = validationPlan(item);
          const risk = riskProfile(item);
          const stats = signalStats(item);
          return `
            <article class="validation-card">
              <div class="validation-rank">0${index + 1}</div>
              <div>
                <div class="validation-headline">
                  <span class="risk-pill ${risk.className}">风险 ${risk.level}</span>
                  <span>${stats.count ? `${stats.count} 条信号` : "种子假设"}</span>
                </div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(plan.pitch)}</p>
              </div>
              <div class="validation-steps">
                <div><b>第一步</b><p>${escapeHtml(plan.firstMove)}</p></div>
                <div><b>通过标准</b><p>${escapeHtml(plan.pass)}</p></div>
              </div>
              <button class="copy-brief" type="button" data-copy-brief="${escapeHtml(item.id)}">复制验证 Brief</button>
            </article>
          `;
        })
        .join("")
    : `<div class="empty slim">当前筛选下没有可验证机会</div>`;
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
    .map((item) => {
      const risk = riskProfile(item);
      const stats = signalStats(item);
      const plan = validationPlan(item);
      return `
        <article class="card">
          <div class="card-head">
            <div>
              <div class="card-badges">
                <span class="status">${escapeHtml(item.status)}</span>
                <span class="risk-pill ${risk.className}">风险 ${risk.level}</span>
                <span class="signal-pill">${stats.count ? `${stats.count} signals` : "seed"}</span>
                <span class="evidence-pill">${escapeHtml(evidenceLabel(item))}</span>
              </div>
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
          <div class="decision-strip">
            <div><b>验证话术</b><p>${escapeHtml(plan.pitch)}</p></div>
            <div><b>先试动作</b><p>${escapeHtml(plan.firstMove)}</p></div>
            <div><b>边界</b><p>${escapeHtml(plan.boundary)}</p></div>
          </div>
          <div class="score-bars">${renderScores(item.scores)}</div>
          <p><strong>产品形态：</strong>${escapeHtml(item.ai_product)}</p>
          <p><strong>收费：</strong>${escapeHtml(item.charge_model)}</p>
          <div class="tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <button class="copy-brief compact" type="button" data-copy-brief="${escapeHtml(item.id)}">复制验证 Brief</button>
        </article>
      `;
    })
    .join("");
}

function render() {
  const baseItems = getBaseFiltered();
  const items = getFiltered();
  renderFocusSystem(baseItems);
  summarize(items);
  renderEvidenceBoard(items);
  renderValidationDeck(items);
  renderLanes(items);
  renderSignalBoard(items);
  renderCards(items);
  bindCopyButtons();
}

fillFilters();
render();

for (const element of [elements.search, elements.category, elements.source, elements.evidence, elements.sort]) {
  element.addEventListener("input", render);
}
