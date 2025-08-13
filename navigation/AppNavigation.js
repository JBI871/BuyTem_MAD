import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Buyer screens
import BuyerHome from '../screens/buyer/BuyerHome';
import CartScreen from '../screens/buyer/CartScreen';
import ItemDetails from '../screens/buyer/ItemDetails';
import OrderTracking from '../screens/buyer/OrderTracking';
import BuyerProfile from '../screens/buyer/BuyerProfile';
import BuyerProfileEdit from '../screens/buyer/BuyerProfileEdit';

// Shopkeeper screens
import ShopkeeperHome from '../screens/shopkeeper/ShopkeeperHome';
import InventoryScreen from '../screens/shopkeeper/InventoryScreen';
import ManageDeliverymen from '../screens/shopkeeper/ManageDeliverymen';
import ShopPolicies from '../screens/shopkeeper/ShopPolicies';

// Deliveryman screens
import DeliverymanHome from '../screens/deliveryman/DeliverymanHome';
import OrderStatus from '../screens/deliveryman/OrderStatus';
import DeliverymanProfile from '../screens/deliveryman/DeliverymanProfile';
import DeliverymanProfileEdit from '../screens/deliveryman/DeliverymanProfileEdit';
import DeliverymanOrderDetails from '../screens/deliveryman/DeliverymanOrderDetails';

const Stack = createNativeStackNavigator();

function BuyerStack({ setUserRole, userEmail }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BuyerHome" options={{ title: 'Home' }}>
        {(props) => <BuyerHome {...props} setUserRole={setUserRole} userEmail={userEmail} />}
      </Stack.Screen>
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="ItemDetails" component={ItemDetails} />
      <Stack.Screen name="OrderTracking" component={OrderTracking} />
      <Stack.Screen name="BuyerProfile">
        {(props) => <BuyerProfile {...props} userEmail={userEmail} />}
      </Stack.Screen>
      <Stack.Screen name="BuyerProfileEdit">
        {(props) => <BuyerProfileEdit {...props} userEmail={userEmail} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function ShopkeeperStack({ setUserRole }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ShopkeeperHome" options={{ title: 'Shop Dashboard' }}>
        {(props) => <ShopkeeperHome {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="ManageDeliverymen" component={ManageDeliverymen} />
      <Stack.Screen name="ShopPolicies" component={ShopPolicies} />
    </Stack.Navigator>
  );
}

function DeliverymanStack({ setUserRole, userEmail }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliverymanHome">
        {(props) => <DeliverymanHome {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
      <Stack.Screen name="OrderStatus" component={OrderStatus} />
      <Stack.Screen name="DeliverymanProfile">
        {(props) => <DeliverymanProfile {...props} userEmail={userEmail} />}
      </Stack.Screen>
      <Stack.Screen name="DeliverymanProfileEdit">
        {(props) => <DeliverymanProfileEdit {...props} userEmail={userEmail} />}
      </Stack.Screen>
      <Stack.Screen name="DeliverymanOrderDetails" component={DeliverymanOrderDetails} />
    </Stack.Navigator>
  );
}

export default function AppNavigation() {
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userRole === null ? (
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  setUserRole={setUserRole}
                  setUserEmail={setUserEmail}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : userRole === 'buyer' ? (
          <Stack.Screen name="BuyerStack">
            {(props) => 
              <BuyerStack 
                {...props} 
                setUserRole={setUserRole} 
                userEmail={userEmail} 
              />
            }
          </Stack.Screen>
        ) : userRole === 'shopkeeper' ? (
          <Stack.Screen name="ShopkeeperStack">
            {(props) => <ShopkeeperStack {...props} setUserRole={setUserRole} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="DeliverymanStack">
            {(props) => 
              <DeliverymanStack
                {...props}
                setUserRole={setUserRole}
                userEmail={userEmail}
              />
            }
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
