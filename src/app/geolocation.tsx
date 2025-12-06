import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    Share,
    StatusBar,
    View,
} from "react-native";
import {
    Appbar,
    Button,
    Card,
    HelperText,
    Text as PaperText,
    TextInput,
} from "react-native-paper";
import { Footer } from "../components/common/Footer";

export default function Geolocation() {
    const router = useRouter();
    const [address, setAddress] = useState("");
    const [generatedLink, setGeneratedLink] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Função para gerar o link do Google Maps
    const generateMapLink = () => {
        if (!address.trim()) {
            Alert.alert("Atenção", "Por favor, insira um endereço válido.");
            return;
        }

        setIsLoading(true);

        // Codifica o endereço para URL
        const encodedAddress = encodeURIComponent(address.trim());

        // Gera o link do Google Maps
        const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

        setGeneratedLink(mapLink);
        setIsLoading(false);
    };

    // Função para compartilhar o link
    const shareLink = async () => {
        if (!generatedLink) {
            Alert.alert("Atenção", "Gere um link primeiro antes de compartilhar.");
            return;
        }

        try {
            await Share.share({
                message: `📍 Localização: ${address}\n\nVeja no mapa: ${generatedLink}`,
                title: "Compartilhar Localização",
            });
        } catch (error) {
            console.error("Erro ao compartilhar:", error);
            Alert.alert("Erro", "Não foi possível compartilhar o link.");
        }
    };

    // Função para abrir o link no navegador
    const openLink = () => {
        if (!generatedLink) {
            Alert.alert("Atenção", "Gere um link primeiro antes de abrir.");
            return;
        }

        Linking.openURL(generatedLink).catch(() => {
            Alert.alert("Erro", "Não foi possível abrir o link.");
        });
    };

    // Função para copiar o link
    const copyLink = () => {
        if (!generatedLink) {
            Alert.alert("Atenção", "Gere um link primeiro antes de copiar.");
            return;
        }

        // Aqui você pode usar Clipboard do expo se quiser
        Alert.alert("Link copiado!", generatedLink);
    };

    // Função para limpar os campos
    const clearFields = () => {
        setAddress("");
        setGeneratedLink("");
    };

    return (
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
            <StatusBar backgroundColor="#6A1B9A" barStyle="light-content" />

            <Appbar.Header style={{ backgroundColor: "#6A1B9A" }}>
                <Appbar.BackAction color="#fff" onPress={() => router.back()} />
                <Appbar.Content title="Geolocalização" titleStyle={{ color: "#fff" }} />
            </Appbar.Header>

            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Card de Informações */}
                <Card
                    style={{
                        backgroundColor: "#E1BEE7",
                        marginBottom: 16,
                        elevation: 2,
                    }}
                >
                    <Card.Content>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Feather name="info" size={20} color="#6A1B9A" />
                            <PaperText
                                variant="titleMedium"
                                style={{ color: "#6A1B9A", fontWeight: "bold" }}
                            >
                                Como usar
                            </PaperText>
                        </View>
                        <PaperText
                            variant="bodyMedium"
                            style={{ marginTop: 8, color: "#4A148C" }}
                        >
                            Digite um endereço completo e clique em "Gerar Link" para criar um
                            link do Google Maps que você pode compartilhar com outras pessoas.
                        </PaperText>
                    </Card.Content>
                </Card>

                {/* Card Principal */}
                <Card style={{ backgroundColor: "#fff", elevation: 3 }}>
                    <Card.Content>
                        <PaperText
                            variant="titleLarge"
                            style={{
                                color: "#6A1B9A",
                                fontWeight: "bold",
                                marginBottom: 16,
                            }}
                        >
                            📍 Gerador de Link de Localização
                        </PaperText>

                        {/* Campo de Endereço */}
                        <TextInput
                            label="Endereço Completo"
                            value={address}
                            onChangeText={setAddress}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            placeholder="Ex: Rua das Flores, 123, Centro, Natal - RN"
                            activeOutlineColor="#6A1B9A"
                            outlineColor="#9C27B0"
                            style={{ backgroundColor: "#fff", marginBottom: 8 }}
                            left={<TextInput.Icon icon="map-marker" color="#6A1B9A" />}
                        />
                        <HelperText type="info" visible={true}>
                            Quanto mais detalhado o endereço, mais precisa será a localização
                        </HelperText>

                        {/* Botão Gerar Link */}
                        <Button
                            mode="contained"
                            onPress={generateMapLink}
                            loading={isLoading}
                            disabled={isLoading || !address.trim()}
                            style={{
                                backgroundColor: "#6A1B9A",
                                marginTop: 16,
                                paddingVertical: 6,
                            }}
                            labelStyle={{ fontSize: 16, fontWeight: "bold" }}
                            icon="map-search"
                        >
                            Gerar Link
                        </Button>

                        {/* Link Gerado */}
                        {generatedLink && (
                            <View style={{ marginTop: 24 }}>
                                <PaperText
                                    variant="titleMedium"
                                    style={{
                                        color: "#6A1B9A",
                                        fontWeight: "bold",
                                        marginBottom: 8,
                                    }}
                                >
                                    ✅ Link Gerado com Sucesso!
                                </PaperText>

                                <Card
                                    style={{
                                        backgroundColor: "#F3E5F5",
                                        marginBottom: 16,
                                    }}
                                >
                                    <Card.Content>
                                        <PaperText
                                            variant="bodySmall"
                                            style={{ color: "#4A148C" }}
                                            selectable
                                        >
                                            {generatedLink}
                                        </PaperText>
                                    </Card.Content>
                                </Card>

                                {/* Botões de Ação */}
                                <View style={{ gap: 12 }}>
                                    <Button
                                        mode="contained"
                                        onPress={shareLink}
                                        style={{ backgroundColor: "#4CAF50" }}
                                        icon="share-variant"
                                        labelStyle={{ fontSize: 15 }}
                                    >
                                        Compartilhar Link
                                    </Button>

                                    <Button
                                        mode="outlined"
                                        onPress={openLink}
                                        style={{ borderColor: "#2196F3" }}
                                        textColor="#2196F3"
                                        icon="open-in-new"
                                        labelStyle={{ fontSize: 15 }}
                                    >
                                        Abrir no Navegador
                                    </Button>

                                    <Button
                                        mode="outlined"
                                        onPress={clearFields}
                                        style={{ borderColor: "#FF5722" }}
                                        textColor="#FF5722"
                                        icon="refresh"
                                        labelStyle={{ fontSize: 15 }}
                                    >
                                        Limpar e Criar Novo
                                    </Button>
                                </View>
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Card de Exemplos */}
                <Card
                    style={{
                        backgroundColor: "#fff",
                        marginTop: 16,
                        elevation: 2,
                    }}
                >
                    <Card.Content>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Feather name="bookmark" size={18} color="#6A1B9A" />
                            <PaperText
                                variant="titleMedium"
                                style={{ color: "#6A1B9A", fontWeight: "bold" }}
                            >
                                Exemplos de Endereços
                            </PaperText>
                        </View>

                        <View style={{ marginTop: 12, gap: 8 }}>
                            <PaperText variant="bodyMedium" style={{ color: "#555" }}>
                                • Av. Paulista, 1578, Bela Vista, São Paulo - SP
                            </PaperText>
                            <PaperText variant="bodyMedium" style={{ color: "#555" }}>
                                • Rua Oscar Freire, 379, Jardins, São Paulo - SP
                            </PaperText>
                            <PaperText variant="bodyMedium" style={{ color: "#555" }}>
                                • Praça da Sé, Centro, São Paulo - SP
                            </PaperText>
                        </View>
                    </Card.Content>
                </Card>
            </ScrollView>

            <Footer />
        </View>
    );
}
