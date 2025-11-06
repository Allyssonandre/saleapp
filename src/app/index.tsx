import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Animatable from 'react-native-animatable';

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        <Pressable onPress={() => router.push('/dashboard')}>
          <Animatable.Image
              animation="tada"
              iterationCount="infinite"
              duration={2000}
              source={require('../../assets/images/mmautocenter.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',     
    backgroundColor: '#ede7f0ff',  
  },
  logo: {
	marginBottom: 60,
    width: 200, 
    height: 300,
    
  },
});