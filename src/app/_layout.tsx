import { Stack } from 'expo-router';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/createform/toastConfig';

export default function Layout() {
  return (
    <PaperProvider>
      <Stack screenOptions={{
        headerShown: false, 
      }}/>
      <Toast config={toastConfig}/>
    </PaperProvider>
  )
}
