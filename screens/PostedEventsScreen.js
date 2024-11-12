import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, StatusBar, Alert, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Toaster, toast } from 'sonner-native';
import { getUserEventsRoute, editEventRoute } from '../utils/APIRoutes';
import RBSheet from 'react-native-raw-bottom-sheet';
import { TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const PostedEventsScreen = ({ navigation }) => {
  const { user, token } = useContext(AuthContext);
  const [postedEvents, setPostedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDate, setEditedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const bottomSheetRef = useRef();

  useEffect(() => {
    fetchPostedEvents();
  }, []);

  const fetchPostedEvents = async () => {
    try {
      const response = await axios.get(getUserEventsRoute(user._id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPostedEvents(response.data.filter(event => event.status !== 'approved'));
    } catch (err) {
      console.error("Error fetching posted events:", err.response);
      toast.error("Failed to fetch posted events");
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
            await axios.delete(`${editEventRoute(eventId, user._id)}`, { 
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

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEditedTitle(event.title);
    setEditedDate(new Date(event.date));
    setIsEditing(true);
    bottomSheetRef.current.open();
  };

  const handleUpdateEvent = async () => {
    try {
      const response = await axios.put(
        `${editEventRoute(selectedEvent._id)}`,
        { title: editedTitle, date: editedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedEvent = response.data;
      setPostedEvents(postedEvents.map(event => 
        event._id === updatedEvent._id ? updatedEvent : event
      ));
      
      bottomSheetRef.current.close();
      setIsEditing(false);
      toast.success("Event updated successfully");
    } catch (err) {
      console.error("Error updating event:", err.response.data);
      toast.error("Failed to update event");
    }
  };

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || editedDate;
    setShowDatePicker(false);
    setEditedDate(currentDate);
  };

  const onChangeTime = (event, selectedTime) => {
    const currentDate = selectedTime || editedDate;
    setShowTimePicker(false);
    setEditedDate(currentDate);
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate('EventDetailsScreen', { event: item })}
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/150' }}
        style={{
          width: 250,
          height: 250,
          marginRight: 15,
          alignSelf: 'center'
        }}
        resizeMode="stretch" 
      />
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDate}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      <View style={{justifyContent: 'space-between', flexDirection: 'row', marginVertical: 10, marginTop: 5}}>
        <TouchableOpacity onPress={() => handleEditEvent(item)}>
          <Ionicons name='pencil-outline' color='white' size={25} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteEvent(item._id)}>
          <Ionicons name='trash' color='red' size={25} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Toaster />
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Pending Events</Text>
        <FlatList
          data={postedEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={<Text style={styles.emptyText}>Congrats! No pending events</Text>}
        />
      </View>
      <RBSheet
        ref={bottomSheetRef}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={400}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)"
          },
          container: {
            backgroundColor: '#1F2937',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          draggableIcon: {
            backgroundColor: "#fff"
          }
        }}
      >
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>Edit Event</Text>
          {isEditing && (
            <>
              <TextInput
                style={styles.bottomSheetInput}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Event Title"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity 
                style={styles.bottomSheetInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {editedDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.bottomSheetInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {editedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={editedDate}
                  mode="date"
                  display="default"
                  onChange={onChangeDate}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={editedDate}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={onChangeTime}
                />
              )}
              <TouchableOpacity 
                style={styles.bottomSheetButton} 
                onPress={handleUpdateEvent}
              >
                <Text style={styles.bottomSheetButtonText}>Update Event</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </RBSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#131324' },
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#131324' },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  emptyText: { color: '#9CA3AF', fontSize: 16, textAlign: 'center', marginTop: 20 },
  eventItem: { backgroundColor: '#1e1e36', padding: 15, borderRadius: 10, marginTop: 10, marginBottom: 20 },
  eventTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  eventDate: { color: 'white', fontSize: 14, marginVertical: 5 },
  bottomSheetContent: { padding: 20 },
  bottomSheetTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 15 },
  bottomSheetInput: { backgroundColor: '#374151', padding: 10, marginVertical: 10, borderRadius: 5, color: 'white' },
  bottomSheetButton: { backgroundColor: '#4F46E5', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  bottomSheetButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  dateTimeText: { color: 'white', fontSize: 16 }
});

export default PostedEventsScreen;