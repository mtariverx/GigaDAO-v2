import Discord from "img/icons/discord_logo_icon_1.png";
import Twitter from "img/icons/twitter.png";
import ME_logo from "img/icons/ME_Logo.png";
import Github from "img/icons/github.png";
import IconButton from "components/common/IconButton";
import "./style.scss";
const SocialFooter: React.FC=(props)=>{
  const onLaunchStaking = () => {
    window.open("https://staking.gigadao.io");
    return;
  };
  const onLaunchDiscord = () => {
    window.open("https://discord.gg/p69tx7wMn7");
    return;
  };
  const onLaunchTwitter = () => {
    window.open("https://twitter.com/GigaDAOio");
    return;
  };
  const onLaunchGithub = () => {
    alert("Coming soon");
    return;
  };
  const onLaunchME = () => {
    window.open("https://magiceden.io/marketplace/peachfunlootbox");
    return;
  };
  return(
    <div className="social-footer">
        <div className="bottom-social-group">
          <div className="social-icon" onClick={onLaunchDiscord}>
            <IconButton
              icon_img={Discord}
              background="social_unfill"
              onClick={onLaunchDiscord}
            />
          </div>
          <div className="social-icon" onClick={onLaunchTwitter}>
            <IconButton icon_img={Twitter} background="social_unfill" />
          </div>
          <div className="social-icon" onClick={onLaunchGithub}>
            <IconButton icon_img={Github} background="social_unfill" />
          </div>
          <div className="social-icon" onClick={onLaunchME}>
            <IconButton icon_img={ME_logo} background="social_unfill" />
          </div>
        </div>
      </div>
  )
}
export default SocialFooter
