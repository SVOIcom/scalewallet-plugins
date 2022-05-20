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

let userAddress = (await EVER.getWallet()).address;

/**
 * Show address prompt modal
 * @returns {Promise<unknown>}
 */
function promptTransferAddress() {
    return new Promise((resolve, reject) => {
        let modalElement = $('#transferModal')
        let transferModal = new bootstrap.Modal(modalElement)
        transferModal.show();

        $('#transferAddress').val('');

        modalElement.find('.btn-primary').click(() => {
            let value = $('#transferAddress').val();
            resolve(value);
        })


        modalElement.on('hidden.bs.modal', event => {
            reject();
        })
    });
}

function showToast(msg, type = 'primary') {
    let id = (Math.random() * 10000).toFixed(0)
    $('.toastHolder').append($(`<div class="toast align-items-center text-bg-${type}" id="${id}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
            <div class="toast-body">
                ${msg}
            </div>
            <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    </div>`))
    let toast = new bootstrap.Toast($(`#${id}`));

    toast.show();
}

window.showToast = showToast;


//Check changes
EVER.on('pubkeyChanged', async () => {
    await review();
    await backgroundUpdateData();
});

setInterval(async () => {
    let currentAddress = (await EVER.getWallet()).address;

    if(currentAddress !== userAddress) {
        userAddress = currentAddress;
        await review();
        await backgroundUpdateData();
    }
}, 1000);


/**
 * Transfer token
 * @param {string} collectionAddress
 * @param {number} tokenAddress
 * @param {string} to
 * @param {string} returnGasTo
 * @returns {Promise<*>}
 */
async function transferToken(collectionAddress, tokenAddress, to, returnGasTo) {
    let tip4 = await (new TIP4Collection(EVER)).init(collectionAddress);
    let nft = await tip4.getNftByAddress(tokenAddress);
    let payload = await nft.transferPayload(to, returnGasTo);
    return await EVER.walletTransfer(nft.address, CONSTS.NFT_TRANSFER_EVER_AMOUNT, payload)
}

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

/**
 * Show collection in UI
 * @param collections
 * @returns {Promise<void>}
 */
async function showCollections(collections) {
    let html = '';
    for (let collectionName in collections) {

        let collection = collections[collectionName];

        if(collection.tokens.length === 0) {
            continue;
        }

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
        html += `    <div class="album py-2 ">
        <div class="container">

            <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
        `;

        for (let token of collection.tokens) {
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
                                    <button type="button" class="btn btn-sm btn-outline-secondary transferButton" data-collection="${token.collection}" data-address="${token.address}">Transfer</button>
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

    if(html === '') {
        html = `<div class="container" style="text-align: center"><h1 class="fw-light">No TIP-4 tokens found</h1></div>`;
    }

    $('#pluginMain').html(html);
    $('.autoClipboard').click(pluginUtils.selfCopyElement());

    $('.transferButton').click(async (event) => {

        try {
            let to = await promptTransferAddress();

            let collectionAddress = $(event.target).data('collection');
            let tokenAddress = $(event.target).data('address');

            await transferToken(collectionAddress, tokenAddress, to, userAddress);

            showToast('Transfer request sent', 'success')
        } catch (e) {
            console.log('Transfer error', e);
            showToast('Transfer error: ' + e.message, 'warning');
        }

    })

}

/**
 * Update collections view
 * @returns {Promise<void>}
 */
async function review() {

    //Update address
    userAddress = window.userAddress = (await EVER.getWallet()).address;

    let userCollections = {};

    if(!localStorage[`userCollections_${userAddress}`]) {
        return;
    } else {
        userCollections = JSON.parse(localStorage[`userCollections_${userAddress}`]);
    }

    console.log(userCollections);

    await showCollections(userCollections);
}

await review();


/**
 * Update data in background
 * @returns {Promise<void>}
 */
async function backgroundUpdateData() {

    try {
        let newUserCollections = await collectCollections(userAddress);

        if(JSON.stringify(newUserCollections) !== localStorage[`userCollections_${userAddress}`]) {
            localStorage[`userCollections_${userAddress}`] = JSON.stringify(newUserCollections);
            await review(newUserCollections);
        }
    } catch (e) {
        console.log(e);
    }

    setTimeout(backgroundUpdateData, CONSTS.BACKGROUND_UPDATE_INTERVAL);
}

await backgroundUpdateData();