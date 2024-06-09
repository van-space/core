import { ModelType } from '@typegoose/typegoose/lib/types';
import { Document, PaginateModel } from 'mongoose';
/// <reference types="../global" />
declare global {
  // @ts-ignore
  export type MongooseModel<T> = ModelType<T> & PaginateModel<T & Document>;
}

export {};
