
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
import { Footer } from "../components/common/Footer";
import { styles } from "../components/createform/createform";
import { toastConfig } from "../components/createform/toastConfig";

let db: SQLite.SQLiteDatabase;

export default function CreateForm() {
  const [product, setProduct] = useState("");
  const [count, setCount] = useState("");
  const [cost, setCost] = useState("");
  const router = useRouter();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setupDB = async () => {
      try {
        db = await SQLite.openDatabaseAsync("products.db", {
          useNewConnection: true,
        });

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS products(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nameProduct TEXT NOT NULL,
  count INTEGER NOT NULL,
  cost TEXT NOT NULL
);
`);

        setDbReady(true);
      } catch (error) {
        console.error("Erro ao abrir/criar banco:", error);
        Alert.alert("Erro", "Não foi possível abrir o banco de dados.");
      }
    };

    setupDB();
  }, []);

  // O restante do componente só funciona quando o banco estiver pronto
  if (!dbReady) return null;

  const saveProduct = async () => {
    if (!product || !count || !cost) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    try {
      await db.runAsync(
        `INSERT INTO products(nameProduct, count, cost) VALUES(?, ?, ?)`,
        [product, Number(count), cost]
      );

      Toast.show({
        type: "success",
        text1: "Produto cadastrado!",
        text2: "Você pode continuar cadastrando.",
      });

      setProduct("");
      setCount("");
      setCost("");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      Alert.alert("Erro", "Erro ao tentar salvar o produto.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 100,
          flexGrow: 1,
          justifyContent: "center",
        }}
      >
        <View style={styles.form}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20, width: "100%" }}>
            <Button
              mode="text"
              icon="view-dashboard"
              textColor="#6A1B9A"
              onPress={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
            <Button
              mode="text"
              icon="package-variant"
              textColor="#6A1B9A"
              onPress={() => router.push("/store")}
            >
              Estoque
            </Button>
          </View>

          <Card style={{ width: "100%", padding: 10, elevation: 4, backgroundColor: '#fff' }}>
            <Card.Content>
              <Text variant="headlineSmall" style={{ color: "#6A1B9A", fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
                Novo Produto
              </Text>

              <TextInput
                mode="outlined"
                label="Nome do Produto"
                placeholder="Ex: Óleo 5W30"
                value={product}
                onChangeText={setProduct}
                style={[styles.input, { backgroundColor: "#fff" }]}
                theme={{ colors: { primary: "#6A1B9A", background: "#fff" } }}
                textColor="#000"
                outlineColor="#6A1B9A"
                left={<TextInput.Icon icon="tag-outline" color="#6A1B9A" />}
              />

              <TextInput
                mode="outlined"
                label="Quantidade Inicial"
                placeholder="Ex: 50"
                keyboardType="numeric"
                value={count}
                onChangeText={setCount}
                style={[styles.input, { backgroundColor: "#fff" }]}
                theme={{ colors: { primary: "#6A1B9A", background: "#fff" } }}
                textColor="#000"
                outlineColor="#6A1B9A"
                left={<TextInput.Icon icon="numeric" color="#6A1B9A" />}
              />

              <TextInput
                mode="outlined"
                label="Custo Unitário (R$)"
                placeholder="Ex: 25.90"
                keyboardType="numeric"
                value={cost}
                onChangeText={setCost}
                style={[styles.input, { backgroundColor: "#fff" }]}
                theme={{ colors: { primary: "#6A1B9A", background: "#fff" } }}
                textColor="#000"
                outlineColor="#6A1B9A"
                left={<TextInput.Icon icon="cash" color="#6A1B9A" />}
              />

              <Button
                icon="check-circle-outline"
                mode="contained"
                textColor="#FFFFFF"
                onPress={saveProduct}
                style={{ marginTop: 10, backgroundColor: "#6A1B9A", paddingVertical: 6 }}
                labelStyle={{ fontSize: 16, fontWeight: "bold" }}
              >
                Salvar Produto
              </Button>
            </Card.Content>
          </Card>
        </View>

        <Toast config={toastConfig} />
      </ScrollView>
      <Footer />
    </View>
  );
}
