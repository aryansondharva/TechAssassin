
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { User, Globe, Github, Linkedin, Twitter, Save, ArrowLeft, Shield } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import { moderateScale } from '../theme/responsive';
import { supabase } from '../lib/supabase';

const EditProfileScreen = ({ onBack, userId }: { onBack: () => void, userId: string }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    github_url: '',
    linkedin_url: '',
    twitter_url: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setFormData({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          github_url: data.github_url || '',
          linkedin_url: data.linkedin_url || '',
          twitter_url: data.twitter_url || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bio: formData.bio,
          github_url: formData.github_url,
          linkedin_url: formData.linkedin_url,
          twitter_url: formData.twitter_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      Alert.alert('Success', 'Operative parameters synchronized.');
      onBack();
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return (
       <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color={COLORS.primary} />
       </View>
     );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Dossier</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="black" /> : <Save size={20} color="black" />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>IDENTITY PARAMETERS</Text>
          </View>
          
          <InputGroup 
            label="FULL NAME" 
            value={formData.full_name} 
            onChange={(v) => setFormData({...formData, full_name: v})} 
            icon={<User size={18} color={COLORS.textMuted} />}
          />
          
          <InputGroup 
            label="BIO / MISSION STATEMENT" 
            value={formData.bio} 
            onChange={(v) => setFormData({...formData, bio: v})} 
            multiline 
            placeholder="Describe your tactical expertise..."
          />
        </View>

        <View style={styles.section}>
           <View style={styles.sectionHeader}>
            <Globe size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>NEURAL LINKS</Text>
          </View>
          
          <InputGroup 
            label="GITHUB" 
            value={formData.github_url} 
            onChange={(v) => setFormData({...formData, github_url: v})} 
            icon={<Github size={18} color={COLORS.textMuted} />}
            placeholder="https://github.com/..."
          />
          
          <InputGroup 
            label="LINKEDIN" 
            value={formData.linkedin_url} 
            onChange={(v) => setFormData({...formData, linkedin_url: v})} 
            icon={<Linkedin size={18} color={COLORS.textMuted} />}
            placeholder="https://linkedin.com/in/..."
          />
          
          <InputGroup 
            label="TWITTER / X" 
            value={formData.twitter_url} 
            onChange={(v) => setFormData({...formData, twitter_url: v})} 
            icon={<Twitter size={18} color={COLORS.textMuted} />}
            placeholder="https://twitter.com/..."
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const InputGroup = ({ label, value, onChange, icon, multiline, placeholder }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.multilineWrapper]}>
      {icon && <View style={styles.inputIcon}>{icon}</View>}
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: 'white',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 25,
  },
  section: {
    marginBottom: 35,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: 'white',
    letterSpacing: 1.5,
    marginBottom: 10,
    opacity: 0.6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    height: 56,
  },
  multilineWrapper: {
    height: 120,
    paddingVertical: 15,
    alignItems: 'flex-start',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  multilineInput: {
    height: '100%',
  }
});

export default EditProfileScreen;
