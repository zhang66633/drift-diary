# 背景音乐生成指南

使用 Meta Audiocraft (MusicGen) 生成游戏背景音乐。

## 硬件要求

- **GPU**: NVIDIA RTX 5060 8GB (或更好)
- **RAM**: 16GB+
- **磁盘**: 10GB+ 可用空间 (模型文件)

## 安装步骤

### 1. 创建 Python 虚拟环境

```bash
python -m venv venv
venv\Scripts\activate  # Windows
# 或
source venv/bin/activate  # Linux/Mac
```

### 2. 安装 PyTorch (支持 CUDA)

RTX 5060 是 sm_120 架构，需要使用较新版本的 PyTorch：

```bash
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
```

验证 GPU 是否可用：

```bash
python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0))"
```

如果显示 `True` 和 GPU 型号则成功。

### 3. 安装 Audiocraft

```bash
pip install audiocraft
```

### 4. 安装 ffmpeg (用于 MP3 转换)

- Windows: 从 https://ffmpeg.org/download.html 下载并添加到 PATH
- Linux: `sudo apt install ffmpeg`
- Mac: `brew install ffmpeg`

## 使用方法

### 列出所有预设

```bash
python scripts/generate_music.py --list
```

### 生成单首音乐

```bash
python scripts/generate_music.py --name harbor
```

### 生成所有音乐

```bash
python scripts/generate_music.py --all
```

### 使用更大的模型 (质量更好，更慢)

```bash
python scripts/generate_music.py --name harbor --model facebook/musicgen-medium
```

### 转换为 MP3

```bash
python scripts/convert_music_to_mp3.py
```

## 音乐预设说明

| 名称 | 描述 | 时长 | 适用场景 |
|------|------|------|---------|
| main_theme | 冒险主题，怀旧钢琴+弦乐 | 30s | 主菜单 / 默认 |
| harbor | 港口小镇，手风琴+吉他 | 30s | 港口场景 |
| ship | 平静航行，木管+弦乐 | 30s | 海上场景 |
| storm | 风暴，紧张管弦乐 | 30s | 风暴场景 |
| island | 神秘海岛，打击乐+长笛 | 30s | 荒岛场景 |
| tense | 紧张抉择，低沉弦乐 | 30s | 抉择/紧张场景 |
| dream | 梦境，空灵氛围 | 30s | 梦境场景 |
| ending_sad | 悲伤结局，钢琴独奏 | 45s | 坏结局 |
| ending_hope | 希望结局，温暖弦乐 | 45s | 好结局 |

## 显存占用参考

| 模型 | 显存占用 | 生成速度 | 推荐 |
|------|---------|---------|------|
| musicgen-small | ~2GB | 快 | ✅ 推荐 8GB 显存 |
| musicgen-medium | ~4GB | 中 | ⚠️ 8GB 可尝试 |
| musicgen-large | ~8GB+ | 慢 | ❌ 8GB 不够 |

## 在游戏中使用

在场景 JSON 的 `audio` 字段中添加 `bgm`：

```json
{
  "id": "ch2_16_荒岛",
  "audio": {
    "ambient": "island",
    "bgm": "island"
  }
}
```

## 常见问题

### 1. CUDA out of memory

- 改用 `musicgen-small` 模型
- 减少生成时长
- 关闭其他占用显存的程序

### 2. 生成速度慢

- 首次运行需要下载模型 (~1.5GB)
- 30秒音乐在 RTX 5060 上大约需要 10-30 秒

### 3. 音乐质量不好

- 尝试调整描述词
- 使用 `musicgen-medium` 模型
- 可以多次生成选最好的
