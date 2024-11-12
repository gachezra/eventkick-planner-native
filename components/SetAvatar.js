import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from "react-native";
import axios from "axios";
import { SvgXml } from 'react-native-svg';
import { Buffer } from "buffer";

const SetAvatar = ({onSet, onCancel}) => {
  const api = `https://api.multiavatar.com/45678945`;
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(undefined);

  useEffect(() => {
    const fetchData = async () => {
      const data = [];
      for (let i = 0; i < 5; i++) {
        const image = await axios.get(`${api}/${Math.round(Math.random() * 1000)}`);
        const buffer = new Buffer(image.data);
        data.push(buffer.toString("base64"));
      }
      setAvatars(data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#4e0eff" />
      ) : (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Pick an avatar</Text>
          <View style={styles.avatars}>
            {avatars.map((avatar, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.avatarContainer,
                  selectedAvatar === index && styles.selectedAvatar
                ]}
                onPress={() => setSelectedAvatar(index)}
              >
                <SvgXml
                    xml={atob(avatar)}
                    width="50"
                    height="50"
                    style={styles.avatar}
                />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.submitBtn} onPress={() => onSet(avatars[selectedAvatar])}>
              <Text style={styles.submitText}>Set Profile Avatar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={() => onCancel()}>
              <Text style={styles.submitText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default SetAvatar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatars: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  avatarContainer: {
    borderWidth: 4,
    borderColor: 'transparent',
    borderRadius: 50,
    padding: 10,
    margin: 10,
  },
  selectedAvatar: {
    borderColor: '#4e0eff',
  },
  avatar: {
    height: 50,
    width: 50,
    borderRadius: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25
  },
  submitBtn: {
    padding: 10,
    backgroundColor: 'transparent',
    borderColor: '#4e0eff',
    borderWidth: 2,
    borderRadius: 50,
    marginHorizontal: 5,
  },
  submitText: {
    color: '#4e0eff',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});