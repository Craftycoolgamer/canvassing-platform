import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { useAuth } from '../contexts/AuthContext';

const Stack = createStackNavigator();

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const handleLoginSuccess = async () => {
    
    onAuthSuccess();
  };

  const handleRegisterSuccess = async () => {
    
    onAuthSuccess();
  };

  const handleNavigateToRegister = () => {
    setIsLogin(false);
  };

  const handleNavigateToLogin = () => {
    setIsLogin(true);
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isLogin ? (
        <Stack.Screen name="Login">
          {() => (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onNavigateToRegister={handleNavigateToRegister}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Register">
          {() => (
            <RegisterScreen
              onRegisterSuccess={handleRegisterSuccess}
              onNavigateToLogin={handleNavigateToLogin}
            />
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}; 