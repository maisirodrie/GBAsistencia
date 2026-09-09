// client/src/utils/fingerprint.js
// Genera una huella digital de hardware que persiste entre diferentes navegadores
// (Chrome, Brave, Safari, Incognito) en un mismo teléfono físico

export async function getDeviceFingerprint() {
    const traits = [];

    // 1. Pantalla física y resolución real
    try {
        const dpr = window.devicePixelRatio || 1;
        const screenW = Math.round(window.screen.width * dpr);
        const screenH = Math.round(window.screen.height * dpr);
        traits.push(`scr:${screenW}x${screenH}x${window.screen.colorDepth || 24}`);
    } catch {
        traits.push('scr:unknown');
    }

    // 2. Núcleos de CPU y soporte táctil
    traits.push(`cores:${navigator.hardwareConcurrency || 'def'}`);
    traits.push(`touch:${navigator.maxTouchPoints || 0}`);
    if (navigator.deviceMemory) {
        traits.push(`ram:${navigator.deviceMemory}`);
    }

    // 3. GPU / Hardware de Video (WebGL)
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
                traits.push(`gpu:${vendor.trim()}~${renderer.trim()}`);
            }
            const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            if (maxTex) traits.push(`max_tex:${maxTex}`);
        } else {
            traits.push('gl:none');
        }
    } catch {
        traits.push('gl:error');
    }

    // 4. Zona horaria del sistema
    try {
        traits.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    } catch {
        traits.push('tz:def');
    }

    const rawSignature = traits.join('|');

    // Generar HASH SHA-256 de la firma de hardware
    try {
        const msgBuffer = new TextEncoder().encode(rawSignature);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return 'hw_' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 24);
    } catch {
        let hash = 0;
        for (let i = 0; i < rawSignature.length; i++) {
            const char = rawSignature.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return 'hw_' + Math.abs(hash).toString(36);
    }
}
