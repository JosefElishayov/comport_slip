/**
 * Creates a flying image clone that animates from the source element to the cart icon.
 * Returns a promise that resolves when the animation completes.
 */
export function flyToCart(sourceElement: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const cartIcon = document.querySelector('[data-cart-icon]');
    if (!cartIcon) {
      resolve();
      return;
    }

    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = cartIcon.getBoundingClientRect();

    // Clone or create a flying element
    const flyer = document.createElement('div');
    flyer.className = 'fly-to-cart-element';

    // Try to find an image inside the source element
    const img = sourceElement.querySelector('img');
    if (img) {
      const imgClone = document.createElement('img');
      imgClone.src = img.src;
      imgClone.style.width = '100%';
      imgClone.style.height = '100%';
      imgClone.style.objectFit = 'cover';
      imgClone.style.borderRadius = '12px';
      flyer.appendChild(imgClone);
    } else {
      flyer.style.background = 'hsl(35 60% 50%)';
      flyer.style.borderRadius = '12px';
    }

    // Position at source
    flyer.style.position = 'fixed';
    flyer.style.zIndex = '9999';
    flyer.style.width = `${Math.min(sourceRect.width, 120)}px`;
    flyer.style.height = `${Math.min(sourceRect.height, 120)}px`;
    flyer.style.left = `${sourceRect.left + sourceRect.width / 2 - Math.min(sourceRect.width, 120) / 2}px`;
    flyer.style.top = `${sourceRect.top + sourceRect.height / 2 - Math.min(sourceRect.height, 120) / 2}px`;
    flyer.style.pointerEvents = 'none';
    flyer.style.overflow = 'hidden';
    flyer.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
    flyer.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
    flyer.style.opacity = '1';

    document.body.appendChild(flyer);

    // Force reflow
    flyer.offsetHeight;

    // Animate to cart icon
    const targetX = targetRect.left + targetRect.width / 2 - 15;
    const targetY = targetRect.top + targetRect.height / 2 - 15;

    flyer.style.left = `${targetX}px`;
    flyer.style.top = `${targetY}px`;
    flyer.style.width = '30px';
    flyer.style.height = '30px';
    flyer.style.opacity = '0.3';
    flyer.style.borderRadius = '50%';

    // Pulse the cart icon
    cartIcon.classList.add('cart-icon-pulse');

    // Cleanup
    setTimeout(() => {
      flyer.remove();
      cartIcon.classList.remove('cart-icon-pulse');
      resolve();
    }, 650);
  });
}
