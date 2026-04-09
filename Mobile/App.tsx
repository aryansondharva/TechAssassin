import React, { useEffect, useRef, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  SafeAreaView,
  Animated,
  Easing,
  ImageBackground,
  Platform,
  ActivityIndicator,
  Image
} from "react-native";
import { 
  useFonts, 
  SpaceGrotesk_400Regular, 
  SpaceGrotesk_700Bold 
} from "@expo-google-fonts/space-grotesk";
import { 
  Inter_400Regular, 
  Inter_700Bold 
} from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { 
  MapPin, 
  CalendarDays, 
  Users, 
  Zap, 
  Target, 
  Flame, 
  Bell, 
  Search, 
  User, 
  ChevronRight, 
  Play,
  Share2,
  Trophy,
  Shield
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "./src/theme/colors";
import { moderateScale, SCREEN_WIDTH } from "./src/theme/responsive";
import { supabase } from "./src/lib/supabase";
import AuthScreen from "./src/screens/AuthScreen";
import { Session } from "@supabase/supabase-js";

const MAX_WIDTH = 480; // Standard mobile width limit

const TechAssassinApp = () => {
  const [fontsLoaded] = useFonts({
    "SpaceGrotesk-Regular": SpaceGrotesk_400Regular,
    "SpaceGrotesk-Bold": SpaceGrotesk_700Bold,
    "Inter-Regular": Inter_400Regular,
    "Inter-Bold": Inter_700Bold,
  });

  const [activeScreen, setActiveScreen] = useState("Home");
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Entrance animation values
  const entranceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    }).catch(err => {
      console.error('Session fetch error:', err);
      setIsAuthLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();

    if (fontsLoaded) {
      Animated.timing(entranceAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fontsLoaded]);


  const onLayoutRootView = async () => {
    console.log('Layout triggered - hiding splash screen');
    await SplashScreen.hideAsync();
  };

  // Only return null if fonts aren't even ready
  if (!fontsLoaded) return null;

  // Handle Initial Loading State inside the app structure
  if (isAuthLoading) {
    return (
      <View style={styles.rootWrapper} onLayout={onLayoutRootView}>
        <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Image 
            source={require('./assets/favicon.png')} 
            style={{ width: 80, height: 80, marginBottom: 30 }}
            resizeMode="contain"
          />
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ color: 'white', marginTop: 20, fontFamily: 'SpaceGrotesk-Bold', letterSpacing: 2 }}>INITIALIZING SYSTEM...</Text>
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.rootWrapper}>
        <View style={styles.mainContainer} onLayout={onLayoutRootView}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <AuthScreen />
        </View>
      </View>
    );
  }

  const renderHomeScreen = () => (
    <View style={styles.screenContainer}>
      <ImageBackground 
        source={require("./assets/hero-bg.png")} 
        style={styles.heroBackground}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "rgba(13, 15, 18, 0.8)", COLORS.background]}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.heroContent}>
          <Animated.View style={{ 
            opacity: entranceAnim,
            transform: [{ translateY: entranceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })}]
          }}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>HACKATHON COMMUNITY</Text>
            </View>
            
            <Text style={styles.heroMainTitle}>
              Tech<Text style={{ color: COLORS.primary }}> Assassin</Text>
            </Text>
            
            <View style={styles.heroSubtitleRow}>
              <Zap size={22} color={COLORS.primary} fill={COLORS.primary} />
              <Text style={styles.heroSubtitleText}>Active Hackathon Community</Text>
            </View>

            <View style={styles.heroStatsBox}>
              <View style={styles.heroStatItem}>
                <MapPin size={18} color={COLORS.primary} />
                <Text style={styles.heroStatValue}>Global</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <CalendarDays size={18} color={COLORS.primary} />
                <Text style={styles.heroStatValue}>Missions</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Users size={18} color={COLORS.primary} />
                <Text style={styles.heroStatValue}>1.8k+</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.heroPrimaryBtn}>
              <Text style={styles.heroPrimaryBtnText}>JOIN THE SQUAD</Text>
              <ChevronRight color="black" size={20} strokeWidth={3} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.heroSecondaryBtn}>
              <Text style={styles.heroSecondaryBtnText}>EXPLORE MISSIONS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );

  const renderMissionsScreen = () => (
    <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.missionListHeader}>
        <Text style={styles.titleText}>Available Missions</Text>
        <Text style={styles.subtitleText}>High priority bounties for elite operatives.</Text>
      </View>

      {[
        { id: 1, title: "Neural Link Override", reward: "4,500 XP", complexity: "High", color: "#facc15" },
        { id: 2, title: "Ghost Protocol", reward: "2,200 XP", complexity: "Mid", color: "#f87171" },
        { id: 3, title: "Crypto Citadel", reward: "8,000 XP", complexity: "Elite", color: "#c084fc" },
      ].map((mission, index) => (
        <TouchableOpacity key={mission.id} style={styles.missionCardRich}>
          <View style={[styles.missionIndicator, { backgroundColor: mission.color }]} />
          <View style={styles.missionCardBody}>
            <View style={styles.missionCardTop}>
              <Text style={styles.missionCardTitle}>{mission.title}</Text>
              <View style={styles.complexityBadge}>
                <Text style={styles.complexityText}>{mission.complexity}</Text>
              </View>
            </View>
            <View style={styles.missionCardBottom}>
              <View style={styles.rewardBox}>
                <Trophy size={14} color={COLORS.textMuted} />
                <Text style={styles.rewardText}>{mission.reward}</Text>
              </View>
              <TouchableOpacity>
                <ArrowRightIcon />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  return (
    <View style={styles.rootWrapper}>
      <View style={styles.mainContainer} onLayout={onLayoutRootView}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {activeScreen === "Home" && renderHomeScreen()}
      {activeScreen !== "Home" && (
        <View style={styles.headerWrapperFixed}>
          <LinearGradient
            colors={["rgba(36, 38, 43, 0.98)", "rgba(13, 15, 18, 1)"]}
            style={styles.headerBackgroundFlat}
          />
          <View style={styles.headerIconsRowFlat}>
            <View style={styles.headerTitlesRow}>
              <Text style={styles.headerLabel}>TECH ASSASSIN</Text>
              <View style={styles.headerDivider} />
              <Text style={styles.headerTitle}>{activeScreen}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileCircleCompact} 
              activeOpacity={0.8}
              onPress={() => supabase.auth.signOut()}
            >
              <View style={styles.profileInnerCircle}>
                <User color={COLORS.primary} size={20} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeScreen !== "Home" && (
        <SafeAreaView style={styles.safeContainer}>
          {activeScreen === "Missions" && renderMissionsScreen()}
          {/* Add other screen renders as needed */}
        </SafeAreaView>
      )}

      {/* Refined Premium Bottom Navigation */}
      <View style={styles.navWrapper}>
        <View style={styles.navInnerContainer}>
          <LinearGradient
            colors={["rgba(36, 38, 43, 0.98)", "rgba(13, 15, 18, 1)"]}
            style={styles.navBackground}
          />
          
          <View style={styles.navIconsRow}>
            <NavBtn icon={<Flame />} label="Home" active={activeScreen === "Home"} onPress={() => setActiveScreen("Home")} />
            <NavBtn icon={<Target />} label="Missions" active={activeScreen === "Missions"} onPress={() => setActiveScreen("Missions")} />
            
            <View style={{ width: 80 }} /> {/* Spacer for central FAB */}

            <NavBtn icon={<Users />} label="Team" active={activeScreen === "Team"} onPress={() => setActiveScreen("Team")} />
            <NavBtn icon={<Shield />} label="Vault" active={activeScreen === "Vault"} onPress={() => setActiveScreen("Vault")} />
          </View>
        </View>

        {/* Central Popping FAB */}
        <TouchableOpacity 
          style={styles.centerFabPosition} 
          onPress={() => setActiveScreen("Home")}
          activeOpacity={0.9}
        >
          <Animated.View style={[styles.centerFab, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.fabGradient}
            >
              <Zap color="white" fill="white" size={32} />
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
};

const NavBtn = ({ icon, label, active, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.navItem, active && { paddingBottom: 0 }]} 
    onPress={onPress} 
    activeOpacity={0.7}
  >
    <View style={active ? styles.activeIconGlow : null}>
      {React.cloneElement(icon, { 
        size: 24, 
        color: active ? COLORS.primary : COLORS.textMuted,
        fill: "transparent",
        strokeWidth: active ? 2.5 : 2
      })}
    </View>
    <Text style={[
      styles.navLabel, 
      { 
        color: active ? COLORS.primary : COLORS.textMuted,
        fontWeight: active ? "700" : "400",
        textShadowColor: active ? "rgba(199, 18, 49, 0.4)" : "transparent",
        textShadowRadius: active ? 10 : 0
      }
    ]}>
      {label}
    </Text>
    <View style={styles.indicatorContainer}>
      {active && <View style={styles.activeIndicator} />}
    </View>
  </TouchableOpacity>
);

const ArrowRightIcon = () => (
  <View style={styles.arrowIconCircle}>
    <ChevronRight size={16} color={COLORS.primary} strokeWidth={3} />
  </View>
);

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    backgroundColor: "#000", // Background color for larger screens
    alignItems: "center",
    justifyContent: "center",
  },
  mainContainer: {
    flex: 1,
    width: Platform.OS === "web" ? Math.min(SCREEN_WIDTH, MAX_WIDTH) : "100%",
    maxWidth: Platform.OS === "web" ? MAX_WIDTH : undefined,
    backgroundColor: COLORS.background,
    overflow: "hidden",
    alignSelf: "center",
  },
  safeContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  heroBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  heroContent: {
    paddingHorizontal: moderateScale(30),
    paddingBottom: moderateScale(120),
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    marginBottom: 16,
  },
  heroBadgeText: {
    fontFamily: "Inter-Bold",
    fontSize: moderateScale(10),
    color: "white",
    letterSpacing: 2,
  },
  heroMainTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: moderateScale(54),
    color: "white",
    lineHeight: moderateScale(60),
    marginBottom: 4,
  },
  heroSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  heroSubtitleText: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: moderateScale(20),
    color: COLORS.primary,
  },
  heroStatsBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 30,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  heroStatValue: {
    fontFamily: "Inter-Regular",
    fontSize: moderateScale(12),
    color: "rgba(255, 255, 255, 0.7)",
  },
  heroStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  heroPrimaryBtn: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  heroPrimaryBtnText: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: moderateScale(16),
    color: "black",
    letterSpacing: 1,
  },
  heroSecondaryBtn: {
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  heroSecondaryBtnText: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 16,
    color: "white",
    letterSpacing: 1,
  },
  headerWrapperFixed: {
    width: "100%",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 50,
    backgroundColor: COLORS.background,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerBackgroundFlat: {
    ...StyleSheet.absoluteFillObject,
  },
  headerIconsRowFlat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    height: 70,
  },
  headerTitlesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerDivider: {
    width: 1,
    height: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerLabel: {
    fontFamily: "Inter-Bold",
    fontSize: moderateScale(11),
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: moderateScale(22),
    color: "white",
  },
  profileCircleCompact: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  profileInnerCircle: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(199, 18, 49, 0.05)",
  },
  screenScroll: {
    flex: 1,
    paddingHorizontal: 25,
  },
  missionListHeader: {
    marginBottom: 25,
  },
  titleText: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 22,
    color: "white",
  },
  subtitleText: {
    fontFamily: "Inter-Regular",
    fontSize: moderateScale(14),
    color: COLORS.textMuted,
    marginTop: 4,
  },
  missionCardRich: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missionIndicator: {
    width: 6,
    height: "100%",
  },
  missionCardBody: {
    flex: 1,
    padding: 20,
  },
  missionCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  missionCardTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: moderateScale(18),
    color: "white",
    flex: 1,
    marginRight: 10,
  },
  complexityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  complexityText: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    color: COLORS.textMuted,
  },
  missionCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rewardText: {
    fontFamily: "Inter-Bold",
    fontSize: moderateScale(13),
    color: "white",
  },
  arrowIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(199, 18, 49, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  navWrapper: {
    position: "absolute",
    bottom: moderateScale(30),
    left: Platform.OS === "web" ? "5%" : 20,
    right: Platform.OS === "web" ? "5%" : 20,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  navInnerContainer: {
    width: "100%",
    height: 70, // Slightly shorter than wrapper for better shadow breathing
    borderRadius: 35,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    elevation: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 }, // Perfectly uniform glow
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 65,
    height: "100%",
  },
  indicatorContainer: {
    height: 6,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  activeIconGlow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  navBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  navIconsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  navLabel: {
    fontFamily: "Inter-Bold",
    fontSize: moderateScale(10),
  },
  centerFabPosition: {
    position: "absolute",
    top: -35, // Perfectly centered vertically relative to the bar top
    alignSelf: "center",
  },
  centerFab: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    elevation: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
});

export default TechAssassinApp;
