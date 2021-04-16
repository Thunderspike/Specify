$(function () {
    specify.init();
});

const specify = new (function () {
    const obj = this;

    // easy data
    // ["First Name", "Last Name", "Gender", "Age", "Email"],
    // ["Amanda", "Reed", "Female", 18, "e.reed@randatmail.com"],
    // ["Sam", "Thomas", "Male", 27, "s.thomas@randatmail.com"],
    // ["Naomi", "Myers", "Female", 19, "n.myers@randatmail.com"],
    // ["Adrian", "Holmes", "Male", 23, "a.holmes@randatmail.com"],
    this.defaultInputEditorData = [
        [
            "core_serial",
            "status",
            "original_launch",
            "original_launch_unix",
            "details",
        ],
        [
            "Merlin2A",
            "expended",
            "2007-03-21T01:10:00.000Z",
            1174439400,
            "Successful first-stage burn and transition to second stage...",
        ],
        [
            "Merlin1C",
            "expended",
            "2008-08-02T03:34:00.000Z",
            1217648040,
            "Residual stage-1 thrust led to collision between stage 1 and stage 2.",
        ],
        [
            "Merlin2C",
            "destroyed",
            "2008-09-28T23:15:00.000Z",
            1222643700,
            "Initially scheduled for 23–25 Sep, carried dummy payload...",
        ],
        [
            "Merlin3C",
            "destroyed",
            "2009-07-13T03:35:00.000Z",
            1247456100,
            "null",
        ],
        [
            "B0003",
            "expended",
            "2010-06-04T18:45:00.000Z",
            1275677100,
            "Core expended on flight, no recovery effort. First flight of Falcon 9",
        ],
        [
            "B0004",
            "destroyed",
            "2010-12-08T15:43:00.000Z",
            1291822980,
            "First flight of Dragon",
        ],
    ];

    this.inputEditor = {
        editorO: null,
        isValid: true,
        invalidJSONelem: null,
        validatorElem: $("#dataValidator"),
        notificationElem: null,
        validInputData: null,
        dimensions: {
            maxRows: 30,
            maxCols: 10,
            numRows: obj.defaultInputEditorData.length - 1,
            numCols: obj.defaultInputEditorData[0].length,
        },
    };

    // prettier-ignore
    this.defaultConfigEditorData = {
        editable: true,
        sortable: true,
        cells: {
            r0c0: {
                type: "number",
                min: 17,
                max: 19
            },
            r0c1: {
                type: ["flying", "lost in space"]
            },
            r0c3: {
                type: "text"
            },
        }
    };

    this.configEditor = {
        editorO: null,
        isValid: true,
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

    function editorFactory(id) {
        const wrap = 60;
        const editor = ace.edit(id, {
            theme: "ace/theme/chaos",
            mode: "ace/mode/json",
            useWorker: true,
            behavioursEnabled: "always",
            fontSize: 16,
            wrap,
            printMargin: wrap,
        });
        editor.renderer.setScrollMargin(16, 16);

        return editor;
    }

    this.setEditorValue = function (editor, value) {
        editor.setValue(JSON.stringify(value, null, 2));
    };

    this.validateDataInput = function (delta) {
        const inputEditor = obj.inputEditor;
        const { editorO, validatorElem, dimensions } = inputEditor;
        let { notificationElem } = inputEditor;
        fullState = {};
        inputEditor.validInputData = [];
        dimensions.numRows = 0;
        dimensions.numCols = 0;

        function dataTableInvalidNotification(
            message = "The JSON structure provided is invalid"
        ) {
            inputEditor.notificationElem = UIkit.notification({
                message: `
                <div class="uk-flex-inline uk-flex-middle">
                    <span uk-icon="info"></span>
                    <p class="uk-margin-small-left">
                        ${message}
                    </p>
                </div>
            `,
                pos: "bottom-left",
                timeout: 0,
            });
        }

        function createNotification(message) {
            if (notificationElem && notificationElem._connected) {
                UIkit.util.once(document, "close", function (evt) {
                    if (evt.detail[0] === notificationElem) {
                        dataTableInvalidNotification(message);
                    }
                });
                notificationElem.close(false);
            } else dataTableInvalidNotification(message);
        }

        let editorVal = editorO.getValue();

        if (editorVal.replace(/\s+/g, "") == "") {
            inputEditor.isValid = false;
            return validatorElem.addClass("error");
        }

        if (editorVal.replace(/\s+/g, "") == "[]")
            return obj.setEditorValue(editorO, {
                data: [...obj.defaultInputEditorData],
            });

        try {
            editorVal = JSON.parse(editorVal);
        } catch (e) {
            inputEditor.isValid;
            return validatorElem.addClass("error");
        }

        try {
            dimensions.numRows = editorVal.data.length - 1;
            dimensions.numCols = editorVal.data[0].length;

            if (!dimensions.numRows) {
                editorO.isValid = false;
                inputEditor.validatorElem.addClass("error");
                const invalidJSONMessage = "The table must have at least 1 row";
                return createNotification(invalidJSONMessage);
            }

            if (
                dimensions.numRows > dimensions.maxRows ||
                dimensions.numCols > dimensions.maxCols
            ) {
                editorO.isValid = false;
                inputEditor.validatorElem.addClass("error");
                const invalidJSONMessage =
                    "The table supports only up to 30 rows and 10 columns";
                return createNotification(invalidJSONMessage);
            }

            editorVal.data.forEach((row) => {
                if (row.length != dimensions.numCols) throw "";
            });
        } catch (e) {
            editorO.isValid = false;
            inputEditor.validatorElem.addClass("error");
            const invalidJSONMessage = "Invalid table dimensions";
            return createNotification(invalidJSONMessage);
        }

        inputEditor.validInputData = editorVal.data;

        // clean leftover notifications if exist
        if (notificationElem && notificationElem._connected)
            notificationElem.close(false);
        inputEditor.validatorElem.removeClass("error");
        editorO.isValid = true;
        obj.validateConfigInput();
    };

    this.validateConfigInput = function (delta) {
        const configEditor = obj.configEditor;
        const { editorO, allowedKeys, validatorElem } = configEditor;
        let { notificationElem } = configEditor;
        configEditor.fullState = {};
        configEditor.validInputData = {};
        configEditor.errorO = {};
        configEditor.typeSemblance = [];
        const { numRows, numCols } = { ...obj.inputEditor.dimensions };

        // if (notificationElem && notificationElem._connected) {
        //     notificationElem.close(false);
        // }

        function dataTableInvalidNotification(
            message = "The JSON structure provided is invalid"
        ) {
            configEditor.notificationElem = UIkit.notification({
                message: `
                <div class="uk-flex-inline uk-flex-middle">
                    <span uk-icon="info"></span>
                    <p class="uk-margin-small-left">
                        ${message}
                    </p>
                </div>
            `,
                pos: "top-right",
                timeout: 0,
            });
        }

        function createNotification(message) {
            if (notificationElem && notificationElem._connected) {
                UIkit.util.once(document, "close", function (evt) {
                    if (evt.detail[0] === notificationElem) {
                        dataTableInvalidNotification(message);
                    }
                });
                notificationElem.close(false);
            } else dataTableInvalidNotification(message);
        }

        if (!obj.inputEditor.isValid) {
            const message = `Please provide valid input for the Data Input Editor before configuring the data on the Data Configuration Editor`;
            configEditor.isValid = false;
            validatorElem.addClass("error");
            return createNotification(message);
        }

        let editorVal = editorO.getValue();

        if (editorVal.replace(/\s+/g, "") == "") {
            configEditor.isValid = false;
            return validatorElem.addClass("error");
        }

        if (editorVal.replace(/\s+/g, "") == "{}")
            return obj.setEditorValue(editorO, {
                ...obj.defaultConfigEditorData,
            });

        try {
            editorVal = JSON.parse(editorVal);
        } catch (e) {
            configEditor.isValid = false;
            return validatorElem.addClass("error");
        }

        const minRequiredProps = Object.keys(editorVal).filter((key) => {
            return allowedKeys.globalFeatures.includes(key);
        }).length;
        if (!minRequiredProps) {
            const message = `Configuration JSON does not specify minimally required attributes`;
            configEditor.isValid = false;
            validatorElem.addClass("error");
            return createNotification(message);
        }

        function recordError(context, path, key) {
            let globalInvalidKeys = putAtObjectPath(context, path);
            return (globalInvalidKeys = globalInvalidKeys
                ? globalInvalidKeys.push(key)
                : [key]);
        }

        // global level keys/values
        Object.keys(editorVal).forEach((key) => {
            if (!allowedKeys.global.includes(key)) {
                recordError(configEditor.errorO, "global.invalidKeys", key);
                delete editorVal[key];
            } else if (allowedKeys.globalFeatures.includes(key)) {
                // reconsider this later
                if (key == "markers") {
                    let markers = editorVal.markers;
                    if (Array.isArray(markers)) {
                        markers = markers.filter((color) => {
                            if (!configEditor.colorRegex.test(color)) {
                                putAtObjectPath(
                                    configEditor.errorO,
                                    "global.invalidValues.markers.invalidColors",
                                    [color]
                                );
                                return false;
                            }
                            return true;
                        });
                        if (!markers.length) {
                            putAtObjectPath(
                                configEditor.errorO,
                                "global.invalidValues.markers",
                                "array0"
                            );
                            editorVal.markers = [
                                ...configEditor.defaultMarkerColors,
                            ];
                        } else if (
                            markers.length > configEditor.maxEnumValues
                        ) {
                            putAtObjectPath(
                                configEditor.errorO,
                                "global.invalidValues.markers",
                                "arrayGtLimit"
                            );
                            editorVal.markers.length =
                                configEditor.maxEnumValues;
                        }
                    } else {
                        if (typeof editorVal.markers != "boolean") {
                            putAtObjectPath(
                                configEditor.errorO,
                                "global.invalidValues.Markers",
                                "nonBoolean"
                            );
                            editorVal.markers = !!editorVal.markers;
                        }
                    }
                    configEditor.fullState[key] = markers;
                } else {
                    if (typeof editorVal[key] != "boolean") {
                        putAtObjectPath(
                            configEditor.errorO,
                            `global.invalidValues.${key}`,
                            "nonBoolean"
                        );
                        editorVal[key] = !!editorVal[key];
                    }
                }
                configEditor.fullState[key] = editorVal[key];
            }
        });

        const cells = editorVal.cells;

        if (cells && trueTypeOf(cells) != "object") {
            const message = `'cells' must be an object type`;
            configEditor.isValid = false;
            validatorElem.addClass("error");
            return createNotification(message);
        }

        // deletes invalid cell identifiers
        cells &&
            Object.keys(cells).forEach((key) => {
                key = key.toLowerCase();
                if (allowedKeys.cells.test(key)) {
                    const cellDims = key.match(/\d+/g);
                    console.log({ cellDims, numRows, numCols });
                    if (cellDims[0] >= numRows) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.invalidCellIdentifiers.${key}`,
                            ["invalidRowDims"]
                        );
                    }
                    if (cellDims[1] >= numCols) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.invalidCellIdentifiers.${key}`,
                            ["invalidColDims"]
                        );
                    }
                } else
                    putAtObjectPath(
                        configEditor.errorO,
                        `global.cells.invalidCellIdentifiers.${key}`,
                        ["invalidIdentifier"]
                    );
                if (configEditor.errorO?.cells?.invalidCellIdentifiers?.[key])
                    delete cells[key];
            });

        // validate cell inputs
        cells &&
            Object.keys(cells).forEach((cell) => {
                let cellValueKeys = Object.keys(cells[cell]);
                // clean invalid valueKeys
                cellValueKeys.forEach((valueKey) => {
                    if (!allowedKeys.cellVals.includes(valueKey)) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.validCellIdentifiers.${cell}.invalidKeyIdentifiers`,
                            [
                                {
                                    [valueKey]: cells[cell][valueKey],
                                    deletedProp: true,
                                },
                            ]
                        );
                        delete cells[cell][valueKey];
                    }
                });
            });

        // enforce noneditability
        cells &&
            Object.keys(cells).forEach((cell) => {
                let cellValueKeys = Object.keys(cells[cell]);
                if (cellValueKeys.includes("editable")) {
                    if (typeof cells[cell].editable != "boolean") {
                        //  removed property if not explicitly boolean
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.validKeyIdentifiers.${cell}.invalidValue`,
                            [
                                {
                                    editable: cells[cell].editable,
                                    deletedProp: true,
                                },
                            ]
                        );
                        delete cells[cell].editable;
                    } else {
                        if (editorVal.editable && cells[cell].editable) {
                            // redundant
                            putAtObjectPath(
                                configEditor.errorO,
                                `cells.validCellIdentifiers.${cell}.invalidValues`,
                                {
                                    redundantEditabilityDeclaration: {
                                        globalEditability: editorVal.editable,
                                        cellProps: { ...cells[cell] },
                                        deletedProp: true,
                                    },
                                }
                            );
                            delete cells[cell].editable;
                        } else if (
                            !editorVal.editable &&
                            !cells[cell].editable
                        ) {
                            // redundant
                            putAtObjectPath(
                                configEditor.errorO,
                                `cells.validCellIdentifiers.${cell}.invalidValues`,
                                {
                                    redundantEditabilityDeclaration: {
                                        globalEditability: editorVal.editable,
                                        cellProps: { ...cells[cell] },
                                        deletedCell: true,
                                    },
                                }
                            );
                            delete cells[cell];
                        } else if (!cells[cell].editable) {
                            // removed other proprties when cell not editable
                            putAtObjectPath(
                                configEditor.errorO,
                                `cells.validCellIdentifiers.${cell}.invalidValues`,
                                {
                                    cellNonEditable: { ...cells[cell] },
                                }
                            );
                            cells[cell] = { editable: false };
                        }
                    }
                }
            });

        // rest of valueKeys
        cells &&
            Object.keys(cells).forEach((cell) => {
                let cellValueKeys = Object.keys(cells[cell]);

                if (cellValueKeys.includes("type")) {
                    let type = cells[cell].type;
                    const minVal = cells[cell].min;
                    const maxVal = cells[cell].max;

                    // check for enums here
                    if (Array.isArray(type)) {
                        if (!type.length) {
                            putAtObjectPath(
                                configEditor.errorO,
                                `cells.validCellIdentifiers.${cell}.invalidEnumLength`,
                                [
                                    {
                                        type: cells[cell].type,
                                        deletedProp: true,
                                    },
                                ]
                            );
                            delete cells[cell].type;
                        }
                        if (type.length > configEditor.maxEnumValues) {
                            putAtObjectPath(
                                configEditor.errorO,
                                `cells.validCellIdentifiers.${cell}.invalidEnumLength`,
                                [
                                    {
                                        type: cells[cell].type,
                                        trimmed: true,
                                    },
                                ]
                            );

                            type.length = configEditor.maxEnumValues;
                        }
                        cells[cell].type = type.filter((enumVal) => {
                            if (
                                !(
                                    typeof enumVal == "boolean" ||
                                    typeof enumVal == "string" ||
                                    typeof enumVal == "number"
                                )
                            ) {
                                putAtObjectPath(
                                    configEditor.errorO,
                                    `cells.validCellIdentifiers.${cell}.invalidEnumVal`,
                                    [
                                        {
                                            enumVal: enumVal.toString(),
                                            deleted: true,
                                        },
                                    ]
                                );
                                return false;
                            }
                            return true;
                        });

                        if (!cells[cell].type.length) {
                            putAtObjectPath(
                                configEditor.errorO,
                                `cells.validCellIdentifiers.${cell}.enum`,
                                {
                                    edgeCase: "emptyAfterTrim",
                                }
                            );
                            delete cells[cell].type;
                        } else {
                            if (
                                (minVal && !isNaN(minVal)) ||
                                (maxVal && !isNaN(maxVal))
                            ) {
                                putAtObjectPath(
                                    configEditor.errorO,
                                    `cells.validCellIdentifiers.${cell}.redundantVals`,
                                    {
                                        invalidKeys: ["min", "max"].filter(
                                            (el) => {
                                                if (el == "min")
                                                    return (
                                                        minVal && !isNaN(minVal)
                                                    );
                                                else
                                                    return (
                                                        maxVal && !isNaN(maxVal)
                                                    );
                                            }
                                        ),
                                        deleted: true,
                                    }
                                );
                                delete cells[cell].min;
                                delete cells[cell].max;
                            }
                        }
                    } else if (!allowedKeys.type.includes(type)) {
                        // non existant type
                        recordError(
                            configEditor.errorO,
                            `cells.validCellIdentifiers.${cell}.invalidValues`,
                            {
                                nonExistantType: type,
                                deletedProp: true,
                            }
                        );
                        delete cells[cell].type;
                    }

                    let numMin, numMax;

                    if (minVal != undefined && isNaN(minVal)) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.validCellIdentifiers.${cell}.invalidValues`,
                            {
                                invalidMinVal: minVal,
                                deletedProp: true,
                            }
                        );
                        delete cells[cell].min;
                    } else {
                        numMin = minVal;
                    }

                    if (maxVal != undefined && isNaN(maxVal)) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.validCellIdentifiers.${cell}.invalidValues`,
                            {
                                invalidMaxVal: maxVal,
                                deletedProp: true,
                            }
                        );
                        delete cells[cell].max;
                    } else {
                        numMax = maxVal;
                    }

                    if (!isNaN(numMin) && !isNaN(numMax)) {
                        if (numMin > numMax) {
                            cells[cell].min = Math.min(numMin, numMax);
                            cells[cell].max = Math.max(numMin, numMax);
                            putAtObjectPath(
                                configEditor.errorO,
                                `cells.validCellIdentifiers.${cell}.swappedMinMax`,
                                {
                                    newMin: cells[cell].min,
                                    newMax: cells[cell].max,
                                }
                            );
                        }
                    }
                }
            });

        // remove empty cells
        cells &&
            Object.keys(cells).forEach((cell) => {
                if ($.isEmptyObject(cells[cell])) {
                    putAtObjectPath(
                        configEditor.errorO,
                        `cells.validCellIdentifiers.${cell}.emptyCell`,
                        "empty"
                    );
                    delete cells[cell];
                }
            });

        // make non empty cells explicitly editable when global edit is false
        if (!editorVal.editable) {
            cells &&
                Object.keys(cells).forEach((cell) => {
                    if (!cells[cell].editable) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.validCellIdentifiers.${cell}.forceAddingTrue`,
                            {
                                cellProps: { ...cells[cell] },
                                addedProp: { editable: true },
                            }
                        );
                        cells[cell].editable = true;
                    }
                });
        }

        // print errors if any and recreate config object
        if (!$.isEmptyObject(configEditor.errorO)) {
            // explicitly add
            obj.setEditorValue(editorO, { ...editorVal });
            console.log({ ...configEditor.errorO });
            const message = `Some configuration options have been changed by the system.`;
            return createNotification(message);
        }

        configEditor.isValid = true;
        validatorElem.removeClass("error");
        configEditor.validInputData = editorVal;
        obj.generateInternalTableConfig();
    };

    this.determineColumnTypeSemblance = function (
        { maxEnumValues, emailRegex, typeSemblance },
        table
    ) {
        table[0].forEach((_, colIndex) => {
            const dataSet = new Set();
            const typeSet = new Set();
            for (let i = 0; i < table.length; i++) {
                const val = table[i][colIndex];
                dataSet.add(val);

                if (!isNaN(val)) typeSet.add("number");
                else if (emailRegex.test(val)) typeSet.add("email");
                else typeSet.add("text");
            }
            if (dataSet.size <= maxEnumValues)
                typeSemblance[colIndex] = {
                    value: "enum",
                    values: Array.from(dataSet),
                };
            else if (typeSet.size == 1)
                typeSemblance[colIndex] = {
                    value: typeSet.values().next().value,
                };
            else typeSemblance[colIndex] = { value: "text" };
        });
    };

    class EditableCell {
        defaultInput = `<input class="uk-input"></input>`;

        constructor(colNum, rowNum) {
            const { fullState } = obj.configEditor;
            this.colNum = colNum;
            this.rowNum = rowNum;
            this.cellMetadata = fullState[rowNum][colNum];
            this.$tdHanlder = $(
                `#tableContainer tbody tr:nth-child(${
                    this.rowNum + 1
                }) td:nth-child(${this.colNum + 1})`
            );
            this.$cellContainer = this.$tdHanlder.find(".cellCont");
            this.$cellStore = this.$cellContainer.find(".cellStore");
            this.processInput();
        }

        processInput() {
            if (!this.midEdit) {
                if (!Array.isArray(this.cellMetadata.type)) this.showInput();
                else this.showDropdown();
            }
        }

        showInput() {
            // console.log(this);
            // console.log("showInput");
            // console.log(this.cellMetadata);

            this.midEdit = true;
            const $cellContainer = this.$cellContainer;
            const $cellStore = this.$cellStore;
            let originalVal = $cellStore.text().trim();
            $cellStore
                .attr("hidden", true)
                .removeClass("uk-animation-slide-right-small");

            const { type } = this.cellMetadata;
            const { emailRegex } = obj.configEditor;
            if (type == "number")
                originalVal = !isNaN(originalVal) ? originalVal : "Number";
            else if (type == "email")
                originalVal = emailRegex.test(originalVal)
                    ? originalVal
                    : "local-part@domainName.com";

            const $tempInput = $(this.defaultInput)
                .attr("type", type)
                .attr("placeholder", originalVal)
                .addClass("uk-animation-fade");

            if (!(type == "number" && originalVal == "Number"))
                $tempInput.val(originalVal);

            $cellContainer.append($tempInput);
            $tempInput.trigger("focus");
            $tempInput.on("focusout", () => {
                $tempInput.removeClass("uk-animation-fade");
                const inputVal = $tempInput.val();

                const error = this.validateInput(inputVal);

                if (error.length) {
                    $tempInput.addClass("uk-form-danger uk-animation-shake");
                    $tempInput.attr("uk-tooltip", error);
                    setTimeout(() => {
                        UIkit.tooltip($tempInput[0]).show();
                        $tempInput.removeClass("uk-animation-shake");
                    }, 500);
                    return;
                }

                $tempInput.removeClass("uk-form-danger");
                setTimeout(() => {
                    $cellStore
                        .text($tempInput.val())
                        .attr("hidden", false)
                        .addClass("uk-animation-slide-right-small");
                    $tempInput.remove();

                    this.midEdit = false;
                }, 250);
            });
        }

        showDropdown() {
            // console.log(this);
            // console.log("showEnum");
            // console.log(this.cellMetadata);

            this.midEdit = true;
            const $cellContainer = this.$cellContainer;
            const $cellStore = this.$cellStore;
            let originalVal = $cellStore.text().trim();
            $cellStore.attr("hidden", true).removeClass("uk-animation-fade");

            let ddState = [...this.cellMetadata.type];
            if (ddState.includes(originalVal)) {
                ddState = ddState
                    .splice(ddState.indexOf(originalVal), 1)
                    .concat(ddState);
            }

            var $tempSelect = $(
                `<select class="uk-select uk-animation-fade"></select>`
            ).append(ddState.map((opt) => `<option>${opt}</option>`));

            $cellContainer.append($tempSelect);
            $tempSelect.trigger("focus");
            $tempSelect.on("focusout", () => {
                $tempSelect.removeClass("uk-animation-fade");
                setTimeout(() => {
                    $cellStore
                        .text($tempSelect.val())
                        .attr("hidden", false)
                        .addClass("uk-animation-fade");
                    $tempSelect.remove();
                    this.midEdit = false;
                }, 250);
            });
        }

        validateInput = function (val) {
            const { min, max, type } = this.cellMetadata;
            const {
                minInputLength,
                maxInputLength,
                emailRegex,
            } = obj.configEditor;

            if (type == "number") {
                if (val == "")
                    return `title: A <span class="error-text">numeric</span> input is required!`;
                val = parseInt(val);
                if (min == undefined && max == undefined) return "";
                else if (min != undefined && max == undefined) {
                    if (val < parseInt(min))
                        return `title: The field expects a minimum value of <span class="error-text">${min}</span>`;
                } else if (min == undefined && max != undefined) {
                    if (val > parseInt(max))
                        return `title: The field expects a maximum value of <span class="error-text">${max}</span>`;
                } else if (val < parseInt(min) || val > parseInt(max))
                    return `title: The field expects a value between <span class="error-text">${min}</span> and <span class="error-text">${max}</span>`;

                return "";
            } else if (type == "text") {
                if (val.length < minInputLength)
                    return `title: The text must be at least <span class="error-text">${minInputLength}</span> character long`;
                else if (val.length > maxInputLength)
                    return `title: The text can be no more than <span class="error-text">${maxInputLength}</span> characters`;
                return "";
            } else {
                if (val.length < minInputLength)
                    return `title: The email must be at least <span class="error-text">${minInputLength}</span> character long`;
                else if (val.length > maxInputLength)
                    return `title: The email address can be no more than <span class="error-text">${maxInputLength}</span> characters`;
                else if (!emailRegex.test(val))
                    return `title: Not a <span class="error-text">valid</span> email address!`;
                return "";
            }
        };
    }

    this.generateInternalTableConfig = function () {
        let { typeSemblance, fullState, validInputData } = obj.configEditor;
        const tableData = [...obj.inputEditor.validInputData];
        tableData.shift(); // remove headers
        // console.log({ tableData });
        // console.log({ validInputData });
        obj.determineColumnTypeSemblance(obj.configEditor, tableData);
        // console.log({ typeSemblance });

        // editable and markers are at the global level
        const { editable, markers, cells } = validInputData;
        obj.configEditor.fullState = tableData.map((_, rowIdx) => {
            return tableData[rowIdx].map((col, colIdx) => {
                let objToReturn = { value: col, editable, markers };
                const correspondingCell = cells[`r${rowIdx}c${colIdx}`];
                if (correspondingCell)
                    objToReturn = { ...objToReturn, ...correspondingCell };
                else if (editable) {
                    objToReturn = {
                        ...objToReturn,
                        type:
                            typeSemblance[colIdx].values ||
                            typeSemblance[colIdx].value,
                    };
                }
                return objToReturn;
            });
        });

        this.generateTable();
    };

    this.generateTable = function () {
        const { isValid: isValidInputEditorData, validInputData } = {
            ...obj.inputEditor,
        };
        const {
            isValid: isValidConfigEditorData,
            fullState,
            validInputData: validInpuConfigData,
        } = obj.configEditor;
        const { editable, sortable, markers, cells } = validInpuConfigData;

        if (!(isValidInputEditorData && isValidConfigEditorData)) return;

        const thead = [...validInputData[0]];

        $("#tableContainer").empty().append(
            `<table class="tableSorter uk-table uk-table-hover uk-table-divider uk-table-small uk-table-middle">
                    <thead>
                        <tr></tr>
                    </thead>
                    <tbody></tbody>
                </table>`
        );

        $("#tableContainer tr").append(
            thead.map((el) => `<th class="uk-table-shrink">${el}</th>`)
        );

        fullState.forEach((row) => {
            const tr = $(`<tr class="minRowHeight"></tr>`).append(
                row.map((cell) => {
                    if (!cell.editable)
                        return `<td class="cell-inherit-height">${cell.value}</td>`;
                    else {
                        return `<td class="uk-text-nowrap uk-width-small cell-inherit-height editable">
                        <div class="cellCont editable-cell">
                            <div class="cellStore">${cell.value}</div>
                        </div>
                    </td>`;
                    }
                })
            );
            $("#tableContainer tbody").append(tr);
        });

        $("#tableContainer tbody td .editable-cell").on(
            "dblclick",
            function () {
                var $this = $(this);
                var col = $this.closest("td").index();
                var row = $this.closest("tr").index();

                // console.log([col, row]);

                if (!fullState[row][col].editCellInst)
                    fullState[row][col].editCellInst = new EditableCell(
                        col,
                        row
                    );
                else fullState[row][col].editCellInst.processInput();
            }
        );

        if (sortable) {
            $("#tableContainer table").tableSort({
                animation: "slide",
                speed: 500,
            });

            $("#tableContainer thead tr").css("display", "flex");
            // $("#tableContainer table th").css("display", "inline-block");

            $(window).on(
                "resize",
                debounce(
                    function () {
                        obj.generateTable();
                    },
                    500,
                    {
                        leading: false,
                        trailing: true,
                    }
                )
            );
        }
    };

    this.init = function () {
        obj.inputEditor.editorO = editorFactory("specifyDataEditor");
        const tableEditor = obj.inputEditor.editorO;
        makeAceEditorResizable(tableEditor);

        obj.configEditor.editorO = editorFactory("specifyConfigEditor");
        const configEditor = obj.configEditor.editorO;
        makeAceEditorResizable(configEditor);

        obj.setEditorValue(tableEditor, {
            data: [...obj.defaultInputEditorData],
        });
        tableEditor.clearSelection();

        obj.setEditorValue(configEditor, { ...obj.defaultConfigEditorData });
        configEditor.clearSelection();

        obj.validateDataInput();

        tableEditor.session.on(
            "change",
            debounce(obj.validateDataInput, 1000, {
                leading: false,
                trailing: true,
            })
        );
        configEditor.session.on(
            "change",
            debounce(obj.validateConfigInput, 1000, {
                leading: false,
                trailing: true,
            })
        );
    };
})();
