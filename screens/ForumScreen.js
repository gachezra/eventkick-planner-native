import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getForumThreadsRoute, addForumThreadRoute, deleteThreadRoute } from '../utils/APIRoutes';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Toaster, toast } from 'sonner-native';

const ForumScreen = ({ route }) => {
  const { eventId, eventTitle } = route.params;
  const { user, token } = useContext(AuthContext);
  const [threads, setThreads] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await axios.get(`${getForumThreadsRoute}/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}`}
      });
      setThreads(response.data.thread);
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  const handleNewThread = async () => {
    if (newThreadTitle.trim()) {
      try {
        const response = await axios.post(addForumThreadRoute, {
          title: newThreadTitle,
          eventId: eventId,
          userId: user._id,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (response.data.status) {
          const thread = response.data.thread;
          if (thread.posts) {
            setThreads([thread, ...threads]);
          } else {
            console.error('Error: Thread posts array is undefined');
          }
        } else {
          toast.error(response.data.msg);
        }
  
        setNewThreadTitle('');
      } catch (error) {
        console.error('Error creating new thread:', error);
      }
    }
  };

  const handleDelete = async (threadId) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this threeead?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "OK", 
          onPress: async () => {
            try {
              await axios.delete(deleteThreadRoute(threadId, user._id), {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              fetchThreads();
            } catch (error) {
              console.error('Error deleting thread:', error);
              Alert.alert('Error', 'Failed to delete thread. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderThread = ({ item }) => (
    <TouchableOpacity
      style={styles.threadContainer}
      onPress={() => navigation.navigate('Thread', { threadId: item._id })}
    >
      <Text style={styles.threadTitle}>{item.title}</Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5}}>
        <Text style={styles.threadInfo}>
          {item.posts.length} posts • Started by {item.user.username}
        </Text>
        {user._id === item.user._id && (
          <TouchableOpacity
            style={{alignItems: 'right'}}
            onPress={() => handleDelete(item._id)}
          >
            <FontAwesome name="trash" size={16} color="#e24a4a" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131324" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40}
      >
        <Text style={styles.forumTitle}>{eventTitle} Discussions</Text>
        <FlatList
          data={threads}
          keyExtractor={(item) => item._id}
          renderItem={renderThread}
        />
        <LinearGradient
          // Button Linear Gradient
          colors={['#1e1e36', '#131324']}
          style={styles.newThreadContainer}>
          <TextInput
            style={styles.newThreadInput}
            placeholder="Start a new thread..."
            placeholderTextColor="#888"
            value={newThreadTitle}
            onChangeText={setNewThreadTitle}
          />
          <TouchableOpacity style={styles.newThreadButton} onPress={handleNewThread}>
            <Text style={styles.newThreadButtonText}>Post</Text>
          </TouchableOpacity>
        </LinearGradient>
        <Toaster/>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  forumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    marginHorizontal: 15,
    color: '#fff',
  },
  newThreadContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1f1f3c',
  },
  newThreadInput: {
    flex: 1,
    backgroundColor: '#252542',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  newThreadButton: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  newThreadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  threadContainer: {
    backgroundColor: '#1f1f3c',
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 15,
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  threadInfo: {
    fontSize: 14,
    color: '#aaa',
  },
});

export default ForumScreen;