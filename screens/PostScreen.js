import React, { useState, useContext } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { format } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Toaster, toast } from 'sonner-native';
import { addEventRoute } from '../utils/APIRoutes';
import AWS from 'aws-sdk';

// AWS configuration remains the same
const s3 = new AWS.S3({
  endpoint: 'https://s3.tebi.io',
  accessKeyId: 'xFBgncfuBMjrkkMF',
  secretAccessKey: 'LwV3UON29392J3jIoXdu5jOotoEy7L9iddadvjrj',
  region: 'us-east-1',
  signatureVersion: 'v4',
  ACL: 'public-read',
});

const PostScreen = () => {
  // State declarations remain the same
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isPaid, setIsPaid] = useState('no');
  const [ticketPrice, setTicketPrice] = useState('');

  const { user, token } = useContext(AuthContext);
  const navigation = useNavigation();

  // Function implementations remain the same
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: undefined,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const uploadMediaFile = async (file) => {
    let fileUri = file.uri;
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const folderPath = `eventkick/${user._id}/posters/`;
    const params = {
      Bucket: 'eventkick',
      Key: `${folderPath}${file.fileName}`,
      Body: blob,
      ContentType: file.type,
    };

    return s3.upload(params).promise().then((res) => setImageUrl(res.Location));
  };

  const handleSubmit = async () => {
    if (!title || !description || !location) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!image) {
      toast.error('Please select an event image');
      return;
    }

    try {
      await uploadMediaFile(image);
      const eventData = {
        title,
        description,
        date: format(date, "yyyy-MM-dd'T'HH:mm:ss"),
        location,
        user: user._id,
        image: imageUrl,
        isPaid: isPaid === 'yes',
        ticketPrice: isPaid === 'yes' ? parseFloat(ticketPrice) : 0,
      };

      await axios.post(addEventRoute, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Event posted successfully!');
      navigation.navigate('Posted');
    } catch (error) {
      console.error('Error posting event:', error.response?.data || error);
      toast.error('Failed to post event. Please try again.');
    }
  };

  // Custom radio button component
  const CustomRadioButton = ({ label, selected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.radioButton,
        selected && styles.radioButtonSelected
      ]}
    >
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected && <View style={styles.selectedRing} />}
      </View>
      <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{flex: 1}}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40}
          >
        <ScrollView style={styles.container}>
          <Surface style={styles.headerCard}>
            <Text style={styles.title}>Create New Event</Text>
            <Text style={styles.subtitle}>Fill in the details below to post your event</Text>
          </Surface>
          
          <View style={styles.formContainer}>
            <TextInput
              label="Event Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              mode="outlined"
              outlineColor="#4f46e5"
              activeOutlineColor="#4f46e5"
              theme={{ colors: { text: 'white', placeholder: 'rgba(255,255,255,0.7)' } }}
            />
            
            <TextInput
              label="Event Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={styles.input}
              mode="outlined"
              outlineColor="#4f46e5"
              activeOutlineColor="#4f46e5"
              theme={{ colors: { text: 'white', placeholder: 'rgba(255,255,255,0.7)' } }}
            />
            
            <Text style={styles.sectionTitle}>Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Date</Text>
                <RNDateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  themeVariant='dark'
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setDate(selectedDate);
                  }}
                  style={[styles.datePicker, { backgroundColor: 'transparent', alignSelf: 'start' }]}
                  textColor="black"
                  minimumDate={new Date()}
                />
              </View>
              
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Time</Text>
                <RNDateTimePicker
                  value={date}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  themeVariant='dark'
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setDate(selectedDate);
                  }}
                  style={[styles.datePicker, { backgroundColor: 'transparent', alignSelf: 'start' }]}
                  textColor="white"
                />
              </View>
            </View>
            
            <TextInput
              label="Event Location"
              value={location}
              onChangeText={setLocation}
              style={styles.input}
              mode="outlined"
              outlineColor="#4f46e5"
              activeOutlineColor="#4f46e5"
              theme={{ colors: { text: 'white', placeholder: 'rgba(255,255,255,0.7)' } }}
            />
            
            <Button 
              onPress={pickImage} 
              mode="contained" 
              style={styles.imageButton}
              labelStyle={styles.imageButtonLabel}
            >
              {image ? 'Change Event Image' : 'Upload Event Image'}
            </Button>

            {image && (
              <Image
                source={{ uri: image.uri }}
                style={styles.imagePreview}
              />
            )}
            
            <Text style={styles.sectionTitle}>Event Type</Text>
            <View style={styles.radioGroup}>
              <CustomRadioButton
                label="Free Event"
                selected={isPaid === 'no'}
                onPress={() => setIsPaid('no')}
              />
              <CustomRadioButton
                label="Paid Event"
                selected={isPaid === 'yes'}
                onPress={() => setIsPaid('yes')}
              />
            </View>
            
            {isPaid === 'yes' && (
              <TextInput
                label="Ticket Price"
                value={ticketPrice}
                onChangeText={setTicketPrice}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                outlineColor="#4f46e5"
                activeOutlineColor="#4f46e5"
                theme={{ colors: { text: 'white', placeholder: 'rgba(255,255,255,0.7)' } }}
                left={<TextInput.Affix style={{color: 'white'}} text="Ksh" />}
              />
            )}
            
            <Button 
              onPress={handleSubmit} 
              mode="contained" 
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
            >
              Post Event
            </Button>
          </View>
          <Toaster />
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#131324',
  },
  headerCard: {
    backgroundColor: '#1e1e36',
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    marginTop: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#1e1e36',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerContainer: {
    flex: 1,
    marginRight: 10,
  },
  dateLabel: {
    color: 'white',
    marginBottom: 8,
    fontSize: 14,
  },
  datePicker: {
    height: 40,
    borderRadius: 15,
  },
  imageButton: {
    marginBottom: 15,
    backgroundColor: '#4f46e5',
    borderRadius: 8,
  },
  imageButtonLabel: {
    fontSize: 16,
    textTransform: 'none',
    paddingVertical: 4,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e36',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  radioButtonSelected: {
    backgroundColor: '#4f46e5',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: 'white',
  },
  selectedRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  radioLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  radioLabelSelected: {
    color: 'white',
    fontWeight: '500',
  },
  submitButton: {
    marginVertical: 20,
    backgroundColor: 'transparent',
    borderColor: '#4f46e5', // indigo-600
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  submitButtonLabel: {
    color: '#4f46e5', // indigo-600
    textTransform: 'none',
    fontSize: 15
  },
});

export default PostScreen;