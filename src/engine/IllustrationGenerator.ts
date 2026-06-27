/**
 * IllustrationGenerator — 封装火山引擎 Seedream API 图像生成。
 *
 * 使用 @volcengine/ark-runtime SDK，模型 doubao-seedream-5-0-260128。
 * API Key 通过构造函数传入或从环境变量 ARK_API_KEY 读取。
 */

import { ArkRuntimeClient } from '@volcengine/ark-runtime';
import type { IllustrationSize } from '../types/scene';

// 运行时导入类型（SDK 导出这些类型，但 TypeScript 路径需要从入口解析）
import type {
  GenerateImagesRequest as _GenerateImagesRequest,
  ImagesResponse as _ImagesResponse,
} from '@volcengine/ark-runtime';

type GenerateImagesRequest = _GenerateImagesRequest;
type ImagesResponse = _ImagesResponse;

// Seedream 5.0 最低要求 3,686,400 像素（1920×1920）
const SIZE_MAP: Record<IllustrationSize, string> = {
  square_hd: '2048x2048',
  square: '1920x1920',
  portrait_4_3: '1920x2560',
  portrait_16_9: '1920x3360',
  landscape_4_3: '2560x1920',
  landscape_16_9: '2560x1440',
};

export interface GeneratedImage {
  /** Base64 编码的图像数据 */
  base64: string;
  /** 图像 URL（response_format=url 时有效） */
  url?: string;
  /** 实际生成的尺寸 */
  size: string;
}

export interface GenerationOptions {
  /** 提示词优化：auto/enabled/disabled */
  optimizePrompt?: 'auto' | 'enabled' | 'disabled';
  /** 随机种子 */
  seed?: number;
  /** 是否添加水印 */
  watermark?: boolean;
  /** 输出格式 */
  outputFormat?: 'jpeg' | 'png';
}

export class IllustrationGenerator {
  private client: ArkRuntimeClient;
  private model: string;
  private defaultFormat: 'b64_json' | 'url';

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || (typeof process !== 'undefined' ? process.env.ARK_API_KEY : undefined);
    if (!key) {
      throw new Error(
        'IllustrationGenerator: API key is required. Pass it to the constructor or set ARK_API_KEY environment variable.'
      );
    }
    this.client = ArkRuntimeClient.withApiKey(key, {
      // 图像生成可能需要较长时间，增加超时
      timeout: 120000,
    });
    this.model = model || 'doubao-seedream-4-5-251128';
    this.defaultFormat = 'b64_json';
  }

  /**
   * 生成单张图像
   * @param prompt - 英文提示词
   * @param size - 图像尺寸（IllustrationSize 或自定义尺寸字符串）
   * @param opts - 可选参数
   * @returns GeneratedImage
   */
  async generateImage(
    prompt: string,
    size: IllustrationSize | string = 'portrait_4_3',
    opts?: GenerationOptions
  ): Promise<GeneratedImage> {
    const sizeStr = SIZE_MAP[size as IllustrationSize] || size;

    const request: GenerateImagesRequest = {
      model: this.model,
      prompt,
      size: sizeStr,
      response_format: this.defaultFormat,
      watermark: opts?.watermark ?? false,
      optimize_prompt: opts?.optimizePrompt === 'disabled' ? false : true,
      output_format: opts?.outputFormat,
      seed: opts?.seed,
    };

    const response: ImagesResponse = await this.client.generateImages(request);

    if (response.error) {
      throw new Error(
        `Seedream API error: ${response.error.code} - ${response.error.message}`
      );
    }

    const image = response.data[0];
    if (!image) {
      throw new Error('Seedream API returned no images');
    }

    return {
      base64: image.b64_json || '',
      url: image.url,
      size: image.size,
    };
  }

  /**
   * 生成多张图像（最多 sequential_image_generation_options.max_images 张）
   * @param prompt - 英文提示词
   * @param count - 生成数量
   * @param size - 图像尺寸
   * @param opts - 可选参数
   * @returns GeneratedImage[]
   */
  async generateImages(
    prompt: string,
    count: number = 2,
    size: IllustrationSize | string = 'portrait_4_3',
    opts?: GenerationOptions
  ): Promise<GeneratedImage[]> {
    const sizeStr = SIZE_MAP[size as IllustrationSize] || size;

    const request: GenerateImagesRequest = {
      model: this.model,
      prompt,
      size: sizeStr,
      response_format: this.defaultFormat,
      watermark: opts?.watermark ?? false,
      optimize_prompt: opts?.optimizePrompt === 'disabled' ? false : true,
      output_format: opts?.outputFormat,
      seed: opts?.seed,
      sequential_image_generation: count > 1 ? 'auto' : 'disabled',
      sequential_image_generation_options:
        count > 1 ? { max_images: count } : undefined,
    };

    const response: ImagesResponse = await this.client.generateImages(request);

    if (response.error) {
      throw new Error(
        `Seedream API error: ${response.error.code} - ${response.error.message}`
      );
    }

    return response.data.map((image) => ({
      base64: image.b64_json || '',
      url: image.url,
      size: image.size,
    }));
  }

  /**
   * 便捷工厂方法：使用 API Key 创建实例
   */
  static withApiKey(apiKey: string, model?: string): IllustrationGenerator {
    return new IllustrationGenerator(apiKey, model);
  }
}
