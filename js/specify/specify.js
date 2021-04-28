$(function () {
    specify.init();
});

const specify = new (function () {
    const obj = this;

    this.defaultInputEditorData = defaultInputEditorData;
    this.defaultConfigEditorData = defaultConfigEditorData;

    this.determineColumnTypeSemblance = function (typeSemblance, table) {
        const { maxEnumValues, emailRegex } = configEditorConstants;

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
            const { fullState } = configEditor.configEditorState;
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
            if (!Array.isArray(this.cellMetadata.type)) this.renderInput();
            else this.renderDropdown();
        }

        renderInput() {
            const $cellContainer = this.$cellContainer;
            const $cellStore = this.$cellStore;
            let originalVal = $cellStore.text().trim();
            $cellStore
                .attr("hidden", true)
                .removeClass("uk-animation-slide-right-small");

            const { type } = this.cellMetadata;
            const { emailRegex } = configEditorConstants;
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
            });
        }

        renderDropdown() {
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
        }

        validateInput = function (val) {
            const { min, max, type } = this.cellMetadata;
            const {
                minInputLength,
                maxInputLength,
                emailRegex,
            } = configEditorConstants;

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
        let { typeSemblance, validConfigData } = configEditor.configEditorState;

        // console.log(`generateInternalTableConfig`);
        // console.log({ typeSemblance, validConfigData });

        const tableData = [...inputEditor.inputEditorState.validInputData];
        tableData.shift(); // remove headers
        obj.determineColumnTypeSemblance(typeSemblance, tableData);

        // editable and markers are at the global level
        const { editable, markers, cells } = validConfigData;
        configEditor.configEditorState.fullState = tableData.map(
            (_, rowIdx) => {
                return tableData[rowIdx].map((col, colIdx) => {
                    let objToReturn = { value: col, editable };
                    if (markers == true)
                        objToReturn.markers =
                            configEditorConstants.defaultMarkerColors;
                    else if (Array.isArray(markers))
                        objToReturn.markers = [...markers];
                    const correspondingCell = cells
                        ? cells[`r${rowIdx}c${colIdx}`]
                        : {};
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
            }
        );

        // console.log({
        //     fullStateInObj: configEditor.configEditorState.fullState,
        //     typeSemblance,
        //     typeSemblanceInObj: configEditor.configEditorState.typeSemblance,
        // });

        this.generateTable();
    };

    this.generateTable = function () {
        const {
            isValid: isValidInputEditorData,
            validInputData,
        } = inputEditor.inputEditorState;

        const {
            isValid: isValidConfigEditorData,
            fullState,
            validConfigData,
        } = configEditor.configEditorState;
        const { sortable } = validConfigData;

        if (!(isValidInputEditorData && isValidConfigEditorData)) return;

        const thead = [...validInputData[0]];

        const { $tableContainer, classes } = inputEditor.domComponents,
            { animSlideRightMed, animSlideRightSmall, reverseAnim } = classes,
            { top } = $tableContainer[0].getBoundingClientRect();

        $tableContainer.removeClass(
            `${animSlideRightMed} ${animSlideRightSmall} ${reverseAnim}`
        );

        setTimeout(() => {
            $tableContainer.addClass(`${animSlideRightMed} ${reverseAnim}`);
            setTimeout(() => {
                $tableContainer.empty();
                $tableContainer.removeClass(
                    `${animSlideRightMed} ${animSlideRightSmall} ${reverseAnim}`
                );
                makeTable();
            }, hideTimeout);
        }, smallTimeout);

        function makeTable() {
            const $table = $(`<table class="tableSorter uk-table uk-table-hover uk-table-divider uk-table-small mb6px">
            <thead>
                <tr></tr>
            </thead>
            <tbody></tbody>
        </table>`);

            $table
                .find(`tr`)
                .append(
                    thead.map((el) => `<th class="uk-table-shrink">${el}</th>`)
                );

            // element blueprints
            const trBp = `<tr class="minRowHeight"></tr>`,
                tdBp = `<td class="uk-width-small cell-inherit-height"></td>`,
                colorWrapperBp = `<div class="cellColorWrapper"></div>`,
                colorDropBtnBp = `<a class="cellColorBtn ripple-cell-light" uk-marker></a>`,
                colorDropWrapperBp = `<div uk-drop="mode: click; pos: top-center; offset: 12"></div>`,
                colorDropContBp = `<div class="uk-card uk-card-small uk-card-default specifyBorderRadius mui-shadow2 uk-flex uk-flex-around p12px"></div>`,
                colorBp = `<a class="colorBtn mui-shadow1 ripple-cell"></a>`;

            fullState.forEach((row) => {
                const $tr = $(trBp).append(
                    row.map((cell) => {
                        const { markers } = cell,
                            $td = $(tdBp);
                        // first markers
                        if (markers) {
                            const $colorWrapper = $(colorWrapperBp);
                            const $colorDropBtn = $(colorDropBtnBp);
                            const $colorDropWrapperBp = $(colorDropWrapperBp);
                            const $colorDropContBp = $(colorDropContBp);

                            $td.append($colorWrapper);
                            $colorWrapper.append($colorDropBtn);
                            $colorWrapper.append($colorDropWrapperBp);
                            $colorDropWrapperBp.append($colorDropContBp);

                            const colors = markers.map((color) => {
                                const $colorBp = $(colorBp);
                                $colorBp.css("backgroundColor", color);
                                $colorBp.on("click", function () {
                                    $(this)
                                        .closest(`.cellColorWrapper `)
                                        .css("backgroundColor", color);
                                });
                                return $colorBp;
                            });

                            $colorDropContBp.append(colors);

                            if (!cell.editable) {
                                $colorWrapper.append(`<p>${cell.value}</p>`);
                            } else {
                                $colorWrapper.append(
                                    $(`<div class="cellCont editable-cell">
                        <div class="cellStore">${cell.value}</div>
                    </div>`)
                                );
                            }
                        } else {
                            // then editability
                            if (!cell.editable) {
                                $td.append(cell.value);
                            } else {
                                $td.append(
                                    $(`<div class="cellCont editable-cell">
<div class="cellStore">${cell.value}</div>
</div>`)
                                );
                            }
                        }

                        return $td;
                    })
                );
                $table.find("tbody").append($tr);
            });

            $tableContainer.addClass(`${animSlideRightSmall}`).append($table);

            setTimeout(() => {
                try {
                    window.scrollTo({ top: top - 72, behavior: "smooth" });
                } catch (e) {}
            }, shorterTimeout);

            $table.find("tbody td .editable-cell").each(function () {
                var $this = $(this);
                var col = $this.closest("td").index();
                var row = $this.closest("tr").index();

                if (!fullState[row][col].editCellInst)
                    fullState[row][col].editCellInst = new EditableCell(
                        col,
                        row
                    );
            });

            Waves.attach(".ripple-cell", ["waves-circle"]);
            Waves.attach(".ripple-cell-light", ["waves-circle", "waves-light"]);
            Waves.init();

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
        }
    };

    this.init = function () {
        Waves.attach(".uk-icon-button.ripple", ["waves-circle"]);
        Waves.attach(".uk-button.ripple", ["waves-button"]);
        Waves.init();

        inputEditor.validateInput();
        // inputEditor.configureInput();
    };
})();
