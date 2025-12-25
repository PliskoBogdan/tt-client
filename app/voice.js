import { Audio } from "expo-av";
import * as FileSystem from 'expo-file-system/legacy';
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, Text, View } from "react-native";
import constants from "../constants";
import { useDeviceId } from "../hooks/useDeviceId";
import { api } from "./src/api/api";

const { AZURE_SPEECH_KEY, AZURE_ENDPOINT } = constants;

export default function VoiceScreen() {
  const [recording, setRecording] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const deviceId = useDeviceId();

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  const startRecording = async () => {
    try {
      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RecordingOptionsPresets.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RecordingOptionsPresets.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RecordingOptionsPresets.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const convertSpeechToText = async (audioUri) => {
    try {
      console.log('Audio URI:', audioUri);

      // Читаем файл как base64
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: 'base64',
      });

      console.log('Base64 length:', audioBase64.length);

      // Конвертируем base64 в бинарные данные
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log('Sending to Azure, bytes:', bytes.length);

      // Отправляем запрос к Azure Speech API
      const response = await fetch(
        `${AZURE_ENDPOINT}?language=ru-RU&format=detailed`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
            'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
            'Accept': 'application/json',
          },
          body: bytes,
        }
      );

      console.log('Azure response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure error:', errorText);
        throw new Error(`Azure API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Azure result:', result);
      
      // Azure может вернуть результат в разных форматах
      if (result.DisplayText) {
        return result.DisplayText;
      } else if (result.NBest && result.NBest[0]?.Display) {
        return result.NBest[0].Display;
      } else if (result.RecognitionStatus === 'Success' && result.DisplayText) {
        return result.DisplayText;
      } else {
        throw new Error('Не удалось распознать речь. Попробуйте говорить громче и четче.');
      }
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw error;
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsProcessing(true);

    try {
      console.log('Stopping recording...');
      
      // Останавливаем запись
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      console.log('Recording stopped, URI:', uri);

      if (!uri) {
        throw new Error('Нет URI аудиофайла');
      }

      // Проверяем существование файла (теперь используем legacy API)
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);

      if (!fileInfo.exists) {
        throw new Error('Аудиофайл не найден');
      }

      // Отправляем аудио в Azure для распознавания
      const recognizedText = await convertSpeechToText(uri);
      console.log('Recognized text:', recognizedText);

      // Удаляем временный файл
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (deleteError) {
        console.warn('Could not delete temp file:', deleteError);
      }

      // Сохраняем распознанный текст
      await api.post(`/todos`, { 
        deviceId, 
        text: recognizedText, 
        source: "voice" 
      });

      Alert.alert("Успех", `Распознано: "${recognizedText}"`);
      router.back();
      router.setParams({ refresh: true })
    } catch (err) {
      console.error("Failed to process recording", err);
      Alert.alert(
        "Ошибка", 
        err.message || "Не удалось распознать речь. Проверьте подключение к интернету."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Button
        title={recording ? "Остановить" : "Начать запись"}
        onPress={recording ? stopRecording : startRecording}
        disabled={isProcessing}
      />
      <Text style={{ textAlign: "center", marginTop: 20, fontSize: 16 }}>
        {recording ? "🎙 Запись..." : ""}
        {isProcessing ? "⏳ Обработка..." : ""}
      </Text>
    </View>
  );
}
