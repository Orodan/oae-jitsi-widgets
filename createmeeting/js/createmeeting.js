define(['jquery', 'oae.core'], function ($, oae) {

    return function (uid) {

        // The widget container
        var $rootel = $('#' + uid);

        // Variable that keeps track of the people and groups to share this meeting with
        var members = [];

        // Variable that keeps track of the selected visibility for the meeting to create
        var visibility = null;

        // Generate a widget ID for the new instance of the `setpermissions` widget. This widget ID
        // will be used in the event communication between this widget and the `setpermissions` widget.
        var setPermissionsId = oae.api.util.generateId();

        // Variable that keeps track of the current context
        var contextData = null;

        var createMeeting = function () {

        };

        var setUpReset = function () {
            $("#createmeeting-jitsi-modal", $rootel).on('hidden.bs.modal', function () {
                // Reset the form
                var $form = $('#createmeeting-jitsi-form', $rootel);
                $form[0].reset();
                oae.api.util.validation().clear($form);
                showOverview();

                // Unbind the setpermissions handler
                $(document).off('oae.setpermissions.changed.' + setPermissionsId);
            });
        };

        /**
         * Initialize the create meeting form and validation
         */
        var setUpCreateMeeting = function () {
            var validateOpts = {
                'submitHandler': createMeeting
            };
            oae.api.util.validation().validate($('#createmeeting-jitsi-form', $rootel), validateOpts);
        };

        /**
         * Show the permissions widget to allow for updates in visiblity and members
         */
        var showPermissions = function () {

            // Hide all containers
            $('.modal-body > div:visible', $rootel).hide();
            $('#createmeeting-jitsi-form > .modal-footer', $rootel).hide();            

            // Show the permissions container
            $('#createmeeting-jitsi-permissions-container', $rootel).show();

        };

        /**
         * Show the main panel of the widget
         */
        var showOverview = function () {
            
            // Hide all containers
            $('.modal-body > div:visible', $rootel).hide();
            
            // Show the overview container
            $('#createmeeting-jitsi-form > .modal-footer', $rootel).show();
            $('#createmeeting-jitsi-overview-container', $rootel).show();

        };

        /**
         * Load the `setpermissions` widget into this widget. That widget will take care of permission
         * management (visibility + sharing) of the meeting
         */
        var setUpSetPermissions = function () {

            // Remove the previous `setpermissions` widget
            var $setPermissionsContainer = $('#createmeeting-jitsi-permissions-container', $rootel);
            $setPermissionsContainer.html('');

            // When the current context is the current user, the configured default tenant visibility for meetings
            // will be used as the default visibility. Otherwise, the visibility of the current context will be
            // used as the default visibility
            if (contextData.id === oae.data.me.id) {
                visibility = oae.api.config.getValue('oae-jitsi', 'visibility', 'meeting');
            } else {
                visibility = contextData.visibility;
            }

            // Event that will be triggered when permission changes have been made in the `setpermissions` widget
            $(document).on('oae.setpermissions.changed.' + setPermissionsId, function (ev, data) {
                //Update visibility for the meeting
                visibility = data.visibility;

                members = _.without(data.shared, oae.data.me.id);

                // Add the permissions summary
                $('#createmeeting-jitsi-permissions', $rootel).html(data.summary);

                // Switch back to the overview
                showOverview();
            });

            $(document).on('oae.setpermissions.cancel.' + setPermissionsId, showOverview);

            // Always add the created meeting to the current user's meeting library
            var preFill = [{
                'displayName': oae.api.i18n.translate('__MSG__MY_MEETINGS__'),
                'id': oae.data.me.id,
                'fixed': true
            }];

            // If the current user is creating the meeting within a group,
            // the group is added as a fixed item as well
            if (contextData.id !== oae.data.me.id)
                preFill.push($.extend({'fixed': true}, contextData));

            // Load the `setpermissions` widget into its container
            oae.api.widget.insertWidget('setpermissions', setPermissionsId, $setPermissionsContainer, false, {
                'count': 1,
                'preFill': preFill,
                'type': 'collabdoc',
                'visibility': visibility 
            });

        };

        /**
         * Initialize the create meeting modal dialog
         */
        var setUpCreateMeetingModal = function () {

            $(document).on('click', '.oae-trigger-createmeeting-jitsi', function () {
                // Request the context information
                $(document).trigger('oae.context.get', 'createmeeting');
            });

            $(document).on('oae.context.send.createmeeting', function (ev, ctx) {
                contextData = ctx;
                $('#createmeeting-jitsi-modal', $rootel).modal({
                    'backdrop': 'static'
                });
            });

            $('#createmeeting-jitsi-modal', $rootel).on('shown.bs.modal', function () {
                $('#createmeeting-description', $rootel).val('');
                $('#createmeeting-name', $rootel).focus();

                //Initiate the permissions widget
                setUpSetPermissions();
            });

            // Binds the 'change' button that shows the setpermissions widget
            $rootel.on('click', '.setpermissions-change-permissions', showPermissions);

        };

        setUpCreateMeetingModal();
        setUpCreateMeeting();
        setUpReset();

    };

});