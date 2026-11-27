/// <reference types="@tarojs/taro" />

declare const __WEB_BUILD_VERSION__: string

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV?: 'h5' | 'weapp'
    PUBLIC_BASE_PATH?: string
  }
}
