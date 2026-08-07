// Universal script for Admin Session & Minimalist Admin Portal View across pages
(function () {
    "use strict";

    function checkAdmin() {
        return localStorage.getItem('isAdminLoggedIn') === 'true';
    }

    function doLogout() {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminUser');
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().signOut().catch(() => {});
        }
        alert('Has cerrado la sesión de administrador.');
        window.location.href = "index.html";
    }

    function applyAdminView() {
        const isAdmin = checkAdmin();

        // 1. Manejar barra flotante de logout
        let bar = document.getElementById('floatingAdminBar');

        if (isAdmin) {
            // Ocultar elementos de navegación y secciones públicas si estamos en la página principal o similar
            const elementsToHide = document.querySelectorAll(
                'nav.navbar, header.site-header, footer.site-footer, section.welcome-section-modern, section.products, section.about-schedule-section, section.foundation-section, section.featured-product, section:has(.welcome-text-highlight), section:has(.cta-section-container)'
            );

            elementsToHide.forEach(el => {
                el.style.setProperty('display', 'none', 'important');
            });

            // Ocultar sección CTA manual
            document.querySelectorAll('section').forEach(sec => {
                if (sec.innerText.includes('¿Querés saber más de nosotros?') || sec.innerText.includes('¿Faltaste a un servicio?')) {
                    sec.style.setProperty('display', 'none', 'important');
                }
            });

            // Asegurar que las 3 secciones requeridas (Novedades, Encuentros, Destacados) se muestren
            const anunciosSec = document.getElementById('anuncios-section');
            if (anunciosSec) anunciosSec.style.setProperty('display', 'block', 'important');

            const destacadosSec = document.getElementById('destacados-section');
            if (destacadosSec) destacadosSec.style.setProperty('display', 'block', 'important');

            // Crear o mostrar barra de cabecera limpia para Admin
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'floatingAdminBar';
                bar.className = 'bg-dark text-white py-3 px-4 shadow-sm border-bottom';
                bar.style.cssText = 'position: sticky; top: 0; left: 0; width: 100%; z-index: 10000;';

                bar.innerHTML = `
                    <div class="container d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                            <img src="images/logos/logo2.svg" alt="CCCSJ Admin" style="height: 32px; filter: brightness(0) invert(1);">
                            <span class="font-weight-bold fs-5 text-white">Panel de Administración CCCSJ</span>
                        </div>
                        <div class="d-flex align-items-center gap-3">
                            <span class="text-white-50 small d-none d-sm-inline"><i class="bi bi-shield-lock-fill text-warning me-1"></i> Sesión Activa</span>
                            <button id="btnGlobalAdminLogout" class="btn btn-danger btn-sm rounded-pill px-3 py-2 font-weight-bold shadow-sm d-flex align-items-center">
                                <i class="bi bi-box-arrow-right me-1 fs-6"></i> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                `;

                document.body.prepend(bar);

                const logoutBtn = bar.querySelector('#btnGlobalAdminLogout');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', doLogout);
                }
            } else {
                bar.style.display = 'block';
            }
        } else {
            if (bar) bar.style.display = 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        applyAdminView();

        const existingLogoutBtns = document.querySelectorAll('#btnLogoutAdmin, .btn-logout-admin');
        existingLogoutBtns.forEach(btn => {
            btn.addEventListener('click', doLogout);
        });
    });

    window.addEventListener('load', applyAdminView);
    window.logoutAdminGlobal = doLogout;
})();
