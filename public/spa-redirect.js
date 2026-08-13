(function restoreGitHubPagesRoute(location) {
  if (!location.search.startsWith('?p=/')) return

  const route = location.search.slice(3).split('&')[0].replace(/^\//, '')
  window.history.replaceState(
    null,
    '',
    `/online-tourism-malawi/${decodeURIComponent(route)}${location.hash}`,
  )
})(window.location)
