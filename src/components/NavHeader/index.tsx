import "./style.scss";
import Button from "components/common/Button";
import Giga_logo from "img/icons/gigadao-full-brand-cropped.png";
import Profile from "img/icons/profile.png";
import { ConnectWalletNavButton } from "../ConnectWalletNavButton";
import IconButton from "components/common/IconButton";

const NavHeader: React.FC= (props) => {
  const onLaunchProfile = () => {
    alert("Coming soon");
    return;
  };
  return(
    <div className="nav-header">
        <div className="top-log">
          <img src={Giga_logo} alt="Solana Explorer" />
        </div>
        <div className="top-nav-right">
          <Button btn_type="common" btn_title="Dashboard" />
          <ConnectWalletNavButton />
          <div onClick={onLaunchProfile}>
            <IconButton icon_img={Profile} background="unfill" />
          </div>
        </div>
      </div>
  )
}
export default NavHeader;