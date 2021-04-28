// immutable singleton reference links:
/**
 * https://css-tricks.com/implementing-private-variables-in-javascript/
 * https://www.sitepoint.com/javascript-design-patterns-singleton/
 * http://www.adequatelygood.com/JavaScript-Module-Pattern-In-Depth.html
 */

/**
 * editorValue
 * configuration
 * notification
 */

class InputEditor {
    obj = this;
    _editorO = null;
    inputEditorState = {
        isValid: true,
        validInputData: null,
    };
    dimensions = {
        maxRows: 30,
        maxCols: 10,
        numRows: defaultInputEditorData.length - 1,
        numCols: defaultInputEditorData[0].length,
    };
    domComponents = {
        notificationElem: null,
        $inputEditorCard: $("#inputEditorCard"),
        $configEditorCard: $("#configEditorCard"),
        $tableWrapper: $("#tableWrapper"),
        $tableContainer: $("#tableContainer"),
        $emptyTable: $(
            `<p class="uk-position-center uk-margin-remove">Table is empty until Specified</p>`
        ),
        $valid: $("#submitInput"),
        $invalid: $("#inputInvalidSyntax"),
        $validator: $("#inputValidator"),
        $configOverlay: $("#configOverlayHandler"),
        classes: {
            okBorder: "okBorder",
            invalidBorder: "invalidBorder",
            animSlideRightSmall: "uk-animation-slide-right-small",
            animSlideRightMed: "uk-animation-slide-right-medium",
            animSlideBotMed: "uk-animation-slide-bottom-medium",
            reverseAnim: "uk-animation-reverse",
            show: "show",
        },
    };

    // configures ace editor
    constructor(editorId) {
        this._editorO = editorFactory(editorId);
        const editor = this._editorO;

        makeAceEditorResizable(editor);

        this.setEditorVal({ data: [...defaultInputEditorData] });
        editor.clearSelection();

        // debouncer works to only consider editor value once the user stopps typing for a `deoubceTimer` amount of time
        editor.session.on(
            "change",
            debounce(this.validateInput, debounceTimer, {
                leading: false,
                trailing: true,
            })
        );
    }

    setEditorVal(value) {
        this._editorO.setValue(JSON.stringify(value, null, 2));
    }

    getEditorVal() {
        return this._editorO.getValue();
    }

    resetData = () => {
        this.setEditorVal({
            data: [...defaultInputEditorData],
        });
    };

