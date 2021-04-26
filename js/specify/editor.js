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

const setEditorValue = function (editor, value) {
    // console.log("editor set value with");
    // console.log(value);
    editor.setValue(JSON.stringify(value, null, 2));
};
