import { useEffect, useState } from "react";
import "./style.scss";
import * as React from "react";
import Profile from "img/icons/profile.png";
import Discord from "img/icons/discord_logo_icon_1.png";
import Twitter from "img/icons/twitter.png";
import ME_logo from "img/icons/ME_Logo.png";
import Web from "img/icons/web.png";
import Github from "img/icons/github.png";
import Refresh from "img/icons/refresh_1.png";
import Plus_fill from "img/icons/plus_symbol_fill.png";
import Giga_logo from "../../img/icons/gigadao-full-brand-cropped.png";
import IconButton from "components/common/IconButton";
import { ConnectWalletNavButton } from "../ConnectWalletNavButton";
import Button from "components/common/Button";
import DAODetailModal from "components/DAODetailModal";
import NewStream from "components/NewStream";
import TokenStream from "components/TokenStream";
import NewProposal from "components/NewProposal";
import NewDAO from "components/NewDAO";

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

const DAODashboardV2: React.FC = (props) => {
  const { publicKey, connected } = useWallet();
  const { dispatch, callConnectOwner, callDisconnectOwner } = useOwnerData();
  const [isConnectingToOwner, setIsConnectingToOwner] = useState(false);

  const [member_daos, setMemberDAOs] = useState<Array<pic.Dao>>([]);
  const [member_dao_ids, setMemberDaoIds] = useState<string[]>([]);
  const [selected_member_dao, setSelectedMemberDAO] = useState<pic.Dao>();
  const [show_modal, setShowModal] = useState(-1);
  const [refresh, setRefresh] = useState(false);
  const [select_dao_id, setSelectDaoId] = useState<string>();

  const wallet = useAnchorWallet();

  const dispatch_state = useDispatch();

  const onSetDao = React.useCallback(
    (dao: pic.Dao) => dispatch_state({ type: "SET_DAO", payload: dao }),
    [dispatch_state]
  );
  // const dao_ = useSelector<DaoState, DaoState["dao"]>((state) => state.dao);
  const dao_store: pic.Dao = useSelector(
    (state: DaoState) => state.dao,
    shallowEqual
  );
  // console.log("useSelector=", dao_store);

  useEffect(() => {
    (async () => {
      try {
        if (connected) {
          setIsConnectingToOwner(true);
          const newOwner: pic.Owner = { address: publicKey };
          // const newOwner: pic.Owner = { address: new PublicKey("GrGUgPNUHKPQ8obxmmbKKJUEru1D6uWu9fYnUuWjbXyi")};;
          callConnectOwner(dispatch, newOwner).then(() => {
            setIsConnectingToOwner(false);
          });
          let member_daos_promise = await livePic.getMemberDaos(
            newOwner,
            wallet
          );
          console.log("=======", member_daos_promise);
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
          console.log("---", streams);
          const dao = { ...m_daos[0], streams: streams };
          console.log("--dao--", dao);
          setSelectedMemberDAO({ ...dao }); //only first
          onSetDao({ ...dao });
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
        console.log("select*******dao");
        let [daos_with_stream] = await livePic.getDaos([
          { ...selected_member_dao },
        ]);
        console.log("+++++", selected_member_dao);
        let streams = await livePic.checkIfStreamOnChain(wallet, {
          ...daos_with_stream,
        });
        const dao = { ...selected_member_dao, streams: streams };
        // let [confirmedDaos] = await livePic.getConfirmedStream([
        //   { ...daos_with_stream },
        // ]);
        console.log("---", streams);
        // console.log("-------------", confirmedDaos);
        setSelectedMemberDAO({ ...dao }); //only first
        onSetDao({ ...dao });
      } else {
        callDisconnectOwner(dispatch);
      }
    })();
  }, [refresh]);

  const onChangeSelectMemberDAO = (event) => {
    let dao_id = event.target.value;
    setSelectDaoId(dao_id);
    setMemberDao(dao_id);
  };

  const onCloseModeal = () => {
    setShowModal(-1);
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
        const streams=await livePic.checkIfStreamOnChain(wallet, { ...daos_with_stream });
        const dao_tmp={...dao, streams:streams}
        setSelectedMemberDAO({ ...dao_tmp });
        setSelectDaoId(dao_id);
        onSetDao({ ...dao_tmp });
       
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
      <div className="top-nav-bar">
        <div className="top-log">
          <img src={Giga_logo} alt="Solana Explorer" />
        </div>
        <div className="top-nav-right">
          <Button btn_type="common" btn_title="Dashboard" />
          <ConnectWalletNavButton />
          <div onClick={onLaunchProfile}>
            <IconButton icon_img={Profile} background="unfill" />
          </div>
        </div>
      </div>
      <div className="dashboard-body">
        <div className="dashboard-dao-group">
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
        </div>
        <div className="dashboard-content">
          <div className="dashboard-content-center">
            <div className="dao-info-summary">
              <div className="dao-summary-title">
                <div className="unit-color">Treasury Value</div>
              </div>
              <div className="dao-summary-content">
                {dao_store.streams?.map((stream, index) =>
                  index < 4 ? (
                    <div className="each-dao-info">
                      <div className="dao-summary-value">
                        {stream.current_pool_amount}
                        <div className="unit-color"> {stream.token_ticker}</div>
                      </div>
                      <div className="dao-summary-percent">+100.0%</div>
                    </div>
                  ) : (
                    ""
                  )
                )}
              </div>
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
                    className="councillor-action-others"
                    onClick={() => setShowModal(1)}
                  >
                    New Token Stream
                  </div>
                  <div
                    className="councillor-action-others"
                    onClick={() => setShowModal(3)}
                  >
                    Token Stream
                  </div>
                  <div
                    className="councillor-action-others"
                    onClick={() => setShowModal(5)}
                    // onClick={() => alert("Coming soon")}
                  >
                    New Multisig Treasury
                  </div>
                  <div
                    className="councillor-action-others"
                    onClick={() => setShowModal(6)}
                    // onClick={() => alert("Coming soon")}
                  >
                    Treasury
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-bottom">
        <div className="bottom-social-group">
          <div className="social-icon" onClick={onLaunchDiscord}>
            <IconButton
              icon_img={Discord}
              background="social_unfill"
              onClick={onLaunchDiscord}
            />
          </div>
          <div className="social-icon" onClick={onLaunchTwitter}>
            <IconButton icon_img={Twitter} background="social_unfill" />
          </div>
          <div className="social-icon" onClick={onLaunchGithub}>
            <IconButton icon_img={Github} background="social_unfill" />
          </div>
          <div className="social-icon" onClick={onLaunchME}>
            <IconButton icon_img={ME_logo} background="social_unfill" />
          </div>
        </div>
      </div>
      {show_modal == 0 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <NewDAO dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 1 && connected && selected_member_dao != undefined ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <NewStream dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 2 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <NewProposal dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 3 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <TokenStream dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 4 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <ActiveProposal dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 5 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <NewMultisigTreasury
            dao={selected_member_dao}
            onClose={onCloseModeal}
          />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 6 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <MultisigTreausry dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
    </div>
  );
};
export default DAODashboardV2;
