// easy data
// ["First Name", "Last Name", "Gender", "Age", "Email"],
// ["Amanda", "Reed", "Female", 18, "e.reed@randatmail.com"],
// ["Sam", "Thomas", "Male", 27, "s.thomas@randatmail.com"],
// ["Naomi", "Myers", "Female", 19, "n.myers@randatmail.com"],
// ["Adrian", "Holmes", "Male", 23, "a.holmes@randatmail.com"],

const hideTimeout = 200;
const debounceTimer = 1000;
const smallTimeout = 10;

const defaultInputEditorData = [
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
    ["Merlin3C", "destroyed", "2009-07-13T03:35:00.000Z", 1247456100, "null"],
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

// prettier-ignore
const defaultConfigEditorData = {
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
