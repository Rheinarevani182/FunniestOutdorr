export function go(to) {
  history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}