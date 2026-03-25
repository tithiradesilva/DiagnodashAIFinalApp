import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { GlobalResultStore } from "./globalStore";

const { height } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setTimer(0);
      interval = setInterval(() => {
        setTimer((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      selectionLimit: 1,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];

      // --- LOGIC: ZOOM VALIDATION ---
      if (selectedAsset.width > 2000) {
        Alert.alert(
          "Zoom In More",
          "The selected area is too wide. Please zoom in closer to the warning light so the AI can see it clearly.",
          [{ text: "Try Again", onPress: () => pickImage() }],
        );
        return;
      }

      // --- LOGIC: ON-DEVICE RESIZE (512x512) ---
      try {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          selectedAsset.uri,
          [{ resize: { width: 512, height: 512 } }],
          { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
        );
        setImage(manipulatedImage.uri);
      } catch (error) {
        console.error("Error resizing image:", error);
        setImage(selectedAsset.uri);
      }
    }
  };

  const handleReload = () => {
    setImage(null);
  };

  const handleContinue = async () => {
    const API_URL = "https://diagnodash-api.onrender.com/predict";
    if (!image) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "upload.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        // CRITICAL: No manual content-type header here to prevent boundary errors
      });

      const data = await response.json();

      if (data.success) {
        GlobalResultStore.setResult(
          image,
          data.detected_class,
          data.confidence,
          data.result_image,
        );
        router.push("/results");
      } else {
        Alert.alert(
          "No Issue Found",
          data.message || "We couldn't detect a specific warning light.",
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Connection Error",
        "Could not connect to the AI Server. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setImage(null);
      setTimer(0);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <Modal transparent={true} animationType="fade" visible={isLoading}>
        <View style={styles.modalBackground}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1342ffff" />
            <Text style={styles.loadingText}>
              Loading ({timer.toFixed(1)}s)
            </Text>
            <Text style={styles.loadingSubText}>
              We are analyzing your Image.
            </Text>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerItem} />
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoLetter}>D.</Text>
            </View>
            <Text style={styles.appName}>Diagnodash AI</Text>
          </View>
          <TouchableOpacity style={styles.headerItem} onPress={handleReload}>
            <Ionicons name="refresh" size={24} color="#333" />
            <Text style={styles.headerLabel}>Reload</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Let’s Get Started</Text>
            <Text style={styles.subtitle}>
              Add an image to get started. Click the blue area below.
            </Text>
          </View>

          <View style={styles.uploadBox}>
            {image ? (
              <View style={styles.uploadedContainer}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusTitle}>Image Uploaded</Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="green"
                    style={{ marginLeft: 8 }}
                  />
                </View>
                <Text style={styles.statusSubtitle}>
                  Click Delete button to clear upload.
                </Text>
                <Image source={{ uri: image }} style={styles.previewImage} />
                {!isLoading && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => setImage(null)}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.touchableFull}
                onPress={pickImage}
              >
                <Ionicons name="add" size={50} color="#666" />
                <Text style={styles.uploadMainText}>Click to Add Image</Text>
                <Text style={styles.uploadSubText}>
                  Click here to browse images from your mobile phone.
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {image && (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "bold",
    color: "#181818ff",
  },
  loadingSubText: {
    marginTop: 15,
    fontSize: 16,
    color: "#343434ff",
    fontWeight: "700",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 60,
  },
  headerItem: { alignItems: "center", justifyContent: "center", width: 50 },
  headerLabel: { fontSize: 14, color: "#333", marginTop: 2, fontWeight: "700" },
  logoContainer: { flexDirection: "row", alignItems: "center" },
  logoIcon: {
    backgroundColor: "#4A6cf7",
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginRight: 8,
  },
  logoLetter: { color: "#fff", fontWeight: "900", fontSize: 16 },
  appName: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  divider: { height: 1, backgroundColor: "#f0f0f0", width: "100%" },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: height * 0.05,
  },
  textContainer: { marginBottom: height * 0.04, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 12 },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#424242ff",
    textAlign: "center",
    lineHeight: 32,
    maxWidth: "95%",
  },
  uploadBox: {
    width: "100%",
    height: "55%",
    maxHeight: 400,
    minHeight: 250,
    borderWidth: 2,
    borderColor: "#ccc",
    borderStyle: "dashed",
    borderRadius: 20,
    backgroundColor: "#f5f5f5ff",
    overflow: "hidden",
  },
  touchableFull: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadMainText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginTop: 15,
    marginBottom: 8,
  },
  uploadSubText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8a8a8aff",
    textAlign: "center",
    lineHeight: 28,
  },
  uploadedContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    padding: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 14,
  },
  statusTitle: { fontSize: 22, fontWeight: "700", color: "#000" },
  statusSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#757575ff",
    marginBottom: 30,
  },
  previewImage: {
    width: Dimensions.get("window").width * 0.36,
    height: Dimensions.get("window").width * 0.36 * 1.28,
    borderRadius: 12,
    resizeMode: "cover",
    marginBottom: 20,
  },
  deleteButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButton: {
    backgroundColor: "#4A6cf7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 30,
    width: "50%",
    shadowColor: "#4A6cf7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueText: {
    color: "#ffffffff",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 6,
  },
});
