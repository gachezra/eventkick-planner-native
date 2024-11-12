import React, { useRef, useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, Text, Alert, Image, Platform } from 'react-native';
import { Video } from 'expo-av';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Toaster, toast } from 'sonner-native';

const { width, height } = Dimensions.get('window');

const EventReelsScreen = ({ route, navigation }) => {
  const { allMedia, eventTitle, eventId } = route.params;
  const videoRefs = useRef({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Request permissions for media library
  const requestPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to save media to your gallery.');
      return false;
    }
    return true;
  };

  // Download and save media to gallery
  const saveToGallery = async (item) => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      // Show loading indicator
      Alert.alert('Downloading...', 'Please wait while we save the media.');

      // Generate a unique filename with appropriate extension
      const extension = item.type === 'video' ? '.mp4' : '.jpg';
      const filename = `${eventId}-${Date.now()}${extension}`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(item.uri, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error('Failed to download file');
      }

      // Save to media library in an album
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      const album = await MediaLibrary.getAlbumAsync(eventTitle);
      
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync(eventTitle, asset, false);
      }

      // Clean up the cached file
      await FileSystem.deleteAsync(fileUri);

      toast.success('Media saved to gallery!');
    } catch (error) {
      console.error('Error saving media:', error);
      toast.error('Failed to save media to gallery.');
    }
  };

  // Share media file
  const shareMedia = async (item) => {
    try {
      // Download the file first
      const extension = item.type === 'video' ? '.mp4' : '.jpg';
      const filename = `${eventId}-${Date.now()}${extension}`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(item.uri, fileUri);
      
      if (downloadResult.status === 200) {
        const mimeType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
        await Sharing.shareAsync(fileUri, {
          mimeType: mimeType,
          dialogTitle: `Share ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`,
        });
        // Clean up
        await FileSystem.deleteAsync(fileUri);
      }
    } catch (error) {
      console.error('Error sharing media:', error);
      Alert.alert('Error', 'Failed to share media.');
    }
  };

  const onViewableItemsChanged = useCallback(({ changed }) => {
    changed.forEach(({ isViewable, item, index }) => {
      if (isViewable) {
        setCurrentIndex(index);
        // Play current video if it's a video
        if (item.type === 'video' && videoRefs.current[index]) {
          videoRefs.current[index].playAsync();
        }
      } else {
        // Pause videos not in view
        if (item.type === 'video' && videoRefs.current[index]) {
          videoRefs.current[index].pauseAsync();
        }
      }
    });
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };


  const renderMedia = (item, index) => {
    if (item.type === 'video') {
      return (
        <Video
          ref={ref => (videoRefs.current[index] = ref)}
          source={{ uri: item.uri }}
          style={styles.media}
          resizeMode="cover"
          shouldPlay={index === currentIndex}
          isLooping
        />
      );
    } else {
      return (
        <Image
          source={{ uri: item.uri }}
          style={styles.media}
          resizeMode="cover"
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{eventTitle}</Text>
      </View>
      <FlatList
        data={allMedia}
        vertical
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.reelContainer}>
            {renderMedia(item, index)}
            
            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => saveToGallery(item)}
              >
                <Ionicons name="save-outline" size={26} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => shareMedia(item)}
              >
                <FontAwesome name="share" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Toaster/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  backButton: {
    padding: 5,
  },
  reelContainer: {
    flex: 1,
    width: width,
    height: Platform.OS === 'android' ? height - 55 : height - 132,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: Platform.OS === 'ios' ? 10 : 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  media: {
    width: '97%',
    height: '100%',
    borderRadius: 20,
    alignSelf: 'center',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
});


export default EventReelsScreen;