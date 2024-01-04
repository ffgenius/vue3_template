import type { AxiosRequestConfig } from 'axios'
import axios from 'axios'
import cache from '@/utils/cache'
import { useRouter } from 'vue-router'

const router = useRouter()

const httpRequest = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || '/',
  timeout: 5000,
})

/*
* 请求拦截器
* */
httpRequest.interceptors.request.use(config => {
  if (config.method === 'get') {
    config.params &&
    Object.keys(config.params).forEach((item) => {
      if (
        config.params[item] === null ||
        config.params[item] === undefined
      ) {
        config.params[item] = ''
      }
    })
  } else {
    config.data &&
    Object.keys(config.data).forEach((item) => {
      if (config.data[item] === null || config.data[item] === undefined) {
        config.data[item] = ''
      }
    })
  }
  const token = cache.local.get('token')
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token
  }
  return config
})

/*
* 响应拦截器
* */
httpRequest.interceptors.response.use(response => {
  if (response.data && response.data.code === 401) {
    cache.local.remove('token')
    router.push({ name: 'login' }).then()
  }
  return response
}, error => {
  const { response } = error
  switch (response?.status) {
    case 400:
      error.message = '请求错误'
      break
    case 401:
      error.message = '未授权，请登录'
      break
    case 403:
      error.message = '拒绝访问'
      break
    case 404:
      error.message = `请求地址出错: ${ response?.config.url }`
      break
    case 408:
      error.message = '请求超时'
      break
    case 500:
      error.message = '服务器内部错误'
  }
  return Promise.reject(new Error(error))
})

interface dataParams<T> {
  data: T,
  message: string,
  code: number
}

type methodType = 'get' | 'post' | 'put' | 'delete'

type params<T> = {
  params?: T,
  data?: T
}

const RequestAxiosInstance = <T, P>(url: string, method: methodType, params: params<P> | {}, config?: AxiosRequestConfig) => {
  return httpRequest<any, dataParams<T>>({
    url,
    method,
    ...params,
    ...config,
  })
}

enum methodTypeMode {
  get = 'get',
  post = 'post',
  put = 'put',
  delete = 'delete',
}

const request = <T, P>(url: string, method: methodType, paramsData?: P, config?: AxiosRequestConfig) => {
  if (method === methodTypeMode.get || method === methodTypeMode.delete) {
    return RequestAxiosInstance<T, P>(url, method, { params: { ...paramsData } }, config)
  } else {
    return RequestAxiosInstance<T, P>(url, method, { data: paramsData }, config)
  }

}

export default request
