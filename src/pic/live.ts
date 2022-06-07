/*
Live implementation of PIC which get and sets data on the solana blockchain and our MirrorScan SQL Database
 */
import * as pic from "./pic";
import { PublicKey } from "@solana/web3.js";
import * as mirror from "./live_utils/mirror_helpers";
import * as chain from "./live_utils/onchain-data-helpers";
import { StakeAccountStatus } from "./live_utils/onchain-data-helpers";
import * as rpc from "./live_utils/rpc_helpers";
import { NETWORK } from "./connect";
import { useAnchorWallet, useWallet } from "providers/adapters/core/react";

export async function getDaoGovernanceFromChain(wallet, dao) {
  try {
    const _dao = await chain.getDaoFromChain(wallet, NETWORK, dao);
    return _dao;
  } catch (e) {
    console.log(e);
  }
}

// Mirror only calls
let connectOwner: pic.ConnectOwner = async (owner: pic.Owner) => {
  try {
    let result = await mirror.getOwner(owner.address.toString());
    if (result.success) {
      const data = result.data;
      // make collections
      if (data.collections?.length > 0) {
        let collections: Array<pic.Collection> = [];
        for (const collection of data.collections) {
          collections.push({
            address: new PublicKey(collection),
          });
        }
        owner.collections = collections;
      }

      if (data.daos?.length > 0) {
        let daos: Array<pic.Dao> = [];
        for (const dao of data.daos) {
          daos.push({
            address: new PublicKey(dao),
          });
        }
        owner.daos = daos;
      }

      if (data.nfts?.length > 0) {
        let nfts: Array<pic.Nft> = [];
        for (const nft of data.nfts) {
          let newNft: pic.Nft = {
            address: new PublicKey(nft.address),
            owner_address: owner.address,
            name: nft.nft_name,
            image_url: nft.image_url,
            collection: { address: nft.collection_address },
          };
          if (nft.token_account) {
            newNft.token_account = new PublicKey(nft.token_account);
          }
          if (nft.stake) {
            let newStake: pic.Stake = {
              address: new PublicKey(nft.stake.address),
              is_active: nft.stake.is_active,
              num_connections: nft.stake.num_connections,
            };
            newNft.stake = newStake;
          }
          nfts.push(newNft);
        }
        owner.nfts = nfts;
      }
    } else {
      alert(
        "Failed to get owner data from backend, support has be automatically notified.\n Please check your interent connection."
      );
    }
    mirror
      .forceSyncStakes(owner.address.toString())
      .then((result) => {
        console.log("forced state sync with res: ", result);
      })
      .catch((err) => {
        console.log("failed to force state sync with err: ", err);
      });
    return owner;
  } catch (err) {
    console.log(err);
  }
};
// return dao with streams
let getDaos: pic.GetDaos = async (daos: Array<pic.Dao>) => {
    try {
    let initializedDaos = [];
    for (const dao of daos) {
      if (dao.address) {
        initializedDaos.push(dao);
      } else {
        dao.streams = [];
      }
    }
    if (initializedDaos.length === 0) {
      return daos;
    }

    let result = await mirror.getDaoStreams(initializedDaos);
    if (result.success) {
      const streamMap: { string: Array<any> } = result.data; //{"ab":["c","d"]}
      for (const [daoAddress, streams] of Object.entries(streamMap)) {
        let matches = daos.filter(
          (dao, _) => dao.address?.toString() === daoAddress
        );
        if (matches.length !== 1) {
          alert(
            "Multiple matches found in DAO array, this should not happen, support has been automatically notified."
          );
          matches.map((item) =>
            console.log("matches=", item.address.toString())
          );
        } else {
          let dao = matches[0];
          dao.streams = [];
          for (const stream of streams) {
              let collections: Array<pic.Collection> = [];
              if (stream.collections?.length > 0) {
                for (const collection_address of stream.collections) {
                  collections.push({
                    address: new PublicKey(collection_address),
                  });
                }
              }

              console.log(
                `got stream ${stream.name} with total_earned: ${stream.total_earned}, is_active: ${stream.is_active}`
              );

              let totalStreamed;
              if (stream.is_active) {
                const lastUpdateTimestamp = stream.last_update_timestamp;
                const elapsedSeconds = Date.now() / 1000 - lastUpdateTimestamp;
                const ratePerConnPerSec =
                  stream.daily_stream_rate / 24 / 60 / 60;
                const recentlyEarned =
                  elapsedSeconds * ratePerConnPerSec * stream.num_connections;
                totalStreamed = stream.total_earned + recentlyEarned; //NOTE: might want to add in check here for would-be-inactive stream...
              } else {
                totalStreamed = stream.total_earned;
              }

              let newStream: pic.Stream = {
                confirmed:stream.confirmed,
                address: new PublicKey(stream.address),
                dao_address: dao.address,
                collections: collections,
                num_connections: stream.num_connections,
                is_active: stream.is_active,
                name: stream.name,
                token_image_url: stream.token_image_url,
                daily_stream_rate: stream.daily_stream_rate,
                total_earned: totalStreamed,
                total_claimed: 0,
                current_pool_amount: 0,
                token_ticker: stream.token_ticker,
                last_update_timestamp: stream.last_update_timestamp,
              };
              dao.streams.push(newStream);
          }
        }
      }
    } else {
      alert(
        "Failed to retrieve latest stream data for daos, support has been automatically notified."
      );
    }
  } catch (e) {
    displayError(e);
  }
  return daos;
};

