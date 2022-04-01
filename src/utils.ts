export const JSONStringifyExt = (obj) => {
    return JSON.stringify(
        obj,
        (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
    );
}

export const uuid = () => {
    return 'xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const getID = () => {
    return (new Date()).getTime() + '-' + uuid().substring(0, 4);
};