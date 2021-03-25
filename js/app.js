$(function () {
    specify.init();
});

/**
   * 1. validate data, 
  *       valid array, if not issue a warning and disable table or something
   *      trim if incorrect matrix dimennsions or too large, otherwise throw an error and 
   * 2. validate config:
   *  validate proper JSON by try { JSON.parse(obj) } catch(e) { }
   *  remove properties at top level: !globalFeatures : { globalFeatures, inputs }
   *      inside of globalFeatures, acceptable are : {
              editable: boolean, sortable: boolean, markers: {
                  enable: [boolean], markerColors: [/^#[0-9A-F]{6}$/]
              }
          },
          inputs: {
              columns: {
                  [`c${tableData[0].length}`]: {
                      valueType: "number" || "email",
                      restrictedToValues: [] <- must have length,
                      min: > 0, <= 255 
                      max: > 0 && <= 255 && >= min
                  } || "number" || "email",
  
              },
              cells: {
                  valueType: "number" || "email",
                      restrictedToValues: [] <- must have length,
                      min: > 0, <= 255 
                      max: > 0 && <= 255 && >= min
                  } || "number" || "email"
              }
          }
   * 3. 
   */

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
            "expended",
            "2008-09-28T23:15:00.000Z",
            1222643700,
            "Initially scheduled for 23–25 Sep, carried dummy payload...",
        ],
        [
            "Merlin3C",
            "expended",
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
            "expended",
            "2010-12-08T15:43:00.000Z",
            1291822980,
            "First flight of Dragon",
        ],
        ["B0005", "expended", "2012-05-22T07:44:00.000Z", 1337672640, "null"],
        [
            "B0006",
            "expended",
            "2012-10-08T00:35:00.000Z",
            1349656500,
            "Suffered engine out at T+1:19 but primary mission successful",
        ],
        ["B0007", "expended", "2013-03-01T19:10:00.000Z", 1362165000, "null"],
        [
            "B1003",
            "destroyed",
            "2013-09-29T16:00:00.000Z",
            1380470400,
            "First flight of Falcon 9 v1.1 upgrade, first Spacex flight from Vandenberg",
        ],
        ["B1004", "expended", "2013-12-03T22:41:00.000Z", 1386110460, "null"],
        ["B1005", "expended", "2014-01-06T18:06:00.000Z", 1389031560, "null"],
        [
            "B1006",
            "destroyed",
            "2014-04-18T19:25:00.000Z",
            1397849100,
            "Broke up after sucessful water landing",
        ],
        [
            "B1007",
            "destroyed",
            "2014-07-14T15:15:00.000Z",
            1405350900,
            "Broke up after sucessful water landing",
        ],
        ["B1008", "expended", "2014-08-05T08:00:00.000Z", 1407225600, "null"],
        ["B1011", "expended", "2014-09-07T05:00:00.000Z", 1410066000, "null"],
        [
            "B1010",
            "expended",
            "2014-09-21T05:52:00.000Z",
            1411278720,
            "Broke up after sucessful water landing",
        ],
        [
            "B1012",
            "destroyed",
            "2015-01-10T09:47:00.000Z",
            1420883220,
            "Destroyed on impact with droneship, grid fin hydraulic fluid depleted",
        ],
        [
            "B1013",
            "destroyed",
            "2015-02-11T23:03:00.000Z",
            1423695780,
            "Broke up after sucessful water landing",
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

    this.defaultConfigEditorData = {
        editable: false,
        sortable: true,
        markers: true,
        // columns: {
        //     c2: {
        //         type: ["Female", "Male"],
        //     },
        //     c3: {
        //         type: "number",
        //     },
        //     c4: {
        //         type: "email",
        //     },
        // },
        cells: {
            r0c1: {
                editable: true,
            },
            r0c2: {
                editable: true,
                type: "number",
                min: 17,
                max: 19,
            },
            r3c3: {
                editable: true,
                type: "number",
                min: 17,
                max: 19,
            },
        },
    };

    this.configEditor = {
        editorO: null,
        isValid: true,
        validatorElem: $("#configValidator"),
        defaultMarkerColors: ["#1e87f0", "#222", "#f8f8f8"],
        minInputLength: 0,
        maxInputLength: 255,
        maxEnumValues: 10,
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
        const { numRows, numCols } = { ...obj.inputEditor.dimensions };

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
                            editorVal.markers =
                                configEditor.defaultMarkerColors;
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
            const message = `cells must be an object`;
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
                    if (cellDims[0] > numRows) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.invalidCellIdentifiers.${key}`,
                            ["invalidRowDims"]
                        );
                    }
                    if (cellDims[1] > numCols) {
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
                            [{ [valueKey]: cells[cell][valueKey] }]
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
                        delete cells[cell].editable;
                    } else {
                        if (
                            (editorVal.editable && cells[cell].editable) ||
                            (!editorVal.editable && !cells[cell].editable)
                        ) {
                            // redundant
                            putAtObjectPath(
                                configEditor.errorO,
                                `cells.validCellIdentifiers.${cell}.invalidValues`,
                                {
                                    redundantEditabilityDeclaration: {
                                        globalEditability: editorVal.editable,
                                        cellProps: { ...cells[cell] },
                                    },
                                }
                            );
                            delete cells[cell].editable;
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
                    const type = cells[cell].type;
                    const minVal = cells[cell].min;
                    const maxVal = cells[cell].min;
                    let numMin, numMax;

                    if (!allowedKeys.type.includes(type)) {
                        // non existant type
                        recordError(
                            configEditor.errorO,
                            `cells.validCellIdentifiers.${cell}.invalidValues`,
                            {
                                nonExistantType: type,
                            }
                        );
                        delete cells[cell].type;
                    }

                    if (
                        isNaN(minVal) &&
                        !isNaN(minVal) &&
                        (minVal < configEditor.minInputLength ||
                            minVal > configEditor.maxInputLength)
                    ) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.validCellIdentifiers.${cell}.invalidValues`,
                            {
                                invalidMinVal: minVal,
                            }
                        );
                        delete cells[cell].min;
                    } else {
                        numMin = minVal;
                    }

                    if (
                        isNaN(maxVal) ||
                        (!isNaN(maxVal) &&
                            (maxVal < configEditor.minInputLength ||
                                maxVal > configEditor.maxInputLength))
                    ) {
                        putAtObjectPath(
                            configEditor.errorO,
                            `cells.validCellIdentifiers.${cell}.invalidValues`,
                            {
                                invalidMaxVal: maxVal,
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
                        }
                    }
                }
            });

        if (JSON.stringify(configEditor.errorO).replace(/\s+/g, "") != "{}") {
            console.log({ ...configEditor.errorO });
            obj.setEditorValue(editorO, { ...editorVal });
            const message = `Invalid input has been sanitized. See what was invalid in the devtools`;
            return createNotification(message);
        }

        configEditor.isValid = true;
        validatorElem.removeClass("error");
        configEditor.validInputData = editorVal;
        obj.generateTable();
    };

    this.generateTable = function () {
        const data = { ...obj.inputEditor };
        const config = { ...obj.configEditor };
        const { editable, sortable, markers, cells } = config.validInputData;

        if (!(data.isValid && config.isValid)) return;

        const tableData = [...data.validInputData];
        const thead = tableData[0];
        tableData.shift();
        const tbody = tableData;

        $("#tableContainer").empty().append(
            `<table class="tableSorter uk-table uk-table-hover uk-table-divider uk-table-small uk-table-middle">
                    <thead>
                        <tr></tr>
                    </thead>
                    <tbody></tbody>
                </table>`
        );

        $("#tableContainer tr").append(thead.map((el) => `<th>${el}</th>`));

        tbody.forEach((row) => {
            const tr = $(`<tr></tr>`).append(
                //class="uk-text-nowrap"
                row.map((cell) => `<td>${cell}</td>`)
            );
            $("#tableContainer tbody").append(tr);
        });

        if (sortable) {
            $("#tableContainer table").tableSort({
                animation: "slide",
                speed: 500,
            });

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

        obj.configEditor.editorO = editorFactory("specifyConfigEditor");
        const configEditor = obj.configEditor.editorO;

        obj.setEditorValue(tableEditor, {
            data: [...obj.defaultInputEditorData],
        });
        tableEditor.clearSelection();

        obj.setEditorValue(configEditor, { ...obj.defaultConfigEditorData });
        configEditor.clearSelection();

        obj.validateDataInput();

        tableEditor.session.on(
            "change",
            debounce(obj.validateDataInput, 500, {
                leading: false,
                trailing: true,
            })
        );
        configEditor.session.on(
            "change",
            debounce(obj.validateConfigInput, 500, {
                leading: false,
                trailing: true,
            })
        );
    };

    function removeUncessaryListeners() {
        const globalEditability = !!obj.tableConfig?.globalFeatures.editable;
        $("table td").on("dblclick", function () {
            const row = $(this).closest("tr").index();
            const column = $(this).index();
            console.log({ row, column });
            obj.tableConfig?.inputs?.cells[`r${row}c${$(this).index()}`];
            if (globalEditability) {
            } else {
                // if (cell.restrictedToValues?.length || cell.min || cell.max) {
                // } else {
                //   $();
                // }
            }
        });
    }
})();
