// toastConfig.js
import { BaseToast, ErrorToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#6A1B9A',           // Roxo lateral
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4A148C',                    // Roxo escuro para o texto
      }}
      text2Style={{
        fontSize: 17,
        color: '#4A148C',
      }}
    />
  ),

  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#f44336',
        backgroundColor: '#fdecea',
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: '#a94442',
      }}
      text2Style={{
        fontSize: 14,
        color: '#a94442',
      }}
    />
  ),
};
