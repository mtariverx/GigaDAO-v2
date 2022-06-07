import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import "./scss/main.scss";
import App from "./App";
import { ClusterProvider } from "./providers/cluster";
import { WalletButtonProvider } from "./providers/wallet";
import { DaoDataProvider } from "./providers/daos";
import { OwnerDataProvider } from "./providers/owner";

import { Provider } from "react-redux";
import { store } from "./store/store";

ReactDOM.render(
  <Router>
    <ClusterProvider>
      <WalletButtonProvider>
        <OwnerDataProvider>
          <DaoDataProvider>
            <Provider store={store}>
              <App />
            </Provider>
          </DaoDataProvider>
        </OwnerDataProvider>
      </WalletButtonProvider>
    </ClusterProvider>
  </Router>,
  document.getElementById("root")
);
