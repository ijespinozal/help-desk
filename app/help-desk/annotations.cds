using AdminService as service from '../../srv/service';

// Decoramos la entidad 'Tickets' del servicio
annotate service.Tickets with @(

    // UI: Todo lo que tiene que ver con la interfaz visual
    UI : {
        
        // 1. Cabecera de la tabla
        HeaderInfo : {
            TypeName       : 'Ticket',
            TypeNamePlural : 'Tickets de Soporte',
            Title          : {
                $Type : 'UI.DataField',
                Value : title // Lo que se ve en el encabezado al entrar al detalle
            },
            Description : {
                $Type : 'UI.DataField',
                Value : description
            }
        },

        // 2. Las Columnas de la Tabla (LineItem)
        LineItem : [
            {
                $Type : 'UI.DataFieldForAction',
                Action : 'AdminService.closeTicket', // Nombre del servicio + punto + nombre de la acción
                Label : 'Cerrar Ticket',
                Criticality : #Negative // Opcional: Le da color rojo al botón (o #Positive para verde)
            },
            {
                $Type : 'UI.DataField',
                Label : 'ID',
                Value : ID,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Título del Problema',
                Value : title,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Prioridad',
                Value : priority.name, // <--- ¡Magia! Navegamos por la asociación
                Criticality : priority.criticality // <--- ¡Más magia! Esto pone el color (Rojo/Amarillo/Verde)
            },
            {
                $Type : 'UI.DataField',
                Label : 'Estado Actual',
                Value : status.name,
                Criticality : status.criticality
            },
            {
                // Mostramos también la descripción cortada
                $Type : 'UI.DataField',
                Label : 'Descripción',
                Value : description
            },
            {
                $Type : 'UI.DataField',
                Label : 'Fecha Límite',
                Value : dueDate
            },
            {
                $Type : 'UI.DataField',
                Label : '¿Vencido?',
                Value : isOverdue,
                Criticality : overdueCriticality, // Esto pintará el texto/icono de rojo o verde
                CriticalityRepresentation : #WithoutIcon // O #WithIcon
            }
        ],
        
        // 3. Definimos un GRUPO de campos (Formulario)
        // El #MainData es un "apodo" (Qualifier) para identificar este grupo
        FieldGroup #MainData : {
            $Type : 'UI.FieldGroupType',
            Data : [
                { $Type : 'UI.DataField', Value : title, Label: 'Título' },
                { $Type : 'UI.DataField', Value : description, Label: 'Detalle' },
                { $Type : 'UI.DataField', Value : priority_code, Label: 'Prioridad' },
                { $Type : 'UI.DataField', Value : status_code, Label: 'Estado' },
                { $Type : 'UI.DataField', Value : category_code, Label: 'Categoría' },
                { $Type : 'UI.DataField', Value : dueDate, Label: 'Fecha Límite' }
            ]
        },

        // 4. Definimos la ESTRUCTURA visual (Facetas)
        Facets : [
            {
                // Creamos una sección que apunta al grupo que definimos arriba
                $Type : 'UI.ReferenceFacet',
                ID    : 'GeneralSection',
                Label : 'Información del Ticket',
                Target : '@UI.FieldGroup#MainData'
            },
            
            // Sección 2: Lista de Comentarios (NUEVA)
            {
                $Type  : 'UI.ReferenceFacet',
                ID     : 'CommentsSection',
                Label  : 'Historial de Conversación',
                Target : 'comments/@UI.LineItem' // <--- Apunta a la relación 'comments'
            }
        ],

        Identification : [
            {
                $Type : 'UI.DataFieldForAction',
                Action : 'AdminService.closeTicket',
                Label : 'Cerrar Ticket Confirmado',
                Criticality : #Negative
            }
        ],
    }
);

// ---------------------------------------------------------
// 🚀 DÍA 3: VALUE HELPS (Listas Desplegables)
// ---------------------------------------------------------

annotate service.Tickets with {
    
    // 1. Configuración para el campo PRIORIDAD (FK)
    priority @(
        // Le decimos que el "Texto" bonito está en la relación 'priority.name'
        Common.Text : priority.name,
        Common.TextArrangement : #TextOnly, // Muestra solo "Alta", no "H (Alta)"
        
        // Esto crea el Dropdown
        Common.ValueListWithFixedValues : true,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Priorities', // Tabla de donde lee la lista
            Parameters : [
                // Lo que se guarda en la BD (code) vs Lo que viene de la lista (code)
                { $Type : 'Common.ValueListParameterInOut', LocalDataProperty : priority_code, ValueListProperty : 'code' },
                // Lo que se muestra en el dropdown
                { $Type : 'Common.ValueListParameterDisplayOnly', ValueListProperty : 'name' }
            ]
        }
    );

    // 2. Configuración para el campo ESTADO (FK)
    status @(
        Common.Text : status.name,
        Common.TextArrangement : #TextOnly,
        Common.ValueListWithFixedValues : true,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Statuses',
            Parameters : [
                { $Type : 'Common.ValueListParameterInOut', LocalDataProperty : status_code, ValueListProperty : 'code' },
                { $Type : 'Common.ValueListParameterDisplayOnly', ValueListProperty : 'name' }
            ]
        }
    );

    // 3. Configuración para el campo CATEGORÍA (FK)
    category @(
        Common.Text : category.name,
        Common.TextArrangement : #TextOnly,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Categories',
            Parameters : [
                { $Type : 'Common.ValueListParameterInOut', LocalDataProperty : category_code, ValueListProperty : 'code' },
                { $Type : 'Common.ValueListParameterDisplayOnly', ValueListProperty : 'name' }
            ]
        }
    );
};

// ---------------------------------------------------------
// 🚀 DÍA 4: TABLA DE COMENTARIOS (Nested LineItem)
// ---------------------------------------------------------

// 1. Definimos las columnas de la entidad HIJA (Comments)
annotate service.Comments with @(
    UI : {
        LineItem : [
            {
                $Type : 'UI.DataField',
                Label : 'Comentario',
                Value : text
            },
            {
                $Type : 'UI.DataField',
                Label : 'Fecha',
                Value : createdAt
            },
            {
                $Type : 'UI.DataField',
                Label : 'Autor',
                Value : createdBy
            }
        ],
        // Ocultamos la info de cabecera innecesaria en la sub-tabla
        HeaderInfo : {
            TypeName : 'Comentario',
            TypeNamePlural : 'Comentarios',
            Title : { Value : text }
        }
    }
);

// SIDE EFFECTS
annotate service.Tickets @(Common : {
    SideEffects #PriorityChanged : {
        SourceProperties : ['priority_code'],
        TargetProperties : ['dueDate']
    }
});