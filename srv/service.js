const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { Tickets } = this.entities;

    this.before(['CREATE', 'UPDATE'], Tickets.drafts, async (req) => {

        const data = req.data;
        console.log("Linea 10: " + JSON.stringify(data))
        
        // Vamos a 'hidratar' los datos. Empezamos asumiendo que es lo que viene
        let descripcionActual = data.description;
        let prioridadActual = data.priority_code;

        // Si es un UPDATE y faltan datos clave, los buscamos en la BD
        if (req.event === 'UPDATE') {
            const ticketEnBd = await cds.tx(req).run(
                SELECT.one.from(Tickets.drafts)
                    .columns('description', 'priority_code')
                    .where({ ID: data.ID })
            );

            if (ticketEnBd) {
                // Si no viene en el payload, usamos lo de la BD
                if (descripcionActual === undefined) descripcionActual = ticketEnBd.description;
                if (prioridadActual === undefined) prioridadActual = ticketEnBd.priority_code;
            }
        }

        // Solo calculamos si es CREATE y si viene un código de prioridad
        if (prioridadActual) {
            
            const hoy = new Date();
            let diasParaSumar = 0;

            // Determinamos cuántos días sumar según la prioridad
            if (prioridadActual === 'H') {
                diasParaSumar = 1;
            } else if (prioridadActual === 'M') {
                diasParaSumar = 3;
            } else {
                // Para 'L' o cualquier otra cosa
                diasParaSumar = 7;
            }

            // 1. Modificamos la fecha (esto cambia el objeto 'hoy' internamente)
            hoy.setDate(hoy.getDate() + diasParaSumar);

            // 2. Asignamos la fecha en formato ISO (YYYY-MM-DD...)
            // Nota: No asignamos el resultado de setDate, sino el objeto 'hoy' ya modificado
            data.dueDate = hoy.toISOString(); 
            
            console.log(`📅 DueDate calculado: ${data.dueDate} (Prioridad: ${prioridadActual})`);
        }

        // --- LÓGICA 1: Valores por defecto (Lo que hicimos ayer) ---
        if (req.event === 'CREATE' && !data.status_code) {
            data.status_code = 'N';
        }

        // --- LÓGICA 2: Detectar Urgencia (Lo que hicimos ayer) ---
        if (data.title) {
            const titulo = data.title.toLowerCase();
            if (titulo.includes('urgente')) {
                data.priority_code = 'H';
            }
        }

        // ============================================================
        // 🛡️ LÓGICA 3: VALIDACIONES (DÍA 2)
        // ============================================================

        // 1. Verificamos si la prioridad es H (ya sea porque vino así o porque la cambiamos arriba)
        if (prioridadActual === 'H') {
            // Validamos sobre 'descripcionActual', no sobre 'data.description'
            if (!descripcionActual || descripcionActual.length < 10) {
                return req.error(400, 'Para tickets de prioridad ALTA, la descripción debe tener mínimo 10 caracteres.');
            }
        }

        // ============================================================
        // 💬 LÓGICA 4: MENSAJERÍA (DÍA 4)
        // ============================================================
        
        if (data.description) {
            const desc = data.description.toLowerCase();
            
            if (desc.includes('password') || desc.includes('contraseña')) {
                // ⚠️ WARN: Avisa pero NO detiene el proceso
                req.warn('⚠️ Recordatorio de Seguridad: Por favor, nunca escribas tu contraseña real en los tickets.');
                // req.info('')
            }
        }
    });

    /**
     * LÓGICA VIRTUAL: Calcular si está vencido al leer
     * Se ejecuta DESPUÉS de leer los datos de la base de datos
     */
    this.after('READ', Tickets, (each) => {
        // 'each' es cada fila que trae la consulta (puede ser 1 o un array de 100)
        
        if (each.dueDate) {
            const hoy = new Date();
            const fechaLimite = new Date(each.dueDate);

            // EJERCICIO A: Completa la lógica
            // Si fechaLimite es menor que hoy... está vencido.
            if (fechaLimite < hoy && each.status_code !== 'C') {
                each.isOverdue = true;
                each.overdueCriticality = 1; // Rojo (Negativo)
            } else {
                each.isOverdue = false;
                each.overdueCriticality = 3; // Verde (Positivo)
            }
        }
    });

    /**
     * ACCIÓN: Cerrar Ticket
     * Se ejecuta cuando alguien llama al botón 'closeTicket'
     * ACCIONES PERSONALIZADAS DIA 3
     */
    this.on('closeTicket', Tickets, async (req) => {
        const idTicket = req.params[0].ID || req.params[0];

        // 1. Verificar estado actual antes de cerrar
        // (Esto evita que cierren uno ya cerrado)
        const ticket = await SELECT.one.from(Tickets).columns('status_code').where({ ID: idTicket });
        
        if (ticket.status_code === 'C') {
            return req.error(400, 'Este ticket ya está cerrado.');
        }

        // 2. Proceder al cierre
        await UPDATE(Tickets).set({ status_code: 'C' }).where({ ID: idTicket });
        
        // Mensaje de éxito (Opcional, Fiori lo muestra solito si todo va bien)
        req.notify('Ticket cerrado correctamente');
    });
});