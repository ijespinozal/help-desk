sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/myorg/support/test/integration/pages/TicketsList",
	"com/myorg/support/test/integration/pages/TicketsObjectPage"
], function (JourneyRunner, TicketsList, TicketsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/myorg/support') + '/test/flp.html#app-preview',
        pages: {
			onTheTicketsList: TicketsList,
			onTheTicketsObjectPage: TicketsObjectPage
        },
        async: true
    });

    return runner;
});

