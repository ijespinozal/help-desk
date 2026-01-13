using my.helpdesk as db from '../db/schema';

service AdminService @(requires: 'authenticated-user') {
    
    @odata.draft.enabled
    entity Tickets as projection on db.Tickets actions {
        action closeTicket();
    } 
    // 2. Reglas de Acceso (ACL)
    annotate Tickets with @(restrict: [
        // ------------------------------------------------------
        // 👑 ROL SUPPORT (Alice)
        // Puede hacer TODO (*) sin restricciones
        // ------------------------------------------------------
        { grant: '*', to: 'Support' },

        // ------------------------------------------------------
        // 👤 ROL USER (Carol)
        // ------------------------------------------------------
        
        // A) Permiso para CREAR (Sin condición 'where', porque es nuevo)
        { grant: 'CREATE', to: 'User' },

        // B) Permiso para LEER (Solo ve SUS propios tickets)
        { grant: 'READ', to: 'User', where: 'createdBy = $user' }
        
        // Nota: No le damos UPDATE ni DELETE, así que no pueden editar ni borrar.
    ]);

    // Las prioridades y estados son solo para leer (nadie crea prioridades nuevas a cada rato)
    @readonly
    entity Priorities as projection on db.Priorities;

    @readonly
    entity Statuses as projection on db.Statuses;

    @readonly
    entity Categories as projection on db.Categories
}