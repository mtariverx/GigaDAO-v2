import "./style.scss";
import { useEffect, useState } from "react";
import "../common/LabelInput/style.scss";
import Button from "components/common/Button";
import Plus_fill from "img/icons/plus_symbol_fill.png";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as pic from "../../pic/pic";
import * as simPic from "../../pic/sim";
import * as livePic from "../../pic/live";
import { getShortKey, validateSolanaAddress } from "components/CommonCalls";
import { useAnchorWallet, useWallet } from "providers/adapters/core/react";
import { useSelector } from "react-redux";
import { DaoState } from "store/DaoReducer";
import { shallowEqual } from "react-redux";
import * as React from "react";
import { useDispatch } from "react-redux";
const ActiveProposal = (props) => {
  
  type counc_sign_pair = {
    councillor: PublicKey;
    signer: boolean;
  };
  const wallet = useAnchorWallet();
  const proposal_options = [
    { value: pic.ProposalType.UPDATE_MULTISIG, label: "Update Multi-sig" },
    { value: pic.ProposalType.DEACTIVATE_STREAM, label: "Deactivate Stream" },
    {
      value: pic.ProposalType.WITHDRAW_FROM_STREAM,
      label: "Withdraw from Stream",
    },
  ];
  const [proposal_type, setProposalType] = useState(-1);

  const [counc_sign, setCounc_Sign] = useState<counc_sign_pair[]>([]);
  const [proposed_councillors, setProposedCouncillors] = useState<string[]>([]);
  const [proposed_approval_threshold, setProposedApprovalThresold] =
    useState<number>();
  const [deactivate_stream_pubkey, setDeactivateStreamPubkey] =
    useState<string>();
  const [amount, setAmount] = useState<number>();
  const [proposed_withdrawal_receiver, setProposedWithdrawalReceiver] =
    useState<string>();
  const [proposed_withdrawal_stream, setProposedWithdrawalStream] =
    useState<string>();
  const [reset, setReset] = useState(true);
  // const onSelectProposalType = (event) => {
  //   setProposalType(event.target.value);
  // };
  const dispatch_state = useDispatch();
  const onSetDao = React.useCallback(
    (dao: pic.Dao) => dispatch_state({ type: "SET_DAO", payload: dao }),
    [dispatch_state]
  );
  const dao: pic.Dao = useSelector((state:DaoState) => state.dao, shallowEqual);
  useEffect(() => {
    (async () => {
      getActiveProposalInfo(dao);
    })();
  }, []);
  useEffect(() => {
    (async () => {
      getActiveProposalInfo(dao);
    })();
  }, [reset]);

  const getActiveProposalInfo = async (dao: pic.Dao) => {
    let tmp: any = [];
    let tmp_counc_sign_arr: Array<counc_sign_pair> = [];
    try {
      const _dao = await livePic.getDaoGovernanceFromChain(wallet, dao);
      dao.governance = _dao.governance;

      if (dao.governance && dao.governance.councillors != undefined) {
        dao.governance.councillors.forEach(function (councillor, index) {
          let tmp_c: counc_sign_pair = {
            councillor: councillor,
            signer: dao.governance.proposed_signers[index],
          };
          tmp_counc_sign_arr.push(tmp_c);
        });
      }

      console.log("===============getActiveProposalInfo======2=======", dao);

      if (dao.governance == undefined) {
        return dao;
      }

      if (
        dao.governance &&
        Object.keys(dao.governance.proposal_type)[0] == "deactivateStream"
      ) {
        setProposalType(2);
        setDeactivateStreamPubkey(
          dao.governance.proposed_deactivation_stream.toString()
        );
      } else if (
        dao.governance &&
        Object.keys(dao.governance.proposal_type)[0] == "withdrawFromStream"
      ) {
        setProposalType(3);
        setAmount(Number(dao.governance.proposed_withdrawal_amount));
        setProposedWithdrawalReceiver(
          dao.governance.proposed_withdrawal_receiver.toString()
        );

        setProposedWithdrawalStream(
          dao.governance.proposed_withdrawal_stream.toString()
        );
        
        
      } else if (
        dao.governance &&
        dao.governance.proposed_councillors.length > 0 &&
        Object.keys(dao.governance.proposal_type)[0] == "updateMultisig"
      ) {
        setProposalType(1);
        tmp = dao.governance.proposed_councillors
          .map((councillor) => councillor.toString())
          
          console.log("tmp=",tmp);
          setProposedCouncillors(tmp);
          setProposedApprovalThresold(Number(dao.governance.proposed_approval_threshold));
        
      }
    } catch (e) {
      console.log(e);
    }
    setCounc_Sign(tmp_counc_sign_arr);
  };
  
  //call for clicking Approve button on Active Proposal
  const onClickApproveProposeBtn = async () => {
    // const dao: pic.Dao = props.dao;
    if (dao.governance) {
      const councillors = dao.governance.councillors.map((item) =>
        item.toString()
      );
      let index = councillors.indexOf(wallet.publicKey.toString());
      let proposed_signers = dao.governance.proposed_signers;
      if (index != -1 && proposed_signers[index] === false) {
        proposed_signers.splice(index, 1, true);
        dao.governance.proposed_signers = [];
        dao.governance.proposed_signers = proposed_signers;
        livePic.approveDaoCommand(wallet, dao);
        getActiveProposalInfo(dao);
      } else {
        alert("Proposal has already approved");
      }
    }
  };
  const onClickDeclineProposeBtn = async () => {
    // const dao: pic.Dao = props.dao;
    if (dao.governance) {
      const councillors = dao.governance.councillors.map((item) =>
        item.toString()
      );
      let index = councillors.indexOf(wallet.publicKey.toString());

      let proposed_signers = dao.governance.proposed_signers;
      if (index != -1 && proposed_signers[index] === true) {
        proposed_signers.splice(index, 1, false);
        dao.governance.proposed_signers = [];
        dao.governance.proposed_signers = proposed_signers;
        livePic.approveDaoCommand(wallet, {...dao});
        getActiveProposalInfo(dao);
      } else {
        alert("Proposal has already declined");
      }
    }
    setReset(!reset);
  };

  const onClickExecuteProposeBtn = () => {
    
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
     getActiveProposalInfo(dao);
  };
  return (
    // <div>
    <div className="active-proposal-container">
      <div className="content-title">Active Proposal</div>
      <div className="proposal-body">
        <div className="proposal-content">
          <div className="content-upper">
            <div className="item-wrapper">
              <div className="title">Proposal Type</div>
              <div className="show-item">
                {proposal_type === -1
                  ? "No data"
                  : proposal_type === 1
                  ? "Update multisig"
                  : proposal_type === 2
                  ? "Deactivate stream"
                  : proposal_type === 3
                  ? "Withdraw from stream"
                  : ""}
              </div>
            </div>
            <div>
              {proposal_type == pic.ProposalType.UPDATE_MULTISIG ? (
                <div className="proposal-item-group">
                  <div className="item-wrapper">
                    <div className="title-top">Councillors</div>
                    <div className="show-collections">
                      {proposed_councillors
                        .map((councillor) => getShortKey(councillor.toString()))
                        .join("\n")}
                    </div>
                  </div>
                  <div className="item-wrapper">
                    <div className="title">Approval Threshold</div>
                    <div className="show-item">
                      {proposed_approval_threshold}
                    </div>
                  </div>
                </div>
              ) : proposal_type == pic.ProposalType.DEACTIVATE_STREAM ? (
                <div>
                  <div className="item-wrapper">
                    <div className="title">Stream Publick Key</div>
                    <div className="show-item">{deactivate_stream_pubkey}</div>
                  </div>
                </div>
              ) : proposal_type == pic.ProposalType.WITHDRAW_FROM_STREAM ? (
                <div>
                  <div className="item-wrapper">
                    <div className="title">Amount</div>
                    <div className="show-item">{amount}</div>
                  </div>
                  <div className="item-wrapper">
                    <div className="title">Withdrawal Receiver</div>
                    <div className="show-item">
                      {proposed_withdrawal_receiver}
                    </div>
                  </div>
                  <div className="item-wrapper">
                    <div className="title">Withdrawal Stream</div>
                    <div className="show-item">
                      {proposed_withdrawal_stream}
                    </div>
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>

        <div className="proposal-councillor">
          <div className="proposal-propose">
            <div className="proposal-title">Councillors</div>
            <div className="proposal-description">
              Approval Threshould be be met before proposal can be executed
            </div>
            <div className="councillor-pubkeys">
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
            <div className="proposal-approve-decline">
              <Button
                btn_type="common"
                btn_title="Approve"
                onClick={onClickApproveProposeBtn}
              />
              <Button
                btn_type="common"
                btn_title="Decline"
                onClick={onClickDeclineProposeBtn}
              />
            </div>
          </div>
          <div className="proposal-execute">
            <div className="execute-description">
              Once the threshould have been met any Councillor can execute
            </div>
            <div className="execute-btn">
              <Button
                btn_type="narrow"
                btn_title="Execute"
                onClick={onClickExecuteProposeBtn}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    // </div>
  );
};
export default ActiveProposal;
