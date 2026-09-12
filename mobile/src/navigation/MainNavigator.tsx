import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator }     from '@react-navigation/stack';
import { useQuery }  from '@tanstack/react-query';
import { Colors, Typography, Spacing } from '@theme/index';
import { useCartStore } from '@store/cartStore';

/* ── Screens ── */
import { HomeScreen }           from '@screens/main/HomeScreen';
import { MarketScreen }         from '@screens/main/MarketScreen';
import { ProductDetailScreen }  from '@screens/main/ProductDetailScreen';
import { CreateListingScreen }  from '@screens/main/CreateListingScreen';
import { CartScreen }           from '@screens/main/CartScreen';
import { SmartMapScreen }       from '@screens/main/SmartMapScreen';
import { OrdersScreen }         from '@screens/main/OrdersScreen';
import { OrderDetailScreen }    from '@screens/main/OrderDetailScreen';
import { MessagesScreen }       from '@screens/main/MessagesScreen';
import { ProfileScreen }        from '@screens/main/ProfileScreen';
import { EditProfileScreen }    from '@screens/main/EditProfileScreen';
import { notificationsApi }     from '@services/api';

/* ══════════════════════════════════════
   PARAM LISTS
══════════════════════════════════════ */
export type MainTabParamList = {
  HomeTab:     undefined;
  MarketTab:   { screen?: keyof MarketStackParamList; params?: any } | undefined;
  SmartMap:    undefined;
  OrdersTab:   { screen?: keyof OrdersStackParamList; params?: any } | undefined;
  MessagesTab: undefined;
  ProfileTab:  { screen?: keyof ProfileStackParamList; params?: any } | undefined;
};

export type MarketStackParamList = {
  MarketHome:    { initialCatId?: string } | undefined;
  ProductDetail: { productId: string };
  CreateListing: undefined;
  Cart:          undefined;
};

export type OrdersStackParamList = {
  OrdersList:  undefined;
  OrderDetail: { orderId: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: { section?: 'basic' | 'farmer' | 'buyer' } | undefined;
};

/* ══════════════════════════════════════
   MARKET STACK
══════════════════════════════════════ */
const MarketStack = createStackNavigator<MarketStackParamList>();

function MarketNavigator() {
  return (
    <MarketStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketStack.Screen name="MarketHome"    component={MarketScreen} />
      <MarketStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <MarketStack.Screen name="CreateListing" component={CreateListingScreen} />
      <MarketStack.Screen name="Cart"          component={CartScreen} />
    </MarketStack.Navigator>
  );
}

/* ══════════════════════════════════════
   ORDERS STACK
══════════════════════════════════════ */
const OrdersStack = createStackNavigator<OrdersStackParamList>();

function OrdersNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrdersList"  component={OrdersScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStack.Navigator>
  );
}

/* ══════════════════════════════════════
   PROFILE STACK
══════════════════════════════════════ */
const ProfileStack = createStackNavigator<ProfileStackParamList>();

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

/* ══════════════════════════════════════
   TAB ICON
══════════════════════════════════════ */
function TabIcon({ emoji, label, focused, badge }: {
  emoji: string; label: string; focused: boolean; badge?: number;
}) {
  return (
    <View style={tabStyles.item}>
      <View>
        <Text style={[tabStyles.emoji, focused && tabStyles.emojiActive]}>{emoji}</Text>
        {badge != null && badge > 0 && (
          <View style={tabStyles.badge}>
            <Text style={tabStyles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

/* ══════════════════════════════════════
   MAIN BOTTOM TABS
══════════════════════════════════════ */
const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  /* Unread notifications → Orders tab badge */
  const { data: notifData } = useQuery({
    queryKey: ['notifications-meta'],
    queryFn:  () => notificationsApi.getAll({ limit: 1 }).then(r => r.data),
    refetchInterval: 30_000,
  });
  const unreadNotifs = notifData?.meta?.unread ?? 0;

  /* Cart item count → Market tab badge */
  const cartCount = useCartStore(state => state.itemCount());

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:     false,
        tabBarStyle:     tabStyles.bar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) =>
            <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MarketTab"
        component={MarketNavigator}
        options={{
          tabBarIcon: ({ focused }) =>
            <TabIcon emoji="🌾" label="Market" focused={focused} badge={cartCount} />,
        }}
      />
      <Tab.Screen
        name="SmartMap"
        component={SmartMapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[tabStyles.mapBtn, focused && tabStyles.mapBtnActive]}>
              <Text style={tabStyles.mapEmoji}>🗺️</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersNavigator}
        options={{
          tabBarIcon: ({ focused }) =>
            <TabIcon emoji="📦" label="Orders" focused={focused} badge={unreadNotifs} />,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ focused }) =>
            <TabIcon emoji="💬" label="Chat" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ focused }) =>
            <TabIcon emoji="👤" label="Me" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar:          { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, height: 70, paddingBottom: 10, paddingTop: 8 },
  item:         { alignItems: 'center', justifyContent: 'center', gap: 3 },
  emoji:        { fontSize: 22, opacity: 0.45 },
  emojiActive:  { opacity: 1 },
  label:        { ...Typography.caption, color: Colors.gray[400] },
  labelActive:  { color: Colors.green[700], fontWeight: '700' },
  badge:        { position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.white },
  badgeText:    { fontSize: 9, fontWeight: '800', color: Colors.white },
  mapBtn:       { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.green[100], alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 3, borderColor: Colors.white },
  mapBtnActive: { backgroundColor: Colors.green[700] },
  mapEmoji:     { fontSize: 26 },
});
