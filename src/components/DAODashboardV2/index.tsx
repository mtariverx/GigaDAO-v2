import { useEffect, useState } from "react";
import "./style.scss";
import * as React from "react";
import Refresh from "img/icons/refresh_1.png";
import Plus_fill from "img/icons/plus_symbol_fill.png";
import Giga_logo from "img/icons/gigadao-full-brand-cropped.png";
import Profile from "img/icons/profile.png";
import IconButton from "components/common/IconButton";
import { ConnectWalletNavButton } from "../ConnectWalletNavButton";
import Button from "components/common/Button";
import DAODetailModal from "components/DAODetailModal";
import NewStream from "components/NewStream";
import TokenStream from "components/TokenStream";
import NewProposal from "components/NewProposal";
import NewDAO from "components/NewDAO";
import StreamCard from "components/StreamCard";

import { Link, NavLink } from "react-router-dom";
import { Keypair, PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useWallet } from "providers/adapters/core/react";
import { useOwnerData } from "providers/owner";
import * as pic from "pic/pic";
import * as simPic from "pic/sim";
// import * as simPic from "../../pic/sim";
import * as livePic from "pic/live";

import { useSelector, useDispatch } from "react-redux";
import { DaoState } from "store/DaoReducer";
import { shallowEqual } from "react-redux";
import ActiveProposal from "components/ActiveProposal";
import NewMultisigTreasury from "components/NewMultisigTreasury";
import MultisigTreausry from "components/MultisigTreasury";
import { clusterPath } from "utils/url";
const DAODashboardV2: React.FC = (props) => {
  const { publicKey, connected } = useWallet();
  const { dispatch, callConnectOwner, callDisconnectOwner } = useOwnerData();
  const [isConnectingToOwner, setIsConnectingToOwner] = useState(false);

  const [member_daos, setMemberDAOs] = useState<Array<pic.Dao>>([]);
  const [member_dao_ids, setMemberDaoIds] = useState<string[]>([]);
  const [selected_member_dao, setSelectedMemberDAO] = useState<pic.Dao>();
  const [show_modal, setShowModal] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [select_dao_id, setSelectDaoId] = useState<string>();
  const [selected_stream, setSelectedStream] = useState<undefined | any>();
  const wallet = useAnchorWallet();
  const { owner } = useOwnerData();
  const dispatch_state = useDispatch();
  const content_title = ["Dashboard", "New Token Streams", "New Proposal", "Token Stream", "Active Proposal", "New Multisig Tresury", "Treasury"];
  const onSetDao = React.useCallback(
    (dao: pic.Dao) => dispatch_state({ type: "SET_DAO", payload: dao }),
    [dispatch_state]
  );
  // const dao_ = useSelector<DaoState, DaoState["dao"]>((state) => state.dao);
  const dao_store: pic.Dao = useSelector(
    (state: DaoState) => state.dao,
    shallowEqual
  );

  useEffect(() => {
    (async () => {
      try {
        if (connected) {
          setIsConnectingToOwner(true);
          const newOwner: pic.Owner = { address: publicKey };
          callConnectOwner(dispatch, newOwner).then(() => {
            setIsConnectingToOwner(false);
          });
          let member_daos_promise = await livePic.getMemberDaos(
            newOwner,
            wallet
          );
          let mdis: Array<string> = [];
          let m_daos: Array<pic.Dao> = [];
          m_daos = member_daos_promise;
          setMemberDAOs(m_daos); //set daos to memberdaos but the dao has only address and streams
          mdis = m_daos.map((dao) => dao.dao_id);
          setMemberDaoIds(mdis);
          setSelectDaoId(mdis[0]);
          let [daos_with_stream] = await livePic.getDaos([{ ...m_daos[0] }]);
          let streams = await livePic.checkIfStreamOnChain(wallet, {
            ...daos_with_stream,
          });
          const dao = { ...m_daos[0], streams: streams };
          setSelectedMemberDAO({ ...dao }); //only first
          onSetDao({ ...dao });
          setSelectedStream(undefined);
          if (streams?.length > 0) {
            console.log("---useEffect---");
            setSelectedStream(streams[0]);
          }
        } else {
          callDisconnectOwner(dispatch);
        }
      } catch (e) {
        console.log(e);
      }
    })();
  }, [connected]);
  useEffect(() => {
    (async () => {
      if (connected) {
        let [daos_with_stream] = await livePic.getDaos([
          { ...selected_member_dao },
        ]);
        let streams = await livePic.checkIfStreamOnChain(wallet, {
          ...daos_with_stream,
        });
        const dao = { ...selected_member_dao, streams: streams };
        setSelectedMemberDAO({ ...dao }); //only first
        onSetDao({ ...dao });
        setSelectedStream(undefined);
        console.log("------");
        if (streams?.length > 0) {
          console.log("------");
          setSelectedStream(streams[0]);
        }
      } else {
        callDisconnectOwner(dispatch);
      }
    })();
  }, [refresh]);

  const getNumOfStakedNFTs = () => {
    let num_staked_nft = 0;
    try {
      const num_nfts = owner.nfts.length;

      if (owner.nfts) {
        for (const nft of owner.nfts) {
          if (nft.stake) {
            num_staked_nft++;
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
    return num_staked_nft;
  }

  const num_staked_nfts = getNumOfStakedNFTs();
  const onChangeSelectMemberDAO = (event) => {
    let dao_id = event.target.value;
    setMemberDao(dao_id);
  };
  const getPercentOfStakedNft = () => {
    let percent = "0";
    try {
      const num_nfts = owner.nfts.length;
      let num_staked_nft = 0;
      if (owner.nfts) {
        for (const nft of owner.nfts) {
          if (nft.stake) {
            num_staked_nft++;
          }
        }
        percent = (num_staked_nft / num_nfts).toFixed(2);
      }
    } catch (e) {
      console.log(e);
    }
    return percent;
  };
  const staked_percent_nft = getPercentOfStakedNft();
  const onCloseModeal = () => {
    setShowModal(0);
    setRefresh(!refresh);
  };

  const onClickRefresh = async () => {
    setRefresh(!refresh);
  };
  const getActiveProposalInfo = async (dao: pic.Dao) => {
    try {
      const _dao = await livePic.getDaoGovernanceFromChain(wallet, dao);
      dao.governance = _dao.governance;
    } catch (e) {
      console.log(e);
    }
  };
  const setMemberDao = async (dao_id: string) => {
    for (const dao of member_daos) {
      if (dao.dao_id == dao_id) {
        let [daos_with_stream] = await livePic.getDaos([{ ...dao }]);
        const streams = await livePic.checkIfStreamOnChain(wallet, {
          ...daos_with_stream,
        });
        const dao_tmp = { ...dao, streams: streams };
        setSelectedMemberDAO({ ...dao_tmp });
        setSelectDaoId(dao_id);
        onSetDao({ ...dao_tmp });
        setSelectedStream(undefined);
        if (streams?.length > 0) {
          setSelectedStream(streams[0]);
        }
      }
    }
  };

  const onLaunchStaking = () => {
    window.open("https://staking.gigadao.io");
    return;
  };
  const onLaunchDiscord = () => {
    window.open("https://discord.gg/p69tx7wMn7");
    return;
  };
  const onLaunchTwitter = () => {
    window.open("https://twitter.com/GigaDAOio");
    return;
  };
  const onLaunchGithub = () => {
    alert("Coming soon");
    return;
  };
  const onLaunchME = () => {
    window.open("https://magiceden.io/marketplace/peachfunlootbox");
    return;
  };
  const onLaunchProfile = () => {
    alert("Coming soon");
    return;
  };

  return (
    <div className="dashboard-main">
      <div className="dashboard-header">
        <div className="header-items-group">

          <div className="top-log">
            <img src={Giga_logo} alt="Solana Explorer" />
          </div>
          <div className="dashboard-dao-group">
            <div onClick={() => setShowModal(7)}>
              <IconButton icon_img={Plus_fill} background="unfill" />
            </div>
            <div className="select-memeberDAO">
              <select value={select_dao_id} onChange={onChangeSelectMemberDAO}>
                {member_dao_ids.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div onClick={onClickRefresh}>
              <IconButton icon_img={Refresh} background="unfill" />
            </div>
          </div>
          <div className="top-nav-right">
            {/* <NavLink to={clusterPath("/maindashboard")} exact> */}
            <Button
              btn_type="common"
              btn_title="Dashboard"
              onClick={() => setShowModal(0)}
            />
            {/* </NavLink> */}
            <ConnectWalletNavButton />
            <div onClick={onLaunchProfile}>
              <IconButton icon_img={Profile} background="unfill" />
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-body">
        {/* <div className="dashboard-dao-group">
          <div onClick={() => setShowModal(0)}>
            <IconButton icon_img={Plus_fill} background="unfill" />
          </div>
          <div className="select-memeberDAO">
            <select value={select_dao_id} onChange={onChangeSelectMemberDAO}>
              {member_dao_ids.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div onClick={onClickRefresh}>
            <IconButton icon_img={Refresh} background="unfill" />
          </div>
        </div> */}
        <div className="body-header">
          {content_title[show_modal]}
        </div>
        <div className="dashboard-content">
          {show_modal != 3 ? (
            <div className="dashboard-content-center">
              <div className="dashboard-status-summary">
                <div className="dao-info-summary">
                  <div className="dao-summary-title">
                    <div className="unit-color">Treasury Value</div>
                  </div>
                  <div className="dao-summary-content">
                    {dao_store.streams?.map((stream, index) =>
                      index < 4 ? (
                        <div className="each-dao-info" key={index}>
                          <div className="dao-summary-value">
                            {stream.current_pool_amount}
                            <div className="unit-color">
                              {" "}
                              {stream.token_ticker}
                            </div>
                          </div>
                          <div className="dao-summary-percent">+100.0%</div>
                        </div>
                      ) : (
                        ""
                      )
                    )}
                  </div>
                </div>
                {/* <div className="dashboard-status-nft">
                  <div className="nft-title">Staking</div>
                  <div className="nft-content">
                    <div className="nft-staked">
                      <div className="nft-staked-title">
                        Number of Staked NFT
                      </div>
                      <div className="nft-staked-cnt">
                        {" "}
                        {num_staked_nfts}
                      </div>
                    </div>
                    <div className="nft-unstaked-cnt">
                      Number of Connected NFTs
                    </div>
                  </div>
                </div> */}
              </div>

              <div className="dao-staking-councillor">
                <div className="dao-staking" onClick={onLaunchStaking}>
                  Staking
                </div>
                <div className="dao-councillor">
                  <div className="councillor-title">Councillor</div>
                  <div className="councillor-action-group">
                    <div
                      className="councillor-action-proposal"
                      onClick={() => setShowModal(4)}
                    >
                      Active Proposal
                    </div>
                    <div
                      className="councillor-action-proposal"
                      onClick={() => setShowModal(2)}
                    >
                      New Proposal
                    </div>
                    <div
                      className="councillor-action-proposal"
                      onClick={() => setShowModal(1)}
                    >
                      New Token Stream
                    </div>
                    <div
                      className="councillor-action-proposal"
                      onClick={() => setShowModal(3)}
                    >
                      Token Stream
                    </div>
                    {/* <NavLink
                    className="councillor-action-proposal"
                    to={clusterPath("/tokenstreamv2")}
                    exact
                    // onClick={() => setShowModal(2)}
                  >
                    Token Stream
                    </NavLink> */}

                    <div
                      className="councillor-action-proposal"
                      onClick={() => setShowModal(5)}
                    // onClick={() => alert("Coming soon")}
                    >
                      New Multisig Treasury
                    </div>
                    <div
                      className="councillor-action-proposal"
                      onClick={() => setShowModal(6)}
                    // onClick={() => alert("Coming soon")}
                    >
                      Treasury
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            ""
          )}
          {show_modal == 3 ? (
            <div className="stream-content-center">
              <div className="dashboard-status-summary">
                <div className="stream-info-summary">
                  <div className="stream-summary-title">
                    <div className="unit-color">Stream</div>
                  </div>
                  <div className="stream-summary-content">
                    <div className="each-dao-info">
                      <div className="stream-item">Stream Rate</div>
                      <div className="dao-summary-value">
                        {selected_stream
                          ? selected_stream.daily_stream_rate
                          : ""}
                        <div className="unit-color">
                          {" "}
                          {selected_stream ? selected_stream.token_ticker : ""}
                        </div>
                      </div>
                      {/* <div className="dao-summary-percent">&nbsp;</div> */}
                    </div>
                    <div className="each-dao-info">
                      <div className="stream-item">Total Earned</div>
                      <div className="dao-summary-value">
                        {selected_stream ? selected_stream.total_earned : ""}
                        <div className="unit-color">
                          {" "}
                          {selected_stream ? selected_stream.token_ticker : ""}
                        </div>
                      </div>
                      {/* <div className="dao-summary-percent">&nbsp;</div> */}
                    </div>
                    <div className="each-dao-info">
                      <div className="stream-item">Total Claimed</div>
                      <div className="dao-summary-value">
                        {selected_stream ? selected_stream.total_claimed : ""}
                        <div className="unit-color">
                          {" "}
                          {selected_stream ? selected_stream.token_ticker : ""}
                        </div>
                      </div>
                      {/* <div className="dao-summary-percent">&nbsp;</div> */}
                    </div>
                    <div className="each-dao-info">
                      <div className="stream-item">Current Pool Amount</div>
                      <div className="dao-summary-value">
                        {selected_stream
                          ? selected_stream.current_pool_amount
                          : ""}
                        <div className="unit-color">
                          {" "}
                          {selected_stream ? selected_stream.token_ticker : ""}
                        </div>
                      </div>
                      {/* <div className="dao-summary-percent">&nbsp;</div> */}
                    </div>
                    <div className="each-dao-info">
                      <div className="stream-item">Total NFTs Staked</div>
                      <div className="dao-summary-value">
                        {/* {selected_stream ? owner.nfts?.length : ""} */}
                        {num_staked_nfts}
                        <div className="unit-color">
                          {" "}
                          {num_staked_nfts > 1 ? "NFTs" : "NFT"}
                          {/* {selected_stream
                            ? owner.nfts?.length > 1
                              ? "NFTs"
                              : "NFT"
                            : ""} */}

                        </div>
                      </div>
                      {/* <div className="dao-summary-percent">
                        + {staked_percent_nft} %
                      </div> */}
                    </div>
                  </div>
                </div>
                {/* <div className="dashboard-status-nft">
                  <div className="nft-title">Staking</div>
                  <div className="nft-content">
                    <div className="nft-staked">
                      <div className="nft-staked-title">
                        Number of Staked NFT
                      </div>
                      <div className="nft-staked-cnt">
                        {" "}
                        {num_staked_nfts}
                      </div>
                    </div>
                    <div className="nft-unstaked-cnt">
                      Number of Connected NFTs
                    </div>
                  </div>
                </div> */}
              </div>

              <div className="card-content">
                <div className="single-card">
                  {dao_store.streams?.map((stream, index) =>
                    stream.daily_stream_rate > 0 ? (
                      <StreamCard
                        key={index}
                        setSelectedStream={setSelectedStream}
                        stream={stream}
                        is_selected={
                          stream.address.toString() ===
                          selected_stream?.address.toString()
                        }
                        setRefresh={setRefresh}
                        refresh={refresh}
                      />
                    ) : (
                      ""
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
      {show_modal == 7 && connected ? (
        <DAODetailModal onClick={() => setShowModal(0)}>
          <NewDAO dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 1 && connected && selected_member_dao != undefined ? (
        <DAODetailModal onClick={() => setShowModal(0)}>
          <NewStream dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 2 && connected ? (
        <DAODetailModal onClick={() => setShowModal(0)}>
          <NewProposal dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {/* {show_modal == 3 && connected ? (
        <DAODetailModal onClick={() => setShowModal(0)}>
          <TokenStream dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )} */}
      {show_modal == 4 && connected ? (
        <DAODetailModal onClick={() => setShowModal(0)}>
          <ActiveProposal dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 5 && connected ? (
        <DAODetailModal onClick={() => setShowModal(0)}>
          <NewMultisigTreasury
            dao={selected_member_dao}
            onClose={onCloseModeal}
          />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 6 && connected ? (
        <DAODetailModal onClick={() => setShowModal(0)}>
          <MultisigTreausry dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
    </div>
  );
};
export default DAODashboardV2;
