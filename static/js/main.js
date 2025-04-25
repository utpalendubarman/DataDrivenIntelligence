$(document).ready(function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // File upload name display
    $('#csvFile').on('change', function() {
        const fileName = $(this).val().split('\\').pop();
        $(this).next('.custom-file-label').html(fileName || 'Choose file');
        
        // Only enable submit if both project name and file are provided
        if (fileName && $('#projectName').val().trim()) {
            $('#submitProject').prop('disabled', false);
        } else {
            $('#submitProject').prop('disabled', true);
        }
    });

    // Project name validation
    $('#projectName').on('input', function() {
        if ($(this).val().trim() && $('#csvFile').val()) {
            $('#submitProject').prop('disabled', false);
        } else {
            $('#submitProject').prop('disabled', true);
        }
    });

    // Create project form validation
    $('#createProjectForm').on('submit', function(e) {
        const projectName = $('#projectName').val().trim();
        const csvFile = $('#csvFile').val();
        
        if (!projectName) {
            e.preventDefault();
            alert('Please enter a project name');
            return false;
        }
        
        if (!csvFile) {
            e.preventDefault();
            alert('Please select a CSV file to upload');
            return false;
        }
        
        // Show loading indicator
        $('#loadingSpinner').show();
        // Disable submit button
        $('#submitProject').prop('disabled', true);
    });

    // Search functionality for projects on dashboard
    $('#projectSearch').on('input', function() {
        const searchValue = $(this).val().toLowerCase();
        
        $('.project-card').each(function() {
            const projectName = $(this).find('.card-title').text().toLowerCase();
            const projectDetails = $(this).find('.card-text').text().toLowerCase();
            
            if (projectName.includes(searchValue) || projectDetails.includes(searchValue)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    // Sort projects by date or name
    $('#sortProjects').on('change', function() {
        const sortOption = $(this).val();
        const projectsContainer = $('#projectsContainer');
        const projects = projectsContainer.find('.project-card').get();
        
        projects.sort(function(a, b) {
            if (sortOption === 'nameAsc') {
                const nameA = $(a).find('.card-title').text().toLowerCase();
                const nameB = $(b).find('.card-title').text().toLowerCase();
                return nameA.localeCompare(nameB);
            } else if (sortOption === 'nameDesc') {
                const nameA = $(a).find('.card-title').text().toLowerCase();
                const nameB = $(b).find('.card-title').text().toLowerCase();
                return nameB.localeCompare(nameA);
            } else if (sortOption === 'dateAsc') {
                const dateA = new Date($(a).data('created-at'));
                const dateB = new Date($(b).data('created-at'));
                return dateA - dateB;
            } else { // dateDesc
                const dateA = new Date($(a).data('created-at'));
                const dateB = new Date($(b).data('created-at'));
                return dateB - dateA;
            }
        });
        
        $.each(projects, function(i, project) {
            projectsContainer.append(project);
        });
    });
});
