import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Card, IconButton, Text } from "react-native-paper";
import { styles } from "../components/Dashboard/dashboardStyle";
//import { Button } from "@react-navigation/elements";
let db: SQLite.SQLiteDatabase;

export default function () {
  const router = useRouter();
  const [transaction, setTransations] = useState<any[]>([]);

  useEffect(() => {
    const setupDatabase = async () => {
      db = await SQLite.openDatabaseAsync("cashflow.db", {
        useNewConnection: true,
      });
      await reloadcash();
    };

    setupDatabase();
  }, []);

  const reloadcash = async () => {
    const updated = await db.getAllAsync(
      "SELECT * FROM cashflow  ORDER BY created_at DESC"
    );
    setTransations(updated);
  };

  
  return (
    <View style={styles.container}>
      <View style={styles.containerviewedit}>
        <View style={styles.action}>
          <IconButton
            icon={() => <Feather name="home" size={20} color="#6A1B9A" />}
            onPress={() => router.push("/dashboard")}
          />
          <Text
            style={styles.latoBold}
            onPress={() => router.push("/dashboard")}
          >
            Dashboard
          </Text>
        </View>

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
      <Card.Title
        title="💰 Histórico de Transações"
        titleStyle={{ fontWeight: "bold", color: "#6A1B9A" }}
      />
      <ScrollView
        style={{ padding: 16 }}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {transaction.length > 0 ? (
          transaction.map((item, index) => (
            <Card key={index} style={styles.carddata} mode="elevated">
              <Card.Content>
                {/* Cabeçalho tipo Excel */}
                <View style={styles.headerRow}>
                  <Text style={[styles.headerCell, { flex: 3 }]}>
                    Descrição
                  </Text>
                  <Text style={[styles.headerCell, { flex: 2 }]}>Valor</Text>
                  <Text style={[styles.headerCell, { flex: 2 }]}>Tipo</Text>
                  <Text style={[styles.headerCell, { flex: 2 }]}>Data</Text>
                </View>

                <View style={styles.divider} />

                {/* Valores da transação */}
                <View style={styles.valueRow}>
                  <Text style={[styles.valueCell, { flex: 3 }]}>
                    {item.description}
                  </Text>
                  <Text
                    style={[
                      styles.valueCell,
                      {
                        flex: 2,
                        color: item.type === "entrada" ? "#2ecc71" : "#e74c3c",
                      },
                    ]}
                  >
                    {item.type === "entrada" ? "+ " : "- "}R${" "}
                    {Math.abs(item.amount).toFixed(2).replace(".", ",")}
                  </Text>
                  <Text style={[styles.valueCell, { flex: 2 }]}>
                    {item.type}
                  </Text>
                  <Text style={[styles.valueCell, { flex: 2 }]}>
                    {item.date}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text
            style={styles.empty}
            onPress={() => router.push("/createcashflow")}
          >
            Nenhuma transação encontrada!!
            <Button
              icon={() => <Feather name="trending-up" size={20} color="#fff" />}
              mode="contained"
              style={{
                backgroundColor: "#520f7cff",
                width: 150,
              }}
              labelStyle={{ color: "#fff" }}
               onPress={() => router.push("/createcashflow")}
            >
              Cadastrar
            </Button>
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
//created_at
