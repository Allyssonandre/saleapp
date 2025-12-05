import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Linking, Pressable, StatusBar, Text, View } from "react-native";
import {
  Appbar,
  Button,
  Card,
  Dialog,
  Divider,
  IconButton,
  Menu,
  Text as PaperText,
  Portal
} from "react-native-paper";
import { styles } from "../components/Dashboard/dashboardStyle";

const MORE_ICON = "dots-vertical";

export default function CreateCashflow() {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // 🔹 Referência para banco SQLite
  let db: SQLite.SQLiteDatabase;

  // Verifica estoque baixo (exemplo, pode remover se não precisar)
  useEffect(() => {
    const checkLowStock = async () => {
      try {
        const db = await SQLite.openDatabaseAsync("products.db");
        const result = await db.getAllAsync(
          "SELECT nameProduct FROM products WHERE count <= 1"
        );
        if (result.length > 0) setShowDialog(true);
      } catch (error) {
        console.error("Erro ao verificar estoque:", error);
      }
    };
    checkLowStock();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <Appbar.Header style={{ backgroundColor: "#6A1B9A" }}>
        <View style={styles.iconGroup}>
          <Pressable
            onPress={() =>
              Linking.openURL(
                "http://api.whatsapp.com/send?phone=558499222-4980"
              )
            }
          >
            <FontAwesome5
              name="whatsapp"
              size={24}
              color="#fff"
              style={styles.icon}
            />
          </Pressable>

          <Pressable onPress={() => Linking.openURL("https://facebook.com/")}>
            <FontAwesome5
              name="facebook-f"
              size={24}
              color="#fff"
              style={styles.icon}
            />
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("https://www.instagram.com/")}
          >
            <Feather
              name="instagram"
              size={24}
              color="#fff"
              style={styles.icon}
            />
          </Pressable>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon={MORE_ICON}
              color="#fff"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              router.push("/createform");
            }}
            title="Criar estoque"
            style={{
              backgroundColor: "#fff",
              borderWidth: 0,
              borderColor: "transparent",
              elevation: 0,
              shadowOpacity: 0,
            }}
            titleStyle={{ color: "#6A1B9A" }}
            leadingIcon={() => (
              <MaterialCommunityIcons
                name="plus-box"
                size={24}
                color="#6A1B9A"
              />
            )}
          />
        </Menu>
      </Appbar.Header>


      {/* Seção de Ajuda */}
      <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8 }}>
        <Card
          style={{
            backgroundColor: showHelp ? "#F3E5F5" : "#fff",
            elevation: 3,
            borderRadius: 12,
          }}
        >
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="help-circle" size={24} color="#6A1B9A" />
                <PaperText
                  variant="titleMedium"
                  style={{ color: "#6A1B9A", fontWeight: "bold" }}
                >
                  Como usar o app
                </PaperText>
              </View>
              <IconButton
                icon={showHelp ? "chevron-up" : "chevron-down"}
                iconColor="#6A1B9A"
                onPress={() => setShowHelp(!showHelp)}
              />
            </View>

            {showHelp && (
              <View style={{ marginTop: 12 }}>
                <Divider style={{ marginBottom: 12 }} />

                {/* Estoque */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="archive" size={18} color="#6A1B9A" />
                    <PaperText
                      variant="titleSmall"
                      style={{ color: "#6A1B9A", fontWeight: "bold" }}
                    >
                      Estoque
                    </PaperText>
                  </View>
                  <PaperText variant="bodyMedium" style={{ marginTop: 4, color: "#555" }}>
                    Gerencie seus produtos: cadastre novos itens, edite informações,
                    controle quantidades, reabasteça quando necessário e gere boletos
                    de vendas. O sistema alerta quando o estoque está baixo.
                  </PaperText>
                </View>

                {/* Cadastrar Transações */}
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="trending-up" size={18} color="#6A1B9A" />
                    <PaperText
                      variant="titleSmall"
                      style={{ color: "#6A1B9A", fontWeight: "bold" }}
                    >
                      Cadastrar Transações
                    </PaperText>
                  </View>
                  <PaperText variant="bodyMedium" style={{ marginTop: 4, color: "#555" }}>
                    Registre todas as movimentações financeiras do seu negócio.
                    Informe se é entrada ou saída, o valor, método de pagamento
                    (Pix, Cartão, Dinheiro, Transferência) e a data. Mantenha seu
                    controle financeiro sempre atualizado.
                  </PaperText>
                </View>

                {/* Fluxo de Caixa */}
                <View style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Feather name="dollar-sign" size={18} color="#6A1B9A" />
                    <PaperText
                      variant="titleSmall"
                      style={{ color: "#6A1B9A", fontWeight: "bold" }}
                    >
                      Fluxo de Caixa
                    </PaperText>
                  </View>
                  <PaperText variant="bodyMedium" style={{ marginTop: 4, color: "#555" }}>
                    Visualize relatórios completos das suas finanças: movimentações
                    diárias, mensais e anuais, análise por método de pagamento e
                    valores acumulados. Exporte relatórios profissionais em PDF ou
                    CSV para análise e compartilhamento.
                  </PaperText>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>

      <View style={styles.containerviewedit}>
        <View style={styles.action}>
          <IconButton
            icon={() => <Feather name="archive" size={20} color="#6A1B9A" />}
            onPress={() => router.push("/store")}
          />
          <Text style={styles.latoBold} onPress={() => router.push("/store")}>
            Estoque
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

      <Divider style={{ width: "80%", alignSelf: "center" }} />

      <Portal>
        <Dialog
          visible={showDialog}
          onDismiss={() => setShowDialog(false)}
          style={{ backgroundColor: "#fff" }}
        >
          <Dialog.Icon icon="store" color="#6A1B9A" />
          <Dialog.Title style={{ color: "#6A1B9A" }}>Atenção</Dialog.Title>
          <Dialog.Content>
            <PaperText
              variant="bodyMedium"
              style={{ color: "#6A1B9A", fontSize: 18 }}
            >
              Alguns produtos estão com estoque quase acabando!!
            </PaperText>
          </Dialog.Content>
          <Dialog.Actions style={{ backgroundColor: "#6A1B9A" }}>
            <Button onPress={() => setShowDialog(false)}>
              <Text style={{ color: "#fff" }}>OK</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
