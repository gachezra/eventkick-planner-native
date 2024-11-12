import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AWS from 'aws-sdk';
import { Camera } from 'lucide-react-native';

const s3 = new AWS.S3({
  endpoint: 'https://s3.tebi.io',
  accessKeyId: 'xFBgncfuBMjrkkMF',
  secretAccessKey: 'LwV3UON29392J3jIoXdu5jOotoEy7L9iddadvjrj',
  region: 'us-east-1',
  signatureVersion: 'v4',
});

const EventMediaCount = ({ eventId, eventTitle }) => {
  const navigation = useNavigation();
  const [mediaCount, setMediaCount] = useState(0);
  const [mediaLinks, setMediaLinks] = useState([]);

  useEffect(() => {
    const fetchMedia = async () => {
      if (!eventId) return;

      const params = {
        Bucket: 'eventkick',
        Prefix: `eventkick/${eventId}/`,
      };

      try {
        const data = await s3.listObjectsV2(params).promise();
        if (data.Contents) {
          const links = data.Contents
            .filter(item => {
              const key = item.Key.toLowerCase();
              return key.endsWith('.jpg') || 
                     key.endsWith('.jpeg') || 
                     key.endsWith('.png') || 
                     key.endsWith('.mp4') || 
                     key.endsWith('.mov');
            })
            .map(item => ({
              uri: `https://s3.tebi.io/eventkick/${item.Key}`,
              type: item.Key.toLowerCase().endsWith('.mp4') ? 'video' : 'photo',
              key: item.Key
            }));
          
          setMediaLinks(links);
          setMediaCount(links.length);
        }
      } catch (error) {
        console.error('Error fetching media:', error);
        setMediaCount(0);
        setMediaLinks([]);
      }
    };

    fetchMedia();
  }, [eventId]);

  const handlePress = () => {
    if (mediaCount > 0) {
      navigation.navigate('Reels', { allMedia: mediaLinks, eventId, eventTitle });
    }
  };

  if (mediaCount === 0) return null;

  return (
    <TouchableOpacity 
      style={[styles.container, {width: mediaCount > 10 ? 50 : 40,}]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Camera color="#fff" size={20} />
      <Text style={styles.countText}>{mediaCount}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    left: 10,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5
  },
});

export default EventMediaCount;