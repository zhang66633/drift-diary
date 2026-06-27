# 鲁滨孙漂流记 · 文字冒险

> "冥冥之中自有凌驾于一切之上的天意，催逼着我们去毁灭自己。"

基于笛福《鲁滨孙漂流记》改编的互动文字冒险游戏。在命运与选择之间，亲历一段荒岛求生的传奇旅程。

**🎮 [开始游戏](https://zhang66633.github.io/drift-diary/)**

---

## 游戏简介

你将扮演鲁滨孙·克鲁索，从赫尔港出走开始，经历风暴、沉船、荒岛求生、与星期五的相遇，直到最终归途。每一次选择都会影响你的命运——健康、精神、物资、技能、天意，五项属性构成生存的基石。

- 🌊 **28+ 场景**，跨越多个章节
- 🎯 **分支选择**与**多选系统**，你的决定改变故事走向
- 📜 **多重结局**——安分守己、客死他乡、孤独终老……
- 🎵 **沉浸式配乐**——9 首 Pixabay 免费音乐，随场景变换
- 📖 **存档系统**——随时存档/读档，自动存档保驾护航
- 🗺️ **航程回顾**——重读已走过的场景
- 🏆 **结局收录**——收集你解锁的每一个结局

## 技术栈

| 技术 | 用途 |
|------|------|
| [React 18](https://react.dev/) | UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vite 5](https://vitejs.dev/) | 构建工具 |
| [Zustand](https://zustand-demo.pmnd.rs/) | 状态管理 |
| [Tailwind CSS 3](https://tailwindcss.com/) | 样式系统 |
| [Zod](https://zod.dev/) | 数据校验 |
| [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | 音频引擎 |

## 本地开发

```bash
# 克隆仓库
git clone https://github.com/zhang66633/drift-diary.git
cd drift-diary

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
├── public/
│   ├── audio/
│   │   ├── bgm/          # 背景音乐（9 首）
│   │   └── sfx/          # 音效（翻页声等）
│   └── illustrations/    # 场景插图
├── src/
│   ├── data/
│   │   └── chapters/     # 章节数据（JSON）
│   ├── engine/           # 游戏引擎
│   │   ├── SceneManager   # 场景管理 + 懒加载
│   │   ├── StateManager   # 属性系统（5属性双轨）
│   │   ├── FlagManager    # 标记系统
│   │   ├── ProvidenceEngine # 天意系统
│   │   ├── ConsequenceEngine # 后果执行
│   │   ├── AudioManager   # Web Audio 音频引擎
│   │   └── SaveManager    # 存档管理
│   ├── store/            # Zustand 状态
│   ├── types/            # TypeScript 类型定义
│   └── ui/               # React 组件
├── index.html
├── vite.config.ts
└── package.json
```

## 许可证

MIT License

---

