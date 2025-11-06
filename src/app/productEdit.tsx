import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { styles } from '../components/createform/createform';
export default function Home() {
  const router = useRouter();
    const [product, setProduct] = React.useState();
    const [count,setCount] = React.useState()
  return (
    <View style={styles.container}>
        <Pressable onPress={() => router.push('/')}>
            <EvilIcons name="arrow-left" size={35} color="#6A1B9A" />
        </Pressable>
      <TextInput
      mode="outlined"
      label="Produto"
      placeholder="Produto"
      right={<TextInput.Affix text="/100" />}
    /><br></br>
      <Button
        icon="send"
        mode="contained"
        style={{ marginTop: 16 }}
      >
        Editar
      </Button>
    </View>
  );
}

