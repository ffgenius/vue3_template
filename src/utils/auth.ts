import cache from './cache'

export function getToken() {
  return cache.local.get('token')
}
