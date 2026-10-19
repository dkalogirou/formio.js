import { AppRegistry } from 'react-native';
import { App } from '../src/App';

AppRegistry.registerComponent('main', () => App);
AppRegistry.runApplication('main', { rootTag: document.getElementById('root') });
