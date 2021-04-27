const configEditorConstants = {
    defaultMarkerColors: ["#1e87f0", "#222", "#f8f8f8"],
    minInputLength: 0,
    maxInputLength: 255,
    determineEnumOnSimilarValues: 3,
    maxEnumValues: 3,
    emailRegex: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    colorRegex: /^#([0-9A-F]{3}){1,2}$/i,
    allowedKeys: {
        globalFeatures: ["editable", "sortable", "markers"],
        global: ["editable", "sortable", "cells"], // "markers", "columns",
        // markers: ["boolean", "array"], // not curr needed with code
        // columns: /^c[0-9]+&/, // on pause for column feature
        // columnVals: ["type", "editable", "markers", "min", "max"],
        editable: "boolean",
        sortable: "boolean",
        type: ["text", "number", "email"],
        cells: /^r[0-9]+c[0-9]+$/,
        // if editable == false, type/min/max dropped
        // if type == enum, min/max dropped
        cellVals: ["editable", "type", "min", "max"],
    },
};
Object.freeze(configEditorConstants);

class ConfigEditor {
    obj = this;
    _editorO = null;
    configEditorState = {
        isValid: true,
        isValidWithErrors: null, // set to true to test automatic message setting
        validConfigData: null,
        errorO: null,
        fullState: null,
        typeSemblance: null,
    };
    domComponents = {
        notificationElem: null,
        $valid: $("#submitConfig"),
        $invalid: $("#configInvalidSyntax"),
        $validator: $("#configValidator"),
        classes: {
            okColor: "okColor",
            warningColor: "warningColor",
            okBorder: "okBorder",
            warningBorder: "warningBorder",
            invalidBorder: "invalidBorder",
            animSlideBotMed: "uk-animation-slide-bottom-medium",
            reverseAnim: "uk-animation-reverse",
        },
    };

    setEditorVal(value) {
        this._editorO.setValue(JSON.stringify(value, null, 2));
    }

    getEditorVal() {
        return this._editorO.getValue();
    }

