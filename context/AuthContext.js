import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Load token from storage on app start
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('accessToken');
        const jsonValue = await AsyncStorage.getItem('userData');
        const stringValue = JSON.parse(jsonValue);
        if (storedToken) {
          setToken(storedToken);
          setUser(stringValue);
        }
      } catch (error) {
        console.error('Failed to load token', error);
      }
    };

    loadToken();
  }, []);

  const login = async (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    try {
      // Save the token in local storage
      await AsyncStorage.setItem('accessToken', accessToken);
      const jsonValue = JSON.stringify(userData);
      await AsyncStorage.setItem('userData', jsonValue);
    } catch (error) {
      console.error('Failed to save token', error);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      // Remove token from storage
      await AsyncStorage.removeItem('accessToken');
    } catch (error) {
      console.error('Failed to remove token', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
