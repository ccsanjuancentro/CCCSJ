// Universal script for Admin Session & Permanent Floating Logout Button across all pages
(function () {
    "use strict";

    function checkAdmin() {
        return localStorage.getItem('isAdminLoggedIn') === 'true';
    }

    function doLogout() {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminUser');
        alert('Has cerrado la sesión de administrador.');
        window.location.reload();
    }

    function renderFloatingAdminBar() {
        const isAdmin = checkAdmin();
        let bar = document.getElementById('floatingAdminBar');

        if (!isAdmin) {
            if (bar) bar.style.display = 'none';
            return;
        }

        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'floatingAdminBar';
            bar.className = 'shadow-lg rounded-pill p-1';
            bar.style.cssText = 'position: fixed; top: 85px; right: 20px; z-index: 10000; transition: all 0.3s ease;';

            bar.innerHTML = `
                <button id="btnGlobalAdminLogout" class="btn btn-danger btn-sm rounded-pill px-3 py-2 font-weight-bold shadow-lg d-flex align-items-center" style="font-size: 13px; letter-spacing: 0.3px;">
                    <i class="bi bi-box-arrow-right me-1 fs-6"></i> Cerrar Sesión
                </button>
            `;

            document.body.appendChild(bar);

            const logoutBtn = bar.querySelector('#btnGlobalAdminLogout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', doLogout);
            }
        } else {
            bar.style.display = 'block';
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderFloatingAdminBar();

        // Listen for any existing logout buttons on the page
        const existingLogoutBtns = document.querySelectorAll('#btnLogoutAdmin, .btn-logout-admin');
        existingLogoutBtns.forEach(btn => {
            btn.addEventListener('click', doLogout);
        });
    });

    window.addEventListener('load', renderFloatingAdminBar);
    window.logoutAdminGlobal = doLogout;
})();
