using { cuid, managed } from '@sap/cds/common';

namespace my.helpdesk;

// Lista de prioridades (Alta, Media, Baja)
entity Priorities {
    key code : String(1);
    name     : String(20);
    criticality : Integer; // Para poner colores (rojo, amarillo, verde)
}

// Lista de estados (Abierto, En Proceso, Cerrado)
entity Statuses {
    key code : String(1);
    name     : String(20);
    criticality : Integer;
}

entity Categories {
    key code : String(2);
    name     : String(20)
}

// La tabla principal de Tickets
entity Tickets : cuid, managed {
    title       : String(100);
    description : String(1000);
    
    // Relaciones (Asociaciones)
    priority    : Association to Priorities;
    status      : Association to Statuses default 'N'; // N = Nuevo (por ejemplo)
    category    : Association to Categories;
    
    // Un ticket puede tener muchos comentarios
    comments    : Composition of many Comments on comments.ticket = $self;

    dueDate     : DateTime;
}

// Comentarios dentro de un ticket
entity Comments : cuid, managed {
    text    : String(500);
    ticket  : Association to Tickets;
}