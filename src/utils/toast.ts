export function showToast(message: string) {
  const existing = document.getElementById('fin-toast-notification');
  if (existing) {
    existing.remove();
  }

  const toastEl = document.createElement('div');
  toastEl.id = 'fin-toast-notification';
  toastEl.className =
    'px-3.5 py-1.5 rounded-full bg-[#18181B]/95 backdrop-blur-md border border-white/15 text-xs font-semibold text-txt-primary shadow-2xl animate-fadeIn pointer-events-none whitespace-nowrap flex items-center gap-2';

  const bottomOffset = window.innerWidth >= 1024
    ? '24px'
    : 'calc(84px + env(safe-area-inset-bottom, 8px))';

  toastEl.style.cssText = `
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: ${bottomOffset};
    z-index: 99999;
    width: max-content;
    max-width: 90vw;
  `;

  toastEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-brand shrink-0 animate-pulse"></span><span>${message}</span>`;
  document.body.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.add('opacity-0', 'transition-opacity', 'duration-200');
    setTimeout(() => {
      if (document.body.contains(toastEl)) {
        document.body.removeChild(toastEl);
      }
    }, 200);
  }, 1800);
}
