$(function () {
    // this.init();

    this.init = function () {
        var tData = [
            ["First Name", "Last Name", "Gender", "Age", "Email"],
            ["Amanda", "Reed", "Female", 18, "e.reed@randatmail.com"],
        ];

        // first determine all values, assume string otherwise
        var state = [
            { editable: true, type: "string" },
            { editable: true, type: "string" },
            { editable: true, type: "string" },
            { editable: true, type: "number" },
            { editable: true, type: "email" },
        ];

        const tableData = [...tData];
        const thead = tableData[0];
        tableData.shift();
        const tbody = tableData;

        $("#tableWidget").empty().append(
            `<table class="tableSorter uk-table uk-table-hover uk-table-divider uk-table-small uk-table-middle">
                <thead>
                    <tr></tr>
                </thead>
                <tbody></tbody>
            </table>`
        );

        $("#tableWidget tr").append(thead.map((el) => `<th>${el}</th>`));

        tbody.forEach((row) => {
            const tr = $(`<tr></tr>`).append(
                //class="uk-text-nowrap"
                row.map((cell) => {
                    return `<td>${cell}</td>`;
                })
            );
            $("#tableWidget tbody").append(tr);
        });
    };

    // original value attempted
});
