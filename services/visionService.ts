import { OCR_CONFIG, VISION_API_ENDPOINT } from '../config/api';

interface OCRResult {
  text: string;
  confidence: number;
}

interface TextAnnotation {
  description: string;
  boundingPoly?: {
    vertices: { x: number; y: number }[];
  };
  paragraphs?: {
    boundingBox: {
      vertices: { x: number; y: number }[];
    };
    words: {
      boundingBox: {
        vertices: { x: number; y: number }[];
      };
      symbols: {
        text: string;
        confidence: number;
      }[];
    }[];
  }[];
}

// バウンディングボックスの面積を計算する関数
function calculateArea(vertices: { x: number; y: number }[]): number {
  if (vertices.length < 3) return 0;

  // 多角形の面積を計算（靴ひも公式）
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}

// 段落のテキストを抽出する関数
function extractParagraphText(paragraph: any): string {
  if (!paragraph.words) return '';

  const text = paragraph.words
    .map(
      (word: any) => word.symbols.map((symbol: any) => symbol.text).join('') // 単語内の文字は空白なしで結合
    )
    .join(''); // 単語間も空白なしで結合

  // 余分な空白を削除
  return text.replace(/\s+/g, '').trim();
}

// 本文を識別する関数
function identifyMainContent(paragraphs: any[]): string {
  if (paragraphs.length === 0) return '';

  console.log('OCR Debug - Found paragraphs:', paragraphs.length);

  // 各段落の情報をログ出力
  paragraphs.forEach((paragraph, index) => {
    const text = extractParagraphText(paragraph);
    const area = paragraph.boundingBox
      ? calculateArea(paragraph.boundingBox.vertices)
      : 0;
    console.log(
      `OCR Debug - Paragraph ${index}: "${text}" (length: ${text.length}, area: ${area})`
    );
  });

  // 段落を位置順（上から下）にソート
  const sortedParagraphs = paragraphs
    .map((paragraph) => ({
      text: extractParagraphText(paragraph),
      y: paragraph.boundingBox ? paragraph.boundingBox.vertices[0].y : 0,
    }))
    .filter((p) => p.text.length > 0)
    .sort((a, b) => a.y - b.y); // Y座標でソート（上から下）

  console.log(
    'OCR Debug - Total paragraphs to display:',
    sortedParagraphs.length
  );

  if (sortedParagraphs.length === 0) return '';

  // すべての段落を改行で結合
  const fullText = sortedParagraphs.map((p) => p.text).join('\n\n');
  console.log('OCR Debug - Combined text length:', fullText.length);

  return fullText;
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
      data.responses[0].fullTextAnnotation
    ) {
      const fullTextAnnotation = data.responses[0].fullTextAnnotation;
      console.log('OCR Debug - Using DOCUMENT_TEXT_DETECTION');

      if (fullTextAnnotation.pages && fullTextAnnotation.pages.length > 0) {
        const page = fullTextAnnotation.pages[0];

        if (page.blocks) {
          // ブロックから段落を抽出
          const allParagraphs: any[] = [];

          page.blocks.forEach((block: any) => {
            if (block.paragraphs) {
              allParagraphs.push(...block.paragraphs);
            }
          });

          if (allParagraphs.length > 0) {
            // 本文を識別
            const mainContent = identifyMainContent(allParagraphs);

            if (mainContent.length > 0) {
              return [
                {
                  text: mainContent,
                  confidence: 1.0,
                },
              ];
            }
          }
        }
      }

      // フォールバック: 全体テキストを使用
      if (fullTextAnnotation.text) {
        console.log('OCR Debug - Using fallback full text');
        const cleanedText = fullTextAnnotation.text.replace(/\s+/g, '').trim();
        return [
          {
            text: cleanedText,
            confidence: 1.0,
          },
        ];
      }
    } else if (
      data.responses &&
      data.responses[0] &&
      data.responses[0].textAnnotations
    ) {
      // 従来のTEXT_DETECTIONフォールバック
      console.log('OCR Debug - Falling back to TEXT_DETECTION');
      const annotations: TextAnnotation[] = data.responses[0].textAnnotations;

      if (annotations.length > 0) {
        const fullText = annotations[0].description;
        console.log('OCR Debug - Full text length:', fullText.length);
        const cleanedText = fullText.replace(/\s+/g, '').trim();

        return [
          {
            text: cleanedText,
            confidence: 1.0,
          },
        ];
      }
    }

    console.log('OCR Debug - No text found');
    return [];
  } catch (error) {
    console.error('OCR Error:', error);
    throw error;
  }
}
