"""
将生成的 WAV 音乐转换为 MP3 格式
需要安装 ffmpeg
"""

import subprocess
from pathlib import Path


def convert_wav_to_mp3(input_dir="public/audio/bgm", bitrate="128k"):
    input_path = Path(input_dir)
    wav_files = list(input_path.glob("*.wav"))

    if not wav_files:
        print(f"在 {input_dir} 中没有找到 WAV 文件")
        return

    print(f"找到 {len(wav_files)} 个 WAV 文件\n")

    for wav_file in wav_files:
        mp3_file = wav_file.with_suffix(".mp3")
        print(f"转换: {wav_file.name} -> {mp3_file.name}")

        result = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i", str(wav_file),
                "-b:a", bitrate,
                "-codec:a", "libmp3lame",
                str(mp3_file),
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            print(f"  ✓ 完成 ({mp3_file.stat().st_size / 1024:.1f} KB)")
        else:
            print(f"  ✗ 失败: {result.stderr[:200]}")


if __name__ == "__main__":
    convert_wav_to_mp3()
