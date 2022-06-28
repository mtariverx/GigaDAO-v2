import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { ClusterModal } from "components/ClusterModal";
import { MessageBanner } from "components/MessageBanner";
import { ConnectOwnerLoadingBanner, Navbar } from "components/Navbar";
import { ClusterStatusBanner } from "components/ClusterStatusButton";
import { SearchBar } from "components/SearchBar";
import { VerifiedDAOs } from "./pages/VerifiedDAOs";
import { ConnectWalletBannerButton } from "./components/ConnectWalletNavButton";
import { DaoPage } from "./pages/DaoPage";
import DAODashboardV2 from "components/DAODashboardV2";
import ReactGA from "react-ga4";
import TokenStreamV2 from "components/TokenStreamV2";
import SocialFooter from "components/SocialFooter";
import NavHeader from "components/NavHeader";

const PROD_GA_MID = "G-7ZX9B5QVXZ";
const TEST_GA_MID = "G-RGDZ6GH4CH";
let GA_MEASUREMENT_ID = window.location.host.includes("gigadao.io")
  ? PROD_GA_MID
  : TEST_GA_MID;
console.log("using ga mid: ", GA_MEASUREMENT_ID);

ReactGA.initialize(GA_MEASUREMENT_ID, {
  gaOptions: { siteSpeedSampleRate: 100 },
});
ReactGA.send({
  hitType: "pageview",
  page: window.location.pathname + window.location.search,
});

function App() {
  return (
    <>
      <ClusterModal />
      <div className="main-content">
        {/* <Navbar />
          <MessageBanner />
          <ClusterStatusBanner />
          <ConnectWalletBannerButton />
          <SearchBar /> */}
        <Switch>
          {/* <Route path="/maindashboard" component={DAODashboardV2} /> */}
          <Route path="/maindashboard">
            <NavHeader />
            <DAODashboardV2 />
            <SocialFooter />
          </Route>
          <Route path="/tokenstreamv2" component={TokenStreamV2} />
          <Route exact path={"/"}>
            <Navbar />
            <MessageBanner />
            <ClusterStatusBanner />
            <ConnectWalletBannerButton />
            <SearchBar />
            <VerifiedDAOs />
          </Route>
          <Route
            exact
            path={"/dao/:dao_id"}
            render={({ match }) => (
              <>
                <Navbar />
                <MessageBanner />
                <ClusterStatusBanner />
                <ConnectWalletBannerButton />
                <SearchBar />
                <DaoPage dao_id={match.params.dao_id} />
              </>
            )}
          />
          <Route
            render={({ location }) => (
              <Redirect to={{ ...location, pathname: "/" }} />
            )}
          />
        </Switch>
      </div>
    </>
  );
}

export default App;
