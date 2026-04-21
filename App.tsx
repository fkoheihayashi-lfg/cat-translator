import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootScreen from './src/screens/BootScreen';
import HomeScreen from './src/screens/HomeScreen';
import LogScreen from './src/screens/LogScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SpeakScreen from './src/screens/SpeakScreen';
import TranslateScreen from './src/screens/TranslateScreen';

export type RootStackParamList = {
  Boot: undefined;
  Home: undefined;
  Translate: undefined;
  Speak: undefined;
  Log: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Boot" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Boot" component={BootScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Translate" component={TranslateScreen} />
        <Stack.Screen name="Speak" component={SpeakScreen} />
        <Stack.Screen name="Log" component={LogScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
