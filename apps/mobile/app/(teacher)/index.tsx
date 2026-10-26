import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMobileAuth } from '../../src/context';
import { mobileApi } from '../../src/api';

export default function TeacherHome() {
  const router = useRouter();
  const { user, logout } = useMobileAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const data = await mobileApi('/teacher-assignments/me');
      setAssignments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClass = (classId: string, className: string) => {
    router.push({
      pathname: '/(teacher)/mark',
      params: { classId, className }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'EduTrack Faculty',
          headerRight: () => (
            <TouchableOpacity onPress={() => { logout(); router.replace('/(auth)/login'); }}>
              <Text style={styles.logoutBtn}>Logout</Text>
            </TouchableOpacity>
          )
        }}
      />

      <View style={styles.welcomeBox}>
        <Text style={styles.welcomeName}>Hello, {user?.name}</Text>
        <Text style={styles.welcomeSub}>Select a cohort to record attendance</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : assignments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No classes assigned to your faculty profile.</Text>
        </View>
      ) : (
        <FlatList
          data={assignments}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const c = item.classId;
            const s = item.subjectId;
            const title = `${c?.grade} - Section ${c?.section}`;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleOpenClass(c?._id, title)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{s?.code || 'HOMEROOM'}</Text>
                  </View>
                </View>
                <Text style={styles.cardSubject}>{s?.name || 'Class Roll Call'}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.actionText}>Open Attendance Roster →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  logoutBtn: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8
  },
  welcomeBox: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  welcomeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  welcomeSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  badge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  cardSubject: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13
  }
});
