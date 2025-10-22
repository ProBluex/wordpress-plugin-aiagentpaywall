jQuery(document).ready(function($) {
    'use strict';
    
    let submitCount = 0;
    const MAX_SUBMISSIONS = 3;
    
    // Character counter for message
    $('#contact-message').on('input', function() {
        const length = $(this).val().length;
        $('#message-count').text(length);
        
        if (length > 2000) {
            $('#message-error').text('Message is too long').show();
        } else {
            $('#message-error').hide();
        }
    });
    
    // Form validation
    function validateForm() {
        let isValid = true;
        $('.field-error').hide();
        
        const name = $('#contact-name').val().trim();
        if (!name || name.length === 0) {
            $('#name-error').text('Name is required').show();
            isValid = false;
        } else if (name.length > 100) {
            $('#name-error').text('Name must be less than 100 characters').show();
            isValid = false;
        }
        
        const email = $('#contact-email').val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            $('#email-error').text('Valid email address is required').show();
            isValid = false;
        } else if (email.length > 255) {
            $('#email-error').text('Email must be less than 255 characters').show();
            isValid = false;
        }
        
        const message = $('#contact-message').val().trim();
        if (!message || message.length === 0) {
            $('#message-error').text('Message cannot be empty').show();
            isValid = false;
        } else if (message.length > 2000) {
            $('#message-error').text('Message must be less than 2000 characters').show();
            isValid = false;
        }
        
        return isValid;
    }
    
    // Handle form submission
    $('#contact-form').on('submit', function(e) {
        e.preventDefault();
        
        // Rate limiting check
        if (submitCount >= MAX_SUBMISSIONS) {
            alert('You\'ve reached the submission limit. Please try again later.');
            return;
        }
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        const submitButton = $('#contact-submit');
        const originalText = submitButton.html();
        submitButton.prop('disabled', true).html('<span class="spinner is-active" style="float: none;"></span> Sending...');
        
        const formData = {
            name: $('#contact-name').val().trim(),
            email: $('#contact-email').val().trim(),
            subject: $('#contact-subject').val().trim() || undefined,
            message: $('#contact-message').val().trim(),
            site_id: agentHubData.siteId || undefined  // Include site_id for validation
        };
        
        // Call the existing submit-contact-message edge function via Cloudflare proxy
        $.ajax({
            url: 'https://api.402links.com/functions/v1/submit-contact-message',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                if (response.success) {
                    submitCount++;
                    $('#contact-form').hide();
                    $('#contact-success').fadeIn();
                    
                    // Reset form for potential next submission
                    $('#contact-form')[0].reset();
                    $('#message-count').text('0');
                } else {
                    alert('Failed to send message: ' + (response.message || 'Please try again.'));
                }
            },
            error: function(xhr, status, error) {
                console.error('Contact form error:', error);
                let errorMessage = 'Failed to send message. Please try again.';
                
                if (xhr.status === 429) {
                    errorMessage = 'Rate limit exceeded. Please wait before sending another message.';
                } else if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                
                alert(errorMessage);
            },
            complete: function() {
                submitButton.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // Handle "Send Another Message" button
    $('#send-another').on('click', function() {
        if (submitCount >= MAX_SUBMISSIONS) {
            alert('You\'ve reached the submission limit for this session.');
            return;
        }
        
        $('#contact-success').hide();
        $('#contact-form').fadeIn();
    });
});
