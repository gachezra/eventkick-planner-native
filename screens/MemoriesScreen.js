import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, FlatList, Image, SafeAreaView, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { getApprovedEventsRoute } from '../utils/APIRoutes';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AWS from 'aws-sdk';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import { Toaster, toast } from 'sonner-native';

const { width: windowWidth } = Dimensions.get('window');
const albumSize = windowWidth / 2 - 10;

const s3 = new AWS.S3({
  endpoint: 'https://s3.tebi.io',
  accessKeyId: 'xFBgncfuBMjrkkMF',
  secretAccessKey: 'LwV3UON29392J3jIoXdu5jOotoEy7L9iddadvjrj',
  region: 'us-east-1',
  signatureVersion: 'v4',
});

export default function MemoriesScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [eventMedia, setEventMedia] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  useEffect(() => {
    fetchRegisteredEvents();
    loadUploadedFiles();
  }, []);

  const fetchRegisteredEvents = async () => {
    try {
      const response = await axios.get(getApprovedEventsRoute, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allEvents = response.data;

      const filteredEvents = allEvents.filter(event =>
        event.registeredUsers &&
        event.registeredUsers.some(registeredUser => 
          registeredUser.user && registeredUser.user.toString() === user._id
        )
      );

      setEvents([{ _id: 'all', title: 'All Events' }, ...filteredEvents]);
      loadEventMedia(filteredEvents);
    } catch (err) {
      console.error("Error fetching registered events:", err.response);
      toats.error('Error fetching registedred events, reload app!')
    }
  };

  const getFilesRecursively = async (directory) => {
    let results = [];
    const items = await FileSystem.readDirectoryAsync(directory);
    
    for (const item of items) {
      const fullPath = `${directory}/${item}`;
      const info = await FileSystem.getInfoAsync(fullPath);
      
      if (info.isDirectory) {
        results = results.concat(await getFilesRecursively(fullPath));
      } else {
        results.push(fullPath);
      }
    }
    
    return results;
  };

  const loadEventMedia = async (events) => {
    const mediaByEvent = { all: [] };
  
    for (const event of events) {
      if (event._id === 'all') continue; // Skip the "All Events" item
  
      const photoDir = `${FileSystem.documentDirectory}photos/${event._id}`;
      const videoDir = `${FileSystem.documentDirectory}videos/${event._id}`;
  
      const photoFiles = await getFilesRecursively(photoDir).catch(() => []);
      const videoFiles = await getFilesRecursively(videoDir).catch(() => []);
  
      const photos = photoFiles.map(file => ({ uri: file, type: 'photo', eventId: event._id }));
      const videos = videoFiles.map(file => ({ uri: file, type: 'video', eventId: event._id }));
  
      const eventMediaList = [...photos, ...videos].sort((a, b) => {
        const aTime = parseInt(a.uri.split('/').pop().split('.')[0]);
        const bTime = parseInt(b.uri.split('/').pop().split('.')[0]);
        return bTime - aTime;
      });
  
      if (eventMediaList.length > 0) {
        mediaByEvent[event._id] = eventMediaList;
        mediaByEvent.all = [...mediaByEvent.all, ...eventMediaList];
      }
    }
  
    // Sort "All Media"
    mediaByEvent.all.sort((a, b) => {
      const aTime = parseInt(a.uri.split('/').pop().split('.')[0]);
      const bTime = parseInt(b.uri.split('/').pop().split('.')[0]);
      return bTime - aTime;
    });
  
    setEventMedia(mediaByEvent);
  };

  const saveAlbum = async (media, eventTitle) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save media to your device.');
        return;
      }

      for (const item of media) {
        if (item.type === 'photo') {
          await MediaLibrary.saveToLibraryAsync(item.uri);
        } else if (item.type === 'video') {
          await MediaLibrary.saveToLibraryAsync(item.uri);
        }
      }

      toast.success(`${eventTitle} album saved to your device.`);
    } catch (error) {
      console.error('Error saving album:', error);
      toast.error('Failed to save the album. Please try again.');
    }
  };

  const loadUploadedFiles = async () => {
    try {
      const uploadedFilesJSON = await AsyncStorage.getItem('uploadedFiles');
      if (uploadedFilesJSON) {
        setUploadedFiles(JSON.parse(uploadedFilesJSON));
      }
    } catch (error) {
      console.error('Error loading uploaded files:', error);
    }
  };

  const saveUploadedFiles = async (newUploadedFiles) => {
    try {
      await AsyncStorage.setItem('uploadedFiles', JSON.stringify(newUploadedFiles));
    } catch (error) {
      console.error('Error saving uploaded files:', error);
    }
  };

  const uploadAlbum = async (media, eventId) => {
    const newUploadedFiles = { ...uploadedFiles };
    const totalFiles = media.length;
    let uploadedCount = 0;

    setUploadProgress({ [eventId]: 0 });

    try {
      for (const item of media) {
        const fileName = item.uri.split('/').pop();
        const fileKey = `eventkick/${eventId}/${fileName}`;

        if (!newUploadedFiles[eventId] || !newUploadedFiles[eventId].includes(fileKey)) {
          const response = await FileSystem.readAsStringAsync(item.uri, { encoding: FileSystem.EncodingType.Base64 });
          const blob = Buffer.from(response, 'base64');
          
          const params = {
            Bucket: 'eventkick',
            Key: fileKey,
            Body: blob,
            ContentType: item.type === 'photo' ? 'image/jpeg' : 'video/mp4',
            ACL: 'public-read',
          };

          await s3.upload(params).promise();

          if (!newUploadedFiles[eventId]) {
            newUploadedFiles[eventId] = [];
          }
          newUploadedFiles[eventId].push(fileKey);
        }

        uploadedCount++;
        setUploadProgress({ [eventId]: uploadedCount / totalFiles });
      }

      setUploadedFiles(newUploadedFiles);
      await saveUploadedFiles(newUploadedFiles);

      toast.success('Album uploaded successfully.');
    } catch (error) {
      console.error('Error uploading album:', error);
      toast.error('Failed to upload the album. Please try again.');
    } finally {
      setUploadProgress({ [eventId]: 0 });
    }
  };

  const hasUnsyncedFiles = (media, eventId) => {
    if (!uploadedFiles[eventId]) return true;
    return media.some(item => {
      const fileName = item.uri.split('/').pop();
      const fileKey = `eventkick/${eventId}/${fileName}`;
      return !uploadedFiles[eventId].includes(fileKey);
    });
  };

  const renderAlbum = ({ item }) => {
    const media = eventMedia[item._id] || [];
    if (media.length === 0 && item._id !== 'all') {
      return null;
    }

    const coverMedia = media[0] || null;
    const progress = uploadProgress[item._id] || 0;
    const showUploadButton = item._id !== 'all' && hasUnsyncedFiles(media, item._id);

    return (
      <View style={styles.albumContainer}>
        <TouchableOpacity 
          style={styles.album}
          onPress={() => navigation.navigate('Pics', { allMedia: media, eventTitle: item.title })}
        >
          {coverMedia ? (
            coverMedia.type === 'video' ? (
              <Video
                source={{ uri: coverMedia.uri }}
                style={styles.albumCover}
                resizeMode="cover"
                shouldPlay={false}
                isMuted={true}
                positionMillis={1000}
              />
            ) : (
              <Image source={{ uri: coverMedia.uri }} style={styles.albumCover} />
            )
          ) : (
            <View style={[styles.albumCover, styles.emptyAlbum]}>
              <Text style={styles.emptyAlbumText}>No media</Text>
            </View>
          )}
          <Text style={styles.albumTitle}>{item.title}</Text>
          <Text style={styles.mediaCount}>{media.length} items</Text>
        </TouchableOpacity>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={() => saveAlbum(media, item.title)} style={styles.iconButton}>
            <Ionicons name="save-outline" size={24} color="#fff" />
          </TouchableOpacity>
          {showUploadButton && (
            <TouchableOpacity onPress={() => uploadAlbum(media, item._id)} style={styles.iconButton}>
              <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        {progress > 0 && progress < 1 && (
          <Progress.Bar progress={progress} width={null} color="#4CD964" style={styles.progressBar} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        <Text style={styles.title}>Memories</Text>
        <FlatList
          data={events}
          renderItem={renderAlbum}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.albumGrid}
          ListEmptyComponent={<Text style={styles.emptyText}>No events with media found</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#131324',
  },
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 15,
    marginHorizontal: 20,
    color: '#fff',
  },
  albumGrid: {
    padding: 5,
  },
  albumContainer: {
    width: albumSize,
    marginBottom: 20,
    marginHorizontal: 5,
  },
  album: {
    width: '100%',
  },
  albumCover: {
    width: '100%',
    height: albumSize,
    borderRadius: 10,
    marginBottom: 8,
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  iconButton: {
    padding: 5,
  },
  albumCover: {
    width: albumSize,
    height: albumSize,
    borderRadius: 10,
    marginBottom: 8,
  },
  emptyAlbum: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyAlbumText: {
    color: '#888',
    fontSize: 16,
  },
  albumTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mediaCount: {
    color: '#888',
    fontSize: 14,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 30,
  },
  progressBar: {
    marginTop: 5,
  },
});
