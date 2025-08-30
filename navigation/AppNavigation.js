import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Buyer screens
import BuyerHome from '../screens/buyer/BuyerHome';
import CartScreen from '../screens/buyer/CartScreen';
import CheckOutScreen from '../screens/buyer/Checkout';
import OrderTracking from '../screens/buyer/OrderTracking';
import BuyerProfile from '../screens/buyer/BuyerProfile';
import BuyerProfileEdit from '../screens/buyer/BuyerProfileEdit';
import BuyerHomeScreen from '../screens/buyer/BuyerHomePage';

// Shopkeeper screens
import ShopkeeperHome from '../screens/shopkeeper/ShopkeeperHome';
import InventoryScreen from '../screens/shopkeeper/InventoryScreen';
import ManageDeliverymen from '../screens/shopkeeper/ManageDeliverymen';
import ShopPolicies from '../screens/shopkeeper/ShopPolicies';
import AdminOrder from '../screens/shopkeeper/AdminOrder';

// Deliveryman screens
import DeliverymanHome from '../screens/deliveryman/DeliverymanHome';
import OrderStatus from '../screens/deliveryman/OrderStatus';
import DeliverymanProfile from '../screens/deliveryman/DeliverymanProfile';
import DeliverymanProfileEdit from '../screens/deliveryman/DeliverymanProfileEdit';
import DeliverymanOrderDetails from '../screens/deliveryman/DeliverymanOrderDetails';
import CurrentDelivery from '../screens/deliveryman/CurrentDelivery';
// Home screen (entry point)
import HomeScreen from '../screens/home';

const Stack = createNativeStackNavigator();

export const portLink = () => 'http://172.20.10.6:6000'; // backend URL

// Buyer stack
function BuyerStack({ setUserRole, userEmail }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BuyerHomePage" options={{ title: 'Home' }}>
        {(props) => (
          <BuyerHomeScreen
            {...props}
            setUserRole={setUserRole}
            userEmail={userEmail}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name='Cart' component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckOutScreen} />
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

// Shopkeeper stack
function ShopkeeperStack({ setUserRole }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ShopkeeperHome" options={{ title: 'Shop Dashboard' }}>
        {(props) => <ShopkeeperHome {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
      <Stack.Screen name="AdminOrder" component={AdminOrder} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="ManageDeliverymen" component={ManageDeliverymen} />
      <Stack.Screen name="ShopPolicies" component={ShopPolicies} />
    </Stack.Navigator>
  );
}

// Deliveryman stack
function DeliverymanStack({ setUserRole, userEmail }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DeliverymanHome" options={{ title: 'Delivery Dashboard' }}>
        {(props) => <DeliverymanHome {...props} setUserRole={setUserRole} />}
      </Stack.Screen>
      <Stack.Screen name="CurrentDelivery" component={(props) => <CurrentDelivery {...props} setUserRole={setUserRole} />} />
      <Stack.Screen name="OrderStatus" component={OrderStatus} />
      <Stack.Screen name="DeliverymanProfile">
        {(props) => <DeliverymanProfile {...props} userEmail={userEmail} />}
      </Stack.Screen>
      <Stack.Screen name="DeliverymanProfileEdit">
        {(props) => <DeliverymanProfileEdit {...props} userEmail={userEmail} />}
      </Stack.Screen>
      <Stack.Screen
        name="DeliverymanOrderDetails"
        component={DeliverymanOrderDetails}
      />
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
            {/* Entry point = HomeScreen */}
            <Stack.Screen name="Home" options={{ title: 'Home' }}>
              {(props) => (
                <HomeScreen
                  {...props}
                  setUserRole={null}
                  setUserEmail={null}
                />
              )}
            </Stack.Screen>
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
        ) : userRole === 'customer' ? (
          <Stack.Screen name="BuyerStack">
            {(props) => (
              <BuyerStack
                {...props}
                setUserRole={setUserRole}
                userEmail={userEmail}
              />
            )}
          </Stack.Screen>
        ) : userRole === 'shopkeeper' ? (
          <Stack.Screen name="ShopkeeperStack">
            {(props) => (
              <ShopkeeperStack {...props} setUserRole={setUserRole} />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="DeliverymanStack">
            {(props) => (
              <DeliverymanStack
                {...props}
                setUserRole={setUserRole}
                userEmail={userEmail}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
