import { Feather, Ionicons } from "@expo/vector-icons";

import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, IconButton, TextInput } from "react-native-paper";
import {
  DatePickerModal,
  pt,
  registerTranslation,
} from "react-native-paper-dates";
import Toast from "react-native-toast-message";
import { styles } from "../components/createform/createform";
import { toastConfig } from "../components/createform/toastConfig";

registerTranslation("pt", pt);

// Banco em memória para fallback no Web
let memoryDb: any[] = [];
let db: SQLite.SQLiteDatabase | null = null;

export default function Createcashflow() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [type, setType] = useState<"entrada" | "saida">("entrada");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<
    "pix" | "cartao" | "dinheiro" | "transferencia"
  >("pix");
  const [transactionDate, setTransactionDate] = useState<string>("");

  const [dbReady, setDbReady] = useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [open, setOpen] = React.useState(false);
  const onDismiss = React.useCallback(() => {
    setOpen(false);
  }, []);

  const onConfirm = React.useCallback((params: any) => {
    setOpen(false);
    setDate(params.date);
    const formatted = params.date.toISOString().split("T")[0];
    setTransactionDate(formatted);
  }, []);

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
    if (!description || !amount || !transactionDate) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios!");
      return;
    }

    if (type !== "entrada" && type !== "saida") {
      Alert.alert("Erro", "Tipo inválido: use 'entrada' ou 'saida'");
      return;
    }

    try {
      const formattedAmount = parseFloat(normalizedAmount);
      if (Platform.OS === "web") {
        // salva em memória
        memoryDb.push({
          id: memoryDb.length + 1,
          description,
          type,
          amount: formattedAmount,
          method,
          transaction_date: transactionDate,
          created_at: new Date().toISOString(),
        });
      } else {
        await db!.runAsync(
          "INSERT INTO cashflow (description, type, amount, method, transaction_date) VALUES (?, ?, ?, ?, ?)",
          [description, type, formattedAmount, method, transactionDate]
        );
      }

      Toast.show({
        type: "success",
        text1: "Transação registrada!",
        text2: "Você pode continuar cadastrando.",
      });

      setDescription("");
      setType("entrada");
      setAmount("");
      setMethod("pix");
      setTransactionDate("");
    } catch (error) {
      console.error("Erro ao salvar o registro:", error);
      Alert.alert("Erro", "Erro ao tentar salvar o registro.");
    }

    await checkTransactions();
  };

  return (
    <View style={styles.container}>
      <View style={styles.containerviewedit}>
        <View style={styles.action}>
          <IconButton
            icon={() => (
              <Feather name="dollar-sign" size={20} color="#6A1B9A" />
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
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={type}
            onValueChange={(itemValue) => setType(itemValue)}
            style={styles.picker}
            dropdownIconColor="#6A1B9A"
          >
            <Picker.Item
              label="Entrada"
              value="entrada"
              style={styles.poppinsBold}
            />
            <Picker.Item
              label="Saída"
              value="saida"
              style={styles.poppinsBold}
            />
          </Picker>
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
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={method}
            onValueChange={(val) => setMethod(val)}
            style={styles.picker}
          >
            <Picker.Item label="Pix" value="pix" />
            <Picker.Item label="Cartão" value="cartao" />
            <Picker.Item label="Dinheiro" value="dinheiro" />
            <Picker.Item label="Transferência" value="transferencia" />
          </Picker>
        </View>

        <Text style={styles.poppinsBold}>
          <IconButton icon="calendar" size={20} iconColor="#6A1B9A" />
          Data da transação:
        </Text>
        <TextInput
          value={transactionDate}
          placeholder="YYYY-MM-DD"
          style={styles.input}
          editable={false}
          mode="outlined"
          right={
            <TextInput.Icon icon="calendar" onPress={() => setOpen(true)} />
          }
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

        <Button
          icon={() => <Ionicons name="download" size={20} color="#FFF" />}
          mode="contained"
          style={styles.button}
          onPress={saveTransaction}
        >
          <Text style={styles.buttonText}>Salvar</Text>
        </Button>

        <DatePickerModal
          locale="pt"
          mode="single"
          visible={open}
          onDismiss={onDismiss}
          date={date}
          onConfirm={onConfirm}
        />
        <Toast config={toastConfig} />
      </View>
    </View>
  );
}
