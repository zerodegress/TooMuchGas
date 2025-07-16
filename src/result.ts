export type Result<T, E> =
  | {
      type: 'ok'
      value: T
    }
  | {
      type: 'err'
      value: E
    }
