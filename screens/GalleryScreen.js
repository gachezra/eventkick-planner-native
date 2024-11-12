import React, { useRef, useState, useCallback } from 'react';
import { View, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, Text, Alert, Platform } from 'react-native';
import { Video } from 'expo-av';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');

const MediaLibrary = ({ route, navigation }) => {
  const { allMedia, eventTitle } = route.params;
  const [media, setMedia] = useState(allMedia);
  const mediaRef = useRef(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const videoRefs = useRef([]);

  const onViewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setSelectedMediaIndex(index);

      // Pause videos not in view and autoplay the one in view
      videoRefs.current.forEach((video, i) => {
        if (i !== index && video) video.pauseAsync();
        if (i === index && video) video.playAsync();
      });
    }
  };

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const shareMedia = async (uri) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      alert('Sharing is not available on this platform');
    }
  };

  const deleteMedia = useCallback(async (uri) => {
    Alert.alert(
      "Delete Media",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            await FileSystem.deleteAsync(uri);
            const updatedMedia = allMedia.filter(item => item.uri !== uri);
            setMedia(updatedMedia);
          } catch (error) {
            console.error('Error deleting media:', error);
            Alert.alert("Error", "Failed to delete the media item.");
          }
        }}
      ]
    );
  }, [allMedia]);

  const saveMedia = (uri) => {
    // Your save logic here (e.g., download or move file)
    alert(`Save media: ${uri}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={mediaRef}
        data={media}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <>
          <View style={styles.mediaContainer}>
            {/* Back Button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Media */}
            {item.type === 'video' ? (
              <Video
                ref={(ref) => (videoRefs.current[index] = ref)}
                source={{ uri: item.uri }}
                style={styles.media}
                resizeMode="stretch"
                shouldPlay={index === selectedMediaIndex}
                isLooping
              />
            ) : (
              <Image source={{ uri: item.uri }} resizeMode="stretch" style={styles.media} />
            )}

            {/* Save and Upload Buttons (stacked vertically) */}
            <View style={styles.topRightActions}>
              <TouchableOpacity
                onPress={() => saveMedia(item.uri)}
                style={{width: 35, height: 35, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center'}}
                >
                <Ionicons name="save-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Share and Delete Buttons at the Bottom */}
          <View style={styles.bottomActions}>
            <TouchableOpacity onPress={() => shareMedia(item.uri)} style={[styles.actionButton, {backgroundColor: 'rgba(67, 56, 202, 0.5)'}]}>
              <Text style={{fontSize: 15, fontWeight: 'bold', color: 'white'}}>Share  </Text>
              <FontAwesome name="share-alt" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteMedia(item.uri)} style={[styles.actionButton, {backgroundColor: 'rgba(248, 113, 113, 0.5)'}]}>
              <Text style={{fontSize: 15, fontWeight: 'bold', color: 'white'}}>Delete  </Text>
              <FontAwesome name="trash" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          </>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  mediaContainer: {
    width: width - 20,
    height: Platform.OS === 'ios' ? height - 140 : height - 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 10,
    marginTop: Platform === 'android' ? 10 : ''
  },
  media: {
    width: '100%',
    height: '100%',
  },
  goBackButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  topRightActions: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  uploadButton: {
    marginTop: 15,
  },
  bottomActions: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 0 : 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justfyContent: 'center'
  },
});

export default MediaLibrary;
