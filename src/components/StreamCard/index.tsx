import "./style.scss";
import * as pic from "pic/pic";
import { useEffect, useState } from "react";
import * as livePic from "../../pic/live";
import { useAnchorWallet } from "providers/adapters/core/react";

const StreamCard: React.FC<{
  setSelectedStream;
  stream;
  is_selected;
  setRefresh;
  refresh;
}> = (props) => {
  const [flag, setFlag] = useState(false);
  const wallet = useAnchorWallet();
  const onClickStream = (e) => {
    props.setSelectedStream(props.stream);
  };
  const onClickReactivateStream = (stream: pic.Stream) => {
    livePic.reactivateStream(wallet, stream);
    // props.stream.is_active=true;
    setFlag(!flag);
    props.setRefresh(!props.refresh);
  };
  useEffect(() => {}, [flag]);
  return (
    <div
      className={`streamcard-main ${
        props.is_selected ? "stream-card-border" : ""
      }`}
      onClick={(e) => onClickStream(e)}
    >
      <div className="stream-body">
        <div className="stream-img">
          <img src={props.stream.token_image_url} alt="Image undefined" />
        </div>
        <div className="stream-details">
          <div className="each-detail">
            <div className="detail-title">Stream Name</div>
            <div className="detail-info">{props.stream.name}</div>
          </div>
          <div className="each-detail">
            <div className="detail-title">Stream Address</div>
            <div className="detail-info">{props.stream.address.toString()}</div>
          </div>
          <div className="each-detail">
            <div className="detail-title">Pool Address</div>
            <div className="detail-info">
              {props.stream.token_pool_address.toString()}
            </div>
          </div>
          <div className="each-detail">
            <div className="detail-title">Active</div>
            <div className="detail-info">
              <div className="active-info">
                <div className="active-status">
                  {props.stream.is_active ? "Yes" : "No"}
                </div>
                {!props.stream.is_active ? (
                  <div
                    className="reactivate-btn"
                    onClick={() => onClickReactivateStream(props.stream)}
                  >
                    Reactivate
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
          <div className="each-detail">
            <div className="detail-title-collection">Collections</div>
            <div className="show-collections">
              {props.stream.collections != undefined
                ? props.stream.collections.map((item, index) => (
                    <div className="item">{item.address.toString()}</div>
                  ))
                : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamCard;