    UIKitNotification(message) {
        this.domComponents.notificationElem = UIkit.notification({
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

    setValid(validity) {
        this.inputEditorState.isValid = !!validity;

        const $validator = this.domComponents.$validator,
            { invalidBorder, okBorder } = this.domComponents.classes;

        setTimeout(() => {
            if (this.inputEditorState.isValid)
                $validator.removeClass(invalidBorder).addClass(okBorder);
            else $validator.addClass(invalidBorder).removeClass(okBorder);
        }, smallTimeout);
    }

    disableConfigEditor() {
        const { $configOverlay, classes } = this.domComponents,
            { reverseAnim, animSlideRightMed } = classes;

        $configOverlay.remove(animSlideRightMed).removeClass(reverseAnim);

        setTimeout(() => {
            $configOverlay.addClass(animSlideRightMed);
        }, smallTimeout);
        setTimeout((_) => {
            $configOverlay.removeAttr("hidden");
        }, hideTimeout);
    }

    hideInputHeaders() {
        const {
                $inputEditorCard,
                $configEditorCard,
                $tableWrapper,
                $tableContainer,
                $emptyTable,
                $validator,
                $valid,
                $invalid,
                classes,
            } = this.domComponents,
            {
                okBorder,
                invalidBorder,
                animSlideRightSmall,
                animSlideRightMed,
                animSlideBotMed,
                reverseAnim,
                show,
            } = classes;

        let tableIsEmpty;
        try {
            tableIsEmpty = $(":first-child", $tableContainer).is("p");
        } catch (e) {
            tableIsEmpty = false;
        }

        this.disableConfigEditor();

        // card shadows
        $inputEditorCard.addClass(show);
        $configEditorCard.removeClass(show);
        $tableWrapper.removeClass(show);

        // table container hide
        if (!tableIsEmpty) {
            $tableContainer
                .removeClass(animSlideRightMed)
                .removeClass(reverseAnim);
        }

        $validator.removeClass(invalidBorder).removeClass(okBorder);

        $valid.removeClass(animSlideBotMed);
        $invalid.removeClass(animSlideBotMed);
        setTimeout(() => {
            $valid.addClass(`${animSlideBotMed} ${reverseAnim}`);
            $invalid.addClass(`${animSlideBotMed} ${reverseAnim}`);
            !tableIsEmpty &&
                $tableContainer.addClass(`${animSlideRightMed} ${reverseAnim}`);
        }, smallTimeout);

        setTimeout(() => {
            $valid.attr("hidden", "true");
            $invalid.attr("hidden", "true");
            if (!tableIsEmpty) {
                $tableContainer.empty().append($emptyTable);
                $tableContainer.removeClass(
                    `${animSlideRightMed} ${reverseAnim}`
                );
                setTimeout(() => {
                    $tableContainer.addClass(animSlideRightSmall);
                });
            }
        }, hideTimeout);
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

    createInvalidNotification(message) {
        const { $valid, $invalid } = this.domComponents;

        $valid.attr("disabled", true);
        $invalid.find(".text").text(message);
        this.toggleHeader({ valid: false });
    }

    showValidInput() {
        const { $valid } = this.domComponents;

        $valid.removeAttr("disabled");
        this.toggleHeader({ valid: true });
    }

    validateInput = () => {
        this.inputEditorState.validInputData = [];
        this.dimensions.numRows = 0;
        this.dimensions.numCols = 0;

        this.hideInputHeaders();

        let editorVal = this.getEditorVal();

        if (editorVal.replace(/\s+/g, "") == "") this.setValid(false);

        try {
            editorVal = JSON.parse(editorVal);
        } catch (e) {
            this.setValid(false);
            const invalidJSONMessage = "Invalid JSON";
            return this.createInvalidNotification(invalidJSONMessage);
        }

        try {
            const inputKeys = Object.keys(editorVal);
            if (inputKeys.length != 1 || inputKeys[0] != "data") throw "";
        } catch (e) {
            this.setValid(false);
            const invalidJSONMessage = "Invalid Input Editor form";
            return this.createInvalidNotification(invalidJSONMessage);
        }

        try {
            this.dimensions.numRows = editorVal.data.length - 1;
            this.dimensions.numCols = editorVal.data[0].length;

            const { maxRows, maxCols, numRows, numCols } = this.dimensions;

            if (!this.dimensions.numRows) {
                this.setValid(false);
                const invalidJSONMessage = "The table must have at least 1 row";
                return this.createInvalidNotification(invalidJSONMessage);
            }

            if (numRows > maxRows || numCols > maxCols) {
                this.setValid(false);
                const invalidJSONMessage =
                    "The table supports only up to 30 rows and 10 columns";
                return this.createInvalidNotification(invalidJSONMessage);
            }

            editorVal.data.forEach((row) => {
                if (row.length != numCols) throw "";
            });
        } catch (e) {
            this.setValid(false);
            const invalidJSONMessage = "Invalid table dimensions";
            return this.createInvalidNotification(invalidJSONMessage);
        }

        this.inputEditorState.validInputData = editorVal.data;

        // clean leftover notifications if exist
        this.closeGlobalNotification();
        this.setValid(true);

        this.showValidInput();
    };

    configureInput() {
        const { $configOverlay, classes } = this.domComponents,
            { reverseAnim } = classes;
        if (!this.inputEditorState.isValid) return;
        $configOverlay.addClass(reverseAnim);
        setTimeout((_) => {
            $configOverlay.attr("hidden", true);
            configEditor.validateConfigInput();
        }, hideTimeout);
    }
}

const inputEditor = new InputEditor("specifyDataEditor");
