import { Feather, Ionicons } from "@expo/vector-icons";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { Button, IconButton, Modal, Portal, SegmentedButtons, TextInput } from "react-native-paper";
import {
    DatePickerInput,
    pt,
    registerTranslation,
} from "react-native-paper-dates";
import Toast from "react-native-toast-message";
import { styles } from "../createform/createform";
import { toastConfig } from "../createform/toastConfig";

registerTranslation("pt", pt);

let db: SQLite.SQLiteDatabase | null = null;

interface EditTransactionModalProps {
    visible: boolean;
    onDismiss: () => void;
    transactionId: number | null;
    onSuccess: () => void;
}

export default function EditTransactionModal({
    visible,
    onDismiss,
    transactionId,
    onSuccess,
}: EditTransactionModalProps) {
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
                if (Platform.OS !== "web") {
                    db = await SQLite.openDatabaseAsync("cashflow.db", {
                        useNewConnection: true,
                    });
                    setDbReady(true);
                }
            } catch (error) {
                console.error("Erro ao abrir banco no modal:", error);
            }
        };
        setupDB();
    }, []);

    // Load transaction logic
    useEffect(() => {
        if (visible && dbReady && transactionId && Platform.OS !== "web") {
            const loadTransaction = async () => {
                try {
                    const result: any = await db!.getFirstAsync(
                        "SELECT * FROM cashflow WHERE id = ?",
                        [transactionId]
                    );
                    if (result) {
                        setDescription(result.description);
                        setType(result.type);
                        // Fix: convert dot to comma for display/editing
                        setAmount(result.amount.toFixed(2).replace(".", ","));
                        setMethod(result.method);

                        // Fix: Parse manually to avoid timezone issues
                        if (result.transaction_date) {
                            const [year, month, day] = result.transaction_date.split('-').map(Number);
                            setDate(new Date(year, month - 1, day));
                        }
                    }
                } catch (error) {
                    console.error("Erro ao carregar transação:", error);
                }
            };
            loadTransaction();
        }
    }, [visible, dbReady, transactionId]);

    const saveTransaction = async () => {
        if (!description || !amount || !date) {
            Alert.alert("Erro", "Preencha todos os campos obrigatórios!");
            return;
        }

        try {
            // Fix parsing:
            // If contains comma, remove dots (thousands) then swap comma to dot
            // If no comma, leave as is (assuming it's already 1234.56 or 1234)
            let normalizedAmount = amount;
            if (amount.includes(",")) {
                normalizedAmount = amount.replace(/\./g, "").replace(",", ".");
            }

            const formattedAmount = parseFloat(normalizedAmount);

            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            const isoDate = `${year}-${month}-${day}`;

            if (Platform.OS !== "web" && transactionId) {
                await db!.runAsync(
                    "UPDATE cashflow SET description = ?, type = ?, amount = ?, method = ?, transaction_date = ? WHERE id = ?",
                    [description, type, formattedAmount, method, isoDate, transactionId]
                );

                Toast.show({
                    type: "success",
                    text1: "Transação atualizada!",
                    text2: "Os dados foram alterados com sucesso.",
                });

                setTimeout(() => {
                    onSuccess(); // Reload list
                    onDismiss(); // Close modal
                }, 1500);
            }
        } catch (error) {
            console.error("Erro ao atualizar transação:", error);
            Alert.alert("Erro", "Erro ao atualizar o registro.");
        }
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={onDismiss}
                contentContainerStyle={{
                    backgroundColor: 'white',
                    padding: 20,
                    margin: 20,
                    borderRadius: 10,
                    maxHeight: '90%'
                }}
            >
                <ScrollView>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={styles.poppinsBold}>Editar Transação</Text>
                        <IconButton icon="close" onPress={onDismiss} />
                    </View>

                    <Text style={styles.poppinsBold}>
                        <IconButton icon="pencil" iconColor="#6A1B9A" size={20} />
                        Descrição:
                    </Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        style={styles.input}
                        mode="outlined"
                        outlineColor="#6A1B9A"
                        activeOutlineColor="#6A1B9A"
                        theme={{
                            colors: {
                                background: "#FFFFFF",
                                primary: "#6A1B9A",
                                placeholder: "#999",
                            },
                        }}
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
                            icon={() => <Feather name="dollar-sign" size={20} color="#6A1B9A" />}
                        />
                        Valor:
                    </Text>
                    <TextInput
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        style={styles.input}
                        mode="outlined"
                        outlineColor="#6A1B9A"
                        activeOutlineColor="#6A1B9A"
                        theme={{
                            colors: {
                                background: "#FFFFFF",
                                primary: "#6A1B9A",
                                placeholder: "#999",
                            },
                        }}
                        textColor="#000"
                    />

                    <Text style={styles.poppinsBold}>
                        <IconButton icon="credit-card" iconColor="#6A1B9A" size={20} />
                        Método:
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
                            label="Data"
                            value={date}
                            onChange={(d) => setDate(d)}
                            inputMode="start"
                            mode="outlined"
                            outlineColor="#6A1B9A"
                            activeOutlineColor="#6A1B9A"
                            style={{ backgroundColor: "#FFFFFF" }}
                            theme={{
                                colors: {
                                    background: "#FFFFFF",
                                    primary: "#6A1B9A",
                                    placeholder: "#999",
                                },
                            }}
                            textColor="#000"
                        />
                    </View>

                    <Button
                        icon={() => <Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                        mode="contained"
                        onPress={saveTransaction}
                        style={{ ...styles.button, marginTop: 10 }}
                    >
                        <Text style={styles.buttonText}>Atualizar</Text>
                    </Button>
                </ScrollView>
                <Toast config={toastConfig} />
            </Modal>
        </Portal>
    );
}