let refreshNft: pic.RefreshNft = async (nft: pic.Nft) => {
  let wallet = nft.wallet;
  let network = nft.network;
  let ownerAddress = nft.owner_address;
  let nftMint = nft.address;
  let finalResult = { nft: undefined };
  try {
    let stakeExistanceResult = await chain.checkIfStakeExists(
      nft,
      wallet,
      network,
      ownerAddress,
      nftMint
    );
    let stakeAccountStatus: StakeAccountStatus =
      stakeExistanceResult.stakeAccountStatus;
    if (stakeAccountStatus === StakeAccountStatus.NOT_INITIALIZED) {
      nft.stake = undefined;
      finalResult.nft = nft;
    } else if (
      stakeAccountStatus === StakeAccountStatus.INITIALIZED_NOT_ACTIVE
    ) {
      nft.stake = {
        address: stakeExistanceResult.stakeAddress,
        num_connections: 0,
        is_active: false,
      };
      finalResult.nft = nft;
    } else if (
      stakeAccountStatus === StakeAccountStatus.INITIALIZED_AND_ACTIVE
    ) {
      nft.stake = {
        address: stakeExistanceResult.stakeAddress,
        num_connections: stakeExistanceResult.numConnections,
        is_active: true,
      };
      finalResult.nft = nft;
    }
  } catch (e) {
    console.log(e);
  }
  mirror
    .forceSyncStakes(nft.owner_address.toString())
    .then((result) => {
      console.log("forced state sync with res: ", result);
    })
    .catch((err) => {
      console.log("failed to force state sync with err: ", err);
    });
  return finalResult;
};

