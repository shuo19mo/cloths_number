import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { HomeScreen } from '../screens/HomeScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { ProductFormScreen } from '../screens/ProductFormScreen';
import { PurchaseScreen } from '../screens/PurchaseScreen';
import { SaleScreen } from '../screens/SaleScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AdjustScreen } from '../screens/AdjustScreen';
import { StocktakeScreen } from '../screens/StocktakeScreen';
import { LogsScreen } from '../screens/LogsScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  ProductDetail: { productId: number };
  ProductForm: undefined;
  Purchase: { productId?: number } | undefined;
  Sale: { productId?: number } | undefined;
  Adjust: { skuId?: number } | undefined;
  Stocktake: { productId?: number } | undefined;
  Logs: undefined;
};

export type TabParamList = {
  Home: undefined;
  Products: undefined;
  Stats: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { height: 70, paddingTop: 8, paddingBottom: 9, borderTopColor: colors.border, backgroundColor: colors.card },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: '商品', tabBarIcon: ({ color, size }) => <Ionicons name="shirt-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: '统计', tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerTitleStyle: { fontWeight: '800' }, headerShadowVisible: false, headerStyle: { backgroundColor: colors.card } }}>
      <Stack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: '商品详情' }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: '新增商品' }} />
      <Stack.Screen name="Purchase" component={PurchaseScreen} options={{ title: '进货入库' }} />
      <Stack.Screen name="Sale" component={SaleScreen} options={{ title: '销售出库' }} />
      <Stack.Screen name="Adjust" component={AdjustScreen} options={{ title: '调整库存' }} />
      <Stack.Screen name="Stocktake" component={StocktakeScreen} options={{ title: '盘点库存' }} />
      <Stack.Screen name="Logs" component={LogsScreen} options={{ title: '操作日志' }} />
    </Stack.Navigator>
  );
}
