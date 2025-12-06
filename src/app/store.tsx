import Feather from "@expo/vector-icons/Feather";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Platform, StatusBar, Text, View } from "react-native";
import {
  Appbar,
  Button,
  Card,
  Dialog,
  IconButton,
  Portal,
  TextInput,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { Footer } from "../components/common/Footer";
import { styles } from "../components/store/storeStyles";

let db: SQLite.SQLiteDatabase;
function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function Store() {
  const [products, setProducts] = useState<any[]>([]);
  const [visibleReplenish, setVisibleReplenish] = useState(false);
  const [visibleEdit, setVisibleEdit] = useState(false);
  const [visibleBoleto, setVisibleBoleto] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [editName, setEditName] = useState("");
  const [editCount, setEditCount] = useState("");
  const [editCost, setEditCost] = useState("");
  const [replenishAmount, setReplenishAmount] = useState("1");
  const [clientName, setClientName] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("1");
  // 🔹 NOVO: States para controle do dialog de exclusão
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  // 🔹 NOVO: States para o diálogo de reset
  const [resetDialogVisible, setResetDialogVisible] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const setupDatabase = async () => {
      db = await SQLite.openDatabaseAsync("products.db", {
        useNewConnection: true,
      });
      await reloadProducts();
    };

    setupDatabase();
  }, []);

  const reloadProducts = async () => {
    const updated = await db.getAllAsync("SELECT * FROM products");
    setProducts(updated);
  };
  // Quantidade

  // 🔹 ALTERADO: Abre o dialog de confirmação
  const confirmResetStore = () => {
    if (products.length === 0) {
      Toast.show({
        type: "info",
        text1: "Estoque já está vazio.",
        text1Style: {
          fontSize: 21,
          color: "#6A1B9A",
        },
        props: {
          borderLeftColor: "#6A1B9A",
        },
        text2: "abasteça seu estoque",
        text2Style: { fontSize: 19, color: "#6A1B9A" },
      });
      return;
    }
    setResetDialogVisible(true);
  };

  // 🔹 ALTERADO: Executa o reset após fechar o dialog
  const executeResetStore = async () => {
    try {
      setResetDialogVisible(false); // Fecha o dialog
      await db.execAsync("DELETE FROM products");
      setProducts([]);

      Toast.show({
        type: "success",
        text1: "Estoque resetado.",
        text1Style: {
          fontSize: 20,
          color: "#6A1B9A",
        },
        position: "top",
        visibilityTime: 3000,
        props: {
          borderLeftColor: "#6A1B9A",
        },
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Erro ao resetar o estoque",
        text2: String(error),
      });
    }
  };

  // 🔹 NOVO: Função para exportar produtos em CSV
  const exportProductsCSV = async () => {
    try {
      if (products.length === 0) {
        Toast.show({
          type: "info",
          text1: "Nenhum produto para exportar",
          text1Style: { fontSize: 20, fontWeight: "600" },
        });
        return;
      }

      // Cabeçalho do CSV
      let csv = "ID,Nome do Produto,Quantidade,Custo (R$)\n";

      // Adiciona cada produto
      products.forEach((product) => {
        csv += `${product.id},"${product.nameProduct}",${product.count},"${product.cost}"\n`;
      });

      // Salva o arquivo CSV
      const fileUri = FileSystem.cacheDirectory + "estoque_produtos.csv";
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Compartilha o arquivo
      await Sharing.shareAsync(fileUri);

      Toast.show({
        type: "success",
        text1: "CSV exportado com sucesso!",
        text1Style: { fontSize: 20, fontWeight: "600" },
      });
    } catch (err) {
      console.error("Erro ao gerar CSV:", err);
      Toast.show({
        type: "error",
        text1: "Erro ao exportar CSV",
        text1Style: { fontSize: 20, fontWeight: "600" },
      });
    }
  };

  const openReplenishDialog = (product: any) => {
    setSelectedProduct(product);
    setReplenishAmount("1");
    setVisibleReplenish(true);
  };

  const handleReplenish = async () => {
    if (!selectedProduct) return;
    if (isNaN(Number(replenishAmount)) || Number(replenishAmount) <= 0) {
      Alert.alert("Erro", "Informe uma quantidade válida para reabastecer");
      return;
    }
    const newCount =
      parseInt(selectedProduct.count) + parseInt(replenishAmount);
    await db.runAsync(`UPDATE products SET count = ? WHERE id = ?`, [
      newCount,
      selectedProduct.id,
    ]);
    setVisibleReplenish(false);
    setSelectedProduct(null);
    await reloadProducts();
    Toast.show({
      type: "success",
      text1: "Estoque reabastecido",
      text1Style: { fontSize: 21, color: "#6A1B9A" },
    });
  };

  const openEditDialog = (product: any) => {
    setSelectedProduct(product);
    setEditName(product.nameProduct);
    setEditCount(product.count.toString());
    setEditCost(product.cost);
    setVisibleEdit(true);
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    if (!editName.trim()) {
      Alert.alert("Erro", "Nome do produto não pode ser vazio");
      return;
    }
    if (isNaN(Number(editCount)) || Number(editCount) < 0) {
      Alert.alert("Erro", "Quantidade inválida");
      return;
    }

    const costNormalized = editCost.replace(",", ".");
    if (isNaN(Number(costNormalized)) || Number(costNormalized) < 0) {
      Alert.alert("Erro", "Custo inválido");
      return;
    }

    await db.runAsync(
      `UPDATE products SET nameProduct = ?, count = ?, cost = ? WHERE id = ?`,
      [editName, editCount, costNormalized, selectedProduct.id]
    );

    setVisibleEdit(false);
    setSelectedProduct(null);
    await reloadProducts();
    Toast.show({
      type: "success",
      text1: "Produto editado",
      text1Style: { fontSize: 21, color: "#6A1B9A" },
    });
  };

  // 🔹 ALTERADO: Agora confirmDelete apenas abre o dialog
  const confirmDelete = (productId: number, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setDeleteDialogVisible(true);
  };

  // 🔹 ALTERADO: Agora executeDelete fecha o dialog antes de excluir
  const executeDelete = async (productId: number) => {
    try {
      setDeleteDialogVisible(false); // 🔹 Fecha o dialog
      await db.runAsync("DELETE FROM products WHERE id = ?", [productId]);
      await reloadProducts();
      Toast.show({
        type: "success",
        text1: "Produto excluído",
        text1Style: { fontSize: 21, color: "#6A1B9A" },
      });
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      Toast.show({ type: "error", text1: "Erro ao excluir produto" });
    }
  };

  const openBoletoDialog = (product: any) => {
    setSelectedProduct(product);
    setClientName("");
    setSaleQuantity("1");
    setVisibleBoleto(true);
  };

  const getDueDate = (daysToAdd = 3) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString();
  };

  // BOLETO
  const handleGenerateBoleto = async () => {
    if (!clientName.trim()) {
      Alert.alert("Erro", "Informe o nome do cliente");
      return;
    }

    const quantity = parseInt(saleQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert("Erro", "Informe uma quantidade válida");
      return;
    }

    const currentStock = parseInt(selectedProduct.count);
    if (quantity > currentStock) {
      Alert.alert(
        "Erro",
        `Estoque insuficiente. Apenas ${currentStock} unidades disponíveis.`
      );
      return;
    }

    const newCount = currentStock - quantity;
    await db.runAsync("UPDATE products SET count = ? WHERE id = ?", [
      newCount,
      selectedProduct.id,
    ]);

    setVisibleBoleto(false);
    setSelectedProduct(null);
    await reloadProducts();

    // Carregar imagem e converter para Base64
    let logoHtml = "";
    try {
      const asset = Asset.fromModule(
        require("../../assets/images/mmautocenter.png")
      );
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(
        asset.localUri || asset.uri,
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );
      logoHtml = `<img src="data:image/png;base64,${base64}" style="width: 100px; margin-bottom: 10px;" />`;
    } catch (e) {
      console.log("Erro ao carregar imagem para PDF:", e);
    }

    const currentDate = new Date().toLocaleDateString();
    const unitPrice = parseFloat(selectedProduct?.cost || "0"); // custo unitário
    const quantityNumber = parseInt(quantity.toString(), 10); // quantidade (número inteiro)
    const total = (unitPrice * quantityNumber).toFixed(2); // valor total com 2 casas decimais
    const html = `
     <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 30px;
        background-color: #f5f5f5;
      }

      .container {
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 25px;
        max-width: 600px;
        margin: auto;
        border-top: 6px solid #6A1B9A;
      }

      .header {
        text-align: center;
        padding-bottom: 15px;
        border-bottom: 2px solid #e0e0e0;
      }
      
      .header img {
        display: block;
        margin: 0 auto;
      }

      .header h2 {
        margin: 0;
        color: #6A1B9A;
      }

      /* ... styles ... */
      
      .section {
        margin-top: 20px;
      }
      
      .field {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 15px;
      }
      
      .label {
        font-weight: bold;
        color: #333;
      }
      
      .value {
        color: #555;
      }
      
      .total {
        font-size: 18px;
        font-weight: bold;
        color: #6A1B9A;
        border-top: 2px solid #e0e0e0;
        padding-top: 10px;
      }
      
      .footer {
        margin-top: 25px;
        font-size: 12px;
        color: #777;
        text-align: center;
        border-top: 1px dashed #ccc;
        padding-top: 8px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        ${logoHtml}
        <h2>MM Auto Center</h2>
        <p>ALINHAMENTO, BALANCEAMENTO E CAMBAGEM</p>
        <h2>Comprovante de Pagamento</h2>
        <p style="font-size: 13px; color: #777;">Boleto Simulado</p>
      </div>

      <div class="section">
        <div class="field">
          <span class="label">Cliente:</span>
          <span class="value">${clientName}</span>
        </div>
        <div class="field">
          <span class="label">Produto:</span>
          <span class="value">${selectedProduct?.nameProduct}</span>
        </div>
        <div class="field">
          <span class="label">Quantidade:</span>
          <span class="value">${quantityNumber}</span>
        </div>
        <div class="field">
          <span class="label">Valor Unitário:</span>
          <span class="value">R$ ${unitPrice.toFixed(2)}</span>
        </div>
        <div class="field total">
          <span>Total:</span>
          <span>R$ ${total}</span>
        </div>
        <div class="field">
          <span class="label">Data de Emissão:</span>
          <span class="value">${currentDate}</span>
        </div>
        <div class="field">
          <span class="label">Vencimento:</span>
          <span class="value">${getDueDate(3)}</span>
        </div>
      </div>

      <div class="footer">
        Este comprovante é gerado apenas para fins de demonstração.
      </div>
    </div>
  </body>
</html>

    `;

    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      if (
        Platform.OS === "android" ||
        Platform.OS === "ios" ||
        Platform.OS === "web"
      ) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartilhar boleto",
        });
      }

      Toast.show({
        type: "success",
        text1: "Boleto gerado!",
        text2: `Cliente: ${clientName}`,
        text1Style: {
          fontSize: 20, // aumenta fonte do título
          fontWeight: "bold",
        },
        text2Style: {
          fontSize: 18, // aumenta fonte do subtítulo
        },
      });
    } catch (err) {}
  };

  const totalStockValue = products.reduce((sum, item) => {
    const cost = parseFloat(item.cost.toString().replace(",", "."));
    const count = parseInt(item.count.toString());
    return sum + (isNaN(cost) || isNaN(count) ? 0 : cost * count);
  }, 0);

  return (
    <View style={styles.container}>
      <Appbar.Header
        style={{
          backgroundColor: "#fff",
          marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <Appbar.BackAction
          onPress={() => router.push("/dashboard")}
          color="#6A1B9A"
        />
        <Appbar.Content
          title="Estoque"
          titleStyle={{ color: "#6A1B9A", fontWeight: "bold" }}
        />
        {products.length > 0 && (
          <View style={{ flexDirection: "row" }}>
            <IconButton
              icon="delete-sweep"
              iconColor="#d32f2f"
              onPress={confirmResetStore}
            />
          </View>
        )}
      </Appbar.Header>

      {products.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 50,
          }}
        >
          <Feather name="package" size={60} color="#ccc" />
          <Text style={{ color: "#999", fontSize: 16, marginTop: 10 }}>
            Seu estoque está vazio.
          </Text>
          <Button
            mode="contained"
            style={{ marginTop: 20, backgroundColor: "#6A1B9A" }}
            labelStyle={{color: "#fff"}}
            onPress={() => router.push("/createform")}
          >
            Adicionar Primeiro Produto
          </Button>
        </View>
      ) : null}

      {products.length > 0 && (
        <Card style={{ margin: 10, backgroundColor: "#6A1B9A", padding: 10 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
                Valor Total em Estoque
              </Text>
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
                R$ {totalStockValue.toFixed(2).replace(".", ",")}
              </Text>
            </View>
            <IconButton
              icon="file-delimited"
              iconColor="#fff"
              onPress={exportProductsCSV}
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            />
          </View>
        </Card>
      )}

      <FlatList
        data={products}
        contentContainerStyle={{ padding: 10, paddingBottom: 150 }}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Card
            style={{ marginBottom: 15, backgroundColor: "#fff", elevation: 3 }}
          >
            <Card.Title
              title={capitalizeFirstLetter(item.nameProduct)}
              subtitle={`Qtd: ${item.count} | Custo: R$ ${item.cost}`}
              titleStyle={{ fontWeight: "bold", color: "#6A1B9A" }}
              subtitleStyle={{ color: "#777" }}
              left={(props) => (
                <Feather {...props} name="package" size={30} color="#6A1B9A" />
              )}
            />
            <Card.Actions>
              {parseInt(item.count) <= 0 ? (
                <Button
                  mode="contained"
                  onPress={() => openReplenishDialog(item)}
                  buttonColor="#D32F2F"
                  textColor="#fff"
                  compact
                >
                  Reabastecer
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={() => openBoletoDialog(item)}
                  textColor="#6A1B9A"
                  style={{ borderColor: "#6A1B9A" }}
                  compact
                >
                  Vender
                </Button>
              )}

              <View style={{ flex: 1 }} />

              <IconButton
                icon="pencil"
                iconColor="#6A1B9A"
                size={20}
                mode="contained"
                onPress={() => openEditDialog(item)}
                containerColor="#f0e6f5"
                style={{ marginHorizontal: 2 }}
              />
              <IconButton
                icon="delete"
                iconColor="#D32F2F"
                size={20}
                mode="contained"
                onPress={() => confirmDelete(item.id, item.nameProduct)}
                containerColor="#ffebee"
                style={{ marginHorizontal: 2 }}
              />
            </Card.Actions>
          </Card>
        )}
      />

      {products.length > 0 && (
        <Button
          icon="plus"
          mode="contained"
          textColor="#fff"
          style={{
            position: "absolute",
            bottom: 80,
            right: 20,
            backgroundColor: "#6A1B9A",
            elevation: 5,
          }}
          onPress={() => router.push("/createform")}
        >
          Novo Produto
        </Button>
      )}
      {/* Modal Reabastecer */}
      <Portal>
        <Dialog
          visible={visibleReplenish}
          style={styles.modalBackground}
          onDismiss={() => setVisibleReplenish(false)}
        >
          <Dialog.Title style={{ color: "#6A1B9A" }}>
            Reabastecer Estoque
          </Dialog.Title>
          <Dialog.Content>
            <Text
              style={{ color: "#6A1B9A", fontSize: 18, fontWeight: "bold" }}
            >
              Produto: {selectedProduct?.nameProduct}
            </Text>
            <TextInput
              mode="outlined"
              label="Quantidade"
              keyboardType="numeric"
              value={replenishAmount}
              onChangeText={setReplenishAmount}
              style={{ marginTop: 16 }}
              outlineColor="#6A1B9A"
              theme={{
                colors: {
                  background: "#FFFFFF",

                  placeholder: "#999",
                },
              }}
              textColor="#000"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisibleReplenish(false)}>
              <MaterialIcons name="cancel" size={22} color="#6A1B9A" />{" "}
              <Text style={styles.textButton}>Cancelar</Text>
            </Button>
            <Button onPress={handleReplenish}>
              <MaterialIcons name="save-alt" size={24} color="#6A1B9A" />{" "}
              <Text style={styles.textButton}>Salvar</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal Editar */}
      <Portal>
        <Dialog
          visible={visibleEdit}
          onDismiss={() => setVisibleEdit(false)}
          style={styles.modalBackground}
        >
          <Dialog.Title style={styles.textcolor}>Editar Produto</Dialog.Title>
          <Dialog.Content style={styles.modalBackground}>
            <TextInput
              mode="outlined"
              label="Nome do Produto"
              value={editName}
              onChangeText={setEditName}
              style={{
                marginBottom: 12,
                color: "#6A1B9A",
                backgroundColor: "#fff",
              }}
              theme={{
                colors: {
                  background: "#FFFFFF",
                  primary: "#6A1B9A", // cor do label e foco
                  text: "#000000", // cor do texto digitado
                  placeholder: "#999999", // cor do label quando não focado
                },
              }}
              outlineColor="#6A1B9A"
              textColor="#000"
            />
            <TextInput
              mode="outlined"
              label="Quantidade"
              keyboardType="numeric"
              value={editCount}
              onChangeText={setEditCount}
              style={{
                marginBottom: 12,
                color: "#6A1B9A",
                backgroundColor: "#fff",
              }}
              theme={{
                colors: {
                  background: "#FFFFFF",
                  primary: "#6A1B9A", // cor do label e foco
                  text: "#000000", // cor do texto digitado
                  placeholder: "#999999", // cor do label quando não focado
                },
              }}
              textColor="#000"
              outlineColor="#6A1B9A"
            />
            <TextInput
              mode="outlined"
              label="Custo (R$)"
              keyboardType="numeric"
              value={editCost}
              onChangeText={setEditCost}
              style={{ marginBottom: 12, color: "#6A1B9A" }}
              theme={{
                colors: {
                  background: "#FFFFFF",
                  primary: "#6A1B9A", // cor do label e foco
                  text: "#000000", // cor do texto digitado
                  placeholder: "#999999", // cor do label quando não focado
                },
              }}
              textColor="#000"
              outlineColor="#6A1B9A"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisibleEdit(false)}>
              <MaterialIcons name="cancel" size={22} color="#6A1B9A" />{" "}
              <Text style={styles.textButton}>Cancelar</Text>
            </Button>
            <Button onPress={handleEdit}>
              <MaterialIcons name="save-alt" size={24} color="#6A1B9A" />{" "}
              <Text style={styles.textButton}>Salvar</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal Boleto */}
      <Portal>
        <Dialog
          visible={visibleBoleto}
          onDismiss={() => setVisibleBoleto(false)}
          style={{ backgroundColor: "#fff" }}
        >
          <Dialog.Title style={styles.textcolor}>
            <Feather name="paperclip" size={19} color="#6A1B9A" /> Gerar Boleto
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.textcolor}>
              PRODUTO: {selectedProduct?.nameProduct}
            </Text>
            <TextInput
              label="NOME DO CLIENTE"
              value={clientName}
              onChangeText={setClientName}
              style={{
                marginTop: 12,
                color: "#6A1B9A",
                backgroundColor: "#fff",
                fontWeight: "bold",
              }}
              textColor="#000"
            />
            <TextInput
              label="QUANTIDADE"
              keyboardType="numeric"
              value={saleQuantity}
              onChangeText={setSaleQuantity}
              style={{
                marginTop: 12,
                color: "#6A1B9A",
                backgroundColor: "#fff",
                fontWeight: "bold",
              }}
              textColor="#000"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisibleBoleto(false)}>
              <MaterialIcons name="cancel" size={22} color="#6A1B9A" />
              <Text style={styles.textButton}>CANCELAR</Text>
            </Button>
            <Button onPress={handleGenerateBoleto}>
              <MaterialIcons name="save-alt" size={24} color="#6A1B9A" />{" "}
              <Text style={styles.textButton}>GERAR</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      {/* 🔹 NOVO: Dialog de exclusão */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
          style={{ backgroundColor: "#fff" }}
        >
          <Dialog.Title style={{ color: "#6A1B9A", fontWeight: "bold" }}>
            Excluir Produto
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontSize: 16 }}>
              Tem certeza que deseja excluir{" "}
              <Text style={{ fontWeight: "bold", color: "#6A1B9A" }}>
                {productToDelete?.name}
              </Text>
              ?
            </Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: "#999" }}>
              Essa ação não poderá ser desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: "space-between" }}>
            <Button
              onPress={() => setDeleteDialogVisible(false)}
              textColor="#6A1B9A"
            >
              <MaterialIcons name="cancel" size={22} color="#6A1B9A" /> Cancelar
            </Button>
            <Button
              onPress={() => {
                if (productToDelete) {
                  executeDelete(productToDelete.id);
                }
              }}
              textColor="white"
              style={{ backgroundColor: "red" }}
            >
              <MaterialIcons name="delete" size={22} color="#fff" /> Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      {/* 🔹 NOVO: Dialog de reset do estoque */}
      <Portal>
        <Dialog
          visible={resetDialogVisible}
          onDismiss={() => setResetDialogVisible(false)}
          style={{ backgroundColor: "#fff" }}
        >
          <Dialog.Title style={{ color: "#6A1B9A", fontWeight: "bold" }}>
            Resetar Estoque
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontSize: 16 }}>
              Deseja realmente resetar todo o estoque?
            </Text>
            <Text style={{ marginTop: 8, fontSize: 14, color: "#999" }}>
              Essa ação excluirá todos os produtos e não poderá ser desfeita.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: "space-between" }}>
            <Button
              onPress={() => setResetDialogVisible(false)}
              textColor="#6A1B9A"
            >
              <MaterialIcons name="cancel" size={22} color="#6A1B9A" /> Cancelar
            </Button>
            <Button
              onPress={executeResetStore}
              textColor="white"
              style={{ backgroundColor: "red" }}
            >
              <MaterialIcons name="delete" size={22} color="#fff" /> Resetar
              Estoque
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Toast />
      <Footer />
    </View>
  );
}
