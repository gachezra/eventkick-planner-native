import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Image, ActivityIndicator } from 'react-native';
import { Calendar } from 'react-native-calendars';
import axios from 'axios';
import { getApprovedEventsRoute } from '../utils/APIRoutes';

const EventsScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await axios.get(getApprovedEventsRoute);
      const currentDate = new Date();
      const filteredEvents = res.data
        .filter(event => new Date(event.date) >= currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      const formattedEvents = formatEvents(filteredEvents);
      setEvents(formattedEvents);
    } catch (err) {
      setError('Failed to fetch events. Please try again.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatEvents = (eventsData) => {
    const formatted = {};
    eventsData.forEach(event => {
      const dateKey = new Date(event.date).toISOString().split('T')[0];
      if (!formatted[dateKey]) {
        formatted[dateKey] = [];
      }
      formatted[dateKey].push(event);
    });
    return formatted;
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const getMarkedDates = () => {
    const markedDates = {};
    Object.keys(events).forEach(date => {
      markedDates[date] = {
        marked: true,
        dotColor: '#4a90e2',
        customStyles: {
          container: {
            backgroundColor: '#1f1f3c',
          },
          text: {
            color: '#fff',
            fontWeight: 'bold',
          },
        },
      };
    });
    return markedDates;
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate('EventDetails', { event: item })}
    >
      <View style={styles.eventImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} resizeMode='stretch' style={styles.eventImage} />
        ) : (
          <View style={styles.eventImagePlaceholder} />
        )}
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventTime}>
          {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.eventLocation}>{item.location}</Text>
        <Text style={styles.eventPrice}>
          {item.isPaid ? `$${item.ticketPrice.toFixed(2)}` : 'Free'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEvents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#131324" />
      <Calendar
        onDayPress={onDayPress}
        markedDates={getMarkedDates()}
        markingType={'custom'}
        current={today}
        theme={{
          selectedDayBackgroundColor: '#4a90e2',
          selectedDayTextColor: '#fff',
          todayTextColor: '#4a90e2',
          textDayFontWeight: '600',
          textDayStyle: {
            color: '#fff',
          },
          calendarBackground: '#131324',
          dayTextColor: '#aaa',
          monthTextColor: 'white',
        }}
      />
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>
          Your events for {selectedDate || today}
        </Text>
        <FlatList
          data={events[selectedDate] || events[today]}
          renderItem={renderEventItem}
          keyExtractor={(item) => item._id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>No events for this date</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131324',
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  eventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  eventItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f3c',
  },
  eventImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#4a90e2',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  eventPrice: {
    fontSize: 14,
    color: '#4a90e2',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventsScreen;