import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    marginRight: "auto",
  },
  icon: {
    marginRight: 70,
  },
  centeredBox: {
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    marginLeft: "auto",
    marginRight: "auto",
    backgroundColor: "#fff",
    gap: 12,
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
  label: {
    fontSize: 12,
    marginTop: -4,
  },
  item: {
    alignItems: "center",
  },
  labelname: {
    fontSize: 14,
    marginBottom: 4,
    color: "#333",
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
    fontSize: 16,
    color: "#000",
  },
  card: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 4,
  },
  container2: { flex: 1, padding: 16, backgroundColor: "#F8F9FA" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  filterRow: { flexDirection: "row", justifyContent: "space-between" },
  picker: { flex: 1, height: 40 },
  card2: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  extratoItem: {
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  carddata: {
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12
  },
  itemdata: {
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
  },
  type: {
    color: "#555",
    fontSize: 13,
    marginTop: 2,
  },
  date: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    marginTop: 10,
  },
  button: {
    width: "100%",
    marginTop: 20,
    backgroundColor: "#520f7cff",
  },
  empty: {
    textAlign: "center",
    color: "#6A1B9A",
    marginTop: 20,
    fontSize: 16,
    fontWeight: "200",
    marginBottom: 20
  },
  headerRow: {
    flexDirection: "row",
    paddingVertical: 10, // mais espaço vertical
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  headerCell: {
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
    color: "#555",
  },
 
  valueRow: {
    flexDirection: "row",
    paddingVertical: 10, // mais espaço entre linhas
    alignItems: "center",
  },
  valueCell: {
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  
});
