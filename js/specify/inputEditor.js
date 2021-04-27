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
        $valid: $("#submitInput"),
        $invalid: $("#inputInvalidSyntax"),
        $validator: $("#inputValidator"),
        $configOverlay: $("#configOverlayHandler"),
        classes: {
            okBorder: "okBorder",
            warningBorder: "warningBorder",
            animSlideBotMed: "uk-animation-slide-bottom-medium",
            reverseAnim: "uk-animation-reverse",
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
            { warningBorder, okBorder } = this.domComponents.classes;

        setTimeout(() => {
            if (this.inputEditorState.isValid)
                $validator.removeClass(warningBorder).addClass(okBorder);
            else $validator.addClass(warningBorder).removeClass(okBorder);
        }, smallTimeout);
    }

    disableConfigEditor() {
        const $configOverlay = this.domComponents.$configOverlay,
            { reverseAnim } = this.domComponents.classes.reverseAnim;

        $configOverlay.removeClass(reverseAnim);
        setTimeout((_) => {
            $configOverlay.removeAttr("hidden");
        }, hideTimeout);
    }

    hideInputHeaders() {
        const { $validator, $valid, $invalid, classes } = this.domComponents,
            { okBorder, warningBorder, animSlideBotMed, reverseAnim } = classes;

        $validator.removeClass(warningBorder).removeClass(okBorder);

        $valid.removeClass(animSlideBotMed);
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

        if (editorVal.replace(/\s+/g, "") == "[]")
            return this.setEditorVal({
                data: [...defaultInputEditorData],
            });

        try {
            editorVal = JSON.parse(editorVal);
        } catch (e) {
            return this.setValid(false);
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
        if (!this.inputEditorState.isValid) return;
        $("#configOverlayHandler").addClass("uk-animation-reverse");
        setTimeout((_) => {
            $("#configOverlayHandler").attr("hidden", true);
            configEditor.validateConfigInput();
        }, hideTimeout);
    }
}

const inputEditor = new InputEditor("specifyDataEditor");
