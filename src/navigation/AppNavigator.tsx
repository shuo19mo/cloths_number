import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
  Adjust: { skuId?: number } | undefined;
  Stocktake: undefined;
  Logs: undefined;
};

export type TabParamList = {
  Home: undefined;
  Products: undefined;
  Purchase: undefined;
  Sale: undefined;
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
        tabBarStyle: { height: 66, paddingTop: 8, paddingBottom: 10 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '首页', tabBarIcon: () => null }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: '商品', tabBarIcon: () => null }} />
      <Tab.Screen name="Purchase" component={PurchaseScreen} options={{ title: '进货', tabBarIcon: () => null }} />
      <Tab.Screen name="Sale" component={SaleScreen} options={{ title: '销售', tabBarIcon: () => null }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: '统计', tabBarIcon: () => null }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的', tabBarIcon: () => null }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.primary, headerTitleStyle: { fontWeight: '800' } }}>
      <Stack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: '商品详情' }} />
      <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: '新增商品' }} />
      <Stack.Screen name="Adjust" component={AdjustScreen} options={{ title: '调整库存' }} />
      <Stack.Screen name="Stocktake" component={StocktakeScreen} options={{ title: '盘点库存' }} />
      <Stack.Screen name="Logs" component={LogsScreen} options={{ title: '操作日志' }} />
    </Stack.Navigator>
  );
}
