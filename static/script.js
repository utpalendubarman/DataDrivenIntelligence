//start_analysis();
        //start_processing();
        //display_table()
const socket = io();
let columns=[]
var sampleData = [];
let config = {
    pageSize: 20,
    currentPage: 1,
    sortField: 'id',
    sortDirection: 'asc',
    searchTerm: ''
};
let table_schema
function startAI(file_path){

    socket.on('connect', function() {
        console.log('Connected to server!');
    });
    
    socket.emit('start-ai',{"file_path":file_path});

    socket.on("datatable",(data)=>{
        start_processing();
        if(data.row_type=="header"){
            columns=data.data.map(item=>{ return {
                field:item,
                title:item,
                visible:true
            }})
            sampleData = [];
            populateTable()
        }
        if (data.row_type == "row") {
            const rowData = {};
            idx=0
            columns.forEach((col) => {
                rowData[col.field] = data.data[idx]; 
                idx++
            });
            sampleData.push(rowData);
            console.log(rowData)
            populateTable()
            display_table()
        }
    })
    // Receive Schema
    socket.on("schema",function(data){
        table_schema=data.schema
        console.log(table_schema)
    })
    
    // Emitters
    formatted_prompt=""
    socket.on("formatted-prompt",function(data){
        chunk=data.chunk
        formatted_prompt=chunk
        console.log(formatted_prompt)
        formatted_prompt=formatted_prompt.replaceAll('"','')
        document.getElementById("ai-formatted-prompt").value=formatted_prompt
        document.getElementById("report_heading").innerHTML="Generating Summary..."
    })

    // Complete Prompt Formatting
    socket.on("complete-formatted-prompt",function(data){
        formatted_prompt=data.formatted_prompt
        generate_database_query(socket,formatted_prompt,table_schema)
    })

    // Generate Database Query
    socket.on("database-query",function(data){
        query=data.chunk
        console.log(query)
        query=query.replaceAll("```sql","")
        query=query.replaceAll("```","")
        query=query.replaceAll("\n"," ")
        document.getElementById("ai-query").value=query
    })

    socket.on("complete-database-query",function(data){
        db_query=data.query
        query=query.replaceAll("```sql","")
        query=query.replaceAll("```","")
        query=query.replaceAll("\n"," ")
        console.log('Executed Query')
        execute_database_query(socket,db_query,table_schema)
        document.getElementById('submitPromptBtn').disabled = false;
        document.getElementById('submitPromptBtn').style.backgroundColor = "#3498db";

    })
    socket.on("report-answer",function(data){
        heading=data.heading
        content=data.content
        document.getElementById("report_heading").innerHTML=heading
        document.getElementById("report_content").innerHTML=content
        document.getElementById("report-label").style.display="block"
        const div = document.querySelector(".ai-panel");
        div.scrollTop = div.scrollHeight;
    })
    
}

function populateTable(skipSort = true) {
    console.log("Should render table now")
    const filteredData = filterData();
    const dataToUse = skipSort ? filteredData : sortData(filteredData);

    const startIndex = (config.currentPage - 1) * config.pageSize;
    const endIndex = startIndex + config.pageSize;
    const pageData = dataToUse.slice(startIndex, endIndex);

    $('#dataTable tbody').empty();
    pageData.forEach(item => {
        const row = $('<tr>');

        columns.forEach(column => {
            if (column.visible) {
                row.append($('<td>').text(item[column.field]));
            }
        });

        $('#dataTable tbody').append(row);
    });

    updatePagination(dataToUse.length);
    updateColumnHeaders();
}


function filterData() {
    if (!config.searchTerm) {
        return sampleData;
    }

    const searchLower = config.searchTerm.toLowerCase();
    return sampleData.filter(item => {
        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchLower)
        );
    });
}

// Continuing the script function from where we left off
function sortData(data) {
    const { sortField, sortDirection } = config;

    return [...data].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (typeof aValue === 'string') {
            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        } else {
            if (sortDirection === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        }
    });
}

