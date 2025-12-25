import { Camera } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useDeviceId } from "../hooks/useDeviceId";

let MlkitOcr;
try {
  MlkitOcr = require("react-native-mlkit-ocr");
} catch {
  MlkitOcr = { detectFromUri: async () => [] }; // заглушка
}

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [permission, setPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const deviceId = useDeviceId();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermission(status === "granted");
    })();
  }, []);

  if (permission === null) return <Text>Запрашиваем разрешения...</Text>;
  if (permission === false) return <Text>Нет доступа к камере</Text>;

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    const pic = await cameraRef.current.takePictureAsync();
    setPhoto(pic);

    // OCR (заглушка для Expo Go)
    const result = await MlkitOcr.detectFromUri(pic.uri);
    const text = result.map((b) => b.text).join(" ");
    console.log("Detected text:", text);
  };

  return (
    <View style={styles.container}>
      <Button title="Сделать фото" onPress={takePhoto} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
