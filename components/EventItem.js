import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const EventItem = ({ event, onEdit, onDelete }) => {
  return (
    <View style={styles.eventItem}>
      <Image 
        source={{ uri: event.image || 'https://via.placeholder.com/150' }}
        style={styles.eventImage}
      />
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Text style={styles.eventDate}>{new Date(event.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.eventActions}>
        <TouchableOpacity onPress={() => onDelete(event._id)}>
          <MaterialIcons name="delete" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    eventItem: {
      backgroundColor: '#1F2937',
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    eventImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    eventDetails: {
      flex: 1,
    },
    eventTitle: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    eventDate: {
      color: '#9CA3AF',
      fontSize: 14,
    },
    eventActions: {
      flexDirection: 'row',
      width: 60,
      jusifySelf: 'end'
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      paddingVertical: 12,
      paddingHorizontal: 30,
      borderRadius: 25,
    },
});

export default EventItem;