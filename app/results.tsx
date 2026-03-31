import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DIAGNOSIS_DATA } from "./diagnosisData";
import { GlobalResultStore } from "./globalStore";

const { width } = Dimensions.get("window");

const TOMTOM_API_KEY = "iUizgBtdWbqkgQwKkKEONhuuz4fERay7";
const USE_MOCK_DATA = false;

export default function Results() {
  const router = useRouter();

  const result = GlobalResultStore.getResult();

  
  if (!result || !result.detectedClass) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            { justifyContent: "center", alignItems: "center", padding: 20 },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={80} color="#ccc" />
          <Text style={[styles.bodyText, { marginBottom: 20, color: "#666" }]}>
            No detection data found.
          </Text>

          {/* Using permissionButton style because it exists in this file */}
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.permissionButtonText}>Go Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { imageUri, detectedClass, confidence, box } = result;

  const diagnosisKey = detectedClass ? detectedClass.toLowerCase() : "default";
  const diagnosis = DIAGNOSIS_DATA[diagnosisKey] || DIAGNOSIS_DATA["default"];

  const [activeTab, setActiveTab] = useState<"overview" | "repair">("overview");
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [locationPermission, setLocationPermission] = useState<boolean | null>(
    null,
  );
  const [repairCenters, setRepairCenters] = useState<any[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);

  const handleScroll = (event: any) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    setShowScrollTop(yOffset > 100);
  };
  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  useEffect(() => {
    if (activeTab === "repair" && locationPermission === null) {
      requestLocationPermission();
    }
  }, [activeTab]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setLocationPermission(true);
      fetchRepairCenters();
    } else {
      setLocationPermission(false);
    }
  };

  // Fetch nearby repair centers using TomTom API
  const fetchRepairCenters = async () => {
    setLoadingCenters(true);
    try {
      if (USE_MOCK_DATA) {
        setTimeout(() => {
          setRepairCenters([
            {
              id: "1",
              name: "Mock Garage",
              address: "123 Main St",
              vicinity: "5 Mins Away",
            },
          ]);
          setLoadingCenters(false);
        }, 1000);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      const { latitude, longitude } = location.coords;

      const query = "car repair";
      const radius = 3000;
      const limit = 5;

      const url = `https://api.tomtom.com/search/2/search/${query}.json?key=${TOMTOM_API_KEY}&lat=${latitude}&lon=${longitude}&radius=${radius}&limit=${limit}`; // TomTom Search API endpoint

      console.log("Fetching TomTom Data...");

      const response = await fetch(url);
      const data = await response.json();
      
      // Format the results to match UI
      if (data.results) {
        const formattedResults = data.results.map((item: any) => ({
          id: item.id,
          name: item.poi.name,
          vicinity: `${(item.dist / 1000).toFixed(1)} km away`,
          address: item.address.freeformAddress,
          phone: item.poi.phone || null,
          position: item.position,
        }));

        setRepairCenters(formattedResults);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
      Alert.alert(
        "Error",
        "Could not fetch repair centers. Check your internet.",
      );
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleCall = (phoneNumber: string | null) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert(
        "No Phone Number",
        "This service center has not listed a phone number.",
      );
    }
  };

  // Determine colors based on confidence level
  const getConfidenceColors = (percent: number) => {
    if (percent > 70) {
      return {
        bg: "#c8ffd5",
        text: "#00a627",
        border: "#00a627",
      };
    } else if (percent > 50) {
      return {
        bg: "#FFFBEB",
        text: "#D97706",
        border: "#FDE68A",
      };
    } else if (percent >= 30) {
      return {
        bg: "#eff3ff",
        text: "#4A6cf7",
        border: "#dbeafe",
      };
    } else {
      return {
        bg: "#FEF2F2",
        text: "#EF4444",
        border: "#FECACA",
      };
    }
  };

  // Draw the bounding box on the image if available
  const renderContent = () => {
    if (activeTab === "overview") {
      const confidencePercent = Math.round((confidence || 0) * 100);

      const colors = getConfidenceColors(confidencePercent);

      return (
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Detected Icon Details :</Text>

          <View style={styles.iconContainer}>
            <Image
              source={{
                uri: imageUri || "https://placehold.co/400", // Fallback image if URI is null
              }}
              style={styles.detectedImage}
            />

            {box && box.length === 4 && (
              // Scale the boxes down to fit the displayed size (160x160)
              <View
                style={{
                  position: "absolute",
                  left: box[0] * (160 / 512),
                  top: box[1] * (160 / 512),
                  width: (box[2] - box[0]) * (160 / 512),
                  height: (box[3] - box[1]) * (160 / 512),
                  borderWidth: 3,
                  borderColor: colors.border,
                  borderRadius: 4,
                  backgroundColor: "rgba(0, 255, 0, 0.15)",
                }}
              />
            )}
          </View>

          <Text style={styles.issueTitle}>{diagnosis.title}</Text>
          
          
          <View
            style={[
              styles.confidenceBadge,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color={colors.text}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.confidenceText, { color: colors.text }]}>
              AI Confidence: {confidencePercent}%
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Importance :</Text>
            <Text
              style={[
                styles.importanceValue,
                {
                  color:
                    diagnosis.importance === "Critical" ? "#FF0000" : "#FF3B30",
                },
              ]}
            >
              {diagnosis.importance}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Explanation :</Text>
            <Text style={styles.bodyText}>{diagnosis.explanation}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Solution :</Text>
            <Text style={styles.bodyText}>{diagnosis.solution}</Text>
          </View>

          <View style={{ height: 200 }} />
        </ScrollView>
      );
    } else {
      return (
        <View style={styles.repairContainer}>
          <Text style={styles.pageTitle}>Nearest Repair Centers</Text>

          {!locationPermission && (
            <View style={styles.centerMessage}>
              <Text style={styles.messageText}>Permission Required</Text>
              <Text style={styles.subMessageText}>
                We need your location to find nearby help.
              </Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestLocationPermission}
              >
                <Text style={styles.permissionButtonText}>Allow Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {locationPermission && loadingCenters && (
            <View style={styles.centerMessage}>
              <ActivityIndicator size="large" color="#4A6cf7" />
              <Text style={{ marginTop: 20, color: "#666", fontWeight: "700" }}>
                Finding nearest Repair Centres...
              </Text>
            </View>
          )}

          {locationPermission &&
            !loadingCenters &&
            repairCenters.length === 0 && (
              <View style={styles.centerMessage}>
                <Text style={styles.messageText}>No Centers Found</Text>
                <Text style={styles.subMessageText}>
                  No repair shops found within 5km.
                </Text>
              </View>
            )}

          {locationPermission &&
            !loadingCenters &&
            repairCenters.length > 0 && (
              <FlatList
                data={repairCenters}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardDistance}>{item.vicinity}</Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#3e3e3e",
                          marginTop: 6,
                          fontWeight: "700",
                          lineHeight: 18,
                        }}
                      >
                        {item.address}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => handleCall(item.phone)}
                    >
                      <Ionicons name="call" size={20} color="#fff" />
                      <Text style={styles.callText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerItem}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#333" />
            <Text style={styles.headerLabel}>Back</Text>
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoLetter}>D.</Text>
            </View>
            <Text style={styles.appName}>Diagnodash AI</Text>
          </View>

          <View style={styles.headerItem} />
        </View>

        <View style={styles.divider} />
        {renderContent()}

        {activeTab === "overview" && showScrollTop && (
          <TouchableOpacity
            style={styles.scrollTopButton}
            onPress={scrollToTop}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color="#4A6cf7"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.scrollTopText}>Scroll to Top</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.dismissAll()}
        >
          <Ionicons name="add" size={28} color="#fff" />
          <Text style={styles.fabText}>New</Text>
        </TouchableOpacity>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab("overview")}
          >
            <View
              style={activeTab === "overview" ? styles.activeTabIcon : null}
            >
              <Ionicons
                name={
                  activeTab === "overview"
                    ? "document-text"
                    : "document-text-outline"
                }
                size={24}
                color={activeTab === "overview" ? "#4A6cf7" : "#999"}
              />
            </View>
            <Text
              style={
                activeTab === "overview"
                  ? styles.activeTabText
                  : styles.inactiveTabText
              }
            >
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab("repair")}
          >
            <View style={activeTab === "repair" ? styles.activeTabIcon : null}>
              <Ionicons
                name={
                  activeTab === "repair" ? "construct" : "construct-outline"
                }
                size={24}
                color={activeTab === "repair" ? "#4A6cf7" : "#999"}
              />
            </View>
            <Text
              style={
                activeTab === "repair"
                  ? styles.activeTabText
                  : styles.inactiveTabText
              }
            >
              Repair Centers
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff3ff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A6cf7",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 60,
  },
  headerItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
  },
  headerLabel: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
    fontWeight: "700",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    backgroundColor: "#4A6cf7",
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginRight: 8,
  },
  logoLetter: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c2c2cff",
    marginBottom: 26,
    textAlign: "center",
    width: "100%",
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cacacaff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    marginBottom: 15,
    overflow: "hidden",
  },
  detectedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  issueTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#161616ff",
    marginTop: 10,
    marginBottom: 10,
  },
  sectionContainer: {
    width: "100%",
    marginBottom: 25,
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6f6f6fff",
    marginBottom: 8,
  },
  importanceValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF3B30",
    marginTop: 4,
  },
  bodyText: {
    fontSize: 18,
    color: "#080808ff",
    textAlign: "center",
    lineHeight: 38,
    fontWeight: "700",
    marginTop: 4,
  },
  scrollTopButton: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "#ffffffff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#4A6cf7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scrollTopText: {
    color: "#4A6cf7",
    fontWeight: "700",
    fontSize: 16,
  },
  repairContainer: {
    flex: 1,
    paddingTop: 40,
  },
  centerMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: -120,
  },
  messageText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subMessageText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: "#4A6cf7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 5,
  },
  cardDistance: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A6cf7",
  },
  callButton: {
    width: 60,
    height: 60,
    borderRadius: 60,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  callText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#4A6cf7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4A6cf7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  fabText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: -2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    justifyContent: "space-around",
    paddingTop: 10,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabIcon: {
    marginBottom: 4,
  },
  activeTabText: {
    fontSize: 12,
    color: "#4A6cf7",
    fontWeight: "700",
    marginTop: 6,
  },
  inactiveTabText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "700",
    marginTop: 6,
  },
});
