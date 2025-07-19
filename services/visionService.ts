import { OCR_CONFIG, VISION_API_ENDPOINT } from '../config/api';

interface OCRResult {
  text: string;
  confidence: number;
}

// OCR処理を実行する関数
export async function performOCR(base64Image: string): Promise<OCRResult[]> {
  try {
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: OCR_CONFIG.featureType,
              maxResults: OCR_CONFIG.maxResults,
            },
          ],
        },
      ],
    };

    const response = await fetch(VISION_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vision API Error:', errorText);
      throw new Error(
        `Vision API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (
      data.responses &&
      data.responses[0] &&
      data.responses[0].textAnnotations
    ) {
      const annotations = data.responses[0].textAnnotations;

      // 最初の要素は全体のテキストなので、それを文章として使用
      if (annotations.length > 0) {
        const fullText = annotations[0].description;
        return [
          {
            text: fullText,
            confidence: 1.0, // 全体テキストの場合は信頼度を1.0とする
          },
        ];
      }

      return [];
    } else {
      return [];
    }
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}
