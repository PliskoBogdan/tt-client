import { recognizeText } from "@infinitered/react-native-mlkit-text-recognition";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDeviceId } from "../hooks/useDeviceId";
import { api } from "./src/api/api";

const { width } = Dimensions.get("window");

export default function CameraScreen() {
  const deviceId = useDeviceId();

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [facing, setFacing] = useState("back");

  const recognizeTextFromImage = async (imageUri) => {

    try {
      const { text } = await recognizeText(imageUri);
      console.log('ettwtw',text)
      return text
    } catch (error) {
      console.error("Error recognizing text:", error);
    }

  };
  const sendTextToAPI = async (text) => {
    try {
      setIsSending(true);

      await api.post(`/todos`, {
        deviceId,
        text,
        source: "photo",
      });

      Alert.alert("Успіх", "Текст успішно збережено");
    } catch (error) {
      console.error("Error sending to API:", error);
      Alert.alert("Ошибка", "Не вдалося зберегти текст");
    } finally {
      setIsSending(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setRecognizedText("");

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      const detectedText = await recognizeTextFromImage(photo.uri);

      if (detectedText && detectedText.trim().length > 0) {
        setRecognizedText(detectedText);
        console.log("Recognized text:", detectedText);
        await sendTextToAPI(detectedText);
      } else {
        Alert.alert("Увага", "Текст на зображенні не виявлено");
      }
    } catch (error) {
      console.error("Error processing photo:", error);
      Alert.alert("Помилка", "Сталася помилка під час обробки фотографії");
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        setRecognizedText("");

        const detectedText = await recognizeTextFromImage(result.assets[0].uri);

        if (detectedText && detectedText.trim().length > 0) {
          setRecognizedText(detectedText);
          await sendTextToAPI(detectedText);
        } else {
          Alert.alert("Увага", "Текст на зображенні не виявлено");
        }

        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      setIsProcessing(false);
    }
  };

  const changeFacing = () => {
    if (facing === 'back') {
      setFacing('front');
      return;
    }

    setFacing('back')
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    camera: {
      flex: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject, // Добавьте это
      backgroundColor: 'transparent',
      flex: 1,
    },
    topBar: {
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      paddingHorizontal: 20,
      paddingBottom: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      color: '#FFF',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: '#FFF',
      opacity: 0.9,
    },
    middleSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    focusFrame: {
      width: width - 80,
      height: 200,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: 35,
      height: 35,
      borderColor: '#00D9FF',
    },
    topLeft: {
      top: 0,
      left: 0,
      borderTopWidth: 5,
      borderLeftWidth: 5,
      borderTopLeftRadius: 4,
    },
    topRight: {
      top: 0,
      right: 0,
      borderTopWidth: 5,
      borderRightWidth: 5,
      borderTopRightRadius: 4,
    },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 5,
      borderLeftWidth: 5,
      borderBottomLeftRadius: 4,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 5,
      borderRightWidth: 5,
      borderBottomRightRadius: 4,
    },
    resultContainer: {
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 18,
      backgroundColor: 'rgba(0, 217, 255, 0.15)',
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'rgba(0, 217, 255, 0.4)',
    },
    resultLabel: {
      fontSize: 13,
      color: '#00D9FF',
      marginBottom: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    resultText: {
      fontSize: 15,
      color: '#FFF',
      lineHeight: 22,
    },
    bottomBar: {
      paddingBottom: Platform.OS === 'ios' ? 50 : 30,
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      paddingTop: 20,
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: width - 40,
    },
    captureButton: {
      width: 85,
      height: 85,
      borderRadius: 42.5,
      backgroundColor: 'rgba(0, 217, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 5,
      borderColor: '#00D9FF',
    },
    captureButtonDisabled: {
      opacity: 0.4,
    },
    captureButtonInner: {
      width: 65,
      height: 65,
      borderRadius: 32.5,
      backgroundColor: '#00D9FF',
    },
    galleryButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    galleryButtonText: {
      fontSize: 28,
    },
    processingText: {
      marginTop: 18,
      fontSize: 16,
      color: '#00D9FF',
      fontWeight: '700',
    },
    permissionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    permissionText: {
      fontSize: 19,
      color: '#FFF',
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 28,
    },
    permissionButton: {
      backgroundColor: '#00D9FF',
      paddingHorizontal: 35,
      paddingVertical: 16,
      borderRadius: 14,
      elevation: 4,
      shadowColor: '#00D9FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    permissionButtonText: {
      color: '#000',
      fontSize: 17,
      fontWeight: '700',
    },
  });

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
          Необхідний доступ до камери для розпізнавання тексту
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Надати доступ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      
      {/* Overlay вынесен за пределы CameraView */}
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Text style={styles.title}>📸 Розпізнавання тексту</Text>
          <Text style={styles.subtitle}>
            Наведіть на текст і натисніть кнопку
          </Text>
        </View>
  
        <View style={styles.middleSection}>
          <View style={styles.focusFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
  
        {recognizedText.length > 0 && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>✓ Розпізнаний текст:</Text>
            <Text style={styles.resultText} numberOfLines={4}>
              {recognizedText}
            </Text>
          </View>
        )}
  
        <View style={styles.bottomBar}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickImage}
              disabled={isProcessing || isSending}
            >
              <Text style={styles.galleryButtonText}>📁</Text>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={[
                styles.captureButton,
                (isProcessing || isSending) && styles.captureButtonDisabled,
              ]}
              onPress={takePhoto}
              disabled={isProcessing || isSending}
              activeOpacity={0.7}
            >
              {isProcessing || isSending ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
              
            <TouchableOpacity activeOpacity={0.7} onPress={changeFacing}>
              <View style={styles.galleryButton} />
            </TouchableOpacity>
          </View>
  
          {(isProcessing || isSending) && (
            <Text style={styles.processingText}>
              {isProcessing ? "🔍 Розпізнавання..." : "📤 Відправлення..."}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