let stakeNft: pic.StakeNFT = async (nft: pic.Nft) => {
  let finalResult = { nft: undefined };

  try {
    let wallet = nft.wallet;
    let network = nft.network;
    let ownerAddress = nft.owner_address;
    let senderNftAccount = nft.token_account;
    let nftMint = nft.address;

    let stakeExistanceResult = await chain.checkIfStakeExists(
      nft,
      wallet,
      network,
      ownerAddress,
      nftMint
    );

    console.log("got stake existence result: ", stakeExistanceResult);

    let stakeAddress = stakeExistanceResult.stakeAddress;
    let stakeAccountStatus: StakeAccountStatus =
      stakeExistanceResult.stakeAccountStatus;

    if (stakeAccountStatus === StakeAccountStatus.NOT_INITIALIZED) {
      let result = await mirror.insertNewStake(
        stakeAddress,
        ownerAddress,
        nft.address
      );
      console.log("got mirror.insertNewStake with result: ", result);
      try {
        stakeAddress = await rpc.initializeStakeAndStake(
          wallet,
          network,
          nftMint,
          senderNftAccount,
          ownerAddress
        );
        let newStake: pic.Stake = {
          address: stakeAddress,
          is_active: true,
          num_connections: 0,
        };
        nft.stake = newStake;
        finalResult.nft = nft;
        mirror
          .updateStake(stakeAddress, true, 0)
          .then((result) => {
            console.log(`got result from mirror.insertNewStake: ${result}`);
            console.log(result);
          })
          .catch((err) => {
            console.log(`got result from mirror.insertNewStake: ${err}`);
            console.log(err);
          });
      } catch (e) {
        console.log("got error: ", e);
      }
    } else if (
      stakeAccountStatus === StakeAccountStatus.INITIALIZED_NOT_ACTIVE
    ) {
      try {
        let result = await rpc.stakeNft(
          wallet,
          network,
          nftMint,
          senderNftAccount,
          ownerAddress
        );
        console.log("got stakeNft rpc with result: ", result);
        let newStake: pic.Stake = {
          address: stakeAddress,
          is_active: true,
          num_connections: 0,
        };
        nft.stake = newStake;
        finalResult.nft = nft;
        mirror
          .updateStake(stakeAddress, true, 0)
          .then((result) => {
            console.log(`got result from mirror.insertNewStake:`);
            console.log(result);
          })
          .catch((err) => {
            console.log(`got result from mirror.insertNewStake: ${err}`);
            console.log(err);
          });
      } catch (e) {
        console.log("got error: ", e);
      }
    } else if (
      stakeAccountStatus === StakeAccountStatus.INITIALIZED_AND_ACTIVE
    ) {
      console.log("stake is already active");
      let newStake: pic.Stake = {
        address: stakeAddress,
        is_active: true,
        num_connections: stakeExistanceResult.numConnections,
      };
      nft.stake = newStake;
      finalResult.nft = nft;
      mirror
        .updateStake(stakeAddress, true, stakeExistanceResult.numConnections)
        .then((result) => {
          console.log(`got result from mirror.insertNewStake:`);
          console.log(result);
        })
        .catch((err) => {
          console.log(`got result from mirror.insertNewStake: ${err}`);
          console.log(err);
        });
    }
  } catch (e) {
    console.log(e);
  }

  return finalResult;
};

let updateStreamAndConnection: pic.UpdateStreamAndConnection = async (
  nft: pic.Nft,
  stream: pic.Stream
) => {
  let finalResult = { nft: undefined, stream: undefined, conn: undefined };
  try {
    stream = await chain.getStream(nft.wallet, nft.network, stream);
    finalResult.stream = stream;

    let stakeResult = await chain.getStake(nft.wallet, nft.network, nft.stake);
    nft.stake = stakeResult.stake;

    let connection: pic.Connection | undefined =
      await chain.checkIfConnectionExists(
        nft.wallet,
        nft.network,
        nft.stake.address,
        stream.address,
        stream.decimals,
        stream.daily_stream_rate
      );

    if (connection) {
      finalResult.conn = connection;
    }

    // set nft last to ensure that we got all the info we needed from the network
    finalResult.nft = nft;
    const confirmed = true; //Kaiming
    mirror
      .updateStream(
        stream.address,
        stream.is_active,
        stream.num_connections,
        stream.total_earned,
        stream.last_update_timestamp,
        confirmed
      )
      .catch((err) => {
        console.log("error update stream: " + err);
      });
    mirror
      .updateStake(
        nft.stake.address,
        nft.stake.is_active,
        stakeResult.numConnections
      )
      .catch((err) => {
        console.log("error updating State in mirror: " + err);
      });
  } catch (e) {
    console.log("inside of updateStream and Connection");
    console.log(e);
  }
  return finalResult;
};

