import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Card, Dialog, IconButton, Portal, Text } from "react-native-paper";
import { Footer } from "../components/common/Footer";
import { styles } from "../components/Dashboard/dashboardStyle";
//import { Button } from "@react-navigation/elements";
let db: SQLite.SQLiteDatabase;

import EditTransactionModal from "../components/Transactions/EditTransactionModal";

const getMethodIcon = (method: string) => {
  switch (method) {
    case "pix": return "star-four-points-outline";
    case "cartao": return "credit-card-outline";
    case "dinheiro": return "cash";
    case "transferencia": return "bank-transfer";
    default: return "help-circle-outline";
  }
};

const getMethodLabel = (method: string) => {
  switch (method) {
    case "pix": return "Pix";
    case "cartao": return "Cartão";
    case "dinheiro": return "Dinheiro";
    case "transferencia": return "Transf.";
    default: return method;
  }
};

export default function () {
  const router = useRouter();
  const [transaction, setTransations] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      const setupDatabase = async () => {
        db = await SQLite.openDatabaseAsync("cashflow.db", {
          useNewConnection: true,
        });
        await reloadcash();
      };
      setupDatabase();
    }, [])
  );

  const reloadcash = async () => {
    const updated = await db.getAllAsync(
      "SELECT * FROM cashflow  ORDER BY created_at DESC"
    );
    setTransations(updated);
  };

  /* State for Delete Confirmation */
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  const confirmDelete = (id: number) => {
    setIdToDelete(id);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (idToDelete !== null) {
      try {
        await db.runAsync("DELETE FROM cashflow WHERE id = ?", [idToDelete]);
        await reloadcash();
        setDeleteDialogVisible(false);
        setIdToDelete(null);
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  const openEditModal = (id: number) => {
    setEditingId(id);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Edit Modal */}
      <EditTransactionModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        transactionId={editingId}
        onSuccess={reloadcash}
      />

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          style={{ backgroundColor: "#fff", borderRadius: 12 }}
        >
          <Dialog.Icon icon="alert-circle-outline" size={40} color="#E53935" />
          <Dialog.Title style={{ textAlign: "center", color: "#E53935" }}>
            Excluir Transação
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ textAlign: "center", fontSize: 16, color: "#333" }}>
              Tem certeza que deseja apagar este item permanentemente?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: "space-around", paddingBottom: 20 }}>
            <Button
              onPress={() => setDeleteDialogVisible(false)}
              mode="outlined"
              textColor="#555"
              style={{ borderColor: "#ccc", width: "40%" }}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleDelete}
              mode="contained"
              buttonColor="#E53935"
              style={{ width: "40%" }}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={[styles.containerviewedit, { marginTop: 40 }]}>
        <IconButton
          icon={() => (
            <Feather name="corner-up-left" size={20} color="#6A1B9A" />
          )}
          onPress={() => router.push("/finances")}
        />
        <Pressable
          style={styles.btnRow}
          onPress={() => router.push("/createcashflow")}
        >
          <Feather name="trending-up" size={20} color="#6A1B9A" />
          <Text style={styles.latoBold}>Criar transações</Text>
        </Pressable>
      </View>
      <Card.Title
        title="💰 Histórico de Transações"
        titleStyle={{ fontWeight: "bold", color: "#6A1B9A" }}
      />
      <ScrollView
        style={{ padding: 16 }}
        contentContainerStyle={{ paddingBottom: 100 }}
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
                  <Text style={[styles.headerCell, { flex: 2 }]}>Método</Text>
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
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <MaterialCommunityIcons name={getMethodIcon(item.method)} size={16} color="#444" />
                    <Text style={{ fontSize: 12, color: "#444" }}>
                      {getMethodLabel(item.method)}
                    </Text>
                  </View>
                </View>

                {/* Ações */}
                {/* Ações */}
                {/* Ações */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4, // Reduced margin
                    borderTopWidth: 1,
                    borderTopColor: "#eee",
                    paddingTop: 4, // Reduced padding
                  }}
                >
                  <View
                    style={{
                      backgroundColor:
                        item.type === "entrada" ? "#E8F5E9" : "#FFEBEE",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: item.type === "entrada" ? "#2E7D32" : "#C62828",
                        fontSize: 12,
                        fontWeight: "bold",
                        textTransform: "capitalize",
                      }}
                    >
                      {item.type}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Button
                      icon="pencil"
                      mode="outlined"
                      compact
                      textColor="#6A1B9A"
                      style={{ borderColor: "#6A1B9Aaa" }}
                      onPress={() => openEditModal(item.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      icon="trash-can"
                      mode="outlined"
                      compact
                      textColor="#E53935"
                      style={{ borderColor: "#E53935aa" }}
                      onPress={() => confirmDelete(item.id)}
                    >
                      Excluir
                    </Button>
                  </View>
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
              Criar transações
            </Button>
          </Text>
        )}
      </ScrollView>

      <Footer />
    </View>
  );
}

