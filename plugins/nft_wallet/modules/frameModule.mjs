import {
    default as getProvider,
    PROVIDERS,
    UTILS
} from "https://everscale-connect.svoi.dev/everscale/0.1.3/getProvider.mjs";
import TIP4Collection from "https://everscale-connect.svoi.dev/everscale/contracts/TIP4Collection.mjs";
import CONSTS from "./consts.mjs";
import pluginUtils from "../../../lib/pluginUtils.mjs";

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

async function showCollections(collections) {
    let html = '';
    for (let collectionName in collections) {
        let collection = collections[collectionName];
        html += `
                <section class=" text-center container">
                    <div class="row align-items-center">
                        <div class="col-3">
                           <div>
                                <img src="${collection.preview?.source}" class="collectionImg">
                            </div>
                        </div>
                        <div class="col-7 align-middle">
                            <h1 class="fw-light collectionTitle">${collectionName}</h1>
                        </div>
                    </div>
                </section>
        `;
        html += `    <div class="album py-5 bg-light">
        <div class="container">

            <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
        `;

        for (let token of collection.tokens) {
            console.log(token);
            html += `
                <div class="col">
                    <div class="card shadow-sm">
                        <div>
                            <img src="${token.preview?.source}" class="tokenImage card-img"> 
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${token.name ? token.name : '#' + Number(token.id)}</h5>
                            <p class="card-text">${token?.description}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="btn-group">
                                    <button type="button" class="btn btn-sm btn-outline-secondary">Transfer</button>
                                  <!--  <button type="button" class="btn btn-sm btn-outline-secondary">Edit</button> -->
                                </div>
                                <small class="text-muted autoClipboard nftAddress" data-clipboard="${token.address}">${UTILS.shortenPubkey(token.address)}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        html += `    </div>
        </div>
    </div>`;
    }

    console.log(html);

    $('#pluginMain').html(html);
    $('.autoClipboard').click(pluginUtils.selfCopyElement());
}

let userCollections = await collectCollections(userAddress);

console.log(userCollections);

await showCollections(userCollections);