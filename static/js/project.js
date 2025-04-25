$(document).ready(function() {
    // Get project ID from the page
    const projectId = $('#projectData').data('project-id');
    
    // Initialize DataTable with advanced features
    const dataTable = $('#dataTable').DataTable({
        responsive: true,
        pagingType: 'full_numbers',
        language: {
            search: 'Search data:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            paginate: {
                first: '<i class="fa fa-angle-double-left"></i>',
                previous: '<i class="fa fa-angle-left"></i>',
                next: '<i class="fa fa-angle-right"></i>',
                last: '<i class="fa fa-angle-double-right"></i>'
            }
        },
        dom: 'Bfrtip',
        buttons: [
            'colvis',
            {
                extend: 'collection',
                text: 'Export',
                buttons: ['csv', 'excel']
            }
        ]
    });
    
    // Handle AI queries
    $('#aiQueryForm').submit(function(e) {
        e.preventDefault();
        
        const userQuery = $('#userQuery').val().trim();
        if (!userQuery) {
            return;
        }
        
        // Display loading indicator
        $('#aiLoading').show();
        
        // Clear previous responses
        $('#formattedPrompt').text('Processing...');
        $('#aiResponse').text('');
        
        // Make AJAX request to server
        $.ajax({
            url: '/api/ask_ai',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                project_id: projectId,
                query: userQuery
            }),
            success: function(data) {
                // Display formatted prompt and response
                $('#formattedPrompt').text(data.formatted_prompt);
                $('#aiResponse').text(data.response);
                
                // Highlight any data in the table that is relevant (simplified example)
                if (userQuery.toLowerCase().includes('find') || 
                    userQuery.toLowerCase().includes('search') || 
                    userQuery.toLowerCase().includes('where')) {
                    
                    // Simplified implementation - in a real app, this would be more sophisticated
                    dataTable.search(userQuery.split(' ').pop()).draw();
                }
            },
            error: function(xhr, status, error) {
                $('#aiResponse').html(`<div class="text-danger">Error: ${xhr.responseJSON?.error || error}</div>`);
            },
            complete: function() {
                $('#aiLoading').hide();
            }
        });
    });
    
    // Clear AI query and results
    $('#clearQuery').click(function() {
        $('#userQuery').val('');
        $('#formattedPrompt').text('');
        $('#aiResponse').text('');
        dataTable.search('').draw(); // Clear any search filtering
    });
    
    // Toggle the AI interaction panel
    $('#toggleAI').click(function() {
        $('.ai-interaction-body').toggleClass('d-none');
        const icon = $(this).find('i:last-child');
        
        if (icon.hasClass('fa-chevron-up')) {
            icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            $(this).attr('title', 'Expand AI Assistant').tooltip('dispose').tooltip();
            // Adjust space for data table
            $('.data-table-container').css('padding-bottom', '60px');
        } else {
            icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            $(this).attr('title', 'Collapse AI Assistant').tooltip('dispose').tooltip();
            // Reset space for data table
            $('.data-table-container').css('padding-bottom', '10px');
        }
    });
    
    // Example queries dropdown
    $('.example-query').click(function() {
        const query = $(this).text();
        $('#userQuery').val(query);
    });
    
    // Initialize tooltips
    $('[data-bs-toggle="tooltip"]').tooltip();
    
    // Handle keyboard shortcut (Ctrl+Space) to focus on the AI query input
    $(document).keydown(function(e) {
        if (e.ctrlKey && e.keyCode === 32) { // Ctrl + Space
            e.preventDefault();
            $('#userQuery').focus();
        }
    });
    
    // Resize handling for responsive layout
    $(window).resize(function() {
        if ($(window).width() < 768) {
            // On small screens, collapse the AI panel by default
            if (!$('.ai-interaction-body').hasClass('d-none')) {
                $('#toggleAI').click();
            }
        }
    });
    
    // Back to dashboard button
    $('#backToDashboard').click(function() {
        window.location.href = '/';
    });
});