let connectToStream: pic.ConnectToStream = async (
  nft: pic.Nft,
  stream: pic.Stream
) => {
  let finalResult = { nft: undefined, conn: undefined, stream: undefined };
  try {
    let existingConnection: pic.Connection | undefined =
      await chain.checkIfConnectionExists(
        nft.wallet,
        NETWORK,
        nft.stake.address,
        stream.address,
        stream.decimals,
        stream.daily_stream_rate
      );
    if (!existingConnection) {
      let connectionAddress = await rpc.initializeConnectionAndConnect(
        nft.wallet,
        nft.network,
        stream.address,
        nft.address,
        nft.owner_address
      );
      finalResult.conn = {
        address: connectionAddress,
        stream_address: stream.address,
        total_earned: 0,
        total_claimed: 0,
        is_active: true,
        last_update_timestamp: Math.floor(Date.now() / 1000),
      };
      nft.stake.num_connections += 1;
      stream.num_connections += 1;
      finalResult.stream = stream;
      finalResult.nft = nft;
    } else {
      if (existingConnection.is_active) {
        finalResult.conn = existingConnection;
        finalResult.stream = await chain.getStream(
          nft.wallet,
          nft.network,
          stream
        );
        const stakeResult = await chain.getStake(
          nft.wallet,
          nft.network,
          nft.stake
        );
        nft.stake = stakeResult.stake;
        finalResult.nft = nft;
      } else {
        let result = await rpc.connectToStream(
          nft.wallet,
          NETWORK,
          stream.address,
          nft.address,
          nft.owner_address,
          existingConnection.address
        );
        console.log("connected to stream with result: ", result);
        finalResult.conn = {
          address: existingConnection.address,
          stream_address: stream.address,
          total_earned: 0,
          total_claimed: 0,
          is_active: true,
          last_update_timestamp: Math.floor(Date.now() / 1000),
        };
        stream.num_connections += 1;
        nft.stake.num_connections += 1;
        finalResult.stream = stream;
        finalResult.nft = nft;
      }
    }
    const confirmed = true;
    chain.getStream(nft.wallet, nft.network, stream).then((newStream) => {
      mirror
        .updateStream(
          newStream.address,
          newStream.is_active,
          newStream.num_connections,
          newStream.total_earned,
          newStream.last_update_timestamp,
          confirmed
        )
        .catch((err) => {
          console.log("error update stream: " + err);
        });
    });
    mirror
      .updateStake(
        nft.stake.address,
        nft.stake.is_active,
        nft.stake.num_connections
      )
      .catch((err) => {
        console.log("error updating State in mirror: " + err);
      });
  } catch (e) {
    console.log(e);
  }
  return finalResult;
};

let claimFromStream: pic.ClaimFromStream = async (
  nft: pic.Nft,
  stake: pic.Stake,
  conn: pic.Connection,
  stream: pic.Stream
) => {
  let finalResult = { conn: undefined, stream: undefined };
  try {
    let result = await rpc.claimTokensFromStream(
      conn.wallet,
      NETWORK,
      stream.address,
      stream.dao_address,
      nft.owner_address,
      stake.address,
      conn.address
    );
    console.log("claimed from stream with result: ", result);
    finalResult.stream = await chain.getStream(nft.wallet, nft.network, stream);
    finalResult.conn = await chain.getConn(
      nft.wallet,
      nft.network,
      conn,
      stream.decimals
    );
    const confirmed = true;
    mirror
      .updateStream(
        finalResult.stream.address,
        finalResult.stream.is_active,
        finalResult.stream.num_connections,
        finalResult.stream.total_earned,
        finalResult.stream.last_update_timestamp,
        confirmed
      )
      .catch((err) => {
        console.log("err udpating stream: " + err);
      });
    mirror
      .updateConnection(finalResult.conn.address, finalResult.conn.is_active)
      .catch((err) => {
        console.log("err updating conn: " + err);
      });
  } catch (e) {
    console.log(e);
  }
  return finalResult;
};

