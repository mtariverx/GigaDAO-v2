import { PlusIcon } from "components/common/icons/plus";
import { useEffect, useState } from "react";
import "./style.scss";
import "../common/LabelInput/style.scss";
import Plus_fill from "img/icons/plus_symbol_fill.png";

import * as pic from "../../pic/pic";
import * as simPic from "../../pic/sim";
import * as livePic from "../../pic/live";
import { Keypair, PublicKey } from "@solana/web3.js";
import Button from "components/common/Button";
import { validateSolanaAddress } from "components/CommonCalls";
import {
  sampleTokenStream1,
  sampleTokenStream2,
} from "pic/sim_data/sample-streams";
import { useAnchorWallet } from "providers/adapters/core/react";
import * as React from "react";
import { useSelector } from "react-redux";
import { DaoState } from "store/DaoReducer";
import { useDispatch, shallowEqual } from "react-redux";

const NewMultisigTreausry = (props) => {
  const [treasury_name, setTreasuryName] = useState<string>();
  const [token_mint_address, setTokenMintAddress] = useState<string>();
  const [token_ticker, setTokenTicker] = useState<string>();
  const [token_img_url, setTokenImgUrl] = useState<string>();

  const [selected_dao, setSelectedDao] = useState<pic.Dao>();
  const [stream_compensate_arr, setStreamCompensateArr] = useState<string[]>(
    []
  );
  const wallet = useAnchorWallet();

  const dispatch_state = useDispatch();
  const onSetDao = React.useCallback(
    (dao: pic.Dao) => dispatch_state({ type: "SET_DAO", payload: dao }),
    [dispatch_state]
  );
  const dao: pic.Dao = useSelector(
    (state: DaoState) => state.dao,
    shallowEqual
  );

  useEffect(() => {
    setSelectedDao({ ...dao });
  }, []);

  const table_rows = 10;

  const onClickMultisigTreasury = async () => {
    if ((await validateSolanaAddress(token_mint_address)) == false) {
      setTokenMintAddress("");
    }
    if (treasury_name && token_ticker && token_img_url && token_mint_address) {
      const key = Keypair.generate();
      let new_treasury: pic.Stream = {
        name: treasury_name,
        address: key.publicKey,
        dao_address: new PublicKey(dao.address),
        collections: [],
        num_connections: 0,
        token_image_url: token_img_url,
        daily_stream_rate: 0,
        total_earned: 0,
        total_claimed: 0,
        current_pool_amount: 0,
        token_ticker: token_ticker,
        last_update_timestamp: Math.floor(Date.now() / 1000),
        is_active: true,
        token_mint_address: new PublicKey(token_mint_address),
        stream_keypair: key,
      };

      await livePic.initializeStream(wallet, dao, new_treasury); //initializeStream
      setSelectedDao({ ...dao }); //setting dao with streams
      props.onClose(); //close btn
    }
  };

  const streams = dao.streams;
  return (
    <div className="new-stream">
      <div className="content-title">Create Multi-sig Treasury</div>
      <div className="stream-pool-content">
        <div className="stream-content">
          <div className="item-wrapper">
            <div className="title">Treasury Name</div>
            <input
              required
              value={treasury_name}
              onChange={(evt) => setTreasuryName(evt.target.value)}
            />
          </div>
          <div className="item-wrapper">
            <div className="title">Token Mint Address</div>
            <input
              required
              value={token_mint_address}
              onChange={(evt) => setTokenMintAddress(evt.target.value)}
            />
          </div>
          <div className="item-wrapper">
            <div className="title">Token Ticker</div>
            <input
              required
              value={token_ticker}
              onChange={(evt) => setTokenTicker(evt.target.value)}
            />
          </div>
          <div className="item-wrapper">
            <div className="title">Token Image URL</div>
            <input
              required
              value={token_img_url}
              onChange={(evt) => setTokenImgUrl(evt.target.value)}
            />
          </div>
        </div>
        <div className="stream-initial-btn">
          <Button
            btn_type="common"
            btn_title="Initialize Stream"
            onClick={onClickMultisigTreasury}
          />
        </div>
      </div>
    </div>
  );
};

export default NewMultisigTreausry;
