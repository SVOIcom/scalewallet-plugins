import {
    default as getProvider,
    PROVIDERS,
    UTILS
} from "https://everscale-connect.svoi.dev/everscale/0.1.3/getProvider.mjs";
import TIP4Collection from "https://everscale-connect.svoi.dev/everscale/contracts/TIP4Collection.mjs";
import CONSTS from "./consts.mjs";

window.getProvider = getProvider;
window.PROVIDERS = PROVIDERS;
window.UTILS = UTILS;

let EVER = null;
try {

    //Initialize provider
    EVER = await getProvider({
        network: 'main',
        networkServer: 'alwaysonlineevermainnode.svoi.dev'
    }, PROVIDERS.EverscaleWallet);
    await EVER.requestPermissions();
    await EVER.start();
} catch (e) {
    console.log(e);
    alert('Everscale connection error ' + e.message);
}
window.EVER = EVER;

let userAddress = window.userAddress = (await EVER.getWallet()).address;

/**
 * Collect user collections info
 * @param {string} userAddress
 * @param {array} collectionsList
 * @returns {Promise<{*}>}
 */
async function collectCollections(userAddress, collectionsList = CONSTS.NFT_COLLECTIONS_WHITELIST) {
    let collections = {};

    //Collecting collections
    for (let collection of collectionsList) {
        let tip4 = await (new TIP4Collection(EVER)).init(collection.address);

        let userCollection = {...await tip4.getTokenInfo(), ...collection};

        let userTokens = await tip4.getOwnerNfts(userAddress);

        userCollection.tokens = [];

        //Retrieve tokens information
        for (let token of userTokens) {
            let nft = await tip4.getNftByAddress(token);
            let info = await nft.getInfo();
            userCollection.tokens.push({address: token, ...info});
        }

        collections[userCollection.name] = userCollection;
    }

    return collections;
}

console.log(await collectCollections(userAddress));