let disconnectFromStream: pic.DisconnectFromStream = async (
  nft: pic.Nft,
  conn: pic.Connection,
  stream: pic.Stream
) => {
  let finalResult = { nft: undefined, conn: undefined, stream: undefined };

  try {
    let result = await rpc.disconnectFromStream(
      nft.wallet,
      NETWORK,
      stream.address,
      nft.address,
      nft.owner_address,
      nft.stake.address,
      conn.address,
      stream.dao_address
    );
    console.log("disconnected from stream with result: ", result);
    nft.stake.num_connections -= 1;
    stream.num_connections -= 1;

    finalResult.nft = nft;
    finalResult.stream = stream;
    const confirmed = true;
    chain.getStream(nft.wallet, nft.network, stream).then((newStream) => {
      mirror
        .updateStream(
          newStream.address,
          newStream.is_active,
          newStream.num_connections,
          newStream.total_earned,
          newStream.last_update_timestamp,
          confirmed
        )
        .catch((err) => {
          console.log("err udpating stream: " + err);
        });
    });
    mirror
      .updateStake(
        nft.stake.address,
        nft.stake.is_active,
        nft.stake.num_connections
      )
      .catch((err) => {
        console.log("err updating conn: " + err);
      });
  } catch (e) {
    console.log(e);
  }

  return finalResult;
};

let unstakeNft: pic.UnstakeNft = async (nft: pic.Nft) => {
  let finalResult = { nft: undefined };
  try {
    let nftTokenAccount = await rpc.unstakeNft(
      nft.wallet,
      NETWORK,
      nft.owner_address,
      nft.stake.address,
      nft.address
    );
    console.log("got rpc.unstakeNft with ata: ", nftTokenAccount.toString());
    nft.stake.is_active = false;
    nft.stake.num_connections = 0;
    nft.token_account = nftTokenAccount;
    finalResult.nft = nft;
    mirror.updateStake(nft.stake.address, false, 0).catch((err) => {
      console.log("error update stake: " + err);
    });
  } catch (e) {
    console.log(e);
  }
  return finalResult;
};

let getMemberDaos: pic.GetMemberDaos = async (owner: pic.Owner, wallet) => {
  //getting member daos from database if the owner address is a councillor of
  try {
    const result = await mirror.getMembers(owner.address.toString()); //get dao address lists from councillor tables
    //getting daos if the owner has daos
    const new_owner = await connectOwner(owner);

    let dao_addresses = []; //combination of daos belong to the owner and daos where the pubkey is a councillor of.
    if (result.success) {
      if (result.data.dao_addresses) {
        dao_addresses = dao_addresses.concat(result.data.dao_addresses);
      }
    } else {
      console.log(
        "Error in fetching daos from getMemberDaos from councillor table"
      );
    }
    if (new_owner.daos) {
      for (const dao of new_owner.daos) {
        if (!dao_addresses.includes(dao.address.toString())) {
          dao_addresses.push(dao.address.toString());
        } else {
          // alert("You have multiple daos with same address");
        }
      }
    }
    const new_daos: Array<pic.Dao> = dao_addresses.map((dao_address) => {
      let dao: pic.Dao = { address: new PublicKey(dao_address) };
      return dao;
    });
    const dao_verified = [];

    let promises = [];
    let daos_unconfirmed = [];
    for (const dao of new_daos) {
      promises.push(mirror.getDaoById(dao.address.toString()));
    }

    let results = await Promise.allSettled(promises);
    let index = -1;
    for (const dao_promise of results) {
      index++;
      if (
        dao_promise.status === "fulfilled" &&
        dao_promise.value.success &&
        dao_promise.value.data[0]?.confirmed
      ) {
        new_daos[index].dao_id = dao_promise.value.data[0].dao_id;
        new_daos[index].display_name = dao_promise.value.data[0].display_name;
        new_daos[index].image_url = dao_promise.value.data[0].image_url;
        new_daos[index].num_nfts = dao_promise.value.data[0].num_nfts;
        new_daos[index].confirmed = dao_promise.value.data[0].confirmed;
        dao_verified.push(new_daos[index]);
      } else if (
        dao_promise.status === "fulfilled" &&
        dao_promise.value.success &&
        dao_promise.value.data[0]?.confirmed == false
      ) {
        // try {
        await chain
          .checkIfDaoOnChain(wallet, NETWORK, new_daos[index])
          .then((_dao) => {
            let dao: pic.Dao = {
              address: new_daos[index].address,
              dao_id: dao_promise.value.data[0].dao_id,
              display_name: dao_promise.value.data[0].display_name,
              image_url: dao_promise.value.data[0].image_url,
              num_nfts: dao_promise.value.data[0].num_nfts,
              confirmed: true,
            };
            daos_unconfirmed.push(dao);
            dao_verified.push(dao);
          })
          .catch((err) => {
            displayError(err);
          });
      }
    }

    let promises_unconfirmed = [];
    for (const dao_unconfirmed of daos_unconfirmed) {
      promises_unconfirmed.push(mirror.updateDao(dao_unconfirmed));
    }
    Promise.allSettled(promises_unconfirmed).then((results) =>
      results.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.data.status === "SUCCESS"
        ) {
          console.log("updating dao in db is succeeded");
        } else {
          console.log("updating dao in db is failed");
        }
      })
    );
    return dao_verified;
  } catch (err) {
    displayError(err);
  }
};

