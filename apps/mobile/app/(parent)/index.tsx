import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMobileAuth } from '../../src/context';
import { mobileApi } from '../../src/api';

export default function ParentHome() {
  const router = useRouter();
  const { user, logout } = useMobileAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const data = await mobileApi('/parents/me/children');
      setChildren(data || []);
      if (data && data.length > 0) {
        setSelectedChild(data[0]);
        loadChildAttendance(data[0]._id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadChildAttendance = async (studentId: string) => {
    try {
      const data = await mobileApi(`/attendance/students/${studentId}/attendance`);
      setAttendance(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectChild = (child: any) => {
    setSelectedChild(child);
    loadChildAttendance(child._id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'EduTrack Parent',
          headerRight: () => (
            <TouchableOpacity onPress={() => { logout(); router.replace('/(auth)/login'); }}>
              <Text style={styles.logoutBtn}>Logout</Text>
            </TouchableOpacity>
          )
        }}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : children.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No linked student accounts found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Multi-Child Selector */}
          <Text style={styles.sectionLabel}>Linked Students</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childTabs}>
            {children.map(ch => {
              const isSelected = selectedChild?._id === ch._id;
              return (
                <TouchableOpacity
                  key={ch._id}
                  style={[styles.childTab, isSelected && styles.childTabActive]}
                  onPress={() => handleSelectChild(ch)}
                >
                  <Text style={[styles.childTabText, isSelected && styles.childTabTextActive]}>
                    {ch.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Nav Shortcut Buttons */}
          <View style={styles.shortcutRow}>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push('/(parent)/notifications')}
            >
              <Text style={styles.shortcutBtnText}>Absence Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutBtn}
              onPress={() => router.push('/(parent)/leaves')}
            >
              <Text style={styles.shortcutBtnText}>Request Leave</Text>
            </TouchableOpacity>
          </View>

          {/* Attendance KPI Hero Card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>CURRENT ATTENDANCE RATE</Text>
            <Text style={styles.heroPercentage}>
              {attendance?.percentage ?? 100}%
            </Text>
            <Text style={styles.heroSub}>
              {attendance?.percentage >= 85
                ? 'Meets institutional threshold requirement'
                : 'Attention: Below 85% requirement'}
            </Text>
          </View>

          {/* Summary Stat Grid */}
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumGreen}>{attendance?.present ?? 0}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumRed}>{attendance?.absent ?? 0}</Text>
              <Text style={styles.statLabel}>Absences</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumAmber}>{attendance?.late ?? 0}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
          </View>

          {/* Attendance Record History */}
          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Recent Attendance Log</Text>
          {attendance?.records?.length === 0 ? (
            <Text style={styles.emptyText}>No attendance records recorded yet.</Text>
          ) : (
            attendance?.records?.map((rec: any) => {
              const colorMap: Record<string, string> = {
                present: '#16a34a',
                absent: '#dc2626',
                late: '#d97706',
                excused: '#2563eb'
              };

              return (
                <View key={rec._id} style={styles.recordItem}>
                  <View>
                    <Text style={styles.recordDate}>{rec.date} • Period {rec.period}</Text>
                    <Text style={styles.recordSubject}>{rec.subject}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusTag,
                      { backgroundColor: colorMap[rec.status] || '#64748b' }
                    ]}
                  >
                    <Text style={styles.statusTagText}>{rec.status.toUpperCase()}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  childTabs: {
    flexDirection: 'row',
    marginBottom: 16
  },
  childTab: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8
  },
  childTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  childTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  childTabTextActive: {
    color: '#fff'
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center'
  },
  shortcutBtnText: {
    color: '#1d4ed8',
    fontWeight: 'bold',
    fontSize: 12
  },
  heroCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16
  },
  heroLabel: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  heroPercentage: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 4
  },
  heroSub: {
    color: '#bfdbfe',
    fontSize: 11
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  statNumGreen: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16a34a'
  },
  statNumRed: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#dc2626'
  },
  statNumAmber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d97706'
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  recordItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recordDate: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  recordSubject: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 8
  }
});
