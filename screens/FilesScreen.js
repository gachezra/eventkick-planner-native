import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AWS from 'aws-sdk';
import { styled } from 'nativewind';

// Define your AWS S3 bucket and credentials
const s3 = new AWS.S3({
  endpoint: 'https://s3.tebi.io',
  accessKeyId: 'xFBgncfuBMjrkkMF',
  secretAccessKey: 'LwV3UON29392J3jIoXdu5jOotoEy7L9iddadvjrj',
  region: 'us-east-1',
  signatureVersion: 'v4',
});

const FilesScreen = ({ username = 'defaultUser' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const folderPath = `${username}/eventkick/`;
        const params = {
          Bucket: 'eventkick',
          Prefix: folderPath,
        };

        const data = await s3.listObjectsV2(params).promise();
        const fileList = data.Contents.map((item) => ({
          key: item.Key,
          fileName: item.Key.replace(folderPath, ''), // Remove folder path from file name
          uri: `https://s3.tebi.io/eventkick/${item.Key}`,
        }));

        console.log(fileList);

        setFiles(fileList);
      } catch (error) {
        console.error('Error fetching files from Tebi: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [username]);

  const renderFileItem = ({ item }) => {
    const isImage = item.fileName.match(/\.(jpeg|jpg|png|gif)$/);
    return (
      <View className="bg-[#232336] p-4 rounded-lg mb-4 w-11/12 self-center">
        {isImage ? (
          <Image source={{ uri: item.uri }} className="w-full h-48 rounded-lg mb-4" />
        ) : (
          <View className="w-full h-48 bg-gray-700 rounded-lg mb-4 items-center justify-center">
            <Text className="text-white text-lg">File: {item.fileName}</Text>
          </View>
        )}
        <Text className="text-white text-lg">{item.fileName}</Text>
        <TouchableOpacity className="mt-2 py-2 px-4 bg-indigo-600 rounded-lg">
          <Text className="text-white text-center">View File</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#131324]">
      <StatusBar barStyle="light-content" backgroundColor="#131324" />
      
      <View className="items-center py-6">
        <Text className="text-2xl font-bold text-white mb-4">Files in Storage</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4">Loading files...</Text>
        </View>
      ) : files.length > 0 ? (
        <FlatList
          data={files}
          keyExtractor={(item) => item.key}
          renderItem={renderFileItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">No files found in the storage bucket.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// Use NativeWind to wrap components for styling
const StyledFilesScreen = styled(FilesScreen);

export default StyledFilesScreen;
