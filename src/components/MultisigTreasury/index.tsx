import { PlusIcon } from "components/common/icons/plus";
import { useEffect, useState } from "react";
import "./style.scss";
import "../common/LabelInput/style.scss";
import Plus_fill from "img/icons/plus_symbol_fill.png";

import * as pic from "pic/pic";
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
import { NETWORK } from "pic/connect";
import * as chain from "../../pic/live_utils/onchain-data-helpers";

// import * as FileSaver from "file-saver";
// import * as XLSX from "xlsx";

const MultisigTreausry = (props) => {
  // const { dao } = props;
  const [selected_dao, setSelectedDao] = useState<pic.Dao>();
  const [stream_compensate_arr, setStreamCompensateArr] = useState<string[]>(
    []
  );
  const [streams, setStreams] = useState<Array<pic.Stream>>();
  // const [flag, setFlag] = useState(true);
  const dispatch_state = useDispatch();
  const onSetDao = React.useCallback(
    (dao: pic.Dao) => dispatch_state({ type: "SET_DAO", payload: dao }),
    [dispatch_state]
  );
  const dao: pic.Dao = useSelector(
    (state: DaoState) => state.dao,
    shallowEqual
  );
  const wallet = useAnchorWallet();
  useEffect(() => {
    (async () => {
      setSelectedDao({ ...dao });
      const streams = dao.streams ? getStreamsFiltered(dao.streams) : [];
      setStreams(streams);
      setStreamCompArr();
    })();
  }, []);
  // useEffect(() => {
  //   (async () => {
  //     setSelectedDao({ ...dao });
  //     const streams = getStreamsFiltered(dao.streams) ? dao.streams : [];
  //     let streams_filtered=[];
  //     setStreams(streams);
  //     setStreamCompArr();
  //     console.log("flag=", flag);
  //   })();
  // }, [flag]);

  const getStreamsFiltered = (streams: pic.Stream[]) => {
    let streams_filtered = [];
    for (const stream of streams) {
      console.log("streams=", streams);
      if (stream.daily_stream_rate == 0) {
        streams_filtered.push(stream);
      }
    }
    return streams_filtered;
  };
  const table_rows = 50;
  const tmp_arr = [];
  for (let i = 0; i < table_rows; i++) {
    tmp_arr.push("tmp");
  }

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

  return (
    <div className="new-stream">
      <div className="content-title">Treasury</div>
      {/* <div className="pool-stream-table"> */}
      <div className="table-container">
        <div className="table-content">
          <table>
            <tr>
              <th>Treasury Name</th>
              <th>Token Pool Address</th>
              <th>Token Image Url</th>
              <th>Current Pool Amount</th>
              <th>Token Tickers</th>
            </tr>
            {streams == undefined
              ? tmp_arr.map((item) => {
                  return (
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                  );
                })
              : ""}
            {streams != undefined
              ? streams.map((stream) => {
                  return (
                    <tr>
                      <td>{stream.name}</td>
                      {/* <td>{stream.address.toString()}</td> */}
                      <td>{stream.token_pool_address.toString()}</td>
                      {/* <td>{stream.is_active ? "Yes" : "No"}</td> */}
                      <td>{stream.token_image_url}</td>
                      <td>{stream.current_pool_amount}</td>
                      <td>{stream.token_ticker}</td>
                    </tr>
                  );
                })
              : ""}
            {stream_compensate_arr.map((item) => {
              return (
                <tr>
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
  );
};

export default MultisigTreausry;
