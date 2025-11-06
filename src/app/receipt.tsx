import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { Button } from 'react-native-paper';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';

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

export default function ReceiptScreen() {
  const { sale } = useLocalSearchParams();
  const router = useRouter();

  const [db, setDb] = useState<SQLite.WebSQLDatabase | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const database = SQLite.openDatabase('products.db');
      setDb(database);
    }
  }, []);

  if (!sale) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Nenhuma venda encontrada.</Text>
        <Button mode="outlined" onPress={() => router.back()}>Voltar</Button>
      </View>
    );
  }

  const data = JSON.parse(sale);
  const total = data.reduce((sum, item) => sum + parseInt(item.quantity) * parseFloat(item.cost), 0);

  const updateStock = async () => {
    if (!db) return;
    try {
      for (const item of data) {
        const currentStockResult = await execSqlAsync(db, `SELECT count FROM products WHERE id = ?`, [item.id]);
        const currentStock = parseInt(currentStockResult.rows.item(0)?.count || '0');
        const newStock = currentStock - parseInt(item.quantity);
        await execSqlAsync(db, `UPDATE products SET count = ? WHERE id = ?`, [newStock.toString(), item.id]);
      }
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err);
      Alert.alert('Erro', 'Não foi possível atualizar o estoque');
    }
  };

  const generatePDF = async () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          header { text-align: center; margin-bottom: 20px; }
          header img { width: 100px; }
          h1 { color: #6A1B9A; border-bottom: 2px solid #6A1B9A; padding-bottom: 5px; margin-bottom: 20px; text-align: center; }
          .cliente { font-size: 16px; margin-bottom: 10px; }
          .produto { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
          .produto strong { color: #6A1B9A; display: block; margin-bottom: 5px; }
          .total { font-size: 18px; font-weight: bold; color: #6A1B9A; margin-top: 20px; text-align: right; }
          footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <header>
          <img src="https://upload.wikimedia.org/wikipedia/pt/3/3a/Pica-Pau.png" alt="Logo">
        </header>

        <h1>Recibo de Compra</h1>

        <div class="cliente"><strong>Cliente:</strong> ${data[0]?.client || 'Não informado'}</div>

        ${data.map(item => `
          <div class="produto">
            <strong>${item.nameProduct}</strong>
            Qtd: ${item.quantity} — Valor unitário: R$ ${parseFloat(item.cost).toFixed(2)}<br/>
            Subtotal: R$ ${(parseInt(item.quantity) * parseFloat(item.cost)).toFixed(2)}
          </div>
        `).join('')}

        <div class="total">Total: R$ ${total.toFixed(2)}</div>

        <footer>Obrigado pela preferência! 😊</footer>
      </body>
      </html>
    `;

    try {
      await updateStock();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      Alert.alert('Erro', 'Não foi possível gerar o PDF ou atualizar o estoque');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/store')}>
        <EvilIcons name="arrow-left" size={35} color="#6A1B9A" />
      </Pressable>

      <Text style={styles.titulo}>Recibo de Compra</Text>
      <Text style={styles.cliente}>Cliente: <Text style={{ fontWeight: 'bold' }}>{data[0]?.client}</Text></Text>

      {data.map((item, index) => (
        <View key={index} style={styles.item}>
          <Text style={styles.produto}>{item.nameProduct}</Text>
          <Text>Qtd: {item.quantity}</Text>
          <Text>Valor unitário: R$ {parseFloat(item.cost).toFixed(2)}</Text>
          <Text>Subtotal: R$ {(parseInt(item.quantity) * parseFloat(item.cost)).toFixed(2)}</Text>
        </View>
      ))}

      <Text style={styles.total}>Total: R$ {total.toFixed(2)}</Text>

      <Button mode="contained" onPress={generatePDF} style={{ marginTop: 20 }}>
        Gerar PDF e Atualizar Estoque
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  titulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  cliente: { fontSize: 16, marginBottom: 20 },
  item: { marginBottom: 12, padding: 8, backgroundColor: '#F5F5F5', borderRadius: 6 },
  produto: { fontWeight: 'bold', fontSize: 16 },
  total: { marginTop: 30, fontSize: 18, fontWeight: 'bold', color: '#6A1B9A' },
  error: { fontSize: 16, color: 'red', marginBottom: 10 },
});
