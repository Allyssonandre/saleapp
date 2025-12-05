import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Fontisto from "@expo/vector-icons/Fontisto";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  IconButton,
  Menu,
  Text as PaperText,
  Portal,
} from "react-native-paper";
import Toast from "react-native-toast-message";
import { Footer } from "../components/common/Footer";

import { useFocusEffect } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useCallback, useState } from "react";
import { styles } from "../components/Dashboard/dashboardStyle";
const MORE_ICON = "dots-vertical";
let db: SQLite.SQLiteDatabase;

export default function Finances() {
  const [menuVisible, setMenuVisible] = useState(false);

  // Helper para formatar data YYYY-MM-DD -> DD/MM/YYYY
  const formatDatePTBR = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  // Helper para formatar mês YYYY-MM -> MM/YYYY
  const formatMonthPTBR = (monthString: string) => {
    if (!monthString) return "";
    const [year, month] = monthString.split("-");
    return `${month}/${year}`;
  };
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [cash, setCash] = useState<any[]>([]);

  // Hoje
  const [fluxoDiario, setFluxoDiario] = useState<any[]>([]);
  const [fluxoMensal, setFluxoMensal] = useState<any[]>([]);
  const [fluxoMetodo, setFluxoMetodo] = useState<any[]>([]);
  const [fluxoAnual, setFluxoAnual] = useState<any[]>([]);
  const [dbReady, setDbReady] = useState(false);

  const [acumuladoEntradaAtual, setAcumuladoEntradaAtual] = useState<any[]>([]);
  const [acumuladoSaidaAtual, setAcumuladoSaidaAtual] = useState<any[]>([]);
  const [acumuladoGeral, setAcumuladoGeral] = useState<any[]>([]);

  // Hoje
  useFocusEffect(
    useCallback(() => {
      const setupDB = async () => {
        if (Platform.OS === "web") {
          console.warn("SQLite não suportado na Web");
          setDbReady(true);
          return;
        }

        db = await SQLite.openDatabaseAsync("cashflow.db", {
          useNewConnection: true,
        });

        // cria views caso não existam
        await db.execAsync(`
             CREATE VIEW IF NOT EXISTS fluxo_diario AS
             SELECT 
                 transaction_date AS dia,
                 SUM(CASE WHEN type='entrada' THEN amount ELSE 0 END) AS total_entradas,
                 SUM(CASE WHEN type='saida' THEN amount ELSE 0 END) AS total_saidas,
                 SUM(CASE WHEN type='entrada' THEN amount ELSE -amount END) AS saldo
             FROM cashflow
             GROUP BY transaction_date
             ORDER BY dia DESC;
           `);

        await db.execAsync(`
             CREATE VIEW IF NOT EXISTS fluxo_mensal AS
             SELECT 
                 strftime('%Y-%m', transaction_date) AS mes,
                 SUM(CASE WHEN type='entrada' THEN amount ELSE 0 END) AS total_entradas,
                 SUM(CASE WHEN type='saida' THEN amount ELSE 0 END) AS total_saidas,
                 SUM(CASE WHEN type='entrada' THEN amount ELSE -amount END) AS saldo
             FROM cashflow
             GROUP BY strftime('%Y-%m', transaction_date)
             ORDER BY mes DESC;
           `);

        await db.execAsync(`
             CREATE VIEW IF NOT EXISTS fluxo_metodo AS
             SELECT 
                 method,
                 SUM(CASE WHEN type='entrada' THEN amount ELSE 0 END) AS total_entradas,
                 SUM(CASE WHEN type='saida' THEN amount ELSE 0 END) AS total_saidas,
                 SUM(CASE WHEN type='entrada' THEN amount ELSE -amount END) AS saldo
             FROM cashflow
             GROUP BY method
             ORDER BY saldo DESC;
           `);

        await db.execAsync(`
             CREATE VIEW IF NOT EXISTS fluxo_anual AS
             SELECT 
                 strftime('%Y', transaction_date) AS ano,
                 SUM(CASE WHEN type='entrada' THEN amount ELSE 0 END) AS total_entradas_ano
             FROM cashflow
             GROUP BY strftime('%Y', transaction_date)
             ORDER BY ano DESC;
           `);

        await db.execAsync(`
             CREATE VIEW IF NOT EXISTS fluxo_entrada_acumulado AS
             SELECT 
             DATE('now') AS data_atual,
             SUM(amount) AS total_entradas_acumulado
             FROM cashflow
             WHERE type = 'entrada'
             AND DATE(transaction_date) <= DATE('now');
           `);

        await db.execAsync(`
             CREATE VIEW IF NOT EXISTS fluxo_saida_acumulado AS
             SELECT 
             DATE('now') AS data_atual,
             SUM(amount) AS total_saidas_acumulado
             FROM cashflow
             WHERE type = 'saida'
             AND DATE(transaction_date) <= DATE('now');
           `);
        await db.execAsync(`
             CREATE VIEW IF NOT EXISTS fluxo_geral_acumulado AS
            SELECT 
            DATE('now') AS data_atual,
            IFNULL(SUM(CASE WHEN type='entrada' THEN amount ELSE 0 END), 0) AS total_entradas_geral,
            IFNULL(SUM(CASE WHEN type='saida' THEN amount ELSE 0 END), 0) AS total_saidas_geral,
            IFNULL(SUM(CASE WHEN type='entrada' THEN amount ELSE -amount END), 0) AS saldo_geral
            FROM cashflow;
            `);
        setDbReady(true);
        await loadDashboard();
      };

      setupDB();
    }, [])
  );

  // carrega dados das views dia 6 de outubro
  const loadDashboard = async () => {
    if (!db) return;
    const diario = await db.getAllAsync("SELECT * FROM fluxo_diario");
    const mensal = await db.getAllAsync("SELECT * FROM fluxo_mensal");
    const metodo = await db.getAllAsync("SELECT * FROM fluxo_metodo");
    const anual = await db.getAllAsync("SELECT * FROM fluxo_anual");
    const entradaAcumulado = await db.getAllAsync(
      "SELECT * FROM fluxo_entrada_acumulado"
    );
    const saidaAcumulada = await db.getAllAsync(
      "SELECT * FROM fluxo_saida_acumulado"
    );
    const geralAcumulado = await db.getAllAsync(
      "SELECT * FROM fluxo_geral_acumulado"
    );
    setFluxoDiario(diario);
    setFluxoMensal(mensal);
    setFluxoMetodo(metodo);
    setFluxoAnual(anual);
    setAcumuladoEntradaAtual(entradaAcumulado);
    setAcumuladoSaidaAtual(saidaAcumulada);
    setAcumuladoGeral(geralAcumulado);
  };

  const exportCSV = async () => {
    try {
      // Cabeçalho do CSV
      let csv = "Tipo,Período/Data,Entradas,Saídas,Saldo\n";

      // Adiciona fluxo diário
      fluxoDiario.forEach((d) => {
        csv += `Diário,${formatDatePTBR(d.dia)},${d.total_entradas?.toFixed(2)},${d.total_saidas?.toFixed(2)},${d.saldo?.toFixed(2)}\n`;
      });

      // Adiciona fluxo mensal
      fluxoMensal.forEach((m) => {
        csv += `Mensal,${formatMonthPTBR(m.mes)},${m.total_entradas?.toFixed(2)},${m.total_saidas?.toFixed(2)},${m.saldo?.toFixed(2)}\n`;
      });

      // Adiciona fluxo por método
      fluxoMetodo.forEach((f) => {
        csv += `Método,${f.method},${f.total_entradas?.toFixed(2)},${f.total_saidas?.toFixed(2)},${f.saldo?.toFixed(2)}\n`;
      });

      // Adiciona fluxo anual
      fluxoAnual.forEach((a) => {
        csv += `Anual,${a.ano},${a.total_entradas_ano?.toFixed(2)},0.00,${a.total_entradas_ano?.toFixed(2)}\n`;
      });

      // Salva o arquivo CSV
      const fileUri = FileSystem.cacheDirectory + "relatorio_financeiro.csv";
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

  // === 🔹 Função para excluir todas as VIEWS ===
  const deleteAllViews = async () => {
    try {
      const views = [
        "fluxo_diario",
        "fluxo_mensal",
        "fluxo_metodo",
        "fluxo_anual",
        "fluxo_entrada_acumulado",
        "fluxo_saida_acumulado",
        "fluxo_geral_acumulado",
      ];

      for (const view of views) {
        await db.execAsync(`DROP VIEW IF EXISTS ${view};`);
      }

      Toast.show({
        type: "success",
        text1: "Views excluídas com sucesso!",
        text1Style: { fontSize: 20, fontWeight: "600" },
      });
    } catch (error) {
      console.error("Erro ao excluir views:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao excluir views",
        text1Style: { fontSize: 20, fontWeight: "600" },
      });
    }
  };

  // === 🔹 Função para excluir dados das tabelas ===
  const clearAllTables = async () => {
    try {
      // apaga dados da tabela principal
      await db.execAsync(`DELETE FROM cashflow;`);
      // se tiver mais tabelas:
      // await db.execAsync(`DELETE FROM outra_tabela;`);

      Toast.show({
        type: "success",
        text1: "Dados das tabelas apagados!",
        text1Style: { fontSize: 20, fontWeight: "600" },
      });

      await loadDashboard(); // recarrega os dados após limpar
    } catch (error) {
      console.error("Erro ao limpar tabelas:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao limpar tabelas",
        text1Style: { fontSize: 20, fontWeight: "600" },
      });
    }
  };
  if (!dbReady) return <Text>Carregando dashboard...</Text>;

  // export
  // export
  const exportPDF = async () => {
    try {
      const generateTable = (
        title: string,
        headers: string[],
        rows: string[][]
      ) => {
        if (rows.length === 0) return `<p>Sem dados para ${title}</p>`;

        const headerRow = headers.map((h) => `<th>${h}</th>`).join("");
        const bodyRows = rows
          .map(
            (row) =>
              `<tr>${row.map((cell, i) => `<td class="${i > 0 ? "amount" : ""}">${cell}</td>`).join("")}</tr>`
          )
          .join("");

        return `
          <div class="section">
            <h2>${title}</h2>
            <table>
              <thead><tr>${headerRow}</tr></thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>
        `;
      };

      const formatCurrency = (value: number | undefined, colorize = false) => {
        const val = value ?? 0;
        const formatted = `R$ ${val.toFixed(2)}`;
        if (!colorize) return formatted;
        return `<span class="${val >= 0 ? "green" : "red"}">${formatted}</span>`;
      };

      const now = new Date();
      const dateStr = now.toLocaleDateString("pt-BR");
      const timeStr = now.toLocaleTimeString("pt-BR");

      let htmlContent = `
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; }
            .company-name { color: #6A1B9A; text-align: center; margin-bottom: 5px; font-size: 28px; font-weight: bold; }
            .company-subtitle { text-align: center; color: #6A1B9A; font-size: 16px; margin-bottom: 10px; font-style: italic; }
            h1 { color: #6A1B9A; text-align: center; margin-bottom: 5px; font-size: 22px; }
            .subtitle { text-align: center; color: #666; font-size: 14px; margin-bottom: 30px; }
            h2 { color: #6A1B9A; border-bottom: 2px solid #6A1B9A; padding-bottom: 5px; margin-top: 25px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f8f9fa; color: #444; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .amount { text-align: right; font-family: 'Courier New', monospace; font-weight: 500; }
            .green { color: #2e7d32; }
            .red { color: #c62828; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            .summary-box { background-color: #f3e5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 16px; }
            .summary-total { font-weight: bold; font-size: 18px; border-top: 1px solid #d1c4e9; padding-top: 10px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="company-name">MM Auto Center</div>
          <div class="company-subtitle">Alinhamento, balanceamento e cambagem</div>
          <h1>Relatório Financeiro</h1>
          <div class="subtitle">Gerado em ${dateStr} às ${timeStr}</div>

          <!-- Resumo Geral -->
          ${acumuladoGeral
          .map(
            (g) => `
            <div class="summary-box">
              <div class="summary-item">
                <span>Total Entradas:</span>
                <span class="green">${formatCurrency(g.total_entradas_geral)}</span>
              </div>
              <div class="summary-item">
                <span>Total Saídas:</span>
                <span class="red">${formatCurrency(g.total_saidas_geral)}</span>
              </div>
              <div class="summary-item summary-total">
                <span>Saldo Geral:</span>
                <span>${formatCurrency(g.saldo_geral, true)}</span>
              </div>
            </div>
          `
          )
          .join("")}

          ${generateTable(
            "Fluxo Diário",
            ["Data", "Entradas", "Saídas", "Saldo"],
            fluxoDiario.map((d) => [
              formatDatePTBR(d.dia),
              formatCurrency(d.total_entradas, true),
              formatCurrency(d.total_saidas, true),
              formatCurrency(d.saldo, true),
            ])
          )}

          ${generateTable(
            "Fluxo Mensal",
            ["Mês", "Entradas", "Saídas", "Saldo"],
            fluxoMensal.map((m) => [
              formatMonthPTBR(m.mes),
              formatCurrency(m.total_entradas, true),
              formatCurrency(m.total_saidas, true),
              formatCurrency(m.saldo, true),
            ])
          )}

          ${generateTable(
            "Fluxo por Método",
            ["Método", "Entradas", "Saídas", "Saldo"],
            fluxoMetodo.map((f) => [
              f.method,
              formatCurrency(f.total_entradas, true),
              formatCurrency(f.total_saidas, true),
              formatCurrency(f.saldo, true),
            ])
          )}

          ${generateTable(
            "Fluxo Anual",
            ["Ano", "Total Entradas"],
            fluxoAnual.map((a) => [
              a.ano,
              formatCurrency(a.total_entradas_ano, true),
            ])
          )}

          <div class="footer">
            <p>Relatório gerado pelo App FlowCash</p>
          </div>
        </body>
        </html>
      `;

      // Gera PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Compartilha PDF
      await Sharing.shareAsync(uri);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      Alert.alert("Erro", "Não foi possível gerar o PDF");
    }
  };
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
      <View style={styles.row2}>
        <IconButton
          icon={() => (
            <Feather name="corner-up-left" size={20} color="#6A1B9A" />
          )}
          onPress={() => router.push("/dashboard")}
        />
      </View>
      <View style={styles.containerviewedit}>
        <Pressable
          style={styles.btnRow}
          onPress={() => router.push("/createcashflow")}
        >
          <Feather name="trending-up" size={18} color="#6A1B9A" />
          <Text style={styles.latoBold}>Criar transações</Text>
        </Pressable>

        <Pressable
          style={styles.btnRow}
          onPress={() => router.push("/transations")}
        >
          <Feather name="eye" size={18} color="#6A1B9A" />
          <Text style={styles.latoBold}>Transações</Text>
        </Pressable>
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
      <ScrollView
        style={{ padding: 16 }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
          📊 Dashboard Financeiro
        </Text>
        <View
          style={{
            flexDirection: "row", // coloca os botões na horizontal
            justifyContent: "center", // distribui espaço entre eles
            padding: 5,
            gap: 12,
          }}
        >
          <Button
            mode="contained"
            onPress={clearAllTables}
            style={{
              flex: 1,
              backgroundColor: "#E53935",
            }}
            labelStyle={{ color: "#fff", fontSize: 13, marginHorizontal: 4 }}
            contentStyle={{ paddingHorizontal: 0 }}
          >
            1. Apagar banco
          </Button>
          <Button
            mode="contained"
            onPress={deleteAllViews}
            style={{
              flex: 1,
              backgroundColor: "#E53935",
            }}
            labelStyle={{ color: "#fff", fontSize: 13, marginHorizontal: 4 }}
            contentStyle={{ paddingHorizontal: 0 }}
          >
            2. Apagar fluxo
          </Button>
        </View>
        {/* ---------- EXPORTAÇÃO ---------- */}
        <View style={{ flexDirection: "row", gap: 10, marginVertical: 16 }}>
          <Button
            mode="contained"
            onPress={exportPDF}
            style={{ flex: 1, backgroundColor: "#6A1B9A" }}
            labelStyle={{ color: "#fff", fontWeight: "bold" }}
          >
            Exportar PDF
          </Button>
          <Button
            mode="contained"
            onPress={exportCSV}
            style={{ flex: 1, backgroundColor: "#2e7d32" }}
            labelStyle={{ color: "#fff", fontWeight: "bold" }}
          >
            Exportar CSV
          </Button>
        </View>
        {/* ---------- FLUXO DIÁRIO ---------- */}
        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 16 }}>
          🔹 Fluxo Diário
        </Text>
        {fluxoDiario.length === 0 ? (
          <PaperText style={{ color: "#777" }}>Nenhum dado diário.</PaperText>
        ) : (
          fluxoDiario.map((d, i) => (
            <View key={i} style={{ marginVertical: 6 }}>
              <PaperText
                variant="titleMedium"
                style={{ color: "#6A1B9A", fontWeight: "bold" }}
              >
                Dia: {formatDatePTBR(d.dia)}
              </PaperText>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  backgroundColor: "#fff",
                  padding: 12,
                  borderRadius: 12,
                  elevation: 2,
                }}
              >
                <View>
                  <Text>Entradas</Text>
                  <Text style={{ color: "green", fontWeight: "bold" }}>
                    R$ {d.total_entradas?.toFixed(2)}
                  </Text>
                </View>
                <View>
                  <Text>Saídas</Text>
                  <Text style={{ color: "red", fontWeight: "bold" }}>
                    R$ {d.total_saidas?.toFixed(2)}
                  </Text>
                </View>
                <View>
                  <Text>Saldo</Text>
                  <Text style={{ color: "#6A1B9A", fontWeight: "bold" }}>
                    R$ {d.saldo?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
        {/* ---------- FLUXO MENSAL ---------- */}
        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 24 }}>
          🔹 Fluxo Mensal
        </Text>
        {fluxoMensal.map((m, i) => (
          <View key={i} style={{ marginVertical: 6 }}>
            <View
              style={{
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 12,
                elevation: 2,
              }}
            >
              <Text style={{ color: "#6A1B9A", fontWeight: "bold" }}>
                Mês: {formatMonthPTBR(m.mes)}
              </Text>
              <Divider style={{ marginVertical: 6 }} />
              <Text>Entradas: R$ {m.total_entradas?.toFixed(2)}</Text>
              <Text>Saídas: R$ {m.total_saidas?.toFixed(2)}</Text>
              <Text style={{ fontWeight: "bold" }}>
                Saldo: R$ {m.saldo?.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        {/* ---------- FLUXO POR MÉTODO ---------- */}
        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 24 }}>
          🔹 Fluxo por Método
        </Text>
        {fluxoMetodo.map((f, i) => (
          <View key={i} style={{ marginVertical: 6 }}>
            <View
              style={{
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 12,
                elevation: 2,
              }}
            >
              <Text style={{ color: "#6A1B9A", fontWeight: "bold" }}>
                Método: {f.method}
              </Text>
              <Divider style={{ marginVertical: 6 }} />
              <Text>Entradas: R$ {f.total_entradas?.toFixed(2)}</Text>
              <Text>Saídas: R$ {f.total_saidas?.toFixed(2)}</Text>
              <Text style={{ fontWeight: "bold" }}>
                Saldo: R$ {f.saldo?.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        {/* ---------- FLUXO ANUAL ---------- */}
        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 24 }}>
          🔹 Fluxo Anual
        </Text>
        {fluxoAnual.map((a, i) => (
          <View key={i} style={{ marginVertical: 6 }}>
            <View
              style={{
                backgroundColor: "#fff",
                padding: 14,
                borderRadius: 12,
                elevation: 2,
              }}
            >
              <Text style={{ color: "#6A1B9A", fontWeight: "bold" }}>
                Ano: {a.ano}
              </Text>
              <Divider style={{ marginVertical: 6 }} />
              <Text>Total Entradas: R$ {a.total_entradas_ano?.toFixed(2)}</Text>
            </View>
          </View>
        ))}
        {/* ---------- ACUMULADOS ---------- */}
        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 24 }}>
          🔹 Acumulados
        </Text>
        {acumuladoEntradaAtual.map((a, i) => (
          <View key={i} style={{ marginVertical: 6 }}>
            <View
              style={{
                backgroundColor: "#E8F5E9",
                padding: 14,
                borderRadius: 12,
                elevation: 2,
              }}
            >
              <Text style={{ color: "green", fontWeight: "bold" }}>
                Entradas acumuladas até hoje
              </Text>
              <Divider style={{ marginVertical: 6 }} />
              <Text style={{ fontSize: 16 }}>
                R$ {a.total_entradas_acumulado?.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
        {acumuladoSaidaAtual.map((a, i) => (
          <View key={i} style={{ marginVertical: 6 }}>
            <View
              style={{
                backgroundColor: "#FFEBEE",
                padding: 14,
                borderRadius: 12,
                elevation: 2,
              }}
            >
              <Text style={{ color: "red", fontWeight: "bold" }}>
                Saídas acumuladas até hoje
              </Text>
              <Divider style={{ marginVertical: 6 }} />
              <Text style={{ fontSize: 16 }}>
                R$ {(a.total_saidas_acumulado ?? 0).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}

        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 16 }}>
          🔹 Fluxo Geral Acumulado
        </Text>
        {acumuladoGeral.map((g, i) => (
          <View key={i} style={{ marginVertical: 6 }}>
            <View
              key={i}
              style={{
                backgroundColor: "#E8F5E9",
                padding: 14,
                borderRadius: 12,
                elevation: 2,
              }}
            >
              <Text style={{ color: "green", fontWeight: "bold" }}>
                Transações atuais
              </Text>
              <Divider style={{ marginVertical: 6 }} />
              <Text style={{ fontSize: 16 }}>
                <Fontisto name="date" size={18} color="black" /> Data Atual:{""}
                {g.data_atual}
              </Text>
              <Text style={{ fontSize: 16 }}>
                <AntDesign name="download" size={20} color="black" /> Total
                Entradas: R${" "}
                <Text style={{ fontWeight: "bold", color: "green" }}>
                  {g.total_entradas_geral?.toFixed(2)}
                </Text>
              </Text>
              <Text style={{ fontSize: 16 }}>
                <AntDesign name="upload" size={20} color="black" /> Total
                Saídas: R${" "}
                <Text style={{ fontWeight: "bold", color: "red" }}>
                  {g.total_saidas_geral?.toFixed(2)}
                </Text>
              </Text>
              <Text style={{ fontSize: 16 }}>
                Saldo Geral depois das saidas: R${" "}
                <Text style={{ fontWeight: "bold", color: "black" }}>
                  {" "}
                  {g.saldo_geral?.toFixed(2)}
                </Text>
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <Footer />
    </View>
  );
}
