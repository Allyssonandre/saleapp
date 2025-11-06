// components/createform/createform.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  form: {
    width: "100%",
    alignItems: "center",
  },
  input: {
    width: "100%",
    marginBottom: 12,
    fontSize: 18,
  },
  button: {
    width: "100%",
    marginTop: 20,
    backgroundColor: "#520f7cff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 19,
  },

  poppinsRegular: {
    fontFamily: "Poppins_400Regular",
    fontSize: 16,
    color: "#333",
  },

  poppinsBold: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#000",
  },

  latoRegular: {
    fontFamily: "Lato_400Regular",
    fontSize: 16,
    color: "#333",
  },

  latoBold: {
    fontFamily: "Lato_700Bold",
    fontSize: 18,
    color: "#000",
  },
  containerviewedit: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  action: {
    alignItems: "center",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#6A1B9A",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#F9F9F9",
    overflow: "hidden", // garante que o borderRadius funcione
    elevation: 2, // sombra no Android
    shadowColor: "#000", // sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  picker: {
    height: 55,
    paddingHorizontal: 10,
    color: "#333", // cor do texto
  },
});
