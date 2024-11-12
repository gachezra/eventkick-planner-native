import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Toaster, toast } from 'sonner-native';
import { updateUserRoute, setAvatarRoute } from '../utils/APIRoutes';
import SetAvatar from '../components/SetAvatar';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const EditProfileScreen = () => {
  const { user, token, update } = useContext(AuthContext);
  const [editedUsername, setEditedUsername] = useState(user.username);
  const [editedEmail, setEditedEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(false);

  const navigation = useNavigation();

  const handleSave = async () => {
    try {
      const response = await axios.put(
        updateUserRoute(user._id),
        { username: editedUsername, email: editedEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      update({ ...user, username: editedUsername, email: editedEmail });
      toast.success('Profile updated successfully');
      navigation.goBack();
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error('Failed to update profile');
    }
  };

  const setProfilePhoto = async (avatarImage) => {
    if (avatarImage === undefined) {
      toast.error('Please select an avatar!');
    } else {
      try {
        const { data } = await axios.post(
          setAvatarRoute(user._id),
          {
            image: avatarImage,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (data.isSet) {
          update({ ...user, avatarImage });
          toast.success('Avatar set successfully!');
          setAvatar(false);
        } else {
          toast.error('Avatar not set, please try again!');
        }
      } catch (error) {
        console.error('Error setting profile picture:', error);
        toast.error('Error setting profile avatar, please try again');
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <Toaster />
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={{position: 'absolute', top:10, left: 30, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4F46E5'}}
        >
          <Ionicons name='arrow-back' color='white' size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => setAvatar(true)}>
          <SvgXml xml={atob(user.avatarImage)} width="100" height="100" style={styles.avatar} />
          <Text style={styles.changeAvatarText}>Change Avatar</Text>
        </TouchableOpacity>

        {avatar && <SetAvatar onSet={setProfilePhoto} onCancel={() => setAvatar(false)} />}

        <View style={styles.editForm}>
          <TextInput
            style={styles.input}
            value={editedUsername}
            onChangeText={setEditedUsername}
            placeholder="Username"
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={styles.input}
            value={editedEmail}
            onChangeText={setEditedEmail}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
          />
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#4F46E5',
  },
  changeAvatarText: {
    color: '#4F46E5',
    marginTop: 10,
  },
  editForm: {
    width: '100%',
    backgroundColor: '#1e1e36',
    padding: 20,
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#131324',
    color: '#ffffff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#30304b',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default EditProfileScreen;