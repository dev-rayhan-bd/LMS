import {  Types } from 'mongoose';

export interface IClass {
  course: Types.ObjectId;
  title: string;
  date: Date;
  time: string;
  details: string;
 documents?: string[];
  link: string;
  zoomMeetingId: string;
zoomStatus: 'scheduled' | 'started' | 'ended' | 'recorded';
recordingLink: string;
startUrl: string;

  createdBy: Types.ObjectId;
}