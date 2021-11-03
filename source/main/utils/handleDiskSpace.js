// @flow
import checkDiskSpace from 'check-disk-space';
import { logger } from './logging';
import {
  DISK_SPACE_REQUIRED,
  DISK_SPACE_REQUIRED_MARGIN_PERCENTAGE,
  DISK_SPACE_CHECK_LONG_INTERVAL,
  DISK_SPACE_CHECK_MEDIUM_INTERVAL,
  DISK_SPACE_CHECK_SHORT_INTERVAL,
  DISK_SPACE_RECOMMENDED_PERCENTAGE,
  stateDirectoryPath,
} from '../config';
import type { CheckDiskSpaceReport } from '../../common/types/no-disk-space.types';
import { CardanoNode } from '../cardano/CardanoNode';
import { CardanoNodeStates } from '../../common/types/cardano-node.types';

export const generateNewReport = (): CheckDiskSpaceReport => ({
  isNotEnoughDiskSpace: false,
  diskSpaceRequired: '',
  diskSpaceMissing: '',
  diskSpaceRecommended: '',
  diskSpaceAvailable: '',
  hadNotEnoughSpaceLeft: false,
  needNewInterval: false,
  interval: DISK_SPACE_CHECK_MEDIUM_INTERVAL,
});

export const handleCheckDiskSpace = async (
  previousReport?: CheckDiskSpaceReport,
  forceDiskSpaceRequired?: number
): Promise<CheckDiskSpaceReport> => {
  const report = previousReport || generateNewReport();
  report.needNewInterval = false;
  report.diskSpaceRequired = forceDiskSpaceRequired || DISK_SPACE_REQUIRED;
  const { free, size } = await checkDiskSpace(stateDirectoryPath);

  report.diskSpaceAvailable = free;
  report.diskTotalSpace = size;
  report.diskSpaceMissing = Math.max(
    report.diskSpaceRequired - report.diskSpaceAvailable,
    0
  );
  report.diskSpaceRecommended =
    (report.diskTotalSpace * DISK_SPACE_RECOMMENDED_PERCENTAGE) / 100;
  const diskSpaceRequiredMargin =
    report.diskSpaceRequired -
    (report.diskSpaceRequired * DISK_SPACE_REQUIRED_MARGIN_PERCENTAGE) / 100;

  if (report.diskSpaceAvailable <= diskSpaceRequiredMargin) {
    if (!report.isNotEnoughDiskSpace) {
      // State change: transitioning from enough to not-enough disk space
      report.interval = DISK_SPACE_CHECK_SHORT_INTERVAL;
      report.needNewInterval = true;
      report.isNotEnoughDiskSpace = true;
    }
  } else if (report.diskSpaceAvailable >= report.diskSpaceRequired) {
    const newDiskSpaceCheckIntervalLength =
      report.diskSpaceAvailable >= report.diskSpaceRequired * 2
        ? DISK_SPACE_CHECK_LONG_INTERVAL
        : DISK_SPACE_CHECK_MEDIUM_INTERVAL;
    if (report.isNotEnoughDiskSpace) {
      // State change: transitioning from not-enough to enough disk space
      report.interval = newDiskSpaceCheckIntervalLength;
      report.needNewInterval = true;
      report.isNotEnoughDiskSpace = false;
    } else if (newDiskSpaceCheckIntervalLength !== report.interval) {
      // Interval change: transitioning from medium to long interval (or vice versa)
      // This is a special case in which we adjust the disk space check polling interval:
      // - more than 2x of available space than required: LONG interval
      // - less than 2x of available space than required: MEDIUM interval
      report.interval = newDiskSpaceCheckIntervalLength;
      report.needNewInterval = true;
    }
  }
  return report;
};

export const handleCardanoNodeRestart = async (
  report: CheckDiskSpaceReport,
  cardanoNode: CardanoNode
) => {
  if (report.isNotEnoughDiskSpace) {
    report.hadNotEnoughSpaceLeft = true;
    logger.info('Not enough disk space', { report });
    if (
      cardanoNode.state !== CardanoNodeStates.STOPPING &&
      cardanoNode.state !== CardanoNodeStates.STOPPED
    ) {
      try {
        logger.info('[DISK-SPACE-DEBUG] Stopping cardano node');
        await cardanoNode.stop();
      } catch (error) {
        logger.error('[DISK-SPACE-DEBUG] Cannot stop cardano node', error);
      }
    }
  } else {
    if (
      // Happens after the user made more disk space
      cardanoNode.state === CardanoNodeStates.STOPPED &&
      cardanoNode.state !== CardanoNodeStates.STOPPING &&
      report.hadNotEnoughSpaceLeft
    ) {
      try {
        logger.info(
          '[DISK-SPACE-DEBUG] restart cardano node after freeing up disk space'
        );
        if (cardanoNode._startupTries > 0) await cardanoNode.restart();
        else await cardanoNode.start();
      } catch (error) {
        logger.error(
          '[DISK-SPACE-DEBUG] Daedalus tried to restart, but failed',
          error
        );
      }
    }
    report.hadNotEnoughSpaceLeft = false;
  }
};
