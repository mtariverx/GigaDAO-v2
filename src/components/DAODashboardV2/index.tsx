import { useEffect, useState } from "react";
import "./style.scss";

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

import ActiveProposal from "components/ActiveProposal";
import { useAnchorWallet, useWallet } from "providers/adapters/core/react";
import { useOwnerData } from "providers/owner";
import * as pic from "../../pic/pic";
import * as simPic from "../../pic/sim";
import * as livePic from "../../pic/live";

const DAODashboardV2: React.FC = (props) => {
  const { publicKey, connected } = useWallet();
  const { dispatch, callConnectOwner, callDisconnectOwner } = useOwnerData();
  const [isConnectingToOwner, setIsConnectingToOwner] = useState(false);

  const [member_daos, setMemberDAOs] = useState<Array<pic.Dao>>([]);
  const [member_dao_ids, setMemberDaoIds] = useState<string[]>([]);
  const [dashitem, setDashItem] = useState(0);
  const [selected_member_dao, setSelectedMemberDAO] = useState<pic.Dao>();
  const [show_modal, setShowModal] = useState(-1);
  const [refresh, setRefresh] = useState(false);
  const [select_dao_id, setSelectDaoId] = useState<string>();

  const wallet = useAnchorWallet();

  useEffect(() => {
    (async () => {
      if (connected) {
        setIsConnectingToOwner(true);
        const newOwner: pic.Owner = { address: publicKey };
        callConnectOwner(dispatch, newOwner).then(() => {
          setIsConnectingToOwner(false);
        });

        let member_daos_promise = await livePic.getMemberDaos(newOwner, wallet);
        console.log("member_daos_promise=", member_daos_promise);

        let mdis: Array<string> = [];
        let m_daos: Array<pic.Dao> = [];
        m_daos = member_daos_promise;
        setMemberDAOs(m_daos); //set daos to memberdaos but the dao has only address and streams
        mdis = m_daos.map((dao) => dao.dao_id);
        setMemberDaoIds(mdis);
        setSelectDaoId(mdis[0]);
        let [daos_with_stream] = await livePic.getDaos([{ ...m_daos[0] }]);
        await livePic.checkIfStreamOnChain(wallet, { ...daos_with_stream });
        let [confirmedDaos] = await livePic.getConfirmedStream([
          { ...daos_with_stream },
        ]);
        setSelectedMemberDAO({ ...confirmedDaos }); //only first
      } else {
        callDisconnectOwner(dispatch);
      }
    })();
  }, [connected]);
  useEffect(() => {
    (async () => {
      if (connected) {
        console.log("reset");
        setIsConnectingToOwner(true);
        const newOwner: pic.Owner = { address: publicKey };
        callConnectOwner(dispatch, newOwner).then(() => {
          setIsConnectingToOwner(false);
        });

        let member_daos_promise = await livePic.getMemberDaos(newOwner, wallet);
        console.log("member_daos_promise=", member_daos_promise);

        let mdis: Array<string> = [];
        let m_daos: Array<pic.Dao> = [];
        m_daos = member_daos_promise;
        setMemberDAOs(m_daos); //set daos to memberdaos but the dao has only address and streams
        mdis = m_daos.map((dao) => dao.dao_id);
        setMemberDaoIds(mdis);
        setSelectDaoId(select_dao_id);
        let [daos_with_stream] = await livePic.getDaos([
          { ...selected_member_dao },
        ]);
        await livePic.checkIfStreamOnChain(wallet, { ...daos_with_stream });
        let [confirmedDaos] = await livePic.getConfirmedStream([
          { ...daos_with_stream },
        ]);
        setSelectedMemberDAO({ ...confirmedDaos }); //only first
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
      console.log("dashv2-getActive");
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
        await livePic.checkIfStreamOnChain(wallet, { ...daos_with_stream });
        let [confirmedDaos] = await livePic.getConfirmedStream([
          { ...daos_with_stream },
        ]);
        setSelectedMemberDAO({ ...confirmedDaos });
        setSelectDaoId(dao_id);
      }
    }
  };

  const onLaunchStaking=()=>{
    window.open("https://staking.gigadao.io/");
    return 
  }

  return (
    <div className="dashboard-main">
      <div className="top-nav-bar">
        <div className="top-log">
          <img src={Giga_logo} alt="Solana Explorer" />
        </div>
        <div className="top-nav-right">
          <Button btn_type="common" btn_title="Dashboard" />
          <ConnectWalletNavButton />
          <IconButton icon_img={Profile} is_background={false} />
        </div>
      </div>
      <div className="dashboard-body">
        <div className="dashboard-dao-group">
          <div onClick={() => setShowModal(0)}>
            <IconButton icon_img={Plus_fill} is_background={false} />
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
            <IconButton icon_img={Refresh} is_background={false} />
          </div>
        </div>
        <div className="dashboard-content">
          <div className="dashboard-content-center">
            <div className="dao-info-summary">
              <div className="dao-summary-title">
                <div className="unit-color">Treasury Value</div>
              </div>
              <div className="dao-summary-content">
                <div className="each-dao-info">
                  <div className="dao-summary-value">
                    4,320 <div className="unit-color"> SOL</div>
                  </div>
                  <div className="dao-summary-percent">+100.0%</div>
                </div>
                <div className="each-dao-info">
                  <div className="dao-summary-value">
                    5,999 <div className="unit-color">USD</div>
                  </div>
                  <div className="dao-summary-percent">+100.0%</div>
                </div>
                <div className="each-dao-info">
                  <div className="dao-summary-value">
                    5,999 <div className="unit-color">GIGS</div>
                  </div>
                  <div className="dao-summary-percent">+100.0%</div>
                </div>
                <div className="each-dao-info">
                  <div className="dao-summary-value">
                    5,999 <div className="unit-color">BPTS</div>
                  </div>
                  <div className="dao-summary-percent">+100.0%</div>
                </div>
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
                    onClick={() => setShowModal(5)}
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
                    onClick={() => setShowModal(4)}
                  >
                    Token Stream{" "}
                  </div>
                  <div className="councillor-action-others">New Multisig Treasury</div>
                  <div className="councillor-action-others">Treasury</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="dashboard-bottom">
        <div className="bottom-social-group">
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
      {show_modal == 4 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <TokenStream dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 5 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <ActiveProposal dao={selected_member_dao} onClose={onCloseModeal} />
        </DAODetailModal>
      ) : (
        ""
      )}
    </div>
  );
};
export default DAODashboardV2;
