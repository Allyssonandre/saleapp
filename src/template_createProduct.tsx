import { styles } from '@/src/components/createform/createform';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useRouter } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import Toast from 'react-native-toast-message';

let db: SQLite.SQLiteDatabase;
export default function Home() {
  const [product, setProduct] = React.useState("");
  const [count, setCount] = React.useState("");
  const [cost, setCost] = React.useState("")
  const router = useRouter();

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        db = await SQLite.openDatabaseAsync('products');

        await db.execAsync(`PRAGMA journal_mode = WAL;`);

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY NOT NULL,
          nameProduct TEXT NOT NULL,
          count TEXT NOT NULL,
          cost TEXT NOT NULL
          );
          `);

        const result = await db.getAllAsync(`SELECT * FROM products;`);
        console.log('Produtos no banco:', result);
      } catch (error) {
        console.error('Erro ao inicializar o banco de dados:', error);
      }
    };

    setupDatabase();
  }, []);

  const createProduct = async () => {
    if (!product || !count || !cost) {
      alert('Preencha todos os campos!');
      return;
    }
    try {
      const result = await db.runAsync(
        `INSERT INTO products (nameProduct, count, cost) VALUES (?, ?, ?)`,
        product,
        count,
        cost
      );

      if (result.lastInsertRowId) {
        Toast.show({
          type: 'success',
          text1: 'Produto criado com sucesso!',
          text2: 'Pode continuar cadastrando !',
        });
        // Limpa os campos
        setProduct('');
        setCount('');
        setCost('');
      } else {
        alert('Erro ao tentar registrar o produto!');
      }
    } catch (error) {
      alert('Erro ao salvar produto!');
    }
  };

  return (
    <View style={styles.container}>

      <Pressable onPress={() => router.push('/dashboard')}>
        <EvilIcons name="arrow-left" size={35} color="#6A1B9A" />
      </Pressable>

      <TextInput
        mode="outlined"
        label="Produto"
        placeholder="Produto"
        right={<TextInput.Affix text="/100" />}
        value={product}
        onChangeText={setProduct}
      />

      <TextInput
        mode="outlined"
        label="Quantidade"
        placeholder="Quantidade"
        keyboardType="numeric"
        right={<TextInput.Affix text="/100" />}
        value={count}
        onChangeText={setCount}
      />

      <TextInput
        mode="outlined"
        label="Valor"
        placeholder="Valor"
        keyboardType="numeric"
        right={<TextInput.Affix text="/100" />}
        value={cost}
        onChangeText={setCost}
      />

      <Button icon="send" mode="contained" style={{ marginTop: 16 }} onPress={() => createProduct()}>
        Criar produto
      </Button>
    </View>
  );
}
