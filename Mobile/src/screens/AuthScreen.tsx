
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { moderateScale } from '../theme/responsive';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Contact } from 'lucide-react-native';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isLogin && (!username || !fullName)) {
      Alert.alert('Error', 'Username and Full Name are required for registration');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Direct login via Supabase
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      } else {
        // Direct signup via Supabase
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: username.trim().toLowerCase(),
              full_name: fullName.trim(),
            },
          },
        });
        
        if (error) throw error;
        
        if (data?.session) {
          Alert.alert('Success', 'Account created successfully!');
        } else {
          Alert.alert('Success', 'Verification email sent! Please check your inbox.');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Authentication Failed', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.background, '#0f0f12']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <ShieldCheck size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>
              {isLogin ? 'Mission Check-in' : 'New Operative'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Enter your credentials to access the grid' 
                : 'Initialize your identity with Tech Assassin'}
            </Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <>
                <View style={styles.inputWrapper}>
                  <Contact size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={COLORS.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <User size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor={COLORS.textMuted}
                    value={username}
                    onChangeText={(text) => setUsername(text.replace(/\s/g, ''))}
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            <View style={styles.inputWrapper}>
              <Mail size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.authButtonText}>
                    {isLogin ? 'AUTHENTICATE' : 'INITIALIZE'}
                  </Text>
                  <ArrowRight size={20} color="#000" strokeWidth={3} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => {
                setIsLogin(!isLogin);
                // Reset inputs when toggling
                setFullName('');
                setUsername('');
              }}
            >
              <Text style={styles.toggleText}>
                {isLogin 
                  ? "Don't have an ID? " 
                  : "Already registered? "}
                <Text style={styles.toggleTextHighlight}>
                  {isLogin ? 'Request Access' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 30,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(199, 18, 49, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(199, 18, 49, 0.3)',
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: moderateScale(32),
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: moderateScale(14),
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    height: 60,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: 'white',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    height: 60,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  authButtonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: moderateScale(16),
    color: 'black',
    letterSpacing: 1.5,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: COLORS.textMuted,
  },
  toggleTextHighlight: {
    color: COLORS.primary,
    fontFamily: 'Inter-Bold',
  },
});

export default AuthScreen;
