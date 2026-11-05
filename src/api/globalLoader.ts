let activeRequests = 0;

const listeners = new Set<(loading: boolean) => void>();

const notify = () => {
  const loading = activeRequests > 0;
  listeners.forEach((listener) => listener(loading));
};

export const startGlobalLoading = () => {
  activeRequests += 1;
  notify();

};

export const stopGlobalLoading = () => {
  activeRequests = Math.max(0, activeRequests - 1);
  notify();
};

export const subscribeToGlobalLoading = (
  listener: (loading: boolean) => void
) => {
  listeners.add(listener);
  listener(activeRequests > 0);

  return () => {
    listeners.delete(listener);
  };
};
