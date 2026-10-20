/**
 * Envío del formulario a Web3Forms (lógica del prompt 00, sin cambios):
 * POST con FormData, sin borrar lo escrito si falla, aviso de estado accesible
 * y bloqueo de envíos duplicados. Los textos llegan desde el componente.
 *
 * Con `<ClientRouter />` el documento se intercambia sin recargar, así que esto
 * es una función que `main.ts` llama en cada `astro:page-load`: si se quedara
 * en código de módulo, tras la primera navegación los listeners apuntarían al
 * formulario antiguo y el envío volvería a ser una navegación completa.
 */
export function initContactForm(): void {
  const form = document.getElementById('lead-form') as HTMLFormElement | null;
  // Un mismo nodo no se engancha dos veces (primera carga + page-load).
  if (!form || form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  const statusEl = document.getElementById('form-status');
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]') ?? null;

  function setStatus(message: string, state: 'pending' | 'success' | 'error' | null): void {
    if (!statusEl) return;
    statusEl.className =
      'form-status' + (state ? ` form-status--${state}` : '') + (message ? '' : ' hidden');
    statusEl.textContent = message;
  }

  const messages = {
    sending: form.dataset.msgSending ?? '',
    success: form.dataset.msgSuccess ?? '',
    error: form.dataset.msgError ?? '',
    button: form.dataset.btnLabel ?? '',
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Evita envíos duplicados mientras la petición está en curso.
    if (form.dataset.submitting === 'true') return;
    form.dataset.submitting = 'true';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = messages.sending;
    }
    setStatus(messages.sending, 'pending');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const json = (await response.json()) as { success?: boolean };

      if (response.ok && json.success) {
        form.reset();
        setStatus(messages.success, 'success');
      } else {
        // No se borra lo escrito: el usuario puede reintentar sin volver a teclearlo.
        setStatus(messages.error, 'error');
      }
    } catch {
      setStatus(messages.error, 'error');
    } finally {
      form.dataset.submitting = 'false';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = messages.button;
      }
    }
  });
}