    UIKitNotification(message = "The JSON structure provided is invalid") {
        this.domComponents.notificationElem = UIkit.notification({
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

    closeGlobalNotification() {
        const notificationElem = this.domComponents.notificationElem;

        if (notificationElem && notificationElem._connected)
            notificationElem.close(false);
    }

    createGlobalNotification(message) {
        const notificationElem = this.domComponents.notificationElem;

        if (notificationElem && notificationElem._connected) {
            UIkit.util.once(document, "close", function (evt) {
                if (evt.detail[0] === notificationElem) {
                    this.UIKitNotification(message);
                }
            });
            notificationElem.close(false);
        } else this.UIKitNotification(message);
    }

    // configures ace editor
    constructor(editorId) {
        this._editorO = editorFactory(editorId);
        const editor = this._editorO;

        makeAceEditorResizable(editor);

        this.setEditorVal({ ...defaultConfigEditorData });
        editor.clearSelection();

        // debouncer works to only consider editor value once the user stopps typing for a `deoubceTimer` amount of time
        editor.session.on(
            "change",
            debounce(this.validateConfigInput, debounceTimer, {
                leading: false,
                trailing: true,
            })
        );
    }

    initCleanseState() {
        const { configEditorState } = this;
        configEditorState.isValid = false;
        configEditorState.validConfigData = {};
        configEditorState.errorO = {};
        configEditorState.fullState = {};
        configEditorState.typeSemblance = [];
        this.closeGlobalNotification();
    }

    /* Message display functions */
    hideConfigHeaders() {
        const { $validator, $valid, $invalid, classes } = this.domComponents,
            {
                warningColor,
                okBorder,
                warningBorder,
                invalidBorder,
                animSlideBotMed,
                reverseAnim,
            } = classes;

        $validator
            .removeClass(okBorder)
            .removeClass(warningBorder)
            .removeClass(invalidBorder);

        $valid
            .removeClass(warningColor)
            .removeClass(animSlideBotMed)
            .removeAttr("uk-tooltip")
            .find(".icon")
            .attr("uk-icon", "check");

        $invalid.removeClass(animSlideBotMed);

        setTimeout(() => {
            $valid.addClass(`${animSlideBotMed} ${reverseAnim}`);
            $invalid.addClass(`${animSlideBotMed} ${reverseAnim}`);
        }, smallTimeout);

        setTimeout(() => {
            $valid.attr("hidden", "true");
            $invalid.attr("hidden", "true");
        }, hideTimeout);
    }

    setValid(validity, message) {
        this.configEditorState.isValid = !!validity;

        const { $validator } = this.domComponents,
            {
                okBorder,
                warningBorder,
                invalidBorder,
            } = this.domComponents.classes;

        setTimeout(() => {
            if (this.configEditorState.isValid)
                $validator
                    .removeClass(invalidBorder)
                    .removeClass(warningBorder)
                    .addClass(okBorder);
            else
                $validator
                    .removeClass(okBorder)
                    .removeClass(warningBorder)
                    .addClass(invalidBorder);
        }, smallTimeout);

        if (message) this.createInvalidNotification(message);
    }

    createInvalidNotification(message) {
        const { $valid, $invalid } = this.domComponents;

        $valid.attr("disabled", true);
        $invalid.find(".text").text(message);
        this.toggleHeader({ valid: false });
    }

    showValidInput() {
        const { $valid, classes } = this.domComponents,
            { okColor, warningColor } = classes;

        $valid
            .removeClass(warningColor)
            .addClass(okColor)
            .removeAttr("disabled")
            .removeAttr("uk-tooltip");
        this.toggleHeader({ valid: true });
    }

    toggleHeader({ valid }) {
        const { domComponents } = this,
            { $valid, $invalid, classes } = domComponents,
            {
                animSlideBotMed: animationClass,
                reverseAnim: reverseAnimClass,
            } = classes;

        const toHide = valid ? $invalid : $valid,
            toShow = valid ? $valid : $invalid;

        setTimeout(() => {
            // hide + disable submit button
            toHide.removeClass(`${animationClass} ${reverseAnimClass}`);
            setTimeout(() => {
                toHide.addClass(`${animationClass} ${reverseAnimClass}`);
            }, smallTimeout);
            setTimeout(() => toHide.attr("hidden", "true"), hideTimeout);

            // show error message
            toShow.removeClass(`${animationClass} ${reverseAnimClass}`);
            setTimeout(() => {
                toShow.addClass(animationClass).removeAttr("hidden");
            }, smallTimeout);
        }, hideTimeout);
    }

    /* Cell cleansing */
    validateGlobalVals(editorValue) {
        const { errorO } = this.configEditorState;
        const {
            allowedKeys,
            colorRegex,
            defaultMarkerColors,
            maxEnumValues,
        } = configEditorConstants;

        Object.keys(editorValue).forEach((key) => {
            if (!allowedKeys.global.includes(key)) {
                putAtObjectPath(errorO, "global.invalidKeys", key);
                delete editorValue[key];
            } else if (allowedKeys.globalFeatures.includes(key)) {
                // reconsider this later
                if (key == "markers") {
                    let markers = editorValue.markers;
                    if (Array.isArray(markers)) {
                        markers = markers.filter((color) => {
                            if (!colorRegex.test(color)) {
                                putAtObjectPath(
                                    errorO,
                                    "global.invalidValues.markers.invalidColors",
                                    [color]
                                );
                                return false;
                            }
                            return true;
                        });
                        if (!markers.length) {
                            putAtObjectPath(
                                errorO,
                                "global.invalidValues.markers",
                                "array have length 0"
                            );
                            editorValue.markers = [...defaultMarkerColors];
                        } else if (markers.length > maxEnumValues) {
                            putAtObjectPath(
                                errorO,
                                "global.invalidValues.markers",
                                "array greater than limit"
                            );
                            editorValue.markers.length = maxEnumValues;
                        }
                    } else {
                        if (typeof editorValue.markers != "boolean") {
                            putAtObjectPath(
                                errorO,
                                "global.invalidValues.markers",
                                "value is not a boolean"
                            );
                            editorValue.markers = !!editorValue.markers;
                        }
                    }
                } else {
                    if (typeof editorValue[key] != "boolean") {
                        putAtObjectPath(
                            errorO,
                            `global.invalidValues.${key}`,
                            `value is not a boolean - ${key} is expecting a boolean value`
                        );
                        editorValue[key] = !!editorValue[key];
                    }
                }
            }
        });
    }

    deleteInvalidCellIdentifiers(cells) {
        const { errorO } = this.configEditorState,
            { allowedKeys } = configEditorConstants,
            { numRows, numCols } = inputEditor.dimensions;

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
            if (errorO?.cells?.invalidCellIdentifiers?.[key]) delete cells[key];
        });
    }

    validateCellInputs(cells) {
        const { errorO } = this.configEditorState,
            { allowedKeys } = configEditorConstants;

        Object.keys(cells).forEach((cell) => {
            let cellValueKeys = Object.keys(cells[cell]);

            cellValueKeys.forEach((valueKey) => {
                if (!allowedKeys.cellVals.includes(valueKey)) {
                    putAtObjectPath(
                        errorO,
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
    }

    enforceCellEditability(cells, editorVal) {
        const { errorO } = this.configEditorState;
        Object.keys(cells).forEach((cell) => {
            let cellValueKeys = Object.keys(cells[cell]);
            if (cellValueKeys.includes("editable")) {
                if (typeof cells[cell].editable != "boolean") {
                    //  removed property if not explicitly boolean
                    putAtObjectPath(
                        errorO,
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
                        // redundant - deletes editability value
                        putAtObjectPath(
                            errorO,
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
                    } else if (!editorVal.editable && !cells[cell].editable) {
                        // redundant - deletes cell if table and cell both non editable
                        putAtObjectPath(
                            errorO,
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
                            errorO,
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
    }

    enforceCellRest(cells) {
        const { errorO, maxEnumValues } = this.configEditorState,
            { allowedKeys } = configEditorConstants;

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
                            errorO,
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
                    if (type.length > maxEnumValues) {
                        putAtObjectPath(
                            errorO,
                            `cells.validCellIdentifiers.${cell}.invalidEnumLength`,
                            [
                                {
                                    type: cells[cell].type,
                                    trimmed: true,
                                },
                            ]
                        );

                        type.length = maxEnumValues;
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
                                errorO,
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
                            errorO,
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
                                errorO,
                                `cells.validCellIdentifiers.${cell}.redundantVals`,
                                {
                                    invalidKeys: ["min", "max"].filter((el) => {
                                        if (el == "min")
                                            return minVal && !isNaN(minVal);
                                        else return maxVal && !isNaN(maxVal);
                                    }),
                                    deleted: true,
                                }
                            );
                            delete cells[cell].min;
                            delete cells[cell].max;
                        }
                    }
                } else if (!allowedKeys.type.includes(type)) {
                    // non existant type
                    putAtObjectPath(
                        errorO,
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
                        errorO,
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
                        errorO,
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
                            errorO,
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
    }

    deleteEmptyCells(cells) {
        const { errorO } = this.configEditorState;
        Object.keys(cells).forEach((cell) => {
            if ($.isEmptyObject(cells[cell])) {
                putAtObjectPath(
                    errorO,
                    `cells.validCellIdentifiers.${cell}.emptyCell`,
                    "empty"
                );
                delete cells[cell];
            }
        });
    }

    makeLeftoverCellsEditable(cells) {
        const { errorO } = this.configEditorState;
        Object.keys(cells).forEach((cell) => {
            if (!cells[cell].editable) {
                putAtObjectPath(
                    errorO,
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

    /* Loop function */
    validateConfigInput = () => {
        // cleanse input
        this.initCleanseState();

        // hide header notification/button
        this.hideConfigHeaders();

        if (!inputEditor.inputEditorState.isValid) {
            const message = `Data from Input Editor is marked as invalid`;
            return this.setValid(false, message);
        }

        let editorVal = this.getEditorVal();
        const strippedEditorVal = editorVal.replace(/\s+/g, "");

        if (strippedEditorVal == "") {
            const message = `Configuration Editor cannot be empty`;
            return this.setValid(false, message);
        }

        if (strippedEditorVal == "{}")
            return this.setEditorVal({
                ...defaultConfigEditorData,
            });

        try {
            editorVal = JSON.parse(editorVal);
            if (!editorVal) throw "Configuration Editor cannot be empty";
        } catch (e) {
            const message = `Invalid JSON` || e;
            return this.setValid(false, message);
        }

        const { allowedKeys } = configEditorConstants,
            minRequiredProps = Object.keys(editorVal).filter((key) => {
                return allowedKeys.globalFeatures.includes(key);
            }).length;
        if (!minRequiredProps) {
            const message = `Configuration JSON does not specify minimally required attributes`;
            return this.setValid(false, message);
        }

        // global level keys/values
        this.validateGlobalVals(editorVal);

        const cells = editorVal.cells;

        if (cells && trueTypeOf(cells) != "object") {
            const message = `'cells' must be an object type`;
            return this.setValid(false, message);
        }

        if (cells) {
            // deletes invalid cell identifiers, such as r__cilw
            this.deleteInvalidCellIdentifiers(cells);
            // deletes values other than configEditorConstants.allowedKeys.cellVals
            this.validateCellInputs(cells);
            // delete cells, or cell values if editability is conflicting with global or redundant
            this.enforceCellEditability(cells, editorVal);
            // delete the rest of invalid cell values
            this.enforceCellRest(cells);
            // deletes left over empty cells after cleansing
            this.deleteEmptyCells(cells);
            // for leftover cells, make them explicitly editable when global editability is false
            if (!editorVal.editable) this.makeLeftoverCellsEditable(cells);
        }

        const { errorO } = this.configEditorState;
        const { $validator, $valid } = this.domComponents;
        const {
            okColor,
            warningColor,
            okBorder,
            warningBorder,
            invalidBorder,
        } = this.domComponents.classes;

        this.configEditorState.validConfigData = editorVal;

        console.log({
            validConfigData: this.configEditorState.validConfigData,
        });

        if (!$.isEmptyObject(errorO)) {
            console.log({ ...errorO });
            this.configEditorState.isValid = true;
            this.configEditorState.isValidWithErrors = true;

            const message = `Redundant or invalid Configuration input options will be cleansed by 
            the system.`;

            $validator
                .removeClass(okBorder)
                .removeClass(invalidBorder)
                .addClass(warningBorder);

            $valid
                .removeClass(okColor)
                .addClass(warningColor)
                .removeAttr("disabled")
                .attr("uk-tooltip", message)
                .find(".icon")
                .attr("uk-icon", "warning");

            return this.toggleHeader({ valid: true });
        }

        let reset = this.configEditorState.isValidWithErrors ? true : false;

        this.setValid(true);
        this.configEditorState.isValidWithErrors = false;
        this.showValidInput();

        if (reset) {
            const message = `Redudant or invalid Configuration input options have been cleansed by the system`;
            this.createGlobalNotification(message);
            this.callCreateTable();
        }
    };

    callCreateTable = () => {
        const { top } = $("#tableContainer")[0].getBoundingClientRect(),
            {
                isValid,
                isValidWithErrors,
                validConfigData,
            } = this.configEditorState;

        if (!isValid) return;
        // re-process config data
        else if (isValid && isValidWithErrors)
            this.setEditorVal({ ...validConfigData });
        else if (isValid && !isValidWithErrors) {
            specify.generateInternalTableConfig();
            // setTimeout(
            //     (_) => window.scrollTo({ top, behavior: "smooth" }),
            //     200
            // );
        } else {
            throw "Impossible state";
        }
    };
}

const configEditor = new ConfigEditor("specifyConfigEditor");
