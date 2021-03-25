var rLength = 10;
var cLength = 10;
var r = /^r[0-9]+c[0-9]+$/;
var errorStruct = {};
// var path = errorStruct.inputs.cells;
// var path = inputs.cells;
Object.keys(a.inputs.cells).forEach((key) => {
    key = key.toLowerCase();
    const errorO = {};
    if (r.test(key)) {
        var cellPos = t.match(/\d+/g);
        if (cellPos[0] > rLength)
            errorO.invalidRow =
                "The specified row '" +
                cellPos[0] +
                "' is greater than the number of rows in the provided data set '" +
                rLength +
                "'";
        if (cellPos[1] > cLength)
            errorO.invalidColumn =
                "The specified column '" +
                cellPos[1] +
                "' is greater than the number of columns in the provided data set '" +
                cLength +
                "'";
    } else
        errorO.invalidIdentifier =
            "The key identifier '" +
            key +
            "' is invalid. The pattern required is 'rYcZ' where 'Y' is a positive integer up to the number of Rows in the data you provide, and Z is a positive integer up to to the number of columns in the data you provide";

    if (
        !(errorO.invalidRow || errorO.invalidColumn || errorO.invalidIdentifier)
    ) {
        putAtObjectPath(`errorStruct.inputs.cells.${key}`, errorO);
        delete a.inputs.cells[key];
    }
});

function putAtObjectPath(context, pathAsString, val) {
    const pathArr = pathAsString.split(".");
    // scoped to current
    if (!context[pathArr[0]]) context[pathArr[0]] = {};
    let path = context[pathArr[0]];
    pathArr.shift();

    pathArr.forEach((el, i, arr) => {
        if (!path[el]) path[el] = {};
        if (i == arr.length - 1) path[el] = val;
        path = path[el];
    });

    return path;
}
