import { useState } from "react";
import "./style.scss";
import NavItem from "../common/NavItem";
import DAODashboard from "../DAODashboard";
import AboutUs from "img/icons/info_1.png";
import Whitepaper from "img/icons/book_1_1.png";
import Discord from "img/icons/discord_logo_icon_1.png";
import Twitter from "img/icons/twitter.png";
import ME_logo from "img/icons/ME_Logo.png";
import Web from "img/icons/web.png";

import Github from "img/icons/github.png";
import NFTStakingBoard from "../NFTStakingBoard";
import Giga_logo from "../../img/icons/gigadao-full-brand-cropped.png";
const MainLayout = (props) => {
  const content_page = [<DAODashboard />];
  const [content_page_index, setContentPageIndex] = useState(2);

  return (
    <div className="mainlayout">
      <div className="left-menu">
        <div className="menu-list">
          <div className="menu-giga-logo">
            <img
              src={Giga_logo}
              width="160"
              alt="Solana Explorer"
            />
          </div>
          <ul>
            {/* now invisible */}
            <li className={`${content_page_index == 1 ? "active" : ""}`}>
              <a href="https://staking.gigadao.io/" target="_blank">
                <NavItem
                  key="1"
                  icon="/icons/entry-icon-nft.svg"
                  text="NFT Staking"
                  onClick={() => setContentPageIndex(2)}
                />
              </a>
            </li>

            <li className={`${content_page_index == 2 ? "active" : ""}`}>
              <NavItem
                key="2"
                icon="/icons/entry-icon-farms.svg"
                text="DAO Dashboard"
                onClick={() => setContentPageIndex(2)}
              />
            </li>
          </ul>
        </div>
        <div className="menu-info">
          <div className="menu-info-social">
            <div className="social-icon">
              <img src={Discord} />
            </div>
            <div className="social-icon">
              <img src={Twitter} />
            </div>
            <div className="social-icon">
              <img src={Github} />
            </div>
            <div className="social-icon">
              <img src={ME_logo} />
            </div>
          </div>
        </div>
      </div>
      <div className="right-content-mainboard">
        {content_page_index == 2 ? (
          <DAODashboard />
        ) : content_page_index == 1 ? (
          ""
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default MainLayout;
