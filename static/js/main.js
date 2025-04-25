$(document).ready(function() {
    // Initialize tooltips
    try {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    } catch (e) {
        console.error("Error initializing tooltips:", e);
    }

    // Fix for modal freeze issue
    $('#createProjectModal').on('shown.bs.modal', function () {
        console.log("Modal opened successfully");
        $(this).find('input:first').focus();
    });

    // File upload name display
    $('#csvFile').on('change', function() {
        try {
            const fileName = $(this).val().split('\\').pop();
            
            // Only enable submit if both project name and file are provided
            if (fileName && $('#projectName').val().trim()) {
                $('#submitProject').prop('disabled', false);
            } else {
                $('#submitProject').prop('disabled', true);
            }
        } catch (e) {
            console.error("Error handling file change:", e);
        }
    });

    // Project name validation
    $('#projectName').on('input', function() {
        try {
            if ($(this).val().trim() && $('#csvFile').val()) {
                $('#submitProject').prop('disabled', false);
            } else {
                $('#submitProject').prop('disabled', true);
            }
        } catch (e) {
            console.error("Error handling project name input:", e);
        }
    });

    // Create project form validation
    $('#createProjectForm').on('submit', function(e) {
        try {
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
        } catch (e) {
            console.error("Error handling form submission:", e);
            e.preventDefault();
            return false;
        }
    });

    // Search functionality for projects on dashboard
    $('#projectSearch').on('input', function() {
        try {
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
        } catch (e) {
            console.error("Error handling project search:", e);
        }
    });

    // Sort projects by date or name
    $('#sortProjects').on('change', function() {
        try {
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
        } catch (e) {
            console.error("Error handling project sorting:", e);
        }
    });
});
