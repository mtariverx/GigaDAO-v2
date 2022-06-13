import "./style.scss";
type props_button = {
  icon_img: string;
  background: boolean;
  onClick: () => void;
};

const IconButton = (props) => {
  const { icon_img, background } = props;
  const onClick = props.onClick;
  return (
    <div className={`btn-${background}`} onClick={onClick}>
      <img src={icon_img} />
    </div>
  );
};
export default IconButton;
