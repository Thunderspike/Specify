// lodash's debounce
const nativeMax = Math.max;
const nativeMin = Math.min;
function debounce(func, wait, options) {
    let lastArgs,
        lastThis,
        maxWait,
        result,
        timerId,
        lastCallTime,
        lastInvokeTime = 0,
        leading = false,
        maxing = false,
        trailing = true;
    if (typeof func !== "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
    }
    wait = Number(wait) || 0;
    if (typeof options === "object") {
        leading = !!options.leading;
        maxing = "maxWait" in options;
        maxWait = maxing
            ? nativeMax(Number(options.maxWait) || 0, wait)
            : maxWait;
        trailing = "trailing" in options ? !!options.trailing : trailing;
    }

    function invokeFunc(time) {
        let args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    }

    function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
    }

    function remainingWait(time) {
        let timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            result = wait - timeSinceLastCall;
        return maxing
            ? nativeMin(result, maxWait - timeSinceLastInvoke)
            : result;
    }

    function shouldInvoke(time) {
        let timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;
        // Either this is the first call, activity has stopped and we're at the trailing
        // edge, the system time has gone backwards and we're treating it as the
        // trailing edge, or we've hit the `maxWait` limit.
        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxing && timeSinceLastInvoke >= maxWait)
        );
    }

    function timerExpired() {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
    }

    function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been debounced at
        // least once.
        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    }

    function cancel() {
        if (timerId !== undefined) {
            clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
    }

    function flush() {
        return timerId === undefined ? result : trailingEdge(Date.now());
    }

    function debounced() {
        let time = Date.now(),
            isInvoking = shouldInvoke(time);
        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timerId === undefined) {
                return leadingEdge(lastCallTime);
            }
            if (maxing) {
                // Handle invocations in a tight loop.
                timerId = setTimeout(timerExpired, wait);
                return invokeFunc(lastCallTime);
            }
        }
        if (timerId === undefined) {
            timerId = setTimeout(timerExpired, wait);
        }
        return result;
    }
    debounced.cancel = cancel;
    debounced.flush = flush;
    return debounced;
}

function throttle(func, wait, options) {
    let leading = true,
        trailing = true;

    if (typeof func !== "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
    }
    if (typeof options === "object") {
        leading = "leading" in options ? !!options.leading : leading;
        trailing = "trailing" in options ? !!options.trailing : trailing;
    }
    return debounce(func, wait, {
        leading,
        maxWait: wait,
        trailing,
    });
}
// returns: array, object, string, date, number, function, regexp, boolean, null, undefined
function trueTypeOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

function cloneObject(pointer) {
    return { ...pointer };
}

function putAtObjectPath(context, pathAsString, val, test) {
    const pathArr = pathAsString.split(".");
    // scoped to current
    if (!context[pathArr[0]]) context[pathArr[0]] = {};
    let path = context[pathArr[0]];
    pathArr.shift();

    if (test) debugger;
    pathArr.forEach((el, i, arr) => {
        if (i < arr.length - 1) {
            if (!path[el]) path[el] = {};
        } else {
            if (!path[el]) path[el] = val;
            else if (trueTypeOf(path[el]) === "object")
                path[el] = { ...path[el], val };
            else if (Array.isArray(path[el])) {
                if (Array.isArray(val)) {
                    path[el] = path[el].concat(val);
                } else path[el] = path.push(val);
            } else path[el] = val;
        }
        path = path[el];
    });

    return path;
}

window.draggingAceEditor = {};

function makeAceEditorResizable(editor) {
    var id_editor = editor.container.id;
    var id_dragbar = "#" + id_editor + "_dragbar";
    var id_wrapper = "#" + id_editor + "_wrapper";
    var wpoffset = 0;
    window.draggingAceEditor[id_editor] = false;

    $(id_dragbar).mousedown(function (e) {
        e.preventDefault();

        window.draggingAceEditor[id_editor] = true;

        var _editor = $("#" + id_editor);
        var top_offset = _editor.offset().top - wpoffset;

        // Set editor opacity to 0 to make transparent so our wrapper div shows
        _editor.css("opacity", 0);

        // handle mouse movement
        $(document).mousemove(function (e) {
            var actualY = e.pageY - wpoffset;
            // editor height
            var eheight = actualY - top_offset;

            // Set wrapper height
            $(id_wrapper).css("height", eheight);

            // Set dragbar opacity while dragging (set to 0 to not show)
            $(id_dragbar).css("opacity", 0.15);
        });
    });

    $(document).mouseup(function (e) {
        if (window.draggingAceEditor[id_editor]) {
            var ctx_editor = $("#" + id_editor);

            var actualY = e.pageY - wpoffset;
            var top_offset = ctx_editor.offset().top - wpoffset;
            var eheight = actualY - top_offset;

            $(document).unbind("mousemove");

            // Set dragbar opacity back to 1
            $(id_dragbar).css("opacity", 1);

            // Set height on actual editor element, and opacity back to 1
            ctx_editor.css("height", eheight).css("opacity", 1);

            // Trigger ace editor resize()
            editor.resize();

            window.draggingAceEditor[id_editor] = false;
        }
    });
}
