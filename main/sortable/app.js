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

  this.tableData = [
    ["First Name", "Last Name", "Gender", "Age", "Email"],
    ["Amanda", "Reed", "Female", 18, "e.reed@randatmail.com"],
    ["Sam", "Thomas", "Male", 27, "s.thomas@randatmail.com"],
    ["Naomi", "Myers", "Female", 19, "n.myers@randatmail.com"],
    ["Adrian", "Holmes", "Male", 23, "a.holmes@randatmail.com"],
  ];

  this.editTable = {
    invalidJSONelem: null,
  };

  this.tableConfig = {
    globalFeatures: {
      editable: false,
      sortable: true,
      markers: {
        enable: true,
        markerColors: [],
      },
    },
    inputs: {
      columns: {
        c2: {
          restrictedToValues: ["Female", "Male"],
        },
        c3: "number",
        c4: "email",
      },
      cells: {
        r0c0: {
          restrictedToValues: ["hello", "world"],
        },
        r0c1: {
          // editable: false,
        },
        r0c2: {
          min: 17,
          max: 19,
        },
        r3c3: {
          min: 17,
          max: 19,
        },
      },
    },
  };

  // returns: array, object, string, date, number, function, regexp, boolean, null, undefined
  this.trueTypeOf = function (obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
  };

  this.changes = [];
  this.emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  obj.defaultMarkerColors = ["#1e87f0", "#222", "#f8f8f8"];

  function editorFactory(id) {
    const wrap = 80;
    const editor = ace.edit(id, {
      theme: "ace/theme/chaos",
      mode: "ace/mode/json",
      useWorker: true,
      behavioursEnabled: "always",
      wrap,
      printMargin: wrap,
    });
    return editor;
  }

  this.initEditors = function () {
    const tableEditor = editorFactory("specifyDataEditor");
    const configEditor = editorFactory("specifyConfigEditor");

    tableEditor.setValue(JSON.stringify({ data: obj.tableData }, null, 2));
    tableEditor.clearSelection();

    tableEditor.session.on(
      "change",
      debounce(
        function (delta) {
          let editorVal = tableEditor.getValue();
          let invalidExpectedJson = true;
          let isValidArray = false;

          try {
            editorVal = JSON.parse(editorVal);

            if (Array.isArray(editorVal)) {
              isValidArray = true;
              invalidExpectedJson = false;
            }

            if (Array.isArray(editorVal.data)) invalidExpectedJson = false;
          } catch (e) {}

          // allow users to paste in array
          if (!invalidExpectedJson && isValidArray)
            return tableEditor.setValue(
              JSON.stringify({ data: editorVal }, null, 2)
            );

          // editor error
          if ($("#specifyDataEditor .ace_error").length) return;

          //editTable.invalidJSONelem
          // invalidEditTable

          if (invalidExpectedJson) {
            const invalidJSONMessage = "The JSON structure provided is invalid";
            const notifyElem = obj.editTable.invalidJSONelem;
            console.log(notifyElem);
            function dataTableInvalidNotification(
              message = "The JSON structure provided is invalid"
            ) {
              obj.editTable.invalidJSONelem = UIkit.notification({
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

              console.log();
            }

            if (notifyElem) {
              UIkit.util.on(document, "close", function (evt) {
                console.log({ claim: evt.detail[0], actual: notifyElem });
                if (evt.detail[0] === notifyElem) {
                  dataTableInvalidNotification(invalidJSONMessage);
                }
              });
              notifyElem.close(true);
            } else dataTableInvalidNotification(invalidJSONMessage);
          }
        },
        5000,
        {
          leading: false,
          trailing: true,
        }
      )
    );

    configEditor.setValue(JSON.stringify(obj.tableConfig, null, 2));
    configEditor.clearSelection();
  };

  this.init = function () {
    obj.initEditors();
    $("table").tableSort({
      animation: "slide",
      speed: 500,
    });

    // $("#temp").dblclick(function () {
    //   console.log($(this));
    //   $(this).addClass("uk-animation-fade uk-animation-reverse");
    //   setTimeout(() => {
    //     $(this)
    //       .empty()
    //       .append(
    //         `<input class="uk-input uk-animation-fade uk-form-width-small" type="text" placeholder="">`
    //       );
    //     $(this).removeClass("uk-animation-fade uk-animation-reverse");
    //   }, 500);
    // });
    removeUncessaryListeners();
  };

  function removeUncessaryListeners() {
    const globalEditability = !!obj.tableConfig?.globalFeatures.editable;
    $("table td").on("dblclick", function () {
      console.log({
        row: $(this).closest("tr").index(),
        column: $(this).index(),
      });
      const cell =
        obj.tableConfig?.inputs?.cells[
          `r${$(this).closest("tr").index()}c${$(this).index()}`
        ];
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
