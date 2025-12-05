import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import Toast from "react-native-toast-message";
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
          CREATE TABLE IF NOT EXISTS products (
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
        `INSERT INTO products (nameProduct, count, cost) VALUES (?, ?, ?)`,
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
      <View style={styles.form}>
        <View style={styles.containerviewedit}>
          <View style={styles.row2}>
            <Pressable
              style={styles.btnRow}
              onPress={() => router.push("/dashboard")}
            >
              <Feather name="corner-up-left" size={20} color="#6A1B9A" />
              <Text style={styles.latoBold}>Dashboard</Text>
            </Pressable>
            <Pressable
              style={styles.btnRow}
              onPress={() => router.push("/store")}
            >
              <Feather name="corner-up-left" size={20} color="#6A1B9A" />
              <Text style={styles.latoBold}>Estoque</Text>
            </Pressable>
          </View>
        </View>
        <TextInput
          mode="outlined"
          label="Produto"
          placeholder="Nome do produto"
          value={product}
          onChangeText={setProduct}
          style={styles.input}
          theme={{
            colors: {
              background: "#FFFFFF",
              primary: "#6A1B9A",
              text: "#000",
              placeholder: "#999",
            },
          }}
          textColor="#000"
          outlineColor="#6A1B9A"
          right={<TextInput.Icon icon="cart" />}
        />

        <TextInput
          mode="outlined"
          label="Quantidade"
          placeholder="Quantidade"
          keyboardType="numeric"
          value={count}
          onChangeText={setCount}
          style={[styles.input, { fontSize: 18 }]}
          theme={{
            colors: {
              background: "#FFFFFF",
              primary: "#6A1B9A",
              text: "#6A1B9A",
              placeholder: "#999",
            },
          }}
          textColor="#000"
          outlineColor="#6A1B9A"
          right={<TextInput.Icon icon="numeric" />}
        />

        <TextInput
          mode="outlined"
          label="Valor"
          placeholder="Valor"
          keyboardType="numeric"
          value={cost}
          onChangeText={setCost}
          style={styles.input}
          theme={{
            colors: {
              background: "#FFFFFF",
              primary: "#6A1B9A",
              text: "#000",
              placeholder: "#999",
            },
          }}
          textColor="#000"
          outlineColor="#6A1B9A"
          right={<TextInput.Icon icon="currency-brl" />}
        />

        <Button
          icon={() => <Ionicons name="add" size={20} color="#FFFFFF" />}
          mode="contained"
          onPress={saveProduct}
          style={styles.button}
        >
          <Text style={styles.buttonText}>CRIAR ESTOQUE</Text>
        </Button>
      </View>

      <Toast config={toastConfig} />
    </View>
  );
}
