import EvilIcons from '@expo/vector-icons/EvilIcons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

async function execSqlAsync(db: SQLite.SQLiteDatabase, sql: string, params: any[] = []): Promise<any> {
  return await db.runAsync(sql, params);
}

interface SaleItem {
  id: number;
  nameProduct: string;
  quantity: string;
  cost: string;
  client?: string;
}

export default function ReceiptScreen() {
  const { sale } = useLocalSearchParams();
  const router = useRouter();

  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const initDb = async () => {
        const database = await SQLite.openDatabaseAsync('products.db');
        setDb(database);
      };
      initDb();
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

  const saleString = Array.isArray(sale) ? sale[0] : sale;
  const data: SaleItem[] = JSON.parse(saleString);
  const total = data.reduce((sum: number, item: SaleItem) => sum + parseInt(item.quantity) * parseFloat(item.cost), 0);

  const updateStock = async () => {
    if (!db) return;
    try {
      for (const item of data) {
        const currentStockResult = await db.getFirstAsync<{ count: string }>(
          `SELECT count FROM products WHERE id = ?`,
          [item.id]
        );
        const currentStock = parseInt(currentStockResult?.count || '0');
        const newStock = currentStock - parseInt(item.quantity);
        await execSqlAsync(db, `UPDATE products SET count = ? WHERE id = ?`, [newStock.toString(), item.id]);
      }
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err);
      Alert.alert('Erro', 'Não foi possível atualizar o estoque');
    }
  };

  const generatePDF = async () => {
    // Carregar imagem e converter para Base64
    let logoHtml = "";
    try {
      const asset = Asset.fromModule(require("../../assets/images/mmautocenter.png"));
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      logoHtml = `<img src="data:image/png;base64,${base64}" style="width: 100px; margin-bottom: 10px;" />`;
    } catch (e) {
      console.log("Erro ao carregar imagem para PDF:", e);
    }

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
          ${logoHtml}
        </header>

        <h1>Recibo de Compra</h1>

        <div class="cliente"><strong>Cliente:</strong> ${data[0]?.client || 'Não informado'}</div>

        ${data.map((item: SaleItem) => `
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

      {data.map((item: SaleItem, index: number) => (
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
