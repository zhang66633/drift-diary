# 鲁滨孙漂流记 · 文字冒险

> "冥冥之中自有凌驾于一切之上的天意，催逼着我们去毁灭自己。"

基于笛福《鲁滨孙漂流记》改编的互动文字冒险游戏。在命运与选择之间，亲历一段荒岛求生的传奇旅程。

**🌐 在线游玩**  
[Cloudflare Pages](https://drift-diary.pages.dev) ｜ [Vercel](https://drift-diary.vercel.app) ｜ [GitHub Pages](https://zhang66633.github.io/drift-diary/)

---

## 游戏简介

你将扮演鲁滨孙·克鲁索，从赫尔港出走开始，经历风暴、沉船、荒岛求生，直到最终归途。每一次选择都会影响你的命运——健康、精神、物资、技能、天意，五项属性构成生存的基石。

- 🌊 **28+ 场景**，跨越两章
- 🎯 **分支选择**与**多选系统**，你的决定改变故事走向
- 📜 **多重结局**——迷途知返、宁死不屈、大海迷失、饥饿而死……
- 🎵 **沉浸式配乐**——HTML5 Audio 流式播放，点击即听
- 🖼️ **结局插图**——解锁结局后在「终点」中欣赏放大
- 📖 **存档系统**——手动存档/读档 + 自动存档
- 🗺️ **航程回顾**——重读已走过的每一页
- 🏆 **结局收录**——收集你解锁的每一个终点

## 技术栈

| 技术 | 用途 |
|------|------|
| [React 18](https://react.dev/) | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vite 5](https://vitejs.dev/) | 构建工具 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 状态管理 |
| [Tailwind CSS 3](https://tailwindcss.com/) | 样式系统 |
| [Zod](https://zod.dev/) | 章节数据校验 |
| HTML5 Audio + Web Audio API | 音频引擎 |

## 部署

同时部署在三个平台，代码推送后自动构建：

| 平台 | 地址 | 国内访问 |
|------|------|----------|
| Cloudflare Pages | `drift-diary.pages.dev` | ✅ 可访问 |
| Vercel | `drift-diary.vercel.app` | ❌ 受限 |
| GitHub Pages | `zhang66633.github.io/drift-diary/` | ✅ 可访问 |

## 本地开发

```bash
git clone https://github.com/zhang66633/drift-diary.git
cd drift-diary
npm install
npm run dev        # 开发服务器
npm run build      # 生产构建
npm run preview    # 预览构建结果
```

## 项目结构

```
├── public/
│   └── audio/
│       ├── bgm/              # 背景音乐（9 首 MP3）
│       └── sfx/              # 音效（翻页声）
├── src/
│   ├── data/chapters/        # 章节数据（JSON）
│   ├── engine/               # 游戏引擎
│   │   ├── SceneManager.ts    # 场景管理 + 懒加载
│   │   ├── StateManager.ts    # 五属性双轨系统
│   │   ├── FlagManager.ts     # 标记系统
│   │   ├── ProvidenceEngine.ts # 天意系统
│   │   ├── ConsequenceEngine.ts # 后果执行引擎
│   │   ├── AudioManager.ts    # HTML5 Audio + Web Audio
│   │   └── SaveManager.ts     # 存档管理（localStorage）
│   ├── store/                # Zustand 状态
│   ├── types/                # TypeScript 类型
│   └── ui/                   # React 组件
├── index.html
├── vite.config.ts
├── vercel.json
└── package.json
```

## 特别说明

- **首次访问**会显示「触碰海风，翻开故事」提示——点击任意位置即可激活音频（浏览器安全策略要求）
- `Ctrl+Shift+D` 开启调试模式，查看内部状态
- BGM 默认统一为主旋律，特殊场景（战斗/遇险/抉择/结局）保留专属配乐

## 许可证

MIT License
