/**
 * TOPIK道場 - React Native App
 * メインアプリケーション
 */

import './global.css';
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return <AppNavigator />;
};

export default App;
