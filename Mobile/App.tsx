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
  Shield,
  Clock,
  Github,
  Linkedin,
  Twitter
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "./src/theme/colors";
import { moderateScale, SCREEN_WIDTH } from "./src/theme/responsive";
import { supabase } from "./src/lib/supabase";
import AuthScreen from "./src/screens/AuthScreen";
import EventsScreen from "./src/screens/EventsScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
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

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*, rank:rank_tiers(name, icon_url)')
      .eq('id', session.user.id)
      .single();
    if (data) setProfile(data);
  };

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('leaderboard_all_time')
      .select('*')
      .limit(20);
    if (data) setLeaderboard(data);
  };

  const fetchMissions = async () => {
    if (!session?.user) return;
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_available_missions', {
      p_user_id: session.user.id
    });
    if (data) setMissions(data);
    setIsLoading(false);
  };

  const joinMission = async (missionId: string, requirementType: string) => {
    if (!session?.user) return;
    
    setIsLoading(true);
    
    // For now, we simulate immediate completion for mobile
    const { data, error } = await supabase
      .from('user_missions')
      .upsert({
        user_id: session.user.id,
        mission_id: missionId,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Join failed:', error);
    } else {
      fetchProfile();
      fetchLeaderboard();
      fetchMissions();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (session) {
      fetchLeaderboard();
      fetchMissions();
      fetchProfile();

      // Set up real-time subscription for profile updates
      const profileSubscription = supabase
        .channel(`profile-${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${session.user.id}`
          },
          (payload) => {
            console.log('Real-time profile update received:', payload.new);
            setProfile((prev: any) => ({ ...prev, ...payload.new }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profileSubscription);
      };
    }
  }, [session]);

  // Only return null if fonts aren't even ready
  if (!fontsLoaded) return null;

  // Handle Initial Loading State inside the app structure
  if (isAuthLoading) {
    return (
      <View style={styles.rootWrapper} onLayout={onLayoutRootView}>
        <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Image 
            source={require('./assets/favicon.png')} 
            style={{ width: 120, height: 120, marginBottom: 30 }}
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
    <ScrollView 
      style={styles.screenScrollFull} 
      showsVerticalScrollIndicator={false} 
      contentContainerStyle={{ paddingHorizontal: 0 }}
      bounces={false}
    >
      <ImageBackground 
        source={require("./assets/hero_bg.png")} 
        style={[styles.heroBackground, { height: Dimensions.get('window').height - 60 }]}
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
              <Zap size={20} color={COLORS.primary} fill={COLORS.primary} />
              <Text style={[styles.heroSubtitleText, { color: COLORS.primary }]}>Active Hackathon Community</Text>
            </View>

            <View style={styles.heroStatsBox}>
              <View style={styles.heroStatItem}>
                <MapPin size={22} color={COLORS.primary} />
                <Text style={styles.heroStatLabel}>Global</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <CalendarDays size={22} color={COLORS.primary} />
                <Text style={styles.heroStatLabel}>Missions</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Users size={22} color={COLORS.primary} />
                <Text style={styles.heroStatLabel}>1.8k+</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.heroPrimaryBtn} onPress={() => setActiveScreen("Missions")}>
              <Text style={styles.heroPrimaryBtnText}>JOIN THE SQUAD</Text>
              <ChevronRight color="black" size={20} strokeWidth={3} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.heroSecondaryBtn} onPress={() => setActiveScreen("Events")}>
              <Text style={styles.heroSecondaryBtnText}>EXPLORE MISSIONS</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ImageBackground>

      {/* Explicit 2cm gap added between explore missions button and feed */}
      <View style={{ height: 200 }} />

      {/* Daily Mission Section */}
      {(() => {
        const dailyMission = missions.find(m => m.frequency === 'daily' && m.status !== 'completed');
        if (!dailyMission) return null;

        return (
          <View style={styles.dailyMissionSection}>
            <View style={styles.sectionHeaderRow}>
               <Text style={styles.sectionHeading}>ACTIVE DAILY BOUNTY</Text>
               <View style={styles.timerBadge}>
                  <Clock size={10} color={COLORS.primary} />
                  <Text style={styles.timerText}>
                    {Math.max(0, Math.floor(dailyMission.time_remaining_ms / 3600000))}H REMAINING
                  </Text>
               </View>
            </View>
            
            <TouchableOpacity 
              style={styles.dailyMissionCard}
              onPress={() => joinMission(dailyMission.id, dailyMission.requirement_type)}
            >
              <LinearGradient
                colors={["rgba(199, 18, 49, 0.15)", "rgba(13, 15, 18, 0.05)"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View style={styles.dailyMissionContent}>
                 <View style={styles.dailyMissionIcon}>
                    <Target color={COLORS.primary} size={24} />
                 </View>
                 <View style={{ flex: 1, marginLeft: 15 }}>
                    <Text style={styles.dailyMissionTitle}>{dailyMission.title}</Text>
                    <Text style={styles.dailyMissionDesc}>{dailyMission.description}</Text>
                 </View>
                 <View style={styles.rewardBadgeSmall}>
                    <Text style={styles.rewardValueSmall}>+{dailyMission.xp_reward}</Text>
                    <Text style={styles.rewardLabelSmall}>XP</Text>
                 </View>
              </View>
              
              <View style={styles.dailyProgressTrack}>
                 <View style={[styles.dailyProgressBar, { width: '0%' }]} />
              </View>
              
              <View style={styles.dailyActionRow}>
                 <Text style={styles.statusText}>STATUS: <Text style={{ color: COLORS.primary }}>AVAILBLE</Text></Text>
                 <View style={styles.actionBtnGhost}>
                    <Text style={styles.actionBtnText}>CLAIM XP</Text>
                    <ChevronRight size={14} color={COLORS.primary} />
                 </View>
              </View>
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* Intelligence Feed Section */}
      <View style={styles.feedSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>INTELLIGENCE FEED</Text>
          <TouchableOpacity>
             <Text style={styles.viewAllText}>ARCHIVES</Text>
          </TouchableOpacity>
        </View>

        <FeedItem 
          icon={<Trophy size={18} color="#f59e0b" />} 
          title="RANK ADVANCEMENT" 
          time="1H AGO" 
          desc="Climbed to top 50 rank. Stay sharp." 
        />
        <FeedItem 
          icon={<Target size={18} color="#10b981" />} 
          title="MISSION SECURED" 
          time="4H AGO" 
          desc="Daily objective completed." 
        />
        <FeedItem 
          icon={<Zap size={18} color={COLORS.primary} />} 
          title="UPLINK ESTABLISHED" 
          time="3M AGO" 
          desc="Mission 'Code4Cause' detected." 
        />
      </View>
      
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  const FeedItem = ({ icon, title, time, desc }: any) => (
    <View style={styles.feedItem}>
      <View style={styles.feedIconBox}>
        {icon}
      </View>
      <View style={styles.feedContent}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>{title}</Text>
          <Text style={styles.feedTime}>{time}</Text>
        </View>
        <Text style={styles.feedDesc}>{desc}</Text>
      </View>
    </View>
  );

  const renderMissionsScreen = () => (
    <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.missionListHeader}>
        <Text style={styles.titleText}>Available Missions</Text>
        <Text style={styles.subtitleText}>High priority bounties for elite operatives.</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        missions.map((mission, index) => (
          <TouchableOpacity key={mission.id} style={styles.missionCardRich}>
            <View style={[styles.missionIndicator, { 
              backgroundColor: mission.frequency === 'daily' ? '#3B82F6' : (mission.frequency === 'weekly' ? '#F97316' : '#A855F7') 
            }]} />
            <View style={styles.missionCardBody}>
              <View style={styles.missionCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.missionCardTitle}>{mission.title}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 2, textTransform: 'uppercase' }}>
                    {mission.frequency} • {mission.difficulty}
                  </Text>
                </View>
                <View style={styles.complexityBadge}>
                  <Text style={styles.complexityText}>+{mission.xp_reward} XP</Text>
                </View>
              </View>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 12 }} numberOfLines={2}>{mission.description}</Text>
              <View style={styles.missionCardBottom}>
                <View style={styles.rewardBox}>
                  {mission.status === 'completed' ? (
                    <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12 }}>MISSION SECURED</Text>
                  ) : (
                    <>
                      <Clock size={14} color={COLORS.textMuted} />
                      <Text style={styles.rewardText}>
                        {mission.time_remaining_ms > 0 ? `${Math.floor(mission.time_remaining_ms / 3600000)}h left` : 'LIMITED TIME'}
                      </Text>
                    </>
                  )}
                </View>
                {mission.status !== 'completed' && (
                  <TouchableOpacity 
                     style={styles.joinBtnSmall} 
                     onPress={() => joinMission(mission.id, mission.requirement_type)}
                     disabled={isLoading}
                  >
                    <Text style={styles.joinBtnText}>EXECUTE</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  const renderLeaderboardScreen = () => (
    <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.missionListHeader}>
        <Text style={styles.titleText}>Global Rankings</Text>
        <Text style={styles.subtitleText}>Top operatives in the neural network.</Text>
      </View>

      {leaderboard.map((item, index) => (
        <View key={item.id} style={styles.leaderboardItem}>
          <Text style={styles.rankText}>{item.rank}</Text>
          <View style={styles.leaderboardAvatar}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
            ) : (
              <User color={COLORS.textMuted} size={20} />
            )}
          </View>
          <View style={styles.leaderboardInfo}>
            <Text style={styles.leaderboardName}>{item.username}</Text>
            <Text style={styles.leaderboardRankName}>{item.rank_name || 'Operative'}</Text>
          </View>
          <Text style={styles.xpText}>{item.total_xp} XP</Text>
        </View>
      ))}
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  const renderProfileScreen = () => {
    if (isEditingProfile) {
      return (
        <EditProfileScreen 
          userId={session?.user?.id || ''} 
          onBack={() => {
            setIsEditingProfile(false);
            fetchProfile();
          }} 
        />
      );
    }

    return (
      <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarBig}>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }} 
                style={{ width: '100%', height: '100%', borderRadius: 50 }} 
              />
            ) : (
              <User color={COLORS.primary} size={60} strokeWidth={1} />
            )}
          </View>
          <Text style={styles.profileName}>{profile?.full_name || profile?.username || 'AGENT'}</Text>
          <Text style={styles.profileStatus}>{profile?.rank?.name || 'Initiate'}</Text>

          <TouchableOpacity 
            style={styles.editProfileSummaryBtn}
            onPress={() => setIsEditingProfile(true)}
          >
            <Text style={styles.editProfileSummaryText}>EDIT DOSSIER</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileStatsRow}>
          <View style={styles.pStatItem}>
            <Text style={styles.pStatVal}>{profile?.total_xp || 0}</Text>
            <Text style={styles.pStatLabel}>XP</Text>
          </View>
          <View style={styles.pStatItem}>
            <Text style={styles.pStatVal}>{profile?.current_streak || 0}</Text>
            <Text style={styles.pStatLabel}>STREAK</Text>
          </View>
          <View style={styles.pStatItem}>
            <Text style={styles.pStatVal}>#{profile?.rank_value || '?'}</Text>
            <Text style={styles.pStatLabel}>RANK</Text>
          </View>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>UNLOCKED BADGES</Text>
        </View>
        <View style={styles.badgesGrid}>
           {['🏅', '🚀', '🔥', '⚡', '🛡️'].map((emoji, i) => (
             <View key={i} style={styles.badgeItem}>
               <Text style={{ fontSize: 30 }}>{emoji}</Text>
             </View>
           ))}
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>NEURAL ACCESS</Text>
        </View>
        <View style={styles.socialRow}>
          {profile?.github_url && (
            <TouchableOpacity style={styles.socialIconBtn}><Github color="white" size={24} /></TouchableOpacity>
          )}
          {profile?.linkedin_url && (
            <TouchableOpacity style={styles.socialIconBtn}><Linkedin color="white" size={24} /></TouchableOpacity>
          )}
          {profile?.twitter_url && (
            <TouchableOpacity style={styles.socialIconBtn}><Twitter color="white" size={24} /></TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.signOutBtn}
          onPress={() => supabase.auth.signOut()}
        >
          <Text style={styles.signOutText}>TERMINATE SESSION</Text>
        </TouchableOpacity>
        
        <View style={{ height: 120 }} />
      </ScrollView>
    );
  };

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
              onPress={() => setActiveScreen("Profile")}
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
          {activeScreen === "Leaderboard" && renderLeaderboardScreen()}
          {activeScreen === "Profile" && renderProfileScreen()}
          {activeScreen === "Events" && <EventsScreen />}
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
            
            <View style={{ width: 80 }} />

            <NavBtn icon={<Users />} label="Team" active={activeScreen === "Events"} onPress={() => setActiveScreen("Events")} />
            <NavBtn icon={<Shield />} label="Vault" active={activeScreen === "Leaderboard"} onPress={() => setActiveScreen("Leaderboard")} />
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
    paddingBottom: 0, // Noticeably shifted further down
    alignItems: "flex-start", // Left aligning!
  },
  heroBadge: {
    alignSelf: "flex-start", // Left aligned
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
    textAlign: "left", // Left aligned
  },
  heroSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start", // Left aligned
    gap: 10,
    marginBottom: 30,
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
  heroStatLabel: {
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
  screenScrollFull: {
    flex: 1,
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
    bottom: 15,
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
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankText: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 18,
    color: COLORS.primary,
    width: 30,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontFamily: "Inter-Bold",
    fontSize: 14,
    color: "white",
  },
  leaderboardRankName: {
    fontFamily: "Inter-Regular",
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
  xpText: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 16,
    color: COLORS.primary,
  },
  profileHeader: {
    alignItems: "center",
    marginVertical: 30,
  },
  profileAvatarBig: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  profileName: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 28,
    color: "white",
  },
  profileStatus: {
    fontFamily: "Inter-Bold",
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  profileStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 30,
  },
  pStatItem: {
    alignItems: "center",
  },
  pStatVal: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 20,
    color: "white",
  },
  pStatLabel: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  sectionTitleRow: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 14,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },
  badgeItem: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutBtn: {
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(199, 18, 49, 0.3)",
    marginTop: 20,
  },
  signOutText: {
    fontFamily: "SpaceGrotesk-Bold",
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  joinBtnSmall: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  joinBtnText: {
    fontFamily: "Inter-Bold",
    fontSize: 12,
    color: "black",
  },
  dailyMissionSection: {
    paddingHorizontal: 25,
    marginTop: -100, // Positioned inside the hero gap
    marginBottom: 40,
  },
  dailyMissionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(199, 18, 49, 0.2)',
    overflow: 'hidden',
    padding: 20,
    elevation: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  dailyMissionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dailyMissionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(199, 18, 49, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(199, 18, 49, 0.2)',
  },
  dailyMissionTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  dailyMissionDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: COLORS.textMuted,
  },
  rewardBadgeSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rewardValueSmall: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: COLORS.primary,
  },
  rewardLabelSmall: {
    fontFamily: 'Inter-Bold',
    fontSize: 8,
    color: COLORS.textMuted,
  },
  dailyProgressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    marginBottom: 15,
  },
  dailyProgressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  dailyActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  actionBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(199, 18, 49, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timerText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    color: COLORS.primary,
  },
  feedSection: {
    paddingHorizontal: 25,
    paddingTop: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionHeading: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  viewAllText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  feedItem: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
    backgroundColor: COLORS.card,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feedIconBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedContent: {
    flex: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: 'white',
    letterSpacing: 0.5,
  },
  feedTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: COLORS.textMuted,
  },
  feedDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 16,
  },
  editProfileSummaryBtn: {
    marginTop: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  editProfileSummaryText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: 'white',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
    marginBottom: 30,
  },
  socialIconBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TechAssassinApp;
