import React, { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Pressable, 
  PanResponder, 
  Image, 
  Button, 
  Alert, 
  Modal, 
  FlatList,
  Platform
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getApprovedEventsRoute } from '../utils/APIRoutes';
import { Ionicons } from '@expo/vector-icons';
import { Toaster, toast } from 'sonner-native';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const CameraScreen = () => {
  // ============= State Management =============
  const { user, token } = useContext(AuthContext);
  const navigation = useNavigation();
  const cameraRef = useRef(null);

  // Permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = useMicrophonePermissions();

  // Camera state
  const [isActive, setIsActive] = useState(false);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [zoom, setZoom] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Media state
  const [picture, setPicture] = useState();
  const [video, setVideo] = useState();

  // Events state
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDropdownVisible, setIsEventDropdownVisible] = useState(false);

  // ============= Directory Management =============
  const createEventDirectories = async (eventId) => {
    try {
      // Define directory paths
      const photoDir = `${FileSystem.documentDirectory}photos/${eventId}`;
      const videoDir = `${FileSystem.documentDirectory}videos/${eventId}`;

      // Check if directories exist
      const [photoDirExists, videoDirExists] = await Promise.all([
        FileSystem.getInfoAsync(photoDir),
        FileSystem.getInfoAsync(videoDir)
      ]);

      // Create directories if they don't exist
      const createDirs = [];
      if (!photoDirExists.exists) {
        createDirs.push(FileSystem.makeDirectoryAsync(photoDir, { intermediates: true }));
      }
      if (!videoDirExists.exists) {
        createDirs.push(FileSystem.makeDirectoryAsync(videoDir, { intermediates: true }));
      }

      if (createDirs.length > 0) {
        await Promise.all(createDirs);
        // console.log(`Created directories for event: ${eventId}`);
      }
    } catch (error) {
      console.error(`Directory creation failed for event ${eventId}:`, error);
      throw error;
    }
  };

  // ============= Event Management =============
  const fetchEvents = async () => {
    try {
      const response = await axios.get(getApprovedEventsRoute, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter events where user is registered
      const userEvents = response.data.filter(event => 
        event.registeredUsers?.some(regUser => 
          regUser.user?.toString() === user._id
        )
      );

      // Create directories for each event
      await Promise.all(userEvents.map(event => 
        createEventDirectories(event._id)
          .catch(error => {
            console.error(`Failed to setup event ${event._id}:`, error);
            toast.error(`Storage setup failed for: ${event.title}`);
          })
      ));

      setEvents(userEvents);
      if (userEvents.length > 0 && !selectedEvent) {
        setSelectedEvent(userEvents[0]);
      }
    } catch (error) {
      console.error("Event fetch failed:", error);
      toast.error("Could not load your events");
    }
  };

  // ============= Camera Controls =============
  const toggleCameraFacing = () => setFacing(current => current === 'back' ? 'front' : 'back');
  const toggleFlash = () => setFlash(current => current === 'off' ? 'on' : 'off');

  const takePicture = async () => {
    if (!cameraRef.current || isRecording || !selectedEvent) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();
      const fileName = `photo_${Date.now()}.jpg`;
      const newUri = `${FileSystem.documentDirectory}photos/${selectedEvent._id}/${fileName}`;
      
      await FileSystem.moveAsync({
        from: photo.uri,
        to: newUri
      });

      setPicture(newUri);
      // console.log('Photo saved:', newUri);
    } catch (error) {
      console.error('Photo capture failed:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const handleRecording = async () => {
    if (!cameraRef.current || !selectedEvent) return;

    try {
      if (isRecording) {
        await cameraRef.current.stopRecording();
        setIsRecording(false);
      } else {
        setIsRecording(true);
        await cameraRef.current.recordAsync({
          quality: '1080p',
          maxDuration: 60,
          mute: false
        }).then(async (recordedVideo) => {
          const fileName = `video_${Date.now()}.mp4`;
          const newUri = `${FileSystem.documentDirectory}videos/${selectedEvent._id}/${fileName}`;
          
          await FileSystem.moveAsync({
            from: recordedVideo.uri,
            to: newUri
          });

          setVideo(newUri);
          // console.log('Video saved:', newUri);
        });
      }
    } catch (error) {
      console.error('Video recording failed:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  // ============= Effects & Handlers =============
  useEffect(() => {
    fetchEvents();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      return () => setIsActive(false);
    }, [])
  );

  // Zoom handler
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newZoom = Math.max(0, Math.min(1, zoom - gestureState.dy / 1500));
      setZoom(newZoom);
    },
  });

  // Permission check
  if (!permission || !audioPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera and microphone access needed</Text>
        <Button 
          title="Grant permissions" 
          onPress={() => {
            requestPermission();
            requestAudioPermission();
          }} 
        />
      </View>
    );
  }

  // ============= Render Methods =============
  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => {
        setSelectedEvent(item);
        setIsEventDropdownVisible(false);
      }}
    >
      <Text style={styles.eventItemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {isActive && (
        <CameraView
          style={styles.camera}
          facing={facing}
          flash={flash}
          ref={cameraRef}
          autoFocus="on"
          zoom={zoom}
        />
      )}

      <Toaster />

      {/* Camera Controls */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Ionicons name={facing === 'back' ? 'camera-reverse' : 'camera'} size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={toggleFlash}>
          <Ionicons name={flash === 'on' ? 'flash' : 'flash-off'} size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={() => navigation.push('Gallery')}>
          <Ionicons name="images" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => setIsEventDropdownVisible(true)}>
          <Ionicons name="list" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Zoom Control */}
      {/* <View style={styles.zoomContainer} {...panResponder.panHandlers}>
        <View style={styles.zoomMarker} />
        <View style={styles.zoomMarker} />
        <View style={styles.zoomMarker} />
        <Text style={styles.zoomText}>{`${(zoom * 100).toFixed(1)}x`}</Text>
        <View style={styles.zoomMarker} />
        <View style={styles.zoomMarker} />
        <View style={styles.zoomMarker} />
      </View> */}

      {/* Capture Button */}
      <Pressable
        onPress={takePicture}
        // onLongPress={handleRecording}
        style={[styles.captureButton, isRecording && styles.recordingButton]}
      />

      {/* Event Selection Modal */}
      <Modal
        visible={isEventDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEventDropdownVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <FlatList
              data={events}
              renderItem={renderEventItem}
              keyExtractor={(item) => item._id}
              style={styles.eventList}
            />
          </View>
        </View>
      </Modal>

      {/* Media Preview */}
      {picture && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: picture }} style={styles.preview} />
          <TouchableOpacity style={styles.closeButton} onPress={() => setPicture(undefined)}>
            <Ionicons name="arrow-back" color="white" size={20} />
          </TouchableOpacity>
        </View>
      )}

      {video && (
        <View style={styles.previewContainer}>
          <Video
            style={styles.preview}
            source={{ uri: video }}
            shouldPlay
            isLooping
            useNativeControls={false}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setVideo(undefined)}>
            <Ionicons name="arrow-back" color="white" size={20} />
          </TouchableOpacity>
        </View>
      )}

      {/* Selected Event Display */}
      {selectedEvent && (
        <View style={styles.selectedEventContainer}>
          <Text style={styles.selectedEventText}>
            Event: {selectedEvent.title}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#131324',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    right: 5,
    top: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
  },
  button: {
    alignItems: 'center',
    borderRadius: 30,
    padding: 10,
    marginBottom: 15
  },
  galleryButton: {
    alignItems: 'center',
    borderRadius: 30,
    padding: 10,
    marginBottom: 15
  },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 50,
    width: 70,
    height: 70,
    backgroundColor: 'white',
    borderRadius: 35,
    borderWidth: 5,
    borderColor: 'rgba(0,0,0,0.2)',
  },
  recordingButton: {
    backgroundColor: 'red',
  },
  focusPoint: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'yellow',
    marginLeft: -35,
    marginTop: -35,
  },
  zoomContainer: {
    position: 'absolute',
    bottom: 60,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    height: 200,
    width: 50,
    borderRadius: 25,
    alignItems: 'center',
    paddingVertical: 10,
    justifyContent: 'center',
  },
  zoomMarker: {
    width: 30,
    height: 1,
    backgroundColor: 'white',
    marginVertical: 10,
    borderRadius: 1,
  },
  zoomText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '50%',
  },
  eventList: {
    flexGrow: 0,
  },
  eventItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  eventItemText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 15,
    height: 30,
    width: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedEventContainer: {
    position: 'absolute',
    bottom: 10,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  selectedEventText: {
    color: 'white',
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
});

export default CameraScreen;