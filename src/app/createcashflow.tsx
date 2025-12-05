import { Feather, Ionicons } from "@expo/vector-icons";

import { useLocalSearchParams, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { Button, IconButton, SegmentedButtons, TextInput } from "react-native-paper";
import {
  DatePickerInput,
  pt,
  registerTranslation,
} from "react-native-paper-dates";
import Toast from "react-native-toast-message";
import { Footer } from "../components/common/Footer";
import { styles } from "../components/createform/createform";
import { toastConfig } from "../components/createform/toastConfig";

registerTranslation("pt", pt);

// Banco em memória para fallback no Web
let memoryDb: any[] = [];
let db: SQLite.SQLiteDatabase | null = null;


export default function Createcashflow() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const transactionId = Array.isArray(id) ? id[0] : id; // Garante que é string
  const isEditing = !!transactionId;

  const [description, setDescription] = useState("");
  const [type, setType] = useState<"entrada" | "saida">("entrada");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<
    "pix" | "cartao" | "dinheiro" | "transferencia"
  >("pix");
  const [dbReady, setDbReady] = useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  useEffect(() => {
    const setupDB = async () => {
      try {
        if (Platform.OS === "web") {
          console.warn(
            "SQLite não suportado no Web. Usando fallback em memória."
          );
          setDbReady(true);
          return;
        }

        db = await SQLite.openDatabaseAsync("cashflow.db", {
          useNewConnection: true,
        });

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS cashflow (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT,
            type TEXT CHECK(type IN ('entrada','saida')) NOT NULL,
            amount REAL NOT NULL,
            method TEXT NOT NULL,
            transaction_date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Carrega dados se for edição
  useEffect(() => {
    if (dbReady && transactionId && Platform.OS !== "web") {
      const loadTransaction = async () => {
        try {
          const result: any = await db!.getFirstAsync(
            "SELECT * FROM cashflow WHERE id = ?",
            [transactionId]
          );
          if (result) {
            setDescription(result.description);
            setType(result.type);
            // Fix: convert dot to comma
            setAmount(result.amount.toFixed(2).replace(".", ","));
            setMethod(result.method);
            setDate(new Date(result.transaction_date));
          }
        } catch (error) {
          console.error("Erro ao carregar transação:", error);
        }
      };
      loadTransaction();
    }
  }, [dbReady, transactionId]);

  if (!dbReady) return null;

  const checkTransactions = async () => {
    try {
      if (Platform.OS === "web") {
        console.log("Registros no banco (memória):", memoryDb);
      } else {
        const rows = await db!.getAllAsync(
          "SELECT * FROM cashflow ORDER BY id DESC"
        );
        console.log("Registros no banco:", rows);
      }
    } catch (error) {
      console.error("Erro ao consultar registros:", error);
    }
  };

  const normalizedAmount = amount
    .replace(/\./g, "") // remove pontos de milhar
    .replace(",", "."); // troca vírgula decimal por ponto

  const saveTransaction = async () => {
    if (!description || !amount || !date) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios!");
      return;
    }

    if (type !== "entrada" && type !== "saida") {
      Alert.alert("Erro", "Tipo inválido: use 'entrada' ou 'saida'");
      return;
    }

    try {
      // Fix parsing:
      let normalizedAmount = amount;
      if (amount.includes(",")) {
        normalizedAmount = amount.replace(/\./g, "").replace(",", ".");
      }

      const formattedAmount = parseFloat(normalizedAmount);

      // Converte Date para YYYY-MM-DD para salvar no banco
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const isoDate = `${year}-${month}-${day}`;

      if (Platform.OS === "web") {
        // salva em memória
        if (isEditing) {
          const index = memoryDb.findIndex((t) => t.id == transactionId);
          if (index >= 0) {
            memoryDb[index] = {
              ...memoryDb[index],
              description,
              type,
              amount: formattedAmount,
              method,
              transaction_date: isoDate,
            };
          }
        } else {
          memoryDb.push({
            id: memoryDb.length + 1,
            description,
            type,
            amount: formattedAmount,
            method,
            transaction_date: isoDate,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        if (isEditing) {
          await db!.runAsync(
            "UPDATE cashflow SET description = ?, type = ?, amount = ?, method = ?, transaction_date = ? WHERE id = ?",
            [description, type, formattedAmount, method, isoDate, transactionId]
          );
        } else {
          await db!.runAsync(
            "INSERT INTO cashflow (description, type, amount, method, transaction_date) VALUES (?, ?, ?, ?, ?)",
            [description, type, formattedAmount, method, isoDate]
          );
        }
      }

      Toast.show({
        type: "success",
        text1: isEditing ? "Transação atualizada!" : "Transação registrada!",
        text2: isEditing
          ? "Os dados foram alterados."
          : "Você pode continuar cadastrando.",
      });

      if (isEditing) {
        // Se for edição, pode voltar pra tela anterior ou limpar
        // Aqui opto por voltar após um delay curto ou deixar na tela
        setTimeout(() => router.back(), 1500);
      } else {
        setDescription("");
        setType("entrada");
        setAmount("");
        setMethod("pix");
        setDate(undefined);
      }
    } catch (error) {
      console.error("Erro ao salvar o registro:", error);
      Alert.alert("Erro", "Erro ao tentar salvar o registro.");
    }

    await checkTransactions();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.containerviewedit}>

          <View style={styles.action}>
            <IconButton
              icon={() => (
                <Feather name="corner-up-left" size={20} color="#6A1B9A" />
              )}
              onPress={() => router.push("/finances")}
            />
            <Text
              style={styles.latoBold}
              onPress={() => router.push("/finances")}
            >
              Fluxo de caixa
            </Text>
          </View>
        </View>
        <View>
          {/* Inputs e Pickers (igual ao seu código) */}
          <Text style={styles.poppinsBold}>
            <IconButton icon="pencil" iconColor="#6A1B9A" size={20} />
            Descrição da transação:
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descreva a transação"
            style={styles.input}
            theme={{
              colors: {
                background: "#FFFFFF", // cor do fundo do input
                primary: "#6A1B9A", // cor do foco/borda ativa
                placeholder: "#999", // cor do placeholder
              },
            }}
            outlineColor="#6A1B9A" // cor da borda quando não está focado
            activeOutlineColor="#6A1B9A" // cor da borda quando focado
            mode="outlined" // garante que a borda apareça
            textColor="#000"
          />

          <Text style={styles.poppinsBold}>
            <IconButton icon="arrow-up-bold-box" iconColor="#6A1B9A" size={20} />
            Tipo:
          </Text>
          <View style={{ marginBottom: 15 }}>
            <SegmentedButtons
              value={type}
              onValueChange={(val) => setType(val as "entrada" | "saida")}
              buttons={[
                {
                  value: "entrada",
                  label: "Entrada",
                  icon: "arrow-up-circle-outline",
                  style: { borderColor: "#6A1B9A" },
                  checkedColor: "#fff",
                  uncheckedColor: "#6A1B9A",
                },
                {
                  value: "saida",
                  label: "Saída",
                  icon: "arrow-down-circle-outline",
                  style: { borderColor: "#6A1B9A" },
                  checkedColor: "#fff",
                  uncheckedColor: "#E53935",
                },
              ]}
              theme={{ colors: { secondaryContainer: type === 'entrada' ? '#6A1B9A' : '#E53935' } }}
            />
          </View>

          <Text style={styles.poppinsBold}>
            <IconButton
              icon={() => (
                <Feather name="dollar-sign" size={20} color="#6A1B9A" />
              )}
            />
            Valor:
          </Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            mode="outlined"
            theme={{
              colors: {
                background: "#FFFFFF", // cor do fundo do input
                primary: "#6A1B9A", // cor do foco/borda ativa
                placeholder: "#999", // cor do placeholder
              },
            }}
            outlineColor="#6A1B9A" // cor da borda quando não está focado
            activeOutlineColor="#6A1B9A" // cor da borda quando focado
            textColor="#000"
          />

          <Text style={styles.poppinsBold}>
            <IconButton icon="credit-card" size={20} iconColor="#6A1B9A" />
            Método de Pagamento:
          </Text>
          <View style={{ marginBottom: 20 }}>
            <SegmentedButtons
              value={method}
              onValueChange={(val) => setMethod(val as any)}
              density="small"
              buttons={[
                {
                  value: "pix",
                  label: "Pix",
                  icon: "star-four-points-outline",
                  style: { borderColor: "#6A1B9A" },
                  checkedColor: "#FFF",
                  uncheckedColor: "#6A1B9A",
                },
                {
                  value: "cartao",
                  label: "Cartão",
                  icon: "credit-card-outline",
                  style: { borderColor: "#6A1B9A" },
                  checkedColor: "#FFF",
                  uncheckedColor: "#6A1B9A",
                },
              ]}
              style={{ marginBottom: 10 }}
              theme={{ colors: { secondaryContainer: "#6A1B9A" } }}
            />
            <SegmentedButtons
              value={method}
              onValueChange={(val) => setMethod(val as any)}
              density="small"
              buttons={[
                {
                  value: "dinheiro",
                  label: "Dinheiro",
                  icon: "cash",
                  style: { borderColor: "#6A1B9A" },
                  checkedColor: "#FFF",
                  uncheckedColor: "#6A1B9A",
                },
                {
                  value: "transferencia",
                  label: "Transferência",
                  icon: "bank-transfer",
                  style: { borderColor: "#6A1B9A" },
                  checkedColor: "#FFF",
                  uncheckedColor: "#6A1B9A",
                },
              ]}
              style={{ marginBottom: 10 }}
              theme={{ colors: { secondaryContainer: "#6A1B9A" } }}
            />
          </View>

          <View style={{ marginBottom: 20, backgroundColor: "#fff" }}>
            <DatePickerInput
              locale="pt"
              label="Data da transação"
              value={date}
              onChange={(d) => setDate(d)}
              inputMode="start"
              style={{ backgroundColor: "#FFFFFF" }}
              theme={{
                colors: {
                  background: "#FFFFFF",
                  primary: "#6A1B9A",
                  placeholder: "#999",
                },
              }}
              mode="outlined"
              outlineColor="#6A1B9A"
              activeOutlineColor="#6A1B9A"
              textColor="#000"
            />
          </View>

          <Button
            icon={() => <Ionicons name="download" size={20} color="#FFF" />}
            mode="contained"
            style={styles.button}
            onPress={saveTransaction}
          >
            <Text style={styles.buttonText}>{isEditing ? "Atualizar" : "Salvar"}</Text>
          </Button>

          <Toast config={toastConfig} />
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
}
