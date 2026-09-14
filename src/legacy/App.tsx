import React from "react";
import { Provider } from "react-redux";
import store from "./store";
import AppRoutes from "./routes";
import { AuthProvider } from "./contexts";

const App = () => {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Provider>
  );
};

export default App;
