import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

let App;
if (Platform.OS === 'web') {
  try {
    App = require('./web-app').default;
  } catch (e) {
    // Show the import error visually on the page
    const React = require('react');
    const { View, Text } = require('react-native');
    App = () =>
      React.createElement(View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 } },
        React.createElement(Text, { style: { color: 'red', fontSize: 18 } }, 'Error loading web-app:'),
        React.createElement(Text, { style: { marginTop: 10, fontSize: 14 } }, String(e))
      );
  }
} else {
  App = require('./App').default;
}

// Wrap in error boundary for runtime errors
const React = require('react');
const { View, Text } = require('react-native');

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return React.createElement(View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#fff3f3' } },
        React.createElement(Text, { style: { color: 'red', fontSize: 20, fontWeight: 'bold', marginBottom: 16 } }, 'Runtime Error'),
        React.createElement(Text, { style: { fontSize: 14, color: '#333', textAlign: 'center' } }, String(this.state.error))
      );
    }
    return this.props.children;
  }
}

const WrappedApp = () => React.createElement(ErrorBoundary, null, React.createElement(App));

registerRootComponent(WrappedApp);
