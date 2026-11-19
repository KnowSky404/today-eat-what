/// <reference types="@tarojs/taro" />

declare namespace NodeJS {
  interface ProcessEnv {
    TARO_ENV?: 'h5' | 'weapp'
    PUBLIC_BASE_PATH?: string
  }
}