function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / config.pageSize);
    $('#pagination').empty();

    // First page button
    $('#pagination').append(
        $('<button>')
            .html('<i class="fas fa-angle-double-left"></i>')
            .prop('disabled', config.currentPage === 1)
            .click(() => {
                if (config.currentPage !== 1) {
                    config.currentPage = 1;
                    populateTable();
                }
            })
    );

    // Previous button
    $('#pagination').append(
        $('<button>')
            .html('<i class="fas fa-angle-left"></i>')
            .prop('disabled', config.currentPage === 1)
            .click(() => {
                if (config.currentPage > 1) {
                    config.currentPage--;
                    populateTable();
                }
            })
    );

    // Page numbers
    let startPage = Math.max(1, config.currentPage - 2);
    let endPage = Math.min(totalPages, config.currentPage + 2);

    if (startPage > 1) {
        $('#pagination').append($('<span>').text('...').css('padding', '0 0.5rem'));
    }

    for (let i = startPage; i <= endPage; i++) {
        $('#pagination').append(
            $('<button>')
                .text(i)
                .addClass(i === config.currentPage ? 'active' : '')
                .click(() => {
                    config.currentPage = i;
                    populateTable();
                })
        );
    }

    if (endPage < totalPages) {
        $('#pagination').append($('<span>').text('...').css('padding', '0 0.5rem'));
    }

    // Next button
    $('#pagination').append(
        $('<button>')
            .html('<i class="fas fa-angle-right"></i>')
            .prop('disabled', config.currentPage === totalPages)
            .click(() => {
                if (config.currentPage < totalPages) {
                    config.currentPage++;
                    populateTable();
                }
            })
    );

    // Last page button
    $('#pagination').append(
        $('<button>')
            .html('<i class="fas fa-angle-double-right"></i>')
            .prop('disabled', config.currentPage === totalPages)
            .click(() => {
                if (config.currentPage !== totalPages) {
                    config.currentPage = totalPages;
                    populateTable();
                }
            })
    );
}

function updateColumnHeaders() {
    // Clear existing headers
    $('#dataTable thead tr').empty();

    // Add updated headers
    columns.forEach(column => {
        if (column.visible) {
            const sortIcon = column.field === config.sortField
                ? (config.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
                : 'fa-sort';

            $('#dataTable thead tr').append(
                $('<th>')
                    .attr('data-sort', column.field)
                    .html(`${column.title} <i class="fas ${sortIcon} sort-icon"></i>`)
            );
        }
    });

    // Attach click event to new headers
    $('#dataTable th').click(function () {
        const sortField = $(this).data('sort');

        if (config.sortField === sortField) {
            config.sortDirection = config.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            config.sortField = sortField;
            config.sortDirection = 'asc';
        }

        populateTable();
    });
}

// Initialize column selector
function initColumnSelector() {
    $('#columnSelector').empty();

    columns.forEach(column => {
        $('#columnSelector').append(
            $('<div>').addClass('column-checkbox').append(
                $('<input>')
                    .attr('type', 'checkbox')
                    .attr('id', `col-${column.field}`)
                    .prop('checked', column.visible)
                    .change(function () {
                        column.visible = $(this).is(':checked');
                    })
            ).append(
                $('<label>')
                    .attr('for', `col-${column.field}`)
                    .text(column.title)
            )
        );
    });
}

function generate_database_query(socket,formatted_prompt,schema){
    console.log("Should generate query")
    socket.emit("generate-query",{
        "formatted_prompt":formatted_prompt,
        "schema":schema
    })
}

function execute_database_query(socket,db_query,schema){
    console.log("Should execute the query now")
    
    socket.emit("execute-query",{
        "database_query":db_query,
        "schema":schema
    })
}

// Search functionality - Vanilla JS version
document.getElementById('searchBtn').addEventListener('click', function () {
    const searchInput = document.querySelector('.search-input').value;
    config.searchTerm = searchInput;
    config.currentPage = 1; // Reset to first page
    populateTable();
});

document.querySelector('.search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') { // Enter key
        config.searchTerm = this.value;
        config.currentPage = 1;
        populateTable();
    }
});

document.getElementById('submitPromptBtn').addEventListener('click', function () {
    const promptInput = document.querySelector('.ai-prompt-input');
    const promptText = promptInput.value.trim();
    document.getElementById("report_heading").innerHTML=""
    document.getElementById("report_content").innerHTML=""
    document.getElementById("report-label").style.display="none"
    document.getElementById("ai-formatted-prompt").innerHTML="Processing..."
    document.getElementById("ai-query").innerHTML="Processing..."
    //#7cb8e0
    if (!promptText) return;
    if(table_schema!=undefined && table_schema.length!=0){
        console.log("asked : "+promptText)
        document.getElementById('submitPromptBtn').disabled = true;
        document.getElementById('submitPromptBtn').style.backgroundColor = "#7cb8e0";
        socket.emit('ask',{"question":promptText,"schema":table_schema});
    }else{
        console.log('Schema not found!')
        console.log(table_schema)
    }
});


