import React from "react";
import { Text, View } from "react-native";

export const Footer = () => {
    return (
        <View
            style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                alignItems: "center",
                paddingBottom: 20,
                paddingTop: 10,
                backgroundColor: "rgba(255,255,255,0.9)",
                zIndex: 1000,
            }}
        >
            <Text style={{ color: "#6A1B9A", fontWeight: "bold", fontSize: 14 }}>
                MM Auto Center
            </Text>
            <Text style={{ color: "#999", fontSize: 12 }}>
                Gerenciado por FlowCash
            </Text>
        </View>
    );
};
