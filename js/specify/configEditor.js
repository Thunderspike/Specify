const vals = {
    editorO: null,
    isValid: true,
    isValidWithErrors: false,
    validatorElem: $("#configValidator"),
    defaultMarkerColors: ["#1e87f0", "#222", "#f8f8f8"],
    minInputLength: 0,
    maxInputLength: 255,
    determineEnumOnSimilarValues: 3,
    maxEnumValues: 3,
    emailRegex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    colorRegex: /^#([0-9A-F]{3}){1,2}$/i,
    allowedKeys: {
        globalFeatures: ["editable", "sortable", "markers"],
        global: ["editable", "sortable", "markers", "cells"], // "columns",
        editable: "boolean",
        sortable: "boolean",
        // markers: ["boolean", "array"], // not curr needed with code
        // columns: /^c[0-9]+&/, // on pause for column feature
        // columnVals: ["type", "editable", "markers", "min", "max"],
        type: ["text", "number", "email"], // removed enum
        cells: /^r[0-9]+c[0-9]+$/,
        // if editable == false, type/min/max dropped
        // if type == enum, min/max dropped
        cellVals: ["editable", "type", "min", "max"],
    },
    notificationElem: null,
    fullState: {},
    errorO: {},
    validInputData: {},
};

class ConfigEditor {}
