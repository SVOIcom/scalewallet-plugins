console.log('Plugin injected interface');
window.addEventListener("message", (event) => {

    if(event.data.type === 'eval') {
        eval(event.data.code);
    }

});


window.pluginUtils = {

    /**
     * Sends message to UI plugin iframe
     * @param message
     * @returns {Promise<void>}
     */
    async sendPluginHolderMessage(message) {
        window.parent.postMessage({type: 'pluginMessage', message, pluginPath: window.pluginMessageOriginPath}, '*')
    },

    /**
     * Send new height to pluginHolder
     * @param height
     * @returns {Promise<void>}
     */
    async updateIframeHeight(height) {
        await this.sendPluginHolderMessage({method: 'updateIframeHeight', height});
    },
};

//Detect frame height change

window.addEventListener('resize', function (event) {
    pluginUtils.updateIframeHeight(document.body.scrollHeight);
}, true);
pluginUtils.updateIframeHeight(document.body.scrollHeight);
setInterval(() => {
    if(window.pluginContentType === 'tab') {
        pluginUtils.updateIframeHeight(document.body.scrollHeight);
    }
}, 1000);
