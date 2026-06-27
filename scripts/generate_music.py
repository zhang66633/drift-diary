"""
MusicGen 背景音乐生成脚本
用于为冒险游戏生成不同氛围的背景音乐

使用方法:
  python scripts/generate_music.py --model facebook/musicgen-small --all
  python scripts/generate_music.py --model facebook/musicgen-small --name harbor
  python scripts/generate_music.py --list
"""

import argparse
import os
import sys
import torch
import torchaudio
from pathlib import Path


MUSIC_PRESETS = {
    "main_theme": {
        "description": "adventure game main theme, nostalgic piano with soft strings, gentle melody, hopeful yet melancholic, 18th century seafaring vibe, cinematic ambient",
        "duration": 30,
        "bpm": 72,
    },
    "harbor": {
        "description": "peaceful harbor town, soft accordion and acoustic guitar, seagulls distant, warm sunny day, medieval port town, relaxing folk ambient",
        "duration": 30,
        "bpm": 80,
    },
    "ship": {
        "description": "calm ocean voyage, gentle waves, soft woodwind and strings, meditative seafaring, peaceful sailing, slow ambient",
        "duration": 30,
        "bpm": 65,
    },
    "storm": {
        "description": "intense storm at sea, dramatic orchestral, thunder and rain, tense and dangerous, dark cinematic, ship in peril",
        "duration": 30,
        "bpm": 100,
    },
    "island": {
        "description": "mysterious tropical island, exotic percussion and flute, lush jungle atmosphere, curious and adventurous, natural ambient",
        "duration": 30,
        "bpm": 85,
    },
    "tense": {
        "description": "tense decision making, suspenseful ambient, low pulsing strings, psychological pressure, moral dilemma, dramatic underscore",
        "duration": 30,
        "bpm": 60,
    },
    "dream": {
        "description": "surreal dream sequence, ethereal ambient, distant chimes and pads, hazy mysterious, floating subconscious atmosphere",
        "duration": 30,
        "bpm": 50,
    },
    "ending_sad": {
        "description": "sad tragic ending, sorrowful piano solo, emotional lament, regret and loss, melancholic cinematic, slow and gentle",
        "duration": 45,
        "bpm": 58,
    },
    "ending_hope": {
        "description": "hopeful bittersweet ending, warm strings and piano, uplifting yet reflective, new beginning, emotional resolution, cinematic",
        "duration": 45,
        "bpm": 70,
    },
}


def list_presets():
    print("可用的音乐预设：\n")
    for name, preset in MUSIC_PRESETS.items():
        print(f"  {name:15s}  {preset['duration']}s  {preset['description'][:60]}...")
    print()


def generate_music(model, name, output_dir):
    from audiocraft.models import MusicGen
    from audiocraft.data.audio import audio_write

    preset = MUSIC_PRESETS.get(name)
    if not preset:
        print(f"错误: 找不到预设 '{name}'")
        print(f"可用预设: {', '.join(MUSIC_PRESETS.keys())}")
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"使用设备: {device}")
    if device == "cuda":
        print(f"GPU: {torch.cuda.get_device_name(0)}")
        print(f"显存: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

    print(f"\n加载模型: {model} ...")
    musicgen = MusicGen.get_pretrained(model)
    musicgen.to(device)
    musicgen.set_generation_params(duration=preset["duration"])

    description = preset["description"]
    print(f"\n生成中: {name}")
    print(f"描述: {description}")
    print(f"时长: {preset['duration']}秒")

    wav = musicgen.generate([description])
    wav = wav.cpu()

    output_path = output_dir / f"{name}.wav"
    audio_write(
        str(output_path),
        wav[0],
        musicgen.sample_rate,
        strategy="loudness",
        loudness_compressor=True,
    )
    print(f"\n已保存: {output_path}")


def generate_all(model, output_dir):
    for name in MUSIC_PRESETS:
        print(f"\n{'='*60}")
        print(f"生成: {name}")
        print(f"{'='*60}")
        try:
            generate_music(model, name, output_dir)
        except Exception as e:
            print(f"生成 {name} 失败: {e}")
            continue
        torch.cuda.empty_cache()


def main():
    parser = argparse.ArgumentParser(description="MusicGen 背景音乐生成器")
    parser.add_argument(
        "--model",
        type=str,
        default="facebook/musicgen-small",
        help="模型名称 (默认: facebook/musicgen-small)\n"
             "可选: facebook/musicgen-small, facebook/musicgen-medium, facebook/musicgen-large",
    )
    parser.add_argument(
        "--name",
        type=str,
        help="生成单个预设的音乐 (如: harbor, island)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="生成所有预设音乐",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="列出所有可用预设",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="public/audio/bgm",
        help="输出目录 (默认: public/audio/bgm)",
    )
    args = parser.parse_args()

    if args.list:
        list_presets()
        return

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.all:
        generate_all(args.model, output_dir)
    elif args.name:
        generate_music(args.model, args.name, output_dir)
    else:
        parser.print_help()
        print("\n示例:")
        print("  python scripts/generate_music.py --list")
        print("  python scripts/generate_music.py --name harbor")
        print("  python scripts/generate_music.py --all --model facebook/musicgen-small")


if __name__ == "__main__":
    main()
