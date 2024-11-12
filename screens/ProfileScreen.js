import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Alert, Share, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Toaster, toast } from 'sonner-native';
import { getUserEventsRoute, deleteEventRoute } from '../utils/APIRoutes';
import { useNavigation } from '@react-navigation/native';
import EventCard from '../components/EventCard';
import { Ionicons } from'@expo/vector-icons';

const ProfileScreen = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [postedEvents, setPostedEvents] = useState([]);
  const [unapprovedEvents, setUnapprovedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    fetchPostedEvents();
  }, []);

  const fetchPostedEvents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(getUserEventsRoute(user._id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const events = response.data.filter(event => event.status === 'approved');
      const sortedEvents = events.sort((b, a) => new Date(a.date) - new Date(b.date));
      setPostedEvents(sortedEvents);
      setUnapprovedEvents(response.data.filter(event => event.status !== 'approved'));
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching posted events:', err.response);
      toast.error('Failed to fetch posted events');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(deleteEventRoute(eventId), { 
              headers: { Authorization: `Bearer ${token}` } 
            });
            setPostedEvents(postedEvents.filter(event => event._id !== eventId));
            toast.success("Event deleted successfully");
          } catch (err) {
            console.error("Error deleting event:", err);
            toast.error("Failed to delete event");
          }
        }
      }
    ]);
  };

  const handleShareEvent = async (eventId) => {
    try {
      const result = await Share.share({
        message:
          `Check out this amazing event on EventKick! https://eventkick.ke/events/${eventId}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log('Shared with: ', result.activityType);
        } else {
          // shared
          toast.success('Event shared successfully!');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        toast.error('Dismissed.');
      }
    } catch (error) {
      toast.error('Failed to share content.');
      console.error(error.message);
    }
  };

  const handleEventPress = (event) => {
    navigation.navigate('EventDetails', { event });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Toaster />
      <View style={styles.container}>
        {/* User Info Section */}
        <View style={styles.userInfoContainer}>
          <SvgXml xml={atob(user.avatarImage)} width="80" height="80" style={styles.avatar} />
          <View style={styles.userTextInfo}>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator style={{position: 'absolute', top: 17, right: 17}} size="medium" color="#4a90e2" />
          ) : (
            <TouchableOpacity style={{position: 'absolute', top: 10, right: 10}} onPress={() => fetchPostedEvents()}>
              <Ionicons name='reload' size={15} color='white' />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Posted')}
          >
            <Text style={styles.actionButtonText}>Pending Events: {unapprovedEvents.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Post')}
          >
            <Text style={styles.actionButtonText}>Post an Event</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={logout}>
            <Text style={styles.actionButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Unapproved Events List */}
        <Text style={styles.sectionTitle}>Approved Events: {postedEvents.length}</Text>
        <FlatList
          data={postedEvents}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <EventCard event={item} userId={user._id} onPress={() => handleEventPress(item)} onShare={() => handleShareEvent(item._id)} onDelete={() => handleDeleteEvent(item._id)} />}
          style={styles.eventsList}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#131324',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4F46E5',
  },
  userTextInfo: {
    marginLeft: 15,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    width: '48%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 5,
  },
  actionButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  eventsList: {
    flex: 1,
  },
});

export default ProfileScreen;