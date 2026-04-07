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
  Easing
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
  Play
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "./src/theme/colors";

const { width } = Dimensions.get("window");

const TechAssassinApp = () => {
  const [fontsLoaded] = useFonts({
    "SpaceGrotesk-Regular": SpaceGrotesk_400Regular,
    "SpaceGrotesk-Bold": SpaceGrotesk_700Bold,
    "Inter-Regular": Inter_400Regular,
    "Inter-Bold": Inter_700Bold,
  });

  // Animation values
  const fadeAnimHeader = useRef(new Animated.Value(0)).current;
  const fadeAnimHero = useRef(new Animated.Value(0)).current;
  const fadeAnimFeed = useRef(new Animated.Value(0)).current;
  const slideAnimMissions = useRef(new Animated.Value(width)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();

    if (fontsLoaded) {
      // Sequence of entrance animations
      Animated.sequence([
        Animated.delay(200),
        Animated.parallel([
          Animated.timing(fadeAnimHeader, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnimHero, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(slideAnimMissions, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnimFeed, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Loop pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const onLayoutRootView = async () => {
    await SplashScreen.hideAsync();
  };

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[COLORS.background, "#1a1616", COLORS.background]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.header, 
              { 
                opacity: fadeAnimHeader,
                transform: [{ translateY: fadeAnimHeader.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })}]
              }
            ]}
          >
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>Operative Aryan</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <Bell color={COLORS.foreground} size={24} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </Animated.View>

          {/* Hero Section Card */}
          <Animated.View 
            style={[
              styles.heroCard,
              {
                opacity: fadeAnimHero,
                transform: [{ translateY: fadeAnimHero.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })}]
              }
            ]}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>HACKATHON COMMUNITY</Text>
                </View>
              </View>
              
              <Text style={styles.heroTitle}>
                Tech<Text style={styles.heroTitleHighlight}> Assassin</Text>
              </Text>
              
              <View style={styles.heroSubtitleContainer}>
                <Flame size={18} color={COLORS.primary} style={styles.heroIcon} />
                <Text style={styles.heroSubtitle}>Active Missions Available</Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Users size={16} color={COLORS.primary} />
                  <Text style={styles.statText}>1.8k+ Squad</Text>
                </View>
                <View style={styles.statItem}>
                  <Target size={16} color={COLORS.primary} />
                  <Text style={styles.statText}>12 Active</Text>
                </View>
                <View style={styles.statItem}>
                  <MapPin size={16} color={COLORS.primary} />
                  <Text style={styles.statText}>Global</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>JOIN THE SQUAD</Text>
                <ChevronRight color={COLORS.foreground} size={18} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Missions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.missionsGrid}>
            {[
              { id: 1, title: 'AI Overlord', rank: 'A', xp: 500, icon: <Zap size={24} color="#facc15" /> },
              { id: 2, title: 'Block Hunter', rank: 'S', xp: 1200, icon: <Target size={24} color="#f87171" /> },
            ].map((mission, index) => (
              <Animated.View 
                key={mission.id}
                style={[
                  styles.missionCard,
                  {
                    transform: [{ translateX: slideAnimMissions }]
                  }
                ]}
              >
                <View style={styles.missionIcon}>{mission.icon}</View>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <View style={styles.missionFooter}>
                  <Text style={styles.rankText}>Rank {mission.rank}</Text>
                  <Text style={styles.xpText}>+{mission.xp} XP</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Community Feed Highlight */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Global Feed</Text>
          </View>

          <Animated.View 
            style={[
              styles.feedCard,
              {
                opacity: fadeAnimFeed,
                transform: [{ translateY: fadeAnimFeed.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })}]
              }
            ]}
          >
            <View style={styles.feedHeader}>
              <View style={styles.avatarPlaceholder}>
                <User color={COLORS.foreground} size={20} />
              </View>
              <View>
                <Text style={styles.feedUserName}>Zephyr Assassin</Text>
                <Text style={styles.feedTime}>2 hours ago</Text>
              </View>
            </View>
            <Text style={styles.feedContent}>
              Just completed the "Cloud Breaker" bounty! The rewards are insane. Best of luck squad! 🚀
            </Text>
            <View style={styles.feedImagePlaceholder}>
              <Play color={COLORS.primary} size={40} />
              <Text style={styles.feedImageText}>Tech Talk - Cloud Security</Text>
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modern Bottom Tab Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Target color={COLORS.primary} size={24} />
          <Text style={styles.navTextActive}>Missions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Search color={COLORS.textMuted} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemCenter}>
          <Animated.View style={[styles.fab, { transform: [{ scale: pulseAnim }] }]}>
            <Zap color={COLORS.foreground} size={28} />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Users color={COLORS.textMuted} size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <User color={COLORS.textMuted} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  welcomeText: {
    fontFamily: "Inter-Regular",
    color: COLORS.textMuted,
    fontSize: 14,
  },
  userName: {
    fontFamily: "SpaceGrotesk-Bold",
    color: COLORS.foreground,
    fontSize: 24,
    marginTop: 4,
  },
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationDot: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  heroCard: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(199, 18, 49, 0.3)',
    marginBottom: 30,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  heroOverlay: {
    padding: 24,
  },
  badgeContainer: {
    marginBottom: 16,
  },
  badge: {
    backgroundColor: 'rgba(199, 18, 49, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(199, 18, 49, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 38,
    color: COLORS.foreground,
    lineHeight: 44,
  },
  heroTitleHighlight: {
    color: COLORS.primary,
  },
  heroSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  heroIcon: {
    marginRight: 8,
  },
  heroSubtitle: {
    fontFamily: "Inter-Bold",
    fontSize: 18,
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: "Inter-Regular",
    color: COLORS.textMuted,
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: "SpaceGrotesk-Bold",
    color: COLORS.foreground,
    fontSize: 14,
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    color: COLORS.foreground,
    fontSize: 20,
  },
  seeAll: {
    fontFamily: "Inter-Regular",
    color: COLORS.primary,
    fontSize: 14,
  },
  missionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  missionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  missionTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    color: COLORS.foreground,
    fontSize: 16,
    marginBottom: 8,
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rankText: {
    fontFamily: "Inter-Bold",
    color: COLORS.primary,
    fontSize: 12,
  },
  xpText: {
    fontFamily: "Inter-Regular",
    color: "#4ade80",
    fontSize: 10,
  },
  feedCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedUserName: {
    fontFamily: "Inter-Bold",
    color: COLORS.foreground,
    fontSize: 15,
  },
  feedTime: {
    fontFamily: "Inter-Regular",
    color: COLORS.textMuted,
    fontSize: 12,
  },
  feedContent: {
    fontFamily: "Inter-Regular",
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  feedImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  feedImageText: {
    fontFamily: "SpaceGrotesk-Bold",
    color: COLORS.foreground,
    fontSize: 14,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: 'rgba(26, 28, 33, 0.95)',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 45,
    height: 45,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(199, 18, 49, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    flexDirection: 'row',
    gap: 8,
  },
  navTextActive: {
    fontFamily: "Inter-Bold",
    color: COLORS.primary,
    fontSize: 12,
  },
  navItemCenter: {
    marginTop: -40,
  },
  fab: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: COLORS.background,
  }
});

export default TechAssassinApp;
