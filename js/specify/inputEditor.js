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
    editorO = null;
    isValid = true;
    invalidJSONelem = null;
    $invalid = $("#inputInvalidSyntax");
    $valid = $("#submitInput");
    $validator = $("#inputValidator");
    okBorder = "okBorder";
    warningBorder = "warningBorder";
    animationClass = "uk-animation-slide-bottom-medium";
    reverseAnimClass = "uk-animation-reverse";
    notificationElem = null;
    validInputData = null;
    dimensions = {
        maxRows: 30,
        maxCols: 10,
        numRows: defaultInputEditorData.length - 1,
        numCols: defaultInputEditorData[0].length,
    };

    // configures ace editor
    constructor(editorId) {
        this._editorO = editorFactory(editorId);
        const editor = this._editorO;

        makeAceEditorResizable(editor);

        this.setEditorVal({ data: [...defaultInputEditorData] });
        editor.clearSelection();

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
        this.notificationElem = UIkit.notification({
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

    createGlobalNotification(message) {
        if (this.notificationElem && this.notificationElem._connected) {
            UIkit.util.once(document, "close", function (evt) {
                if (evt.detail[0] === this.notificationElem) {
                    this.UIKitNotification(message);
                }
            });
            this.notificationElem.close(false);
        } else this.UIKitNotification(message);
    }

    setValid(validity) {
        this.isValid = !!validity;
        // this.validationBadge(this.isValid);

        setTimeout(() => {
            if (this.isValid)
                this.$validator
                    .removeClass(this.warningBorder)
                    .addClass(this.okBorder);
            else
                this.$validator
                    .removeClass(this.okBorder)
                    .addClass(this.warningBorder);
        }, smallTimeout);
    }

    disableConfigEditor() {
        $("#configOverlayHandler").removeClass("uk-animation-reverse");
        setTimeout((_) => {
            $("#configOverlayHandler").removeAttr("hidden");
        }, hideTimeout);
    }

    hideInputHeaders() {
        this.$validator
            .removeClass(this.warningBorder)
            .removeClass(this.okBorder);
        const animationClass = this.animationClass,
            reverseAnimClass = this.reverseAnimClass;
        this.$valid.removeClass(animationClass);
        this.$invalid.removeClass(animationClass);
        setTimeout(() => {
            this.$valid.addClass(`${animationClass} ${reverseAnimClass}`);
            this.$invalid.addClass(`${animationClass} ${reverseAnimClass}`);
        }, smallTimeout);
        setTimeout(() => {
            this.$valid.attr("hidden", "true");
            this.$invalid.attr("hidden", "true");
        }, hideTimeout);
    }

    toggleHeader({ valid }) {
        const animationClass = this.animationClass,
            reverseAnimClass = this.reverseAnimClass,
            toHide = valid ? `$invalid` : `$valid`,
            toShow = valid ? `$valid` : `$invalid`;

        setTimeout(() => {
            // hide + disable submit button
            this[toHide].removeClass(`${animationClass} ${reverseAnimClass}`);
            setTimeout(() => {
                this[toHide].addClass(`${animationClass} ${reverseAnimClass}`);
            }, smallTimeout);
            setTimeout(() => this[toHide].attr("hidden", "true"), hideTimeout);

            // show error message
            this[toShow].removeClass(`${animationClass} ${reverseAnimClass}`);
            setTimeout(() => {
                this[toShow].addClass(animationClass).removeAttr("hidden");
            }, smallTimeout);
        }, hideTimeout);
    }

    createInvalidNotification(message) {
        this.$valid.attr("disabled", true);
        this.$invalid.find(".text").text(message);
        this.toggleHeader({ valid: false });
    }

    showValidInput() {
        this.$valid.removeAttr("disabled");
        this.toggleHeader({ valid: true });
    }

    validateInput = () => {
        this.validInputData = [];
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

            if (!this.dimensions.numRows) {
                this.setValid(false);
                const invalidJSONMessage = "The table must have at least 1 row";

                return this.createInvalidNotification(invalidJSONMessage);
            }

            if (
                this.dimensions.numRows > this.dimensions.maxRows ||
                this.dimensions.numCols > this.dimensions.maxCols
            ) {
                this.setValid(false);
                const invalidJSONMessage =
                    "The table supports only up to 30 rows and 10 columns";
                return this.createInvalidNotification(invalidJSONMessage);
            }

            editorVal.data.forEach((row) => {
                if (row.length != this.dimensions.numCols) throw "";
            });
        } catch (e) {
            this.setValid(false);
            const invalidJSONMessage = "Invalid table dimensions";
            return this.createInvalidNotification(invalidJSONMessage);
        }

        this.validInputData = editorVal.data;

        // clean leftover notifications if exist
        if (this.notificationElem && this.notificationElem._connected)
            this.notificationElem.close(false);
        this.setValid(true);

        this.showValidInput();
    };

    configureInput() {
        if (!this.isValid) return;
        $("#configOverlayHandler").addClass("uk-animation-reverse");
        setTimeout((_) => {
            $("#configOverlayHandler").attr("hidden", true);
            specify.validateConfigInput();
        }, hideTimeout);
    }
}

const inputEditor = new InputEditor("specifyDataEditor");
// Object.freeze(inputEditor);
