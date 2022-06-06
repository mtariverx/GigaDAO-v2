import "./style.scss";
const DAODetailModal = (props) => {

  return (
    <div id="open-modal" className="modal-window">
      <div className="modal-main">
        <div className="back-dashboard" onClick={props.onClick}>&lt;- Back</div>
        {props.children}
      </div>
    </div>
  );
};
export default DAODetailModal;
