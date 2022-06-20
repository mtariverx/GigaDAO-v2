import { useEffect, useState } from "react";
import "./style.scss";
// import MemberGraph from "components/common/MemberGraph";
import Refresh from "img/icons/refresh_1.png";
import Profile from "img/icons/profile.png";
import Plus_fill from "img/icons/plus_symbol_fill.png";
import Gigs_log from "img/icons/small_gigs_token_logo.png";

import DAODetailModal from "components/DAODetailModal";
import NewStream from "components/NewStream";
import NewProposal from "components/NewProposal";
import DAOSocial from "components/DAOSocial";
import IconButton from "components/common/IconButton";
import NewDAO from "components/NewDAO";
import Button from "components/common/Button";
import { ConnectWalletNavButton } from "../ConnectWalletNavButton";

import * as pic from "pic/pic";
import * as simPic from "pic/sim";
import * as livePic from "pic/live";
import { Keypair, PublicKey } from "@solana/web3.js";
import { useAnchorWallet, useWallet } from "providers/adapters/core/react";
import { useOwnerData } from "providers/owner";

const DAODashboard: React.FC = (props) => {
  const [collapse, setCollapse] = useState(false);
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

  type counc_sign_pair = {
    councillor: PublicKey;
    signer: boolean;
  };

  const [counc_sign, setCounc_Sign] = useState<counc_sign_pair[]>([]);
  const [active_proposal_info, setActiveProposalInfo] = useState<Array<any[]>>(
    []
  );

  const getShortKey = (long_key: string) => {
    const str: string = long_key.slice(0, 7) + "..." + long_key.slice(-7);
    return str;
  };
  useEffect(() => {
    (async () => {
      if (connected) {
     
          setIsConnectingToOwner(true);
          const newOwner: pic.Owner = { address: publicKey };
          callConnectOwner(dispatch, newOwner).then(() => {
            setIsConnectingToOwner(false);
          });

          let member_daos_promise = await livePic.getMemberDaos(
            newOwner,
            wallet,
          );
          console.log("member_daos_promise=", member_daos_promise);

          let mdis: Array<string> = [];
          let m_daos: Array<pic.Dao> = [];
          m_daos = member_daos_promise;
          setMemberDAOs(m_daos); //set daos to memberdaos but the dao has only address and streams
          mdis = m_daos.map((dao) => dao.dao_id);
          setMemberDaoIds(mdis);
          setSelectDaoId(mdis[0]);
          let [daos_with_stream] = await livePic.getDaos([{...m_daos[0]}]);
          await livePic.checkIfStreamOnChain(wallet, {...daos_with_stream});
          let [confirmedDaos] = await livePic.getConfirmedStream([
            {...daos_with_stream},
          ]);
          setSelectedMemberDAO({ ...confirmedDaos }); //only first
          // getActiveProposalInfo({ ...confirmedDaos });
 
      } else {
        callDisconnectOwner(dispatch);
      }
    })();
  }, [connected]);
  useEffect(() => {
    (async () => {
      if (connected) {
      
          setIsConnectingToOwner(true);
          const newOwner: pic.Owner = { address: publicKey };
          callConnectOwner(dispatch, newOwner).then(() => {
            setIsConnectingToOwner(false);
          });

          let member_daos_promise = await livePic.getMemberDaos(
            newOwner,
            wallet,
          );
          console.log("member_daos_promise=", member_daos_promise);

          let mdis: Array<string> = [];
          let m_daos: Array<pic.Dao> = [];
          m_daos = member_daos_promise;
          setMemberDAOs(m_daos); //set daos to memberdaos but the dao has only address and streams
          mdis = m_daos.map((dao) => dao.dao_id);
          setMemberDaoIds(mdis);
          setSelectDaoId(select_dao_id);
          let [daos_with_stream] = await livePic.getDaos([{...selected_member_dao}]);
          await livePic.checkIfStreamOnChain(wallet, {...daos_with_stream});
          let [confirmedDaos] = await livePic.getConfirmedStream([
            {...daos_with_stream},
          ]);
          setSelectedMemberDAO({ ...confirmedDaos }); //only first
          // getActiveProposalInfo({ ...confirmedDaos });
      
      } else {
        callDisconnectOwner(dispatch);
      }
    })();
  }, [refresh]);

  // useEffect(() => {
  //   if (selected_member_dao != undefined) {
  //     getActiveProposalInfo({...selected_member_dao});
  //   }
  // }, [selected_member_dao]);
  const onCloseModeal = () => {
    setShowModal(-1);
    setRefresh(!refresh);
   
    
  };
  const onClickRefresh = async () => {
    setRefresh(!refresh);
  };

  let dao: pic.Dao;
  const onChangeSelectMemberDAO = (event) => {
    let dao_id = event.target.value;
    setSelectDaoId(dao_id);
    setMemberDao(dao_id);
  };

  const setMemberDao = async (dao_id: string) => {
    for (const dao of member_daos) {
      if (dao.dao_id == dao_id) {
        let [daos_with_stream] = await livePic.getDaos([{...dao}]);
        await livePic.checkIfStreamOnChain(wallet, {...daos_with_stream});
        let [confirmedDaos] = await livePic.getConfirmedStream([{...daos_with_stream}]);
        setSelectedMemberDAO({ ...confirmedDaos});
        setSelectDaoId(dao_id);
      }
    }
  };

  //get governance info to show them in Active Proposal Section
  // const getActiveProposalInfo = async (dao: pic.Dao) => {
  //   let tmp: any = [];
  //   let tmp_counc_sign_arr: Array<counc_sign_pair> = [];
  //   try {
  //     const _dao = await livePic.getDaoGovernanceFromChain(wallet, dao);
  //     dao.governance = _dao.governance;

  //     if (dao.governance && dao.governance.councillors != undefined) {
  //       dao.governance.councillors.forEach(function (councillor, index) {
  //         let tmp_c: counc_sign_pair = {
  //           councillor: councillor,
  //           signer: dao.governance.proposed_signers[index],
  //         };
  //         tmp_counc_sign_arr.push(tmp_c);
  //       });
  //     }
  //     if (dao.governance == undefined) {
  //       return dao;
  //     }

  //     if (
  //       dao.governance &&
  //       Object.keys(dao.governance.proposal_type)[0] == "deactivateStream"
  //     ) {
  //       tmp = [
  //         ["Proposal Type:", "Deactivate Stream"],
  //         [
  //           "Stream Public Key:",
  //           getShortKey(dao.governance.proposed_deactivation_stream.toString()),
  //         ],
  //       ];
  //     } else if (
  //       dao.governance &&
  //       Object.keys(dao.governance.proposal_type)[0] == "withdrawFromStream"
  //     ) {
  //       tmp = [
  //         ["Proposal Type: ", "Withdraw from Stream"],
  //         ["Amount:", `${dao.governance.proposed_withdrawal_amount}`],
  //         [
  //           "Withdraw Receiver: ",
  //           getShortKey(dao.governance.proposed_withdrawal_receiver.toString()),
  //         ],
  //         [
  //           "Withdraw Stream: ",
  //           getShortKey(dao.governance.proposed_withdrawal_stream.toString()),
  //         ],
  //       ];
  //     } else if (
  //       dao.governance &&
  //       Object.keys(dao.governance.proposal_type)[0] == "updateMultisig"
  //     ) {
  //       tmp = [
  //         ["Proposal Type: ", "Update Multi-sig"],
  //         [
  //           "councillors: ",
  //           dao.governance.proposed_councillors
  //             .map((councillor) => getShortKey(councillor.toString()))
  //             .join("\n"),
  //         ],
  //       ];
  //     }
  //     setActiveProposalInfo(tmp);
  //   } catch (e) {
  //     console.log(e);
  //   }
  //   setCounc_Sign(tmp_counc_sign_arr);
  //   setActiveProposalInfo(tmp);
  // };

  //call for clicking Approve button on Active Proposal
  const onClickApproveProposeBtn = async () => {
    const wallet_address = publicKey.toString();
    const dao: pic.Dao = selected_member_dao;
    if (dao.governance) {
      const councillors = dao.governance.councillors.map((item) =>
        item.toString()
      );
      let index = councillors.indexOf(wallet_address);
      if (index != -1) {
        let proposed_signers = dao.governance.proposed_signers;
        proposed_signers.splice(index, 1, true);
        dao.governance.proposed_signers = proposed_signers;
        setSelectedMemberDAO({ ...dao });
      }
    }
    livePic.approveDaoCommand(wallet, dao);

  };

  const onClickExecuteProposeBtn = () => {
    const dao: pic.Dao = selected_member_dao;
    if (dao.governance != undefined) {
      if (
        dao.governance &&
        Object.keys(dao.governance.proposal_type)[0] == "deactivateStream"
      ) {
        livePic.executeDeactivateStream(wallet, dao);
      } else if (
        dao.governance &&
        Object.keys(dao.governance.proposal_type)[0] == "withdrawFromStream"
      ) {
        livePic.executeWithdrawFromStream(wallet, dao);
      } else if (
        dao.governance &&
        Object.keys(dao.governance.proposal_type)[0] == "updateMultisig"
      ) {
        livePic.executeUpdateDaoMultisig(wallet, dao);
      }
    }
  };

  return (
    <div className="dashboard-content">
      <a href="https://staking.gigadao.io/" target="_blank">
        <div className="menu-icon">
          <span>Show Menu</span>
        </div>
      </a>
      <div className="top-nav-bar">
        <div className="dash-title">DAO Dashboard</div>
        <div className="top-nav-right">
          <div className="nav-dao-search">
            <input type="text" placeholder="DAO Search.." name="search" />
          </div>
          <div className="connection-refresh_btn">
            <ConnectWalletNavButton />
            <IconButton icon_img={Profile} is_background={false} />
          </div>
        </div>
      </div>
      <div className="dashboard-main-content ">
        <div className="content-left">
          <div className="address-refresh_btn">
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
          <div className="member-token">
            <div className="dash-items">
              <div
                className={`item-each ${dashitem == 0 ? "active" : ""}`}
                onClick={() => setDashItem(0)}
              >
                Members
              </div>
              <div
                className={`item-each ${dashitem == 1 ? "active" : ""}`}
                onClick={() => setDashItem(1)}
              >
                Token Pools
              </div>
              <div
                className={`item-each ${dashitem == 2 ? "active" : ""}`}
                onClick={() => setDashItem(2)}
              >
                Token Streams
              </div>
              <div
                className={`item-each ${dashitem == 3 ? "active" : ""}`}
                onClick={() => setDashItem(3)}
              >
                Voting
              </div>
              <div
                className={`item-each ${dashitem == 4 ? "active" : ""}`}
                onClick={() => setDashItem(4)}
              >
                More...
              </div>
            </div>
            <div className="dash-details">
              Tracking Data Coming Soon!
              {/* <div className="dash-details-graph"><MemberGraph /></div>  */}
            </div>
          </div>
          <div className="tokenpool-proposal">
            <div
              className="dashboard-card tokenpool-streams "
              onClick={() => setShowModal(1)}
            >
              Token Pools <br />& Streams
            </div>
            <div
              className="dashboard-card new-proposal"
              onClick={() => setShowModal(2)}
            >
              New Proposal
            </div>
          </div>
          <div className="voting-social">
            <div
              className="dashboard-card dao-voting"
              onClick={() => setShowModal(3)}
            >
              Voting
            </div>
            <div
              className="dashboard-card dao-social"
              onClick={() => setShowModal(4)}
            >
              DAO Social
            </div>
          </div>
        </div>
        <div className="content-right">
          <div className="active-proposal">
            <div className="proposal-setting">
              <div className="proposal-active">Active proposal</div>
              <div className="proposal-description">
                {active_proposal_info.map((item_pair) => {
                  return (
                    <div className="description-item-value">
                      <div className="description-item">{item_pair[0]}</div>
                      <div className="description-value">{item_pair[1]}</div>
                    </div>
                  );
                })}
              
              </div>
              <div className="proposal-councillors">Councillors</div>
              <div className="proposal-councillor-pubkeys">
                {counc_sign.map((item) => (
                  <div className="councillor-pubkey-pair">
                    <div className="text-pubkey">
                      {getShortKey(item.councillor.toString())}
                    </div>
                    <div className="vote-state">
                      {item.signer ? "Approved" : "-"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="proposal-btn-group">
                <Button
                  btn_type="common"
                  btn_title="Approve"
                  onClick={onClickApproveProposeBtn}
                />
                <Button
                  btn_type="common"
                  btn_title="Execute"
                  onClick={onClickExecuteProposeBtn}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {show_modal == 0 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <NewDAO
            dao={selected_member_dao}
            onClose={onCloseModeal}
          />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 1 && connected && selected_member_dao != undefined ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <NewStream
            dao={selected_member_dao}
            onClose={onCloseModeal}
          />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 2 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
          <NewProposal
            dao={selected_member_dao}
            onClose={onCloseModeal}
          />
        </DAODetailModal>
      ) : (
        ""
      )}
      {show_modal == 4 && connected ? (
        <DAODetailModal onClick={() => setShowModal(-1)}>
        </DAODetailModal>
      ) : (
        ""
      )}
    </div>
  );
};
export default DAODashboard;
