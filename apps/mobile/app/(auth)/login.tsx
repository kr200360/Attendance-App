import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileAuth } from '../../src/context';
import { mobileApi } from '../../src/api';

export default function MobileLogin() {
  const router = useRouter();
  const { login } = useMobileAuth();
  const [email, setEmail] = useState('sarah.jenkins@school.edu');
  const [password, setPassword] = useState('Teacher123!');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const data = await mobileApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(data.user, data.accessToken);

      if (data.user.role === 'teacher' || data.user.role === 'admin') {
        router.replace('/(teacher)');
      } else if (data.user.role === 'parent') {
        router.replace('/(parent)');
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Please check your login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (role: 'teacher' | 'parent') => {
    if (role === 'teacher') {
      setEmail('sarah.jenkins@school.edu');
      setPassword('Teacher123!');
    } else {
      setEmail('john.watson@parent.edu');
      setPassword('Parent123!');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Brand */}
        <View style={styles.brandBox}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>ET</Text>
          </View>
          <Text style={styles.title}>EduTrack Mobile</Text>
          <Text style={styles.subtitle}>School Attendance & Parent Portal</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="teacher@school.edu"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Switcher */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Quick Demo Switcher:</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => setDemoAccount('teacher')}
              >
                <Text style={styles.demoBtnText}>Fill Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => setDemoAccount('parent')}
              >
                <Text style={styles.demoBtnText}>Fill Parent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  container: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%'
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 28
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0f172a'
  },
  loginBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 20
  },
  loginBtnDisabled: {
    opacity: 0.6
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15
  },
  demoBox: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 8
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb'
  }
});
