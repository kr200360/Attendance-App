import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import { Stack } from 'expo-router';
import { mobileApi } from '../../src/api';

export default function ParentLeaves() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [chData, lData] = await Promise.all([
        mobileApi('/parents/me/children'),
        mobileApi('/leave-requests')
      ]);
      setChildren(chData || []);
      if (chData && chData.length > 0) {
        setSelectedChildId(chData[0]._id);
      }
      setLeaves(lData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason || reason.length < 5) {
      Alert.alert('Validation Error', 'Please enter a clear reason for the requested leave.');
      return;
    }

    setSubmitting(true);
    try {
      await mobileApi('/leave-requests', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedChildId,
          startDate,
          endDate,
          reason
        })
      });

      setReason('');
      Alert.alert('Success', 'Leave request submitted for review.');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Student Leave Requests' }} />

      <FlatList
        data={leaves}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Request Absence Leave</Text>

            <Text style={styles.label}>Select Student</Text>
            <View style={styles.childPills}>
              {children.map(ch => (
                <TouchableOpacity
                  key={ch._id}
                  style={[
                    styles.pill,
                    selectedChildId === ch._id && styles.pillActive
                  ]}
                  onPress={() => setSelectedChildId(ch._id)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      selectedChildId === ch._id && styles.pillTextActive
                    ]}
                  >
                    {ch.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
            />

            <Text style={styles.label}>Reason for Leave</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder="e.g. Family medical appointment"
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>Submit Leave Request</Text>
            </TouchableOpacity>

            <Text style={[styles.formTitle, { marginTop: 24, marginBottom: 8 }]}>
              Previous Leave Requests
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.leaveCard}>
            <View style={styles.leaveHeader}>
              <Text style={styles.leaveDates}>
                {item.startDate} {item.startDate !== item.endDate ? `to ${item.endDate}` : ''}
              </Text>
              <View
                style={[
                  styles.badge,
                  item.status === 'approved' && { backgroundColor: '#dcfce7' },
                  item.status === 'rejected' && { backgroundColor: '#ffe4e6' },
                  item.status === 'pending' && { backgroundColor: '#fef3c7' }
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.status === 'approved' && { color: '#16a34a' },
                    item.status === 'rejected' && { color: '#dc2626' },
                    item.status === 'pending' && { color: '#d97706' }
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.leaveReason}>{item.reason}</Text>
            {item.remarks && (
              <Text style={styles.leaveRemarks}>School note: {item.remarks}</Text>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4
  },
  childPills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  pillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb'
  },
  pillText: {
    fontSize: 12,
    color: '#334155'
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: 'bold'
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: '#0f172a'
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 14
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13
  },
  leaveCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  leaveDates: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  leaveReason: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4
  },
  leaveRemarks: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 4,
    fontStyle: 'italic'
  }
});
