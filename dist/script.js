document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('contact-form');
const email = document.getElementById('email');
const error = document.getElementById('email-error');
const status = document.getElementById('form-status');

form.addEventListener('submit', event => {
  event.preventDefault();
  status.hidden = true;
  const valid = email.validity.valid && email.value.trim().length > 0;
  error.hidden = valid;
  email.setAttribute('aria-invalid', String(!valid));
  if (!valid) {
    email.focus();
    return;
  }
  status.textContent = 'This preview does not send enquiries. Contact requests will be enabled when the final website launches.';
  status.hidden = false;
});
email.addEventListener('input', () => {
  error.hidden = true;
  email.removeAttribute('aria-invalid');
  status.hidden = true;
});

document.querySelectorAll('[data-dialog]').forEach(trigger => {
  trigger.addEventListener('click', () => {
    document.getElementById(trigger.dataset.dialog).showModal();
  });
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('.dialog-close, .dialog-dismiss').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});
