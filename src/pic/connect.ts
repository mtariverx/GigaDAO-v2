import * as simPic from './sim';
import * as livePic from './live';
const IS_LIVE = true; // NOTE: change this two switch between live and sim mode
// export const NETWORK = " https://api.mainnet-beta.solana.com/";
export const NETWORK = "https://broken-falling-dew.solana-mainnet.quiknode.pro/2593467a7cd46abf29edb3da687386fd3c3b7f59/"
export const NETWORK_ADDITIONAL = "https://restless-muddy-bush.solana-mainnet.quiknode.pro/3179d6ee0c77c76dede825abc2c4222096378cb1/"
export const pic = (IS_LIVE) ? livePic : simPic;
