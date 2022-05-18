import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Query } from 'mongoose'

import { PartialType } from '@nestjs/mapped-types'
import { AutoIncrementID } from '@typegoose/auto-increment'
import {
  DocumentType,
  Ref,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@typegoose/typegoose'
import { BeAnObject } from '@typegoose/typegoose/lib/types'

import { CountModel } from '~/shared/model/count.model'
import { WriteBaseModel } from '~/shared/model/write-base.model'

import { TopicModel } from '../topic/topic.model'
import { Coordinate } from './models/coordinate.model'
import { NoteMusic } from './models/music.model'

@modelOptions({
  options: {
    customName: 'Note',
  },
})
@plugin(AutoIncrementID, {
  field: 'nid',
  startAt: 1,
})
@index({ text: 'text' })
@index({ modified: -1 })
@index({ nid: -1 })
@pre('findOne', autoPopulateTopic)
@pre('find', autoPopulateTopic)
export class NoteModel extends WriteBaseModel {
  @prop()
  @IsString()
  @IsOptional()
  @Transform(({ value: title }) => (title.length === 0 ? '无题' : title))
  title: string
  @prop({ required: false, unique: true })
  public nid: number

  @prop({ default: false })
  @IsBoolean()
  @IsOptional()
  hide: boolean

  @prop({
    select: false,
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value: val }) => (String(val).length === 0 ? null : val))
  password?: string

  @prop()
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  secret?: Date

  @prop()
  @IsString()
  @IsOptional()
  mood?: string

  @prop()
  @IsOptional()
  @IsString()
  weather?: string

  @prop()
  @IsBoolean()
  @IsOptional()
  hasMemory?: boolean

  @prop({ select: false, type: Coordinate })
  @ValidateNested()
  @Type(() => Coordinate)
  @IsOptional()
  coordinates?: Coordinate

  @prop({ select: false })
  @IsString()
  @IsOptional()
  location?: string

  @prop({ type: CountModel, default: { read: 0, like: 0 }, _id: false })
  count?: CountModel

  @prop({ type: [NoteMusic] })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => NoteMusic)
  music?: NoteMusic[]

  @prop()
  @IsMongoId()
  @IsOptional()
  topicId?: Ref<TopicModel>

  @prop({
    justOne: true,
    foreignField: '_id',
    localField: 'topicId',
    ref: () => TopicModel,
  })
  topic?: TopicModel

  static get protectedKeys() {
    return ['nid', 'count'].concat(super.protectedKeys)
  }
}

export class PartialNoteModel extends PartialType(NoteModel) {}

function autoPopulateTopic(
  this: Query<
    any,
    DocumentType<NoteModel, BeAnObject>,
    {},
    DocumentType<NoteModel, BeAnObject>
  >,
  next: () => void,
) {
  this.populate({ path: 'topic' })
  next()
}
