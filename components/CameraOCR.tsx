import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { performOCR } from '../services/visionService';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface OCRResult {
  text: string;
  confidence: number;
}

export default function CameraOCR() {
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImage(photo.uri);
        await performOCRWithService(photo.base64!);
      } catch (error) {
        Alert.alert('エラー', '写真の撮影に失敗しました');
      }
    }
  };

  const performOCRWithService = async (base64Image: string) => {
    setIsProcessing(true);
    try {
      const results = await performOCR(base64Image);
      setOcrResult(results);

      if (results.length === 0) {
        Alert.alert('OCR結果', 'テキストが検出されませんでした');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('エラー', 'OCR処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setOcrResult([]);
  };

  if (!permission) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>カメラへのアクセスが許可されていません</ThemedText>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={requestPermission}
        >
          <ThemedText style={styles.resetButtonText}>
            カメラ権限を要求
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {!capturedImage ? (
        <View style={styles.cameraContainer}>
          <CameraView style={styles.camera} facing={type} ref={cameraRef}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => {
                  setType(type === 'back' ? 'front' : 'back');
                }}
              >
                <ThemedText style={styles.text}>カメラを反転</ThemedText>
              </TouchableOpacity>
            </View>
          </CameraView>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <ThemedText type="title" style={styles.resultTitle}>
            OCR結果
          </ThemedText>

          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={styles.processingText}>
                テキストを解析中...
              </ThemedText>
            </View>
          ) : (
            <View style={styles.ocrResults}>
              {ocrResult.length > 0 ? (
                <View style={styles.ocrItem}>
                  <ThemedText type="subtitle" style={styles.ocrTitle}>
                    認識された文章
                  </ThemedText>
                  <ThemedText style={styles.ocrText}>
                    {ocrResult[0].text}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.noText}>
                  テキストが検出されませんでした
                </ThemedText>
              )}
            </View>
          )}

          <TouchableOpacity style={styles.resetButton} onPress={resetCamera}>
            <ThemedText style={styles.resetButtonText}>
              新しい写真を撮る
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
  captureButton: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#007AFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
  },
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  resultTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
  },
  ocrResults: {
    flex: 1,
  },
  ocrItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  ocrTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  ocrText: {
    fontSize: 16,
    lineHeight: 24,
  },
  confidenceText: {
    fontSize: 12,
    opacity: 0.7,
  },
  noText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
