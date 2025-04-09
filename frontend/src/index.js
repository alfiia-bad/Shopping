import React from 'react';
import ReactDOM from 'react-dom';
import { AppRegistry } from 'react-native';
import App from './App';
import './index.css'; // Стили для веб-версии

// Регистрация приложения для веба с использованием React Native Web
AppRegistry.registerComponent('App', () => App);
AppRegistry.runApplication('App', {
  initialProps: {},
  rootTag: document.getElementById('root'),
});

ReactDOM.render(<App />, document.getElementById('root'));
