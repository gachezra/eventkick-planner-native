import React, { useState, useCallback, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Platform, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { scanTicketRoute, getEventRoute } from '../utils/APIRoutes';
import axios from 'axios';

const ScannerScreen = ({ route }) => {
  const { token } = useContext(AuthContext);
  const { eventId } = route.params;
  const [event, setEvent] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [isActive, setIsActive] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => {
        setIsActive(false);
      };
    }, [])
  );

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log(eventId)
        await axios.get(getEventRoute(eventId)).then((res) => {
          setEvent(res.data)
        })
      } catch (e) {
        console.error('Error fetching event:', e.response.data);
      };
    };

    fetchEvent();
  }, [eventId])

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to use the camera and microphone.</Text>
        <Button onPress={() => {
          requestPermission();
        }} title="Grant permissions" />
      </View>
    );
  };

  const handleBarCodeScanned = async (data) => {
    const [eventid, userId] = data.split('_');

    if (eventid !== event._id || !event.registeredUsers.some(registeredUser => registeredUser.user.toString() === userId)) {
      Alert.alert(
        "Invalid QR Code",
        "Scan again?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => navigation.goBack()
          },
          { 
            text: "Scan", 
            style: "default",
            onPress: () => setIsActive(true)
          }
        ]
      );
    } else {
      try {
        const res = await axios.post(scanTicketRoute(eventId, userId), {
          scanned: true
        }, {
          headers: { Authorization: `Bearer ${token}`}
        })
        if (res.status === 200) {
          const msg = res.data.message;
          Alert.alert(
            `${msg}`,
            "Continue?",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => navigation.goBack()
              },
              {
                text: "Scan",
                style: "default",
                onPress: () => setIsActive(true)
              }
            ]
          );
        };
      } catch (e) {
        const msg = e.response.data.message;
        Alert.alert(
          `${msg}`,
          "Try again?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => navigation.goBack()
            },
            { 
              text: "Scan", 
              style: "default",
              onPress: () => setIsActive(true)
            }
          ]
        );
      }
    }
  };

  console.log(event)

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' ? <StatusBar hidden /> : null}
      <View style={styles.overlay} />
      <View style={styles.cameraContainer}>
        {isActive ? (
          <CameraView
            style={styles.camera}
            facing='back'
            onBarcodeScanned={({data}) => {
              handleBarCodeScanned(data)
              setIsActive(false)
            }}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            autoFocus='on'
          />
        ) : 
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4a90e2" />
          </View>
        }
      </View>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name='arrow-back' color='white' size={20} />
      </TouchableOpacity>
      <View style={styles.selectedEventContainer}>
        <Text style={styles.selectedEventText}>{event.title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  cameraContainer: {
    position: 'absolute',
    top: '25%',
    left: '20%',
    width: '60%',
    height: '40%',
    overflow: 'hidden',
    borderRadius: 8,
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 30,
    borderRadius: 15,
  },
  selectedEventContainer: {
    position: 'absolute',
    bottom: 150,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  selectedEventText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 25,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
});

export default ScannerScreen;