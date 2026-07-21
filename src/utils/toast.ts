export function showToast(message: string) {
  const existing = document.getElementById('fin-toast-notification');
  if (existing) {
    existing.remove();
  }

  const nav = document.getElementById('bottom-nav');
  const isNavVisible = nav && window.getComputedStyle(nav).display !== 'none';
  const bottomOffset = isNavVisible
    ? 'calc(76px + env(safe-area-inset-bottom, 0px))'
    : 'calc(24px + env(safe-area-inset-bottom, 0px))';

  const toastEl = document.createElement('div');
  toastEl.id = 'fin-toast-notification';
  toastEl.className =
    'px-4 py-2 rounded-full bg-[#18181B] text-white border border-white/15 text-xs font-semibold tracking-wide shadow-2xl animate-fade-in pointer-events-none whitespace-nowrap flex items-center gap-2';

  toastEl.style.cssText = `
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: ${bottomOffset};
    z-index: 99999;
    width: max-content;
    max-width: 90vw;
  `;

  toastEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-brand inline-block shrink-0"></span><span>${message}</span>`;
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
