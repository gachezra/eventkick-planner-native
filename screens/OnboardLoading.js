import { Text, StyleSheet, View, Alert } from 'react-native';
import React, { useEffect, useState, useContext, useRef } from 'react';
import ProgressBar from 'react-native-progress/Bar';
import { AuthContext } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import { getApprovedEventsRoute, getUserEventsRoute } from '../utils/APIRoutes';
import axios from 'axios';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

const OnboardLoading = ({ navigation }) => {
  const { token, user } = useContext(AuthContext);
  const [progressValue, setProgressValue] = useState(0);
  const animation = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [dataType, setDataType] = useState(null); // 'user' or 'public'

  // Permission hooks remain the same
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  // isToday function remains the same
  const isToday = (dateString) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  };

  // requestPermissions function remains the same
  const requestPermissions = async () => {
    try {
      const cameraResult = await requestCameraPermission();
      const microphoneResult = await requestMicrophonePermission();
      const mediaLibraryResult = await MediaLibrary.requestPermissionsAsync();
      const mediaLibrarySaveResult = await MediaLibrary.requestPermissionsAsync(true);

      const allPermissionsGranted = 
        cameraResult.granted &&
        microphoneResult.granted &&
        mediaLibraryResult.status === 'granted' &&
        mediaLibrarySaveResult.status === 'granted';

      if (!allPermissionsGranted) {
        Alert.alert(
          'Permissions Required',
          'This app requires camera, microphone, and media library permissions to function properly. Please enable them in your device settings.',
          [{ text: 'OK' }]
        );
      }

      setPermissionsGranted(allPermissionsGranted);
      return allPermissionsGranted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionsGranted(false);
      return false;
    }
  };

  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      const granted = await requestPermissions();
      if (!granted) {
        console.log('Not all permissions were granted');
      }
    };

    checkAndRequestPermissions();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine data type early
        setDataType(user && token ? 'user' : 'public');

        if (user && token) {
          const response = await axios.get(getUserEventsRoute(user._id), {
            headers: { Authorization: `Bearer ${token}` }
          });

          const userEvents = response.data;
          const todayEvent = userEvents.find(event => isToday(event.date));
          const selectedEvent = todayEvent || userEvents[0];

          if (selectedEvent) {
            setSelectedEvent(selectedEvent);
          }
        } else {
          const res = await axios.get(getApprovedEventsRoute);
          const todayEvents = res.data.filter(event => isToday(event.date))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          setEvents(todayEvents);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, token]);

  useEffect(() => {
    let timeoutId;
    
    const updateProgress = () => {
      if (progressValue < 1) {
        timeoutId = setTimeout(() => {
          setProgressValue(prev => Math.min(prev + 0.2, 1));
        }, 1500);
      } else {
        // Navigation logic
        if (token) {
          navigation.replace('HomeTab');
        } else {
          navigation.replace('login');
        }
      }
    };

    updateProgress();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [progressValue]);

  const renderEventStats = () => {
    if (!selectedEvent) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{selectedEvent.totalShares || 0}</Text>
          <Text style={styles.statLabel}>Shares</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{selectedEvent.openedCount || 0}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {selectedEvent.registeredUsers?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Registered</Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (error) {
      return <Text style={styles.eventText}>Unable to load events</Text>;
    }

    if (loading) {
      return <Text style={[styles.eventText, styles.loadingText]}>Loading events...</Text>;
    }

    if (dataType === 'user' && selectedEvent) {
      return (
        <>
          <Text style={styles.eventText}>{`${selectedEvent.title} stats`}</Text>
          {renderEventStats()}
        </>
      );
    }

    if (dataType === 'public') {
      return (
        <Text style={styles.eventText}>
          {`You have ${events.length} event${events.length !== 1 ? 's' : ''} near you today`}
        </Text>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>EventKick</Text>
        <LottieView
          autoPlay
          loop={false}
          ref={animation}
          style={{
            width: 300,
            height: 300,
            backgroundColor: 'transparent',
          }}
          source={require('../assets/welcome.json')}
        />
        {renderContent()}
      </View>
      <View style={styles.progress}>
        <ProgressBar
          progress={progressValue}
          borderRadius={3}
          width={200}
          color={'rgba(255, 255, 255, 0.5)'}
        />
      </View>
    </View>
  );
};

export default OnboardLoading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  logo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 20,
  },
  progress: {
    marginBottom: 70,
    flex: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  eventText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    minWidth: 100,
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 5,
  },
});