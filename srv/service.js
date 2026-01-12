const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    console.log("🔥🔥🔥 SERVICE.JS CARGADO 🔥🔥🔥");
    const { Tickets } = this.entities;

    this.before(['CREATE', 'UPDATE'], Tickets.drafts, async (req) => {

        const data = req.data;

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

        console.log("👉 Cerrando Ticket:", idTicket);

        await UPDATE(Tickets).set({ status_code: 'C' }).where({ ID: idTicket });

        console.log(`✅ Ticket cerrado.`);
    });
});