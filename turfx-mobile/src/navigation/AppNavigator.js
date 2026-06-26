import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { 
  Home, Search, Calendar, User, 
  LayoutDashboard, BookOpen, DollarSign, MapPin,
  QrCode, ShieldCheck
} from 'lucide-react-native';

// Auth
import LoginScreen          from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// User screens
import HomeScreen             from '../screens/main/HomeScreen';
import ExploreScreen          from '../screens/main/ExploreScreen';
import TurfDetailScreen       from '../screens/main/TurfDetailScreen';
import CheckoutScreen         from '../screens/main/CheckoutScreen';
import BookingConfirmedScreen from '../screens/main/BookingConfirmedScreen';
import MyBookingsScreen       from '../screens/main/MyBookingsScreen';
import ProfileScreen          from '../screens/main/ProfileScreen';
import QRScannerScreen        from '../screens/main/QRScannerScreen';

// Partner screens
import PartnerDashboardScreen from '../screens/partner/PartnerDashboardScreen';
import PartnerBookingsScreen  from '../screens/partner/PartnerBookingsScreen';
import PartnerVenuesScreen    from '../screens/partner/PartnerVenuesScreen';
import PartnerEarningsScreen  from '../screens/partner/PartnerEarningsScreen';
import AddVenueScreen         from '../screens/partner/AddVenueScreen';

// Admin screens
import AdminLoginScreen       from '../screens/admin/AdminLoginScreen';
import AdminDashboardScreen   from '../screens/admin/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

// ── Tab icon ──────────────────────────────────────────────────────────────
function TabIcon({ label, icon: Icon, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Icon 
        size={24} 
        color={focused ? COLORS.primary : COLORS.textMuted}
      />
      <Text style={{ fontSize: 10, fontWeight: focused ? '800' : '600',
        color: focused ? COLORS.primary : COLORS.textMuted, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

// ── QR FAB icon ───────────────────────────────────────────────────────────
function QRTabIcon({ focused }) {
  return (
    <View style={{
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: focused ? COLORS.accent : COLORS.primary,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 3,
      borderColor: '#fff',
    }}>
      <QrCode size={26} color="#fff" />
    </View>
  );
}

// ── User bottom tabs ──────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          backgroundColor: COLORS.white,
          borderTopWidth: 1.5,
          borderTopColor: COLORS.border,
        },
      }}
    >
      <Tab.Screen name="Home"       component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Home"     icon={Home} focused={focused} /> }} />
      <Tab.Screen name="Explore"    component={ExploreScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Explore"  icon={Search} focused={focused} /> }} />
      <Tab.Screen name="QRScanner"  component={QRScannerScreen}
        options={{ tabBarIcon: ({ focused }) => <QRTabIcon focused={focused} /> }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Bookings" icon={Calendar} focused={focused} /> }} />
      <Tab.Screen name="Profile"    component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Profile"  icon={User} focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Partner bottom tabs ───────────────────────────────────────────────────
function PartnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          backgroundColor: COLORS.dark,
          borderTopWidth: 0,
        },
      }}
    >
      <Tab.Screen name="PartnerHome"     component={PartnerDashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" icon={LayoutDashboard} focused={focused} /> }} />
      <Tab.Screen name="PartnerBookings" component={PartnerBookingsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Bookings"  icon={BookOpen} focused={focused} /> }} />
      <Tab.Screen name="PartnerEarnings" component={PartnerEarningsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Earnings"  icon={DollarSign} focused={focused} /> }} />
      <Tab.Screen name="PartnerVenues"   component={PartnerVenuesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Venues"    icon={MapPin} focused={focused} /> }} />
    </Tab.Navigator>
  );
}

// ── Root navigator ────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <Text style={{ fontSize: 36, fontWeight: '900', color: COLORS.accent, letterSpacing: -1 }}>TurfX</Text>
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 24 }} />
      </View>
    );
  }

  let initialRoute = 'Login';
  if (user) {
    if (user.role === 'admin') {
      initialRoute = 'AdminDashboard';
    } else if (user.role === 'owner') {
      initialRoute = 'PartnerApp';
    } else {
      initialRoute = 'MainApp';
    }
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        {/* Auth */}
        <Stack.Screen name="Login"          component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* User app */}
        <Stack.Screen name="MainApp"          component={MainTabs} />
        <Stack.Screen name="TurfDetail"       component={TurfDetailScreen} />
        <Stack.Screen name="Checkout"         component={CheckoutScreen} />
        <Stack.Screen name="BookingConfirmed" component={BookingConfirmedScreen} />

        {/* Partner app */}
        <Stack.Screen name="PartnerApp"      component={PartnerTabs} />
        <Stack.Screen name="AddVenue"        component={AddVenueScreen} />

        {/* Admin app */}
        <Stack.Screen name="AdminLogin"      component={AdminLoginScreen} />
        <Stack.Screen name="AdminDashboard"  component={AdminDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
