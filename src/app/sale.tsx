import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert, Pressable, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SQLite from 'expo-sqlite';
import Toast from 'react-native-toast-message';
import * as qs from 'qs';

function execSqlAsync(db: SQLite.WebSQLDatabase, sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
}

export default function Sale() {
  const router = useRouter();
  const { product } = useLocalSearchParams();

  const [db, setDb] = useState<SQLite.WebSQLDatabase | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [client, setClient] = useState('Nome do cliente');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const database = SQLite.openDatabaseAsync('products');
      setDb(database);

      execSqlAsync(database, `
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          productId INTEGER,
          nameProduct TEXT,
          client TEXT,   
          quantity TEXT,
          INTEGER NOT NULL,
          createdAt TEXT
        );
      `).catch(error => {
        console.error('Erro ao inicializar banco:', error);
        Alert.alert('Erro', 'Não foi possível abrir o banco de dados');
      });
    }
  }, []);

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Erro: Produto não informado</Text>
        <Button mode="outlined" onPress={() => router.back()}>Voltar</Button>
      </View>
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(product);
  } catch {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Erro: Produto inválido</Text>
        <Button mode="outlined" onPress={() => router.back()}>Voltar</Button>
      </View>
    );
  }

  const handleSave = async () => {
    const quantityNumber = parseInt(quantity);
    const stockNumber = parseInt(parsed.count);

    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      Alert.alert('Erro', 'Informe uma quantidade válida');
      return;
    }

    if (quantityNumber > stockNumber) {
      Toast.show({
        type: 'error',
        text1: 'Estoque insuficiente',
        text2: `Estoque atual: ${stockNumber} unidades.`,
      });
      return;
    }

    const newStock = stockNumber - quantityNumber;
    const now = new Date().toISOString();

    const saleData = [{ ...parsed, quantity: quantityNumber, client }];

    if (Platform.OS !== 'web' && db) {
      try {
        await execSqlAsync(db, `
          INSERT INTO orders (productId, nameProduct, client, quantity, cost, createdAt) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [parsed.id, parsed.nameProduct, client, quantityNumber.toString(), parsed.cost, now]);

        await execSqlAsync(db, `UPDATE products SET count = ? WHERE id = ?`, [newStock.toString(), parsed.id]);

        Toast.show({ type: 'success', text1: 'Venda registrada com sucesso' });
      } catch (error) {
        console.error('Erro ao salvar venda:', error);
        Alert.alert('Erro', 'Falha ao salvar venda');
        return;
      }
    } else {
      console.log('Modo Web: Simulando venda (não salva no banco)');
      Toast.show({ type: 'info', text1: 'Simulação no navegador' });
    }

    const params = qs.stringify({
      sale: JSON.stringify(saleData),
    });

    router.push(`/receipt?${params}`);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/store')}>
        <EvilIcons name="arrow-left" size={35} color="#6A1B9A" />
      </Pressable>

      <Text style={styles.title}>Produto: {parsed.nameProduct}</Text>
      <Text>Estoque atual: {parsed.count}</Text>

      <TextInput
        label="Nome do cliente"
        value={client}
        onChangeText={setClient}
        mode="outlined"
        style={{ marginTop: 16 }}
      />

      <TextInput
        label="Quantidade"
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
        mode="outlined"
        style={{ marginTop: 16 }}
      />

      <Button mode="contained" onPress={handleSave} style={{ marginTop: 20 }}>
        Salvar e gerar recibo
      </Button>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#6A1B9A' },
  error: { fontSize: 16, color: 'red', marginBottom: 10 },
});
