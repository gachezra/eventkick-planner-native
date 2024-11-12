import React, { useState, useContext } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Title, Surface } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';
import { loginRoute, registerRoute } from '../utils/APIRoutes';
import axios from 'axios';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [msg, setMsg] = useState('');

  const { login } = useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        const res = await axios.post(loginRoute, { username: email, password })
        login(res.data.user, res.data.token)
      } else {
        const res = await axios.post(registerRoute, { email, password, username })
        setMsg(res.data.msg)
      }
    } catch (error) {
      console.error('Authentication error:', error.response.data);
    }
  };

  const renderLogin = () => (
    <Surface style={styles.surface}>
      <Title style={styles.title}>Login</Title>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <Button
        mode="outlined"
        onPress={handleAuth}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        Login
      </Button>
      <Text style={styles.switchText} onPress={() => setIsLogin(false)}>
        Don't have an account? Register
      </Text>
    </Surface>
  );

  const renderRegister = () => (
    <Surface style={styles.surface}>
      <Title style={styles.title}>Register</Title>
      {msg ? (
        <Text style={{
          color: 'white',
          fontSize: 12,
          fontWeight: 'bold',
          alignSelf: 'center',
          marginVertical: 5
        }}>{msg}</Text>
      ) : ''}
      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
        theme={inputTheme}
      />
      <Button
        mode="outlined"
        onPress={handleAuth}
        style={styles.button}
        labelStyle={styles.buttonText}
      >
        Register
      </Button>
      <Text style={styles.switchText} onPress={() => setIsLogin(true)}>
        Already have an account? Login
      </Text>
    </Surface>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {isLogin ? renderLogin() : renderRegister()}
      </View>
    </KeyboardAvoidingView>
  );
};

const inputTheme = {
  colors: {
    primary: '#7c3aed', // Brighter indigo
    text: '#ffffff',
    placeholder: '#a78bfa', // Light purple for better visibility
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131324',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#131324',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#252540',
  },
  button: {
    marginTop: 10,
    borderColor: '#7c3aed',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderRadius: 8,
    width: 'fill',
  },
  buttonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchText: {
    marginTop: 15,
    color: '#d8b4fe',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default AuthScreen;