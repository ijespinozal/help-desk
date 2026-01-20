sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/project/helpdesk/test/integration/pages/TicketsList",
	"com/project/helpdesk/test/integration/pages/TicketsObjectPage"
], function (JourneyRunner, TicketsList, TicketsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/project/helpdesk') + '/test/flp.html#app-preview',
        pages: {
			onTheTicketsList: TicketsList,
			onTheTicketsObjectPage: TicketsObjectPage
        },
        async: true
    });

    return runner;
});

