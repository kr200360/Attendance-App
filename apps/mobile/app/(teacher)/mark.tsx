import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { mobileApi } from '../../src/api';

export default function MobileMarkAttendance() {
  const router = useRouter();
  const { classId, className } = useLocalSearchParams<{ classId: string; className: string }>();

  const today = new Date().toISOString().split('T')[0];
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string>('draft');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSession();
  }, [classId]);

  const loadSession = async () => {
    try {
      const data = await mobileApi('/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify({
          classId,
          date: today,
          period: 1
        })
      });

      setSessionId(data.session._id);
      setSessionStatus(data.session.status);
      setRecords(data.records || []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const setStudentStatus = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    if (sessionStatus === 'submitted') return;
    setRecords(prev =>
      prev.map(r => (r.studentId._id === studentId ? { ...r, status } : r))
    );
  };

  const markAllPresent = () => {
    if (sessionStatus === 'submitted') return;
    setRecords(prev => prev.map(r => ({ ...r, status: 'present' })));
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      const payload = records.map(r => ({
        studentId: r.studentId._id,
        status: r.status,
        remarks: r.remarks
      }));

      await mobileApi(`/attendance/sessions/${sessionId}/records`, {
        method: 'PUT',
        body: JSON.stringify({ records: payload })
      });

      Alert.alert('Success', 'Draft saved successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const absentCount = records.filter(r => r.status === 'absent').length;

    Alert.alert(
      'Confirm Submission',
      `Submit attendance with ${absentCount} absences? This will lock the session and notify verified parents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const payload = records.map(r => ({
                studentId: r.studentId._id,
                status: r.status,
                remarks: r.remarks
              }));

              await mobileApi(`/attendance/sessions/${sessionId}/submit`, {
                method: 'POST',
                body: JSON.stringify({ records: payload })
              });

              setSessionStatus('submitted');
              Alert.alert('Success', 'Attendance submitted! Parents have been notified.');
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Submission failed');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: className || 'Mark Attendance'
        }}
      />

      {/* Control Strip */}
      <View style={styles.topStrip}>
        <View>
          <Text style={styles.dateText}>Date: {today} (Period 1)</Text>
          <Text style={styles.statusText}>
            Status: <Text style={{ fontWeight: 'bold' }}>{sessionStatus.toUpperCase()}</Text>
          </Text>
        </View>

        {sessionStatus !== 'submitted' && (
          <TouchableOpacity style={styles.allPresentBtn} onPress={markAllPresent}>
            <Text style={styles.allPresentText}>Mark All Present</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const student = item.studentId;
            const currentStatus = item.status;

            return (
              <View style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student?.name}</Text>
                  <Text style={styles.studentAdm}>{student?.admissionNumber}</Text>
                </View>

                {/* Status Toggles */}
                <View style={styles.toggleRow}>
                  {(['present', 'absent', 'late', 'excused'] as const).map(s => {
                    const isSelected = currentStatus === s;
                    const colorMap = {
                      present: '#16a34a',
                      absent: '#dc2626',
                      late: '#d97706',
                      excused: '#2563eb'
                    };

                    return (
                      <TouchableOpacity
                        key={s}
                        disabled={sessionStatus === 'submitted'}
                        style={[
                          styles.statusPill,
                          isSelected && { backgroundColor: colorMap[s] }
                        ]}
                        onPress={() => setStudentStatus(student._id, s)}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isSelected && { color: '#fff', fontWeight: 'bold' }
                          ]}
                        >
                          {s.charAt(0).toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Bottom Action Footer */}
      {sessionStatus !== 'submitted' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.draftBtn}
            onPress={handleSaveDraft}
            disabled={submitting}
          >
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>Submit Roll Call</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  topStrip: {
    padding: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dateText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  statusText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  allPresentBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  allPresentText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb'
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  studentInfo: {
    flex: 1
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a'
  },
  studentAdm: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'monospace'
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6
  },
  statusPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  statusPillText: {
    fontSize: 12,
    color: '#475569'
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    gap: 12
  },
  draftBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center'
  },
  draftBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155'
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center'
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff'
  }
});
