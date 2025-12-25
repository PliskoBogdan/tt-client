import { Stack } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import { SnackbarProvider } from './src/providers/SnackbarProvider';


export default function Layout() {
  return (
    <PaperProvider>
      <SnackbarProvider>
        <Stack />
      </SnackbarProvider>
    </PaperProvider>
  );
}