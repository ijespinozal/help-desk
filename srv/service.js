const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { Tickets } = this.entities;

    this.before(['CREATE', 'UPDATE'], Tickets.drafts, async (req) => {

        const data = req.data;

        // Solo calculamos si es CREATE y si viene un código de prioridad
        if (data.priority_code) {
            
            const hoy = new Date();
            let diasParaSumar = 0;

            // Determinamos cuántos días sumar según la prioridad
            if (data.priority_code === 'H') {
                diasParaSumar = 1;
            } else if (data.priority_code === 'M') {
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
            
            console.log(`📅 DueDate calculado: ${data.dueDate} (Prioridad: ${data.priority_code})`);
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
        const prioridadFinal = data.priority_code;

        if (prioridadFinal === 'H') {
            // Regla: Si es Alta, la descripción debe ser larga
            if (!data.description || data.description.length < 20) {

                // 🛑 REJECT: Esto detiene todo y devuelve error 400
                // El primer argumento (400) es el código HTTP
                // El segundo es el mensaje para el usuario
                return req.error(400, 'Para tickets de prioridad ALTA, la descripción debe tener mínimo 20 caracteres.');
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
     * ACCIÓN: Cerrar Ticket
     * Se ejecuta cuando alguien llama al botón 'closeTicket'
     * ACCIONES PERSONALIZADAS DIA 3
     */
    this.on('closeTicket', Tickets, async (req) => {
        // req.params ahora es un array que puede venir con la llave compuesta
        // Obtenemos el ID de forma segura:
        const idTicket = req.params[0].ID || req.params[0];

        await UPDATE(Tickets).set({ status_code: 'C' }).where({ ID: idTicket });

    });
});