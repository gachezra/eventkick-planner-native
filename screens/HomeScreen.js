import React, { useEffect, useState, useRef } from 'react';
import { View, FlatList, TextInput, SafeAreaView, ActivityIndicator, StatusBar, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import EventCard from '../components/EventCard';
import { getApprovedEventsRoute } from '../utils/APIRoutes';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('New'); // State for sorting options
  const [showSortMenu, setShowSortMenu] = useState(false); // State to toggle sort menu visibility
  const navigation = useNavigation();

  // Animated values for dropdown
  const dropdownHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(getApprovedEventsRoute);

        const currentDate = new Date();

        const filteredEvents = res.data
          .filter(event => new Date(event.date) >= currentDate)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(filteredEvents);
        setLoading(false);
      } catch (error) {
        console.error('Error loading events:', error);
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    sortEvents(sortOption);
  }, [sortOption]);

  useEffect(() => {
    // Animate dropdown height when showSortMenu changes
    Animated.timing(dropdownHeight, {
      toValue: showSortMenu ? 70 : 0, // Adjust this value based on your dropdown content height
      duration: 300, // Duration of the animation
      easing: Easing.inOut(Easing.ease), // Easing function for smooth animation
      useNativeDriver: false,
    }).start();
  }, [showSortMenu]);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query) {
      const filtered = events.filter((event) =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    } else {
      setFilteredEvents([]);
    }
  };

  const handleEventPress = (event) => {
    navigation.navigate('EventDetails', { event });
  };

  const sortEvents = (option) => {
    let sortedEvents = [...events];
    if (option === 'Popular') {
      sortedEvents = sortedEvents.sort((a, b) => b.openedCount - a.openedCount);
    } else {
      sortedEvents = sortedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    setEvents(sortedEvents);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#131324]">
      <StatusBar barStyle="light-content" backgroundColor="#131324" />
      <View className="py-2 px-4 justify-center bg-[#1f1f3c]">
        <View className="flex-row items-center justify-between bg-[#2a2a4a] p-2 rounded-lg">
          {/* Search Box */}
          <View className="flex-row items-center flex-1 mr-2">
            <Ionicons name="search" size={20} color="#888" className="mr-5" />
            <TextInput
              className="flex-1 text-base text-[#e0e0e0] ml-1"
              placeholder="Search events..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#737373"
            />
          </View>
          {/* Sort Button */}
          <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)}>
            <Ionicons name="options" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Sort Menu Dropdown with Animation */}
        <Animated.View style={{ height: dropdownHeight, overflow: 'hidden', backgroundColor: '#2a2a4a', paddingHorizontal: 16, paddingVertical: showSortMenu ? 8 : 0, borderRadius: 10, marginTop: 8 }}>
          <TouchableOpacity onPress={() => { setSortOption('New'); setShowSortMenu(false); }}>
            <Text style={{ color: sortOption === 'New' ? '#4a90e2' : '#aaa', paddingVertical: 4, marginBottom: 7 }}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSortOption('Popular'); setShowSortMenu(false); }}>
            <Text style={{ color: sortOption === 'Popular' ? '#4a90e2' : '#aaa', paddingVertical: 4 }}>Popular</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : (
        <FlatList
          data={searchQuery ? filteredEvents : events}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => handleEventPress(item)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;
