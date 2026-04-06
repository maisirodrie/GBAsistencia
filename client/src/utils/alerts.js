import Swal from 'sweetalert2';

export const showAlert = ({ title, text, icon = 'success', confirmButtonText = 'Aceptar', showCancelButton = false, cancelButtonText = 'Cancelar' }) => {
    return Swal.fire({
        title,
        text,
        icon,
        showCancelButton,
        confirmButtonText,
        cancelButtonText,
        background: '#0f172a',
        color: '#f8fafc',
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#334155',
        customClass: {
            popup: 'rounded-[2rem] border border-slate-800 shadow-2xl',
            title: 'font-black tracking-tight',
            content: 'font-medium text-slate-400',
            confirmButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-xs',
            cancelButton: 'rounded-xl px-6 py-3 font-black uppercase tracking-widest text-xs'
        }
    });
};

export const showToast = (title, icon = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1e293b',
        color: '#f8fafc',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon,
        title
    });
};
