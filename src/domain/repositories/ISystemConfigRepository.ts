export interface ISystemConfigRepository {
  getByKey(key: string): Promise<any | null>;
  setByKey(key: string, value: any): Promise<void>;
  getAll(): Promise<Record<string, any>>;
}
