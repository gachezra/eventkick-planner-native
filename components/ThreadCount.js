import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, } from 'react-native';
import { getForumThreadsRoute } from '../utils/APIRoutes';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';

const ThreadCount = ({eventId, token, eventTitle}) => {
  const [threadCount, setThreadCount] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchThreadCount = async () => {
      try {
        const response = await axios.get(`${getForumThreadsRoute}/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}`}
        });
        setThreadCount(response.data.thread.length);
      } catch (error) {
        console.error('Error fetching thread count:', error);
      }
    };
    fetchThreadCount();
  }, [token]);


  return (
    <TouchableOpacity 
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 40,
        height: 30,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
      }}
      activeOpacity={1}
      onPress={() => navigation.navigate('Forums', {eventId, eventTitle})}
    >
      <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
      <Text style={{color: '#fff', marginLeft: 5}}>{threadCount}</Text>
    </TouchableOpacity>
  );
};

export default ThreadCount;