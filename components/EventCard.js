import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThreadCount from './ThreadCount';
import EventMediaCount from './EventMediaCount';

const { width: screenWidth } = Dimensions.get('window');

const EventCard = ({ event, onPress, onDelete, onShare, onEdit }) => {
  const { token } = useContext(AuthContext);
  const [imageHeight, setImageHeight] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (event.image) {
      Image.getSize(event.image, (width, height) => {
        const imageWidth = screenWidth - 32; // Full width minus padding
        const scaleFactor = imageWidth / width;
        setImageHeight(height * scaleFactor);
      }, (error) => {
        console.error("Couldn't get the image size:", error);
      });
    }
  }, [event.image]);

  const handleMenuPress = (e) => {
    e.stopPropagation();
    setMenuVisible(!menuVisible);
  };

  return (
    <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => setMenuVisible(false)}>
      <View style={{ position: 'relative', width: '100%', height: imageHeight }}>
        <Image
          source={{ uri: event.image }}
          style={{ ...StyleSheet.absoluteFillObject, opacity: 0.5 }}
          blurRadius={10}
        />
        <View style={{width: '100%', alignItems: 'center', justifyContent: 'center'}}>
          <Image
            source={{ uri: event.image }}
            style={{ width: '80%', height: '95%', borderRadius: 8 }}
            resizeMode="stretch"
          />
        </View>
        <TouchableOpacity style={{position: 'absolute', top: 10, left:10}} onPress={handleMenuPress}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
        </TouchableOpacity>
        {menuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity onPress={onShare} style={styles.menuItem}>
              <Text style={styles.menuText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.menuItem}>
              <Text style={styles.menuText}>Delete</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={onEdit} style={styles.menuItem}>
              <Text style={styles.menuText}>Edit</Text>
            </TouchableOpacity> */}
          </View>
        )}
        <ThreadCount token={token} eventId={event._id} eventTitle={event.title} />
        <EventMediaCount eventId={event._id} eventTitle={event.title} />
      </View>
      <TouchableOpacity activeOpacity={1} onPress={onPress}>
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>{event.title}</Text>
          </View>
          <Text style={{ fontSize: 14, color: '#aaaaaa', marginBottom: 4 }}>{event.location}</Text>
          <Text style={{ fontSize: 14, color: '#aaaaaa', marginBottom: 4 }}>
            {new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'UTC'
            }).format(new Date(event.date))}
          </Text>
          <Text style={{ fontSize: 14, color: '#cccccc', marginBottom: 12 }} numberOfLines={2}>
            {event.description}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#cccccc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="heart-outline" size={20} color="#cccccc" /> {event.favouritedByUser.length}
            </Text>
            <Text style={{ fontSize: 14, color: '#cccccc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="open-outline" size={20} color="#cccccc" /> {event.openedCount}
            </Text>
            <Text style={{ fontSize: 14, color: '#cccccc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="share-outline" size={20} color="#cccccc" /> {event.totalShares}
            </Text>
            <Text style={{ fontSize: 15, color: '#cccccc', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="people-outline" size={20} color="#cccccc" /> {event.registeredUsers.length}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f1f3c',
    marginBottom: 16,
    borderRadius: 3,
    overflow: 'hidden',
  },
  menu: {
    position: 'absolute',
    top: 40,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 5,
    padding: 5,
    zIndex: 1,
  },
  menuItem: {
    padding: 10,
  },
  menuText: {
    color: '#ffffff',
    fontSize: 14,
  },
});

export default EventCard;