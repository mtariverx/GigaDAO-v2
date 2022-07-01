import { useEffect, useState } from "react";
import "./style.scss";
import * as React from "react";
import StreamCard from "components/StreamCard";

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

const TokenStreamV2: React.FC = (props) => {
  const { publicKey, connected } = useWallet();
  const { dispatch, callConnectOwner, callDisconnectOwner } = useOwnerData();
  const [isConnectingToOwner, setIsConnectingToOwner] = useState(false);

  const [member_daos, setMemberDAOs] = useState<Array<pic.Dao>>([]);
  const [member_dao_ids, setMemberDaoIds] = useState<string[]>([]);
  const [selected_member_dao, setSelectedMemberDAO] = useState<pic.Dao>();
  const [show_modal, setShowModal] = useState(-1);
  const [refresh, setRefresh] = useState(false);
  const [select_dao_id, setSelectDaoId] = useState<string>();
  const [selected_stream, setSelectedStream] = useState<undefined | any>();
  const wallet = useAnchorWallet();
  const { owner } = useOwnerData();
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
  console.log("===================");
  useEffect(() => {
    (async () => {
      try {
        if (connected) {
          setIsConnectingToOwner(true);
          const newOwner: pic.Owner = { address: publicKey };
          callConnectOwner(dispatch, newOwner).then(() => {
            setIsConnectingToOwner(false);
          });

          if (dao_store.streams?.length > 0) {
            setSelectedStream(dao_store.streams[0]);
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
        console.log("refresh clicked-", refresh);
      } else {
        callDisconnectOwner(dispatch);
      }
    })();
  }, [refresh]);

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
    setShowModal(-1);
    setRefresh(!refresh);
  };

  const onClickRefresh = async () => {
    setRefresh(!refresh);
  };

  return (
    <div className="tokenstreamv2-main">
      <div className="stream-title">Token Streams</div>

      <div className="stream-content">
        <div className="stream-content-center">
          <div className="stream-info-summary">
            <div className="stream-summary-content">
              <div className="each-dao-info">
                <div className="stream-item">Stream Rate</div>
                <div className="dao-summary-value">
                  {selected_stream ? selected_stream.daily_stream_rate : ""}
                  <div className="unit-color">
                    {" "}
                    {selected_stream ? selected_stream.token_ticker : ""}
                  </div>
                </div>
                <div className="dao-summary-percent">&nbsp;</div>
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
                <div className="dao-summary-percent">&nbsp;</div>
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
                <div className="dao-summary-percent">&nbsp;</div>
              </div>
              <div className="each-dao-info">
                <div className="stream-item">Current Pool Amount</div>
                <div className="dao-summary-value">
                  {selected_stream ? selected_stream.current_pool_amount : ""}
                  <div className="unit-color">
                    {" "}
                    {selected_stream ? selected_stream.token_ticker : ""}
                  </div>
                </div>
                <div className="dao-summary-percent">&nbsp;</div>
              </div>
              <div className="each-dao-info">
                <div className="stream-item">Total NFTs Staked</div>
                <div className="dao-summary-value">
                  {selected_stream ? owner.nfts?.length : ""}
                  <div className="unit-color">
                    {" "}
                    {selected_stream
                      ? owner.nfts?.length > 1
                        ? "NFTs"
                        : "NFT"
                      : ""}
                  </div>
                </div>
                <div className="dao-summary-percent">
                  + {staked_percent_nft} %
                </div>
              </div>
            </div>
          </div>
          <div className="card-content">
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
    </div>
  );
};
export default TokenStreamV2;
