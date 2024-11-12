import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Switch, FlatList, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AWS from 'aws-sdk';
import { styled } from 'nativewind';
import { useNavigation } from '@react-navigation/native';

const UploadScreen = ({ username = 'defaultUser' }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [compress, setCompress] = useState(false);
  const navigation = useNavigation();

  // Configure AWS S3 with Tebi credentials
  const s3 = new AWS.S3({
    endpoint: 'https://s3.tebi.io',
    accessKeyId: 'xFBgncfuBMjrkkMF',
    secretAccessKey: 'LwV3UON29392J3jIoXdu5jOotoEy7L9iddadvjrj',
    region: 'us-east-1',
    signatureVersion: 'v4',
    ACL: 'public-read',
  });

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media is required!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedMedia = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        fileName: asset.fileName || `media_${Date.now()}`,
      }));
      setMediaFiles(selectedMedia);
    }
  };

  const compressImage = async (uri) => {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulatedImage.uri;
  };

  const uploadMediaFile = async (file) => {
    let fileUri = file.uri;

    if (compress && file.type.startsWith('image')) {
      fileUri = await compressImage(file.uri);
      Alert.alert('Image compressed', 'The image was compressed successfully.');
    }

    const response = await fetch(fileUri);
    const blob = await response.blob();

    const folderPath = `${username}/eventkick/`;
    const params = {
      Bucket: 'eventkick',
      Key: `${folderPath}${file.fileName}`,
      Body: blob,
      ContentType: file.type,
    };

    return s3.upload(params).promise().then((res) => console.log(res.Location));
  };

  const uploadToTebi = async () => {
    if (mediaFiles.length === 0) return;

    setUploading(true);
    setUploadStatus('Uploading...');

    try {
      for (let i = 0; i < mediaFiles.length; i++) {
        const media = mediaFiles[i];
        await uploadMediaFile(media);
        setUploadStatus(`Uploaded ${i + 1} of ${mediaFiles.length}`);
      }
      setUploadStatus('All files uploaded successfully!');
    } catch (error) {
      setUploadStatus('Upload failed. Try again.');
      console.error('Error uploading to Tebi: ', error);
    } finally {
      setUploading(false);
    }
  };

  const renderMediaItem = ({ item }) => {
    return item.type.includes('video') ? (
      <Text className="text-white text-sm">Video: {item.fileName}</Text>
    ) : (
      <Image source={{ uri: item.uri }} className="w-24 h-24 rounded-lg mx-2" />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#131324]">
      <StatusBar barStyle="light-content" backgroundColor="#131324" />

      <View className="items-center py-6">
        <Text className="text-2xl font-bold text-white mb-4">Upload Media</Text>

        <View className="w-full h-48 items-center justify-center bg-[#232336] rounded-lg p-4 mb-6">
          {mediaFiles.length > 0 ? (
            <FlatList
              data={mediaFiles}
              keyExtractor={(item) => item.uri}
              renderItem={renderMediaItem}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text className="text-white">No media selected</Text>
          )}
        </View>

        <TouchableOpacity
          className="w-full p-4 rounded-lg bg-indigo-600 items-center mb-6"
          onPress={pickMedia}
        >
          <Text className="text-white text-lg font-bold">Choose Media</Text>
        </TouchableOpacity>

        {/* Compression Toggle */}
        <View className="flex-row items-center justify-between w-full px-6 mb-4">
          <Text className="text-white text-base">Compress Image</Text>
          <Switch value={compress} onValueChange={setCompress} />
        </View>

        {compress && mediaFiles.some((file) => file.type.startsWith('video')) && (
          <Text className="text-xs text-yellow-400 mb-4">
            Compression not available for videos. Videos will be uploaded as-is.
          </Text>
        )}

        <TouchableOpacity
          className={`w-full p-4 rounded-lg ${
            uploading || mediaFiles.length === 0 ? 'bg-gray-600' : 'bg-green-600'
          } items-center`}
          onPress={uploadToTebi}
          disabled={uploading || mediaFiles.length === 0}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-lg font-bold">
              Upload {mediaFiles.length} Files
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-full p-4 rounded-lg mt-3 bg-[#1e1e36] items-center`}
          onPress={() => navigation.navigate('Files')}
        >
          <Text className="text-white text-lg font-bold"> Files</Text>
        </TouchableOpacity>

        {uploadStatus ? <Text className="text-white mt-4">{uploadStatus}</Text> : null}
      </View>
    </SafeAreaView>
  );
};

// Use NativeWind to wrap components for styling
const StyledUploadScreen = styled(UploadScreen);

export default StyledUploadScreen;
