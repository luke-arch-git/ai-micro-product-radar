# AI Micro Product Radar

发现能被 AI 做成小产品的真实需求，不限行业，只看能否落地。

这个仓库不是 AI 工具大全，也不是创业点子清单。它记录的是社交平台、评论区、工作流、微信群、后台系统里反复出现的小麻烦：有人已经在手动解决，有明确输入和输出，AI 现在可以把它压成一个很小的产品。

## 两层数据

这个项目把“需求信号”和“产品机会”分开：

- `data/signals.json`：原始需求信号。比如评论区有人求工具、社群里有人抱怨、用户在找模板或代办。
- `data/github-signals.json`：GitHub 信息差信号。记录开源项目的新能力如何翻译成中文需求和闲鱼服务。
- `data/opportunities.json`：产品化后的机会卡。每张卡都必须写清楚输入、输出、笨办法、MVP 和收费路径。

这样做的好处是：每天先大量收集信号，再把少数高质量信号整理成机会，不会把灵感误当成需求。

## 收录标准

一条机会至少要满足 3 个条件：

- 有明确输入，比如截图、照片、语音、聊天记录、评论、PDF、表格。
- 有明确输出，比如回复、清单、报价、总结、分类、话术、提醒。
- 用户现在已经在手动做，或者正在求模板、求工具、求代办。
- MVP 可以在 7 天内做出来。
- 用户看到后能立刻判断是否有用。
- 有潜在收费路径，比如按月订阅、单次处理、模板包、插件、代处理服务。

## 不收什么

- 只有“AI 可以做”，但没有具体用户动作。
- 需要大客户销售或复杂交付。
- 第一版需要完整平台、App、多人协作系统。
- 只有宏大赛道，没有可验证的小场景。
- 没有分发路径，找不到第一批用户。

## 机会卡字段

```json
{
  "id": "mp-001",
  "title": "小红书评论区需求提取器",
  "target_user": "做账号、卖课、卖货的人",
  "signal_sources": ["小红书评论区", "抖音评论区"],
  "input": "评论区文本",
  "output": "高频问题、购买顾虑、可做产品点",
  "current_workaround": "手动翻评论、截图、复制到表格",
  "ai_product": "粘贴评论后自动生成需求洞察报告",
  "mvp_scope": "粘贴 100 条评论，输出需求 Top 10",
  "charge_model": "19-99 元/月",
  "scores": {
    "pain": 4,
    "frequency": 5,
    "ai_fit": 5,
    "mvp_speed": 5,
    "payment": 4,
    "distribution": 4
  }
}
```

评分满分 100，由 6 个维度计算：痛感、频率、AI 适配度、MVP 速度、付费可能、分发路径。

## 项目结构

```text
.
├── data/
│   ├── categories.json
│   ├── github-signals.json
│   ├── opportunities.json
│   └── signals.json
├── methods/
│   ├── scoring-framework.md
│   └── source-mining-playbook.md
├── scripts/
│   └── validate-data.js
├── site/
│   ├── app.js
│   ├── github.html
│   ├── github.js
│   ├── index.html
│   ├── xianyu.html
│   ├── xianyu.js
│   └── styles.css
├── templates/
│   └── daily-signal-log.md
└── .github/
    ├── ISSUE_TEMPLATE/opportunity.yml
    └── workflows/
        ├── pages.yml
        └── validate.yml
```

## 本地查看

直接打开：

```text
site/index.html
```

主雷达支持：

- `Focus Mode`：按教培/机构、本地小商家、内容电商、表格客服文档、低风险先试等方向快速收窄。
- `今日先试 3 个`：根据落地分、信号数量、付费可能、MVP 速度和风险边界自动推荐当天优先验证的机会。
- `验证动作`：每张机会卡都会给出验证话术、第一步样本、通过标准和风险边界。
- `Evidence Board`：显示当前筛选下的信号覆盖率、最强需求信号和高分缺证据机会。
- `验证 Brief`：一键生成可复制的访谈/私聊文本；浏览器不允许写入剪贴板时，会展示可手动复制的文本框。

GitHub 信息差雷达：

```text
site/github.html
```

闲鱼验证页：

```text
site/xianyu.html
```

校验数据并生成网页数据文件：

```bash
npm run validate
```

推到 GitHub 后，`pages.yml` 会把 `site/` 发布成 GitHub Pages。

## 闲鱼验证思路

`site/xianyu.html` 会把机会卡转成可测试的闲鱼服务：标题、测试价、交付物、上架文案和风险提示。

建议只发布窄服务，比如“帮你整理评论区高频问题”“帮你把表格查重清洗”“帮你写差评补救回复”。不要发布自动爬取、外挂、隐私数据处理、保证涨粉成交、医疗法律金融结论等高风险内容。

## GitHub 信息差思路

`site/github.html` 会把 GitHub 开源项目翻译成中文服务机会：项目能力、信息差、中文需求、闲鱼服务和交付边界。

原则是：GitHub 是情报源，不是货源。不要倒卖代码或冒充原创工具；可以卖配置建议、资料整理、教程、流程图、轻量定制和人工交付。

## 每日工作流

1. 去小红书、抖音、Product Hunt、Chrome Web Store、Shopify App Store、Reddit、微信群观察真实抱怨。
2. 只记录出现“有没有工具”“求模板”“谁能帮我”“每次都要手动”“太麻烦了”的场景。
3. 把问题改写成机会卡，写清楚输入、输出、当前笨办法、MVP。
4. 给 6 个维度打分。
5. 每天只留下 1-3 条最可能落地的机会。

## 快速贡献

提交新机会时，不要只写 idea。请至少写清楚：

- 真实用户是谁。
- 他们现在怎么手动解决。
- AI 小产品的输入和输出是什么。
- 第一版 7 天内怎么做。
- 你看到这个需求的来源或证据摘要。

如果只有原始信号，还没想清楚产品形态，可以先按 `templates/daily-signal-log.md` 记录。

## Seed Opportunities

当前数据是项目启动用的“种子假设”，不是已验证商业机会。使用前需要补充真实来源、访谈或付费测试。
