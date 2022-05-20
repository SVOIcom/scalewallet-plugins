console.log('Injected interface');
window.addEventListener("message", (event) => {

    if(event.data.type === 'eval') {
        eval(event.data.code);
    }

});


window.pluginUtils = {
    async sendPluginHolderMessage(message) {
        window.parent.postMessage({type: 'pluginMessage', message, pluginPath: window.pluginMessageOriginPath}, '*')
    },

    async updateIframeHeight(height) {
        await this.sendPluginHolderMessage({method: 'updateIframeHeight', height});
    }
};

window.addEventListener('resize', function (event) {
    pluginUtils.updateIframeHeight(document.body.scrollHeight);
}, true);
pluginUtils.updateIframeHeight(document.body.scrollHeight);