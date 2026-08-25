export const ADMIN_BASE_PATH = '/mwg-7c4f91e2'

export const adminPath = (suffix = '') => {
  if (!suffix) return ADMIN_BASE_PATH
  return `${ADMIN_BASE_PATH}${suffix.startsWith('/') ? suffix : `/${suffix}`}`
}

export const legacyAdminSuffix = (pathname = '') => (
  pathname === '/admin' ? '' : pathname.startsWith('/admin/') ? pathname.slice('/admin'.length) : null
)