let initializeDao: pic.InitializeDao = async (wallet, dao: pic.Dao) => {
  try {
    await mirror
      .initializeDAO(dao)
      .then((result) => console.log("insert dao result=", result));
    await mirror
      .insertCouncillors(dao)
      .then((result) => console.log("insert councillors result=", result));
    await rpc
      .initializeDAO(wallet, NETWORK, dao)
      .then((result) => alert("Initializing dao in onchain was success!")); //calls for onchain
  } catch (err) {
    displayError(err);
  }

  return dao;
};

let initializeStream: pic.InitializeStream = async (
  wallet,
  dao: pic.Dao,
  stream: pic.Stream
) => {
  try {
    await mirror
      .insertNewStream(stream)
      .then((result) => alert("Initializing stream in database was success!"));
    await rpc
      .initializeStream(wallet, NETWORK, dao, stream)
      .then((result) => alert("Initializing stream in onchain was success!"));
  } catch (err) {
    displayError(err);
  }
  return { dao, stream };
};

export async function checkIfStreamOnChain(wallet, dao) {
  try {
    let promises = [];
    let new_dao={...dao, streams:[]};
    for (const stream of dao.streams) {
      if(stream.confirmed){
        new_dao.streams.push(stream);
      } else {
        promises.push(chain.getStream(wallet, NETWORK, stream));
      }
    }

    let results = await Promise.allSettled(promises);
    let stream_unconfirmed = [];
    const confirmed = true;
    for (const result of results) {
      if (result.status === "fulfilled") {
        let stream=result.value;
        stream_unconfirmed.push(
          mirror.updateStream(
            stream.address,
            stream.is_active,
            stream.num_connections,
            stream.total_earned,
            stream.last_update_timestamp,
            confirmed,
          )
        );
      }
    }

    Promise.allSettled(stream_unconfirmed).then((results) =>
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.success) {
          console.log(result);
          console.log("updating stream in db is succeeded");
        } else {
          console.log("updating stream in db is failed");
        }
      })
    );
  } catch (e) {
    console.log(e);
  }
}
//check later
export async function getConfirmedStream(daos) {
  try {
    let initializedDaos = [];
    for (const dao of daos) {
      if (dao.address) {
        initializedDaos.push(dao);
      } else {
        dao.streams = [];
      }
    }
    if (initializedDaos.length === 0) {
      return daos;
    }

    let result = await mirror.getDaoStreams(initializedDaos);
    if (result.success) {
      const streamMap: { string: Array<any> } = result.data; //{"ab":["c","d"]}
      for (const [daoAddress, streams] of Object.entries(streamMap)) {
        let matches = daos.filter(
          (dao, _) => dao.address?.toString() === daoAddress
        );
        if (matches.length !== 1) {
          alert(
            "Multiple matches found in DAO array, this should not happen, support has been automatically notified."
          );
          matches.map((item) =>
            console.log("matches=", item.address.toString())
          );
        } else {
          let dao = matches[0];
          dao.streams = [];
          for (const stream of streams) {
            if (stream.confirmed) {
              let collections: Array<pic.Collection> = [];
              if (stream.collections?.length > 0) {
                for (const collection_address of stream.collections) {
                  collections.push({
                    address: new PublicKey(collection_address),
                  });
                }
              }

              console.log(
                `got stream ${stream.name} with total_earned: ${stream.total_earned}, is_active: ${stream.is_active}`
              );

              let totalStreamed;
              if (stream.is_active) {
                const lastUpdateTimestamp = stream.last_update_timestamp;
                const elapsedSeconds = Date.now() / 1000 - lastUpdateTimestamp;
                const ratePerConnPerSec =
                  stream.daily_stream_rate / 24 / 60 / 60;
                const recentlyEarned =
                  elapsedSeconds * ratePerConnPerSec * stream.num_connections;
                totalStreamed = stream.total_earned + recentlyEarned; //NOTE: might want to add in check here for would-be-inactive stream...
              } else {
                totalStreamed = stream.total_earned;
              }

              let newStream: pic.Stream = {
                confirmed:stream.confirmed,
                address: new PublicKey(stream.address),
                dao_address: dao.address,
                collections: collections,
                num_connections: stream.num_connections,
                is_active: stream.is_active,
                name: stream.name,
                token_image_url: stream.token_image_url,
                daily_stream_rate: stream.daily_stream_rate,
                total_earned: totalStreamed,
                total_claimed: 0,
                current_pool_amount: 0,
                token_ticker: stream.token_ticker,
                last_update_timestamp: stream.last_update_timestamp,
              };
              dao.streams.push(newStream);
            }
          }
        }
      }
    } else {
      alert(
        "Failed to retrieve latest stream data for daos, support has been automatically notified."
      );
    }
  } catch (e) {
    console.log(e);
  }
  console.log("confirmed dao=",daos);
  return daos;
}
export function displayError(err) {
  if (
    err.message
      .toLowerCase()
      .includes("Transaction was not confirmed in".toLowerCase())
  ) {
    alert("Transaction was not confirmed in 30s");
  } else if (
    err.message
      .toLowerCase()
      .includes(
        "failed to send transaction: Transaction simulation failed: Error processing Instruction 0: custom program error: 0x1".toLocaleLowerCase()
      )
  ) {
    alert("Insufficient funds");
  } else if (
    err.message
      .toLowerCase()
      .includes("Signature verification failed".toLowerCase())
  ) {
    alert("Signature verification failed");
  } else if (
    err.message
      .toLowerCase()
      .includes("Max supported stream rate exceeded".toLowerCase())
  ) {
    alert("Max supported stream rate exceeded");
  } else if (
    err.message
      .toLowerCase()
      .includes(" Proposal is not active".toLowerCase())
  ) {
    alert("Proposal is not active");
  } else {
    //TODO if transaction is failed, delete the stream in database.
    // alert(err);
    console.log("err.message=", err.message);
    // alert(err.message);
  }
 
}
//writing calls
export async function proposeDaoCommand(wallet, dao) {
  await rpc
    .proposeDaoCommand(wallet, NETWORK, dao)
    .then(() => alert("Proposing dao command was success!"))
    .catch((err) => displayError(err));
}
export async function approveDaoCommand(wallet, dao) {
  await rpc
    .approveDaoCommand(wallet, NETWORK, dao)
    .then(() => alert("approveDaoCommand was success!"))
    .catch((err) => displayError(err));
}

export async function executeUpdateDaoMultisig(wallet, dao) {
  await rpc
    .executeUpdateDaoMultisig(wallet, NETWORK, dao)
    .then(() => alert("ExecuteUpdateDaoMultisig was success!"))
    .catch((err) => displayError(err));
}
export async function executeDeactivateStream(wallet, dao) {
  await rpc
    .executeDeactivateStream(wallet, NETWORK, dao)
    .then(() => alert("executeDeactivateStream was success!"))
    .catch((err) => displayError(err));
}
export async function executeWithdrawFromStream(wallet, dao) {
  await rpc
    .executeWithdrawFromStream(wallet, NETWORK, dao)
    .then(() => alert("executeWithdrawFromStream was success!"))
    .catch((err) => displayError(err));
}

export {
  connectOwner,
  getDaos,
  stakeNft,
  unstakeNft,
  connectToStream,
  disconnectFromStream,
  claimFromStream,
  updateStreamAndConnection,
  refreshNft,
  getMemberDaos,
  initializeDao,
  initializeStream,
};
