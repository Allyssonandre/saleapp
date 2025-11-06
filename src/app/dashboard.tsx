import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Image, Linking, Pressable, StatusBar, Text, View } from "react-native";
import {
  Appbar,
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  Menu,
  Text as PaperText,
  Portal,
} from "react-native-paper";
import { styles } from "../components/Dashboard/dashboardStyle";

const MORE_ICON = "dots-vertical";

export default function CreateCashflow() {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);

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

      <View style={styles.centeredBox}>
        <Chip
          style={{
            height: 80,
            paddingHorizontal: 20,
            borderRadius: 24,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
          textStyle={{ fontSize: 18 }}
          onPress={() => console.log("Pressed")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={require("../../assets/images/mmautocenter.png")}
              style={{
                width: 120,
                height: 120,
                resizeMode: "contain",
              }}
            />
          </View>
        </Chip>
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
              <Feather name="trending-up" size={20} color="#6A1B9A" />
            )}
            onPress={() => router.push("/createcashflow")}
          />
          <Text
            style={styles.latoBold}
            onPress={() => router.push("/createcashflow")}
          >
            Cadastrar transações
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
