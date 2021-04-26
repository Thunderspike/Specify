$(function () {
    specify.init();
});

const specify = new (function () {
    const obj = this;

    this.defaultInputEditorData = defaultInputEditorData;
    this.defaultConfigEditorData = defaultConfigEditorData;

    this.configEditor = {
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

    this.validateConfigInput = function () {
        const configEditor = obj.configEditor;
        const { editorO, allowedKeys, validatorElem } = configEditor;
        let { notificationElem } = configEditor;
        obj.configEditor.isValidWithErrors = false;
        obj.configEditor.lastCleansedInput = {};
        configEditor.fullState = {};
        configEditor.validInputData = {};
        configEditor.errorO = {};
        configEditor.typeSemblance = [];
        const { numRows, numCols } = { ...inputEditor.dimensions };

        // configMessageCont
        // configInvalidSyntax

        const $configInvalidSyntax = $("#configInvalidSyntax");
        const $submitConfig = $("#submitConfig");

        $configInvalidSyntax.addClass("uk-animation-reverse");
        $configInvalidSyntax.attr("hidden", "true");
        $submitConfig.addClass("uk-animation-reverse");
        $submitConfig.attr("hidden", "true");

        // if (notificationElem && notificationElem._connected) {
        //     notificationElem.close(false);
        // }

        function dataTableInvalidNotification(
            message = "The JSON structure provided is invalid"
        ) {
            obj.configEditor.notificationElem = UIkit.notification({
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

        function createGlobalNotification(message) {
            if (notificationElem && notificationElem._connected) {
                UIkit.util.once(document, "close", function (evt) {
                    if (evt.detail[0] === notificationElem) {
                        dataTableInvalidNotification(message);
                    }
                });
                notificationElem.close(false);
            } else dataTableInvalidNotification(message);
        }

        function createNotification(message) {
            $submitConfig.addClass("uk-animation-reverse");
            $submitConfig.attr("hidden", "true");
            setEditorValue(editorO, { ...editorVal });
            $configInvalidSyntax.find(".text").text(message);
            $configInvalidSyntax
                .removeClass("uk-animation-reverse")
                .removeAttr("hidden");
        }

        if (!inputEditor.isValid) {
            const message = `Data from Input Editor is marked as invalid`;
            obj.configEditor.isValid = false;
            validatorElem.addClass("error");
            return createNotification(message);
        }

        let editorVal = editorO.getValue();

        if (editorVal.replace(/\s+/g, "") == "") {
            const message = `Configuration Editor cannot be empty`;
            obj.configEditor.isValid = false;
            validatorElem.addClass("error");
            return createNotification(message);
        }

        if (editorVal.replace(/\s+/g, "") == "{}")
            return setEditorValue(editorO, {
                ...obj.defaultConfigEditorData,
            });

        try {
            editorVal = JSON.parse(editorVal);
        } catch (e) {
            obj.configEditor.isValid = false;
            return validatorElem.addClass("error");
        }

        const minRequiredProps = Object.keys(editorVal).filter((key) => {
            return allowedKeys.globalFeatures.includes(key);
        }).length;
        if (!minRequiredProps) {
            const message = `Configuration JSON does not specify minimally required attributes`;
            obj.configEditor.isValid = false;
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
                    // console.log({ cellDims, numRows, numCols });
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

        $configInvalidSyntax.addClass("uk-animation-reverse");
        setTimeout((_) => $configInvalidSyntax.attr("hidden", "true"));

        // print errors to console. store cleansed editorVal in lastCleasnedInput and show Warning Submit button
        if (!$.isEmptyObject(configEditor.errorO)) {
            console.log({ ...configEditor.errorO });
            obj.configEditor.isValid = false;
            obj.configEditor.isValidWithErrors = true;
            obj.configEditor.lastCleansedInput = { ...editorVal };

            const message = `Redundant or invalid Configuration input options will be cleansed by the system.`;

            $submitConfig
                .removeClass("okColor")
                .addClass("warningColor")
                .attr("uk-tooltip", message);
            $submitConfig.find(".icon").attr("uk-icon", "warning");
            $submitConfig
                .removeClass("uk-animation-reverse")
                .removeAttr("hidden");
            return;
        }

        $submitConfig
            .removeClass("warningColor")
            .addClass("okColor")
            .removeAttr("uk-tooltip");
        $submitConfig.find(".icon").attr("uk-icon", "check");
        $submitConfig.removeClass("uk-animation-reverse").removeAttr("hidden");

        obj.configEditor.isValid = true;
        validatorElem.removeClass("error");
        obj.configEditor.validInputData = editorVal;
        // super scuff
        if (obj.configEditor.loadTable) {
            delete obj.configEditor.loadTable;
            const message = `Redudant or invalid Configuration input options has been cleansed by the system`;
            createGlobalNotification(message);
            obj.createTable();
        }
    };

    this.createTable = function () {
        const { top } = $("#tableContainer")[0].getBoundingClientRect();

        const {
            isValid,
            isValidWithErrors,
            lastCleansedInput,
            validInputData,
        } = obj.configEditor;
        // console.log({
        //     isValid,
        //     isValidWithErrors,
        //     lastCleansedInput,
        //     validInputData,
        // });
        // debugger;
        if (!isValid && !isValidWithErrors) return;
        else if (!isValid && isValidWithErrors) {
            $("#submitConfig").addClass("uk-animation-reverse");
            setTimeout((_) => $("#submitConfig").attr("hidden", true));
            // const message = `Redudant or invalid Configuration input options has been cleansed by the system`;
            // configGlobalNotification(message);
            // super scuff
            obj.configEditor.loadTable = true;

            if ($("#tableContainer p"))
                $("#tableContainer p").text("...generating");
            return setEditorValue(obj.configEditor.editorO, {
                ...lastCleansedInput,
            });
            // hope noone looks at this
        } else if (isValid && !jQuery.isEmptyObject(validInputData)) {
            obj.generateInternalTableConfig();
            setTimeout(
                (_) => window.scrollTo({ top, behavior: "smooth" }),
                200
            );
        }
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
            if (!Array.isArray(this.cellMetadata.type)) this.showInput();
            else this.showDropdown();
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
                // setTimeout(() => {
                //     $cellStore
                //         .text($tempInput.val())
                //         .attr("hidden", false)
                //         .addClass("uk-animation-slide-right-small");
                //     $tempInput.remove();

                //     this.midEdit = false;
                // }, 250);
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
            // $tempSelect.trigger("focus");
            // $tempSelect.on("focusout", () => {
            //     $tempSelect.removeClass("uk-animation-fade");
            //     setTimeout(() => {
            //         $cellStore
            //             .text($tempSelect.val())
            //             .attr("hidden", false)
            //             .addClass("uk-animation-fade");
            //         $tempSelect.remove();
            //         this.midEdit = false;
            //     }, 250);
            // });
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
        const tableData = [...inputEditor.validInputData];
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
                // console.log({ objToReturn });
                return objToReturn;
            });
        });

        this.generateTable();
    };

    this.generateTable = function () {
        const { isValid: isValidInputEditorData, validInputData } = {
            ...inputEditor,
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

        $("#tableContainer tbody td .editable-cell").each(function () {
            var $this = $(this);
            var col = $this.closest("td").index();
            var row = $this.closest("tr").index();

            // console.log([col, row]);

            if (!fullState[row][col].editCellInst)
                fullState[row][col].editCellInst = new EditableCell(col, row);
            // else fullState[row][col].editCellInst.processInput();
        });

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
        // obj.inputEditor.editorO = editorFactory("specifyDataEditor");
        // const tableEditor = obj.inputEditor.editorO;
        // makeAceEditorResizable(tableEditor);

        obj.configEditor.editorO = editorFactory("specifyConfigEditor");
        const configEditor = obj.configEditor.editorO;
        makeAceEditorResizable(configEditor);

        // setEditorValue(tableEditor, {
        //     data: [...obj.defaultInputEditorData],
        // });
        // tableEditor.clearSelection();

        setEditorValue(configEditor, { ...obj.defaultConfigEditorData });
        configEditor.clearSelection();

        // tableEditor.session.on(
        //     "change",
        //     debounce(obj.validateDataInput, 1000, {
        //         leading: false,
        //         trailing: true,
        //     })
        // );

        configEditor.session.on(
            "change",
            debounce(this.validateConfigInput, 1000, {
                leading: false,
                trailing: true,
            })
        );

        inputEditor.validateInput();
    };
})();
