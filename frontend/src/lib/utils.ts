export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number,
) {
  let timeout: ReturnType<typeof setTimeout>;

  return function <U>(this: U, ...args: Parameters<typeof fn>) {
    clearTimeout(timeout);

    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}
