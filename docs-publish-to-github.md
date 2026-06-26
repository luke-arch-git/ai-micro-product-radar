# Publish To GitHub

这是一份把本项目发布成 GitHub 开源仓库的最短流程。

## 方式一：GitHub 网页发布

适合不想装命令行工具的人。

1. 打开 GitHub，点击右上角 `+`，选择 `New repository`。
2. 仓库名建议用 `ai-micro-product-radar`。
3. 选择 `Public`。
4. 不要勾选 `Add a README file`，因为本项目已经有 README。
5. 创建仓库后，进入仓库页面的 `uploading an existing file`。
6. 上传本项目目录里的全部文件。
7. 提交信息写：`Initial release`。

本地项目目录：

```text
/Users/vencentw/Documents/Codex/2026-06-26/wo-x/outputs/ai-micro-product-radar
```

## 方式二：命令行发布

适合以后持续更新。

先安装 GitHub CLI：

```bash
brew install gh
gh auth login
```

然后在项目目录运行：

```bash
git remote add origin https://github.com/YOUR_NAME/ai-micro-product-radar.git
git push -u origin main
```

把 `YOUR_NAME` 换成你的 GitHub 用户名。

## 开启 GitHub Pages

发布后可以把网页公开出来：

1. 进入仓库 `Settings`。
2. 打开 `Pages`。
3. Source 选择 `GitHub Actions`。
4. 回到仓库的 `Actions` 页面。
5. 等 `Deploy site to GitHub Pages` 工作流跑完。

之后访问地址通常是：

```text
https://YOUR_NAME.github.io/ai-micro-product-radar/
```

## 首次发布前建议

- 确认 `data/opportunities.json` 里的机会都是种子假设，不要宣传成已验证。
- 如果要中文传播，可以把仓库描述写成：`发现能被 AI 做成小产品的真实微需求雷达`。
- 如果要英文传播，可以写成：`A radar for tiny AI product opportunities backed by real user pain signals`。
