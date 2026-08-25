export const EASE_STANDARD = [0.4, 0, 0.2, 1];
export const EASE_ENTRANCE = [0.2, 0, 0, 1];

export const pageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: EASE_ENTRANCE },
};

export const staggerChildren = (max = 6) => ({
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0 },
  },
});

export const childFadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: EASE_ENTRANCE },
};

export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: EASE_STANDARD },
};

export const modalPanel = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.2, ease: EASE_STANDARD },
};

export const toastSlide = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.24, ease: EASE_STANDARD },
};
