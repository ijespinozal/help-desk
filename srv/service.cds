using my.helpdesk as db from '../db/schema';

service AdminService {
    
    // Habilitamos Drafts para que la UI sea amigable luego
    @odata.draft.enabled
    entity Tickets as projection on db.Tickets actions {
        // Definimos el botón. No devuelve nada, solo hace algo.
        action closeTicket(); 
    };

    // Las prioridades y estados son solo para leer (nadie crea prioridades nuevas a cada rato)
    @readonly
    entity Priorities as projection on db.Priorities;

    @readonly
    entity Statuses as projection on db.Statuses;

    @readonly
    entity Categories as projection on db.Categories
}