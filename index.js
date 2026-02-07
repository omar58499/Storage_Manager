import { registerRootComponent } from 'expo';

const React = require('react');
const { View, Text } = require('react-native');

let App;
try {
  App = require('./web-app').default;
} catch (e) {
  App = () =>
    React.createElement(View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 } },
      React.createElement(Text, { style: { color: 'red', fontSize: 18 } }, 'Error loading web-app:'),
      React.createElement(Text, { style: { marginTop: 10, fontSize: 14 } }, String(e))
    );
}

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
      return React.createElement(View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#0f172a' } },
        React.createElement(Text, { style: { color: '#dc2626', fontSize: 20, fontWeight: 'bold', marginBottom: 16 } }, 'Runtime Error'),
        React.createElement(Text, { style: { fontSize: 14, color: '#f1f5f9', textAlign: 'center' } }, String(this.state.error))
      );
    }
    return this.props.children;
  }
}

const WrappedApp = () => React.createElement(ErrorBoundary, null, React.createElement(App));

registerRootComponent(WrappedApp);
