// langUtils.js
const langKeys = ['eng', 'thai', 'japanese'];

const getLocalizedText = (lang, langObject) => {
    return langObject[langKeys[lang]] || langObject['eng'];
};

const getLangKeysSize = () => {
    return langKeys.length; // Returns the number of available languages
};

export { getLocalizedText, getLangKeysSize, langKeys };
