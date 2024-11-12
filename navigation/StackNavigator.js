import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FilesScreen from '../screens/FilesScreen';
import UploadScreen from '../screens/UploadScreen';
import EventDetails from '../screens/EventDetails';
import AuthScreen from '../screens/AuthScreen';
import ForumScreen from '../screens/ForumScreen';
import ThreadScreen from '../screens/ThreadScreen';
import OnboardLoading from '../screens/OnboardLoading';
import ScannerScreen from '../screens/ScannerScreen';
import MemoriesScreen from '../screens/MemoriesScreen';
import PostedEventsScreen from '../screens/PostedEventsScreen';
import PostScreen from '../screens/PostScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GalleryScreen from '../screens/GalleryScreen';
import EventReelsScreen from '../screens/EventReelsScreen';
import { AuthContext } from '../context/AuthContext';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  const { token } = useContext(AuthContext);

  return (
    <Stack.Navigator>
      {token ? (
        <>
          <Stack.Screen name='loading' component={OnboardLoading} options={{ headerShown: false }} />
          <Stack.Screen name='HomeTab' component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="EventDetails" component={EventDetails} options={{ headerShown: false }} />
          <Stack.Screen name="Upload" component={UploadScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Forums" component={ForumScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Thread" component={ThreadScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Gallery" component={MemoriesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Files" component={FilesScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Posted" component={PostedEventsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Post" component={PostScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Pics" component={GalleryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Reels" component={EventReelsScreen} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name='loading' component={OnboardLoading} options={{ headerShown: false }} />
          <Stack.Screen name='login' component={AuthScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;