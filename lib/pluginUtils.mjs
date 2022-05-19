const pluginUtils = {
    /**
     * Copy text to clipboard
     * @param text
     * @returns {Promise<void>}
     */
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            try {
                cordova.plugins.clipboard.copy(text);
            } catch (e) {

            }
        }
    },

    /**
     * Create callback for self copy element
     * @param dataAttribName
     * @returns {function(): Promise<void>}
     */
    selfCopyElement: function (dataAttribName = 'clipboard') {
        return async function () {

            let data = this.dataset[(dataAttribName)];
            await pluginUtils.copyToClipboard(data);
        }
    },
};

export default pluginUtils;