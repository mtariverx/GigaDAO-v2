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
const TokenStream = (props) => {

  const { dao } = props;
  const [is_stream, setStream] = useState(1);
  const [pool_name, setPoolName] = useState<string>();
  const [token_mint_address, setTokenMintAddress] = useState<string>();
  const [token_ticker, setTokenTicker] = useState<string>();
  const [token_img_url, setTokenImgUrl] = useState<string>();
  const [stream_rate, setStreamRate] = useState<number>();
  const [collections, setCollections] = useState<string[]>([]);
  const [num_connections, setNumCollections] = useState(0);
  const [collect, setCollect] = useState<string>();

  const [selected_dao, setSelectedDao] = useState<pic.Dao>();
  const [stream_compensate_arr, setStreamCompensateArr] = useState<string[]>(
    []
  );
 const wallet = useAnchorWallet();
  useEffect(() => {
    setSelectedDao({ ...dao });
    setStreamCompArr();
  }, []);

  const table_rows = 10;
  const changeCollections = (index: number) => (value: string) => {
    const temp = [...collections];
    temp[index] = value;
    setCollections(temp);
  };
  const onAddCollections = async () => {
    const temp = [...collections];
    let flag=true;
    //  let flag = await validateSolanaAddress(collect);
    if (flag) {
      if(!temp.includes(collect)){
        temp.push(collect);
        setCollections(temp);
      } else {
        alert("The collection address is duplicated");
      }
    }
    setCollect("");
  };

  const setStreamCompArr = () => {
    const remain_rows = dao.streams
      ? dao.streams.length >= table_rows
        ? 0
        : table_rows - dao.streams.length
      : table_rows;
    let tmp_stream: string[] = [];
    for (let i = 0; i < remain_rows; i++) {
      tmp_stream.push("tmp_stream");
    }
    setStreamCompensateArr(tmp_stream);
  };

  const streams = dao.streams;
  return (
    <div className="new-stream">
      
        <div className="pool-stream-table">
          <div className="table-container">
            <div className="table-title">Token Streams</div>
            <div className="table-content">
              <table>
                <tr>
                  <th>Pool Name</th>
                  <th>Pool Address</th>
                  <th>Active</th>
                  <th>Token Image Url</th>
                  <th>Stream Rate</th>
                  <th>Total Earned</th>
                  <th>Total Claimed</th>
                  <th>Current Pool Amount</th>
                  <th>Token Tickers</th>
                </tr>
                {selected_dao && selected_dao.streams
                  ? selected_dao.streams.map((stream) => {
                      return (
                        <tr>
                          <td>{stream.name}</td>
                          <td>{stream.address.toString()}</td>
                          <td>{stream.is_active.toString()}</td>
                          <td>{stream.token_image_url}</td>
                          <td>{stream.daily_stream_rate}</td>
                          <td>{stream.total_earned}</td>
                          <td>{stream.total_claimed}</td>
                          <td>{stream.current_pool_amount}</td>
                          <td>{stream.token_ticker}</td>
                        </tr>
                      );
                    })
                  : ""}
                {}
                {stream_compensate_arr.map((item) => {
                  return (
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  );
                })}
              </table>
            </div>
          </div>
         
        </div>
    </div>
  );
};

export default TokenStream;
