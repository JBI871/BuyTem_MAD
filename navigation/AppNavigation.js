import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';


import BuyerHome from '../screens/buyer/BuyerHome';
import CartScreen from '../screens/buyer/CartScreen';
import ItemDetails from '../screens/buyer/ItemDetails';
import OrderTracking from '../screens/buyer/OrderTracking';


import ShopkeeperHome from '../screens/shopkeeper/ShopkeeperHome';
import InventoryScreen from '../screens/shopkeeper/InventoryScreen';
import ManageDeliverymen from '../screens/shopkeeper/ManageDeliverymen';
import ShopPolicies from '../screens/shopkeeper/ShopPolicies';


import DeliverymanHome from '../screens/deliveryman/DeliverymanHome';
import OrderStatus from '../screens/deliveryman/OrderStatus';

const Stack = createNativeStackNavigator();


function BuyerStack({ setUserRole }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BuyerHome">
        {(props) => <BuyerHome {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="ItemDetails" component={ItemDetails} />
      <Stack.Screen name="OrderTracking" component={OrderTracking} />
    </Stack.Navigator>
  );
}

function ShopkeeperStack({ setUserRole }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ShopkeeperHome">
        {(props) => <ShopkeeperHome {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="ManageDeliverymen" component={ManageDeliverymen} />
      <Stack.Screen name="ShopPolicies" component={ShopPolicies} />
    </Stack.Navigator>
  );
}

function DeliverymanStack({ setUserRole }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliverymanHome">
        {(props) => <DeliverymanHome {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
      <Stack.Screen name="OrderStatus" component={OrderStatus} />
    </Stack.Navigator>
  );
}

export default function AppNavigation() {
  const [userRole, setUserRole] = useState(null);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {userRole === null ? (
          <>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} setUserRole={setUserRole} />}
            </Stack.Screen>
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : userRole === 'buyer' ? (
          <Stack.Screen
            name="BuyerStack"
            options={{ headerShown: false }}
          >
            {(props) => <BuyerStack {...props} setUserRole={setUserRole} />}
          </Stack.Screen>
        ) : userRole === 'shopkeeper' ? (
          <Stack.Screen
            name="ShopkeeperStack"
            options={{ headerShown: false }}
          >
            {(props) => <ShopkeeperStack {...props} setUserRole={setUserRole} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="DeliverymanStack"
            options={{ headerShown: false }}
          >
            {(props) => <DeliverymanStack {...props} setUserRole={setUserRole} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
