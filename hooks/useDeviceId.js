import * as Device from "expo-device";
import { useMemo } from "react";

export function useDeviceId() {
  return useMemo(() => {
    return Device.osInternalBuildId || Device.modelId || "unknown-device";
  }, []);
}