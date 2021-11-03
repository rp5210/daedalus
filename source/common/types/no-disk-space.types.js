// @flow
export type CheckDiskSpaceReport = {
  isNotEnoughDiskSpace: boolean,
  diskSpaceRequired: number,
  diskSpaceMissing: number,
  diskSpaceRecommended: number,
  diskSpaceAvailable: number,
  hadNotEnoughSpaceLeft: boolean,
  needNewInterval: boolean,
  interval: number,
};
