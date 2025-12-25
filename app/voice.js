import { Audio } from "expo-av";
import * as FileSystem from 'expo-file-system/legacy';
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Button, Text, View } from "react-native";
import constants from "../constants";
import { useDeviceId } from "../hooks/useDeviceId";
import { api } from "./src/api/api";

const { AZURE_SPEECH_KEY, AZURE_ENDPOINT } = constants;

export default function VoiceScreen() {
  const [recording, setRecording] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0); 
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef(null);
  const deviceId = useDeviceId();

  const maxRecordingTime = 60;

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  // Clear timer after unmounted
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recordingTime >= maxRecordingTime && recording) {
      console.log('Max recording time reached, stopping...');
      stopRecording();
    }
  }, [recordingTime, recording]);

  const startRecording = async () => {
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

    try {
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const convertSpeechToText = async (audioUri) => {
    try {
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: 'base64',
      });

      console.log('Base64 length:', audioBase64.length);

      // Convert base64 into binary
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const response = await fetch(
        `${AZURE_ENDPOINT}?language=uk-UA&format=detailed`,
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Azure error:', errorText);
        throw new Error(`Azure API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Azure return result in several formats
      if (result.DisplayText) {
        return result.DisplayText;
      } else if (result.NBest && result.NBest[0]?.Display) {
        return result.NBest[0].Display;
      } else if (result.RecognitionStatus === 'Success' && result.DisplayText) {
        return result.DisplayText;
      } else {
        throw new Error('Не вдалося розпізнати мову. Спробуйте говорити голосніше і чіткіше.');
      }
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw error;
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsProcessing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error('Немає URI аудіофайлу');
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new Error('Аудіофайл не знайдено');
      }

      const recognizedText = await convertSpeechToText(uri);
      console.log('Recognized text:', recognizedText);

      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (deleteError) {
        console.warn('Could not delete temp file:', deleteError);
      }

      await api.post(`/todos`, { 
        deviceId, 
        text: recognizedText, 
        source: "voice" 
      });

      Alert.alert("Успіх", `Розпізнано: "${recognizedText}"`);
      router.back();
      router.setParams({ refresh: true })
    } catch (err) {
      console.error("Failed to process recording", err);
      Alert.alert(
        "Помилка", 
        err.message || "Не вдалося розпізнати мову. Перевірте підключення до Інтернету."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (recordingTime >= Math.round(maxRecordingTime * 0.9)) return '#ff0000';
    if (recordingTime >= Math.round(maxRecordingTime * 0.7)) return '#ff6600';
    return '#000000';
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Button
        title={recording ? "Зупинити" : "Почати запис"}
        onPress={recording ? stopRecording : startRecording}
        disabled={isProcessing}
      />
      {recording && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ fontSize: 16 }}>
            🎙 Запись...
          </Text>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            marginTop: 10,
            color: getTimerColor()
          }}>
            {formatTime(recordingTime)}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
            Максимум {maxRecordingTime} секунд
          </Text>
        </View>
      )}
      <Text style={{ textAlign: "center", marginTop: 20, fontSize: 16 }}>
        {recording ? "🎙 запис..." : ""}
        {isProcessing ? "⏳ Обрабка..." : ""}
      </Text>
    </View>
  );
}
