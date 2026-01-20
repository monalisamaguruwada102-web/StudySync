import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, LogIn, UserPlus, Info } from 'lucide-react-native';

import { Colors, Spacing, Typography } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { CustomInput } from '../../components/CustomInput';
import { CustomButton } from '../../components/CustomButton';

const { width, height } = Dimensions.get('window');

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <LogIn size={40} color={Colors.white} />
            </View>
            <Text style={styles.title}>Off Rez Connect</Text>
            <Text style={styles.subtitle}>Log in to access your boarding account</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.glassBackground} />

            <View style={styles.inputWrapper}>
              <Mail size={18} color={Colors.textLight} style={styles.inputIcon} />
              <CustomInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.field}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={18} color={Colors.textLight} style={styles.inputIcon} />
              <CustomInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.field}
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.signupBtn}>
              <Text style={styles.signupText}>Sign Up Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Info size={16} color={Colors.primary} />
            <Text style={styles.infoText}>Only registered users can log in. If this is your first time, please sign up.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: Spacing.l,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.m,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 4,
    color: Colors.textLight,
  },
  formCard: {
    padding: Spacing.l,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    opacity: 0.4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.m,
  },
  inputIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    bottom: 18,
  },
  field: {
    flex: 1,
    paddingLeft: 44,
    backgroundColor: 'white',
    borderRadius: 16,
    height: 56,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.l,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  loginBtn: {
    height: 56,
    borderRadius: 18,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    color: Colors.textLight,
    fontSize: 15,
  },
  signupBtn: {
    marginLeft: 8,
  },
  signupText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 16,
    marginTop: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoText: {
    flex: 1,
    color: '#1e40af',
    fontSize: 12,
    marginLeft: 10,
    lineHeight: 18,
  }
});
