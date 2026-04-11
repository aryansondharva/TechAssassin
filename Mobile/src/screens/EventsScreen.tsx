
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Calendar, MapPin, Users, Trophy, Target, Search, Clock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { moderateScale } from '../theme/responsive';

const EventsScreen = () => {
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data as in Desktop
  const events = [
    {
      id: 'luma-code4cause-2025',
      title: 'Code4Cause: Social Impact Hackathon',
      description: "Ready to Ignite Change? Step up and code for a cause! The Social Impact Hackathon isn't just an event; it's a movement.",
      start_date: '2025-02-21T09:00:00+05:30',
      location: 'Computer Seminar Hall | GIDC Degree Engineering College',
      max_participants: 200,
      participant_count: 45,
      status: 'live',
      image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
      prizes: { '1st': '5K INR' },
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Target size={14} color={COLORS.primary} strokeWidth={3} />
          <Text style={styles.badgeText}>ACTIVE DEPLOYMENT ZONE</Text>
        </View>
        <Text style={styles.title}>Community Missions</Text>
        <Text style={styles.subtitle}>High-impact tactical operations within the network.</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search missions..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['All Missions', 'Live', 'Upcoming', 'Archive'].map((label, idx) => {
          const val = label.toLowerCase().split(' ')[0];
          const isActive = filter === val || (filter === 'all' && val === 'all');
          return (
            <TouchableOpacity 
              key={idx} 
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => setFilter(val)}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        events.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventCard}>
            <Image source={{ uri: event.image_url }} style={styles.eventImage} />
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{event.status.toUpperCase()}</Text>
            </View>
            
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDesc} numberOfLines={2}>{event.description}</Text>
              
              <View style={styles.infoRow}>
                <Calendar size={14} color={COLORS.primary} />
                <Text style={styles.infoText}>{new Date(event.start_date).toLocaleDateString()}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <MapPin size={14} color={COLORS.primary} />
                <Text style={styles.infoText} numberOfLines={1}>{event.location}</Text>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.statItem}>
                  <Users size={14} color={COLORS.textMuted} />
                  <Text style={styles.statText}>{event.participant_count}/{event.max_participants} Units</Text>
                </View>
                {event.prizes && (
                   <View style={styles.statItem}>
                     <Trophy size={14} color={COLORS.primary} />
                     <Text style={[styles.statText, { color: COLORS.primary }]}>{event.prizes['1st']} Bounty</Text>
                   </View>
                )}
              </View>

              <TouchableOpacity style={styles.briefingBtn}>
                <Text style={styles.briefingBtnText}>MISSION BRIEFING</Text>
                <ChevronRight size={16} color="white" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: moderateScale(28),
    color: 'white',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 54,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontFamily: 'Inter-Regular',
  },
  filterScroll: {
    marginBottom: 25,
  },
  filterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  filterTextActive: {
    color: 'black',
  },
  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventImage: {
    width: '100%',
    height: 180,
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  eventBody: {
    padding: 20,
  },
  eventTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: 'white',
    textTransform: 'uppercase',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  eventDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  briefingBtn: {
    backgroundColor: COLORS.surface,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  briefingBtnText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: 'white',
    letterSpacing: 1,
  }
});

export default EventsScreen;
