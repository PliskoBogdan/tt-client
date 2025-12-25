import { createContext, useContext, useState } from 'react';
import { Snackbar, Text } from 'react-native-paper';

const SnackbarContext = createContext(null);

const COLORS = {
  success: '#2e7d32',
  error: '#c62828',
  info: '#1565c0',
};

export function SnackbarProvider({ children }) {
  const [state, setState] = useState({
    visible: false,
    message: '',
    type: 'info'
  });

  const show = (type, message) => {
    setState({ visible: true, type, message });
  };

  return (
    <SnackbarContext.Provider
      value={{
        success: (msg) => show('success', msg),
        error: (msg) => show('error', msg),
        info: (msg) => show('info', msg),
      }}
    >
      {children}

      <Snackbar
        visible={state.visible}
        onDismiss={() =>
          setState((s) => ({ ...s, visible: false }))
        }
        duration={2500}
        style={{ backgroundColor: COLORS[state.type] }}
      >
        <Text style={{ color: '#fff' }}>
          {state.message}
        </Text>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = () => useContext(SnackbarContext);
