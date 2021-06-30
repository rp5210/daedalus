// @flow
import React, { Component } from 'react';
import { PopOver } from 'react-polymorph/lib/components/PopOver';
import classnames from 'classnames';
import SVGInline from 'react-svg-inline';
import CopyToClipboard from 'react-copy-to-clipboard';
import { observer } from 'mobx-react';
import BigNumber from 'bignumber.js';
import { defineMessages, intlShape } from 'react-intl';
import DialogCloseButton from '../../widgets/DialogCloseButton';
import Dialog from '../../widgets/Dialog';
import type { Reward, RewardsHistoryItem } from '../../../api/staking/types';
import styles from './StakingRewardsHistoryDialog.scss';
import { PoolPopOver } from '../widgets/PoolPopOver';
import globalMessages from '../../../i18n/global-messages';
import Table from '../../widgets/Table';
import StakePool from '../../../domains/StakePool';
import copyIcon from '../../../assets/images/copy-asset.inline.svg';
import copyCheckmarkIcon from '../../../assets/images/check-w.inline.svg';
import { ITEM_COPY_FEEDBACK } from '../../../config/timingConfig';
import LoadingSpinner from '../../widgets/LoadingSpinner';
import Ellipsis from '../../widgets/Ellipsis';

const messages = defineMessages({
  title: {
    id: 'staking.rewardsHistory.dialog.title',
    defaultMessage: '!!!Rewards details',
    description:
      'Title "Earned delegation rewards" label on the rewards history dialog.',
  },
  columnEpoch: {
    id: 'staking.rewardsHistory.dialog.column.epoch',
    defaultMessage: '!!!Epoch',
    description: 'Transactions CSV column - Epoch',
  },
  columnStakePool: {
    id: 'staking.rewardsHistory.dialog.column.stakePool',
    defaultMessage: '!!!Stake pool',
    description: 'Transactions CSV column - Pool',
  },
  columnAmount: {
    id: 'staking.rewardsHistory.dialog.column.amount',
    defaultMessage: '!!!Amount',
    description: 'Transactions CSV column - Amount',
  },
  exportCsvLabel: {
    id: 'staking.rewardsHistory.dialog.csv.label',
    defaultMessage: '!!!Export CSV',
    description: 'TexportCsvLabel on the rewards history dialog.',
  },
  rewardsAddress: {
    id: 'staking.rewardsHistory.dialog.rewardsAddress',
    defaultMessage: '!!!Rewards address',
    description: '"Rewards address" label on the rewards history dialog.',
  },
  unknownStakePoolTooltip: {
    id: 'staking.rewardsHistory.dialog.unknownStakePoolTooltip',
    defaultMessage:
      '!!!Stake pool details are unavailable for this stake pool ID.',
    description: '"Unknown Stake Pool" tooltip on the rewards history dialog.',
  },
});

type Props = {
  currentTheme: string,
  isFetchingRewardsHistory: boolean,
  onClose: Function,
  onExportCSV: Function,
  onOpenExternalLink: Function,
  reward: Reward,
  rewardsHistory: Array<RewardsHistoryItem>,
  onCopyAddress: Function,
};

type State = {
  itemCopied: boolean,
};

@observer
export default class StakingRewardsHistoryDialog extends Component<
  Props,
  State
> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };

  copyNotificationTimeout: TimeoutID;

  state = {
    itemCopied: false,
  };

  handleCopy = () => {
    const { onCopyAddress, reward } = this.props;
    const { rewardsAddress } = reward || {};
    this.setState({
      itemCopied: true,
    });
    clearTimeout(this.copyNotificationTimeout);
    this.copyNotificationTimeout = setTimeout(() => {
      this.setState({ itemCopied: false });
    }, ITEM_COPY_FEEDBACK);
    onCopyAddress(rewardsAddress);
  };

  renderStakePool = (pool: StakePool) => {
    const { currentTheme, onOpenExternalLink } = this.props;
    return (
      <div>
        <PoolPopOver
          containerClassName="StakingRewardsHistoryDialog_table"
          currentTheme={currentTheme}
          numberOfRankedStakePools={0}
          onOpenExternalLink={onOpenExternalLink}
          openOnHover
          stakePool={pool}
        >
          <span className={styles.stakePoolTicker}>[{pool.ticker}] </span>
        </PoolPopOver>
        &nbsp;
        {pool.name}
      </div>
    );
  };

  renderStakePoolId = (poolID: string) => (
    <PopOver
      content={this.context.intl.formatMessage(
        messages.unknownStakePoolTooltip
      )}
    >
      <Ellipsis string={poolID} />
    </PopOver>
  );

  renderContent = () => {
    const { intl } = this.context;
    const { isFetchingRewardsHistory, rewardsHistory } = this.props;

    const tableColumns = [
      {
        title: intl.formatMessage(messages.columnEpoch),
        id: 'epoch',
      },
      {
        title: intl.formatMessage(messages.columnStakePool),
        id: 'pool',
        sortValue: (pool: StakePool) =>
          pool.ticker ? `${pool.ticker}${pool.name}` : pool.id,
        render: (pool: $Shape<StakePool>) =>
          pool.name
            ? this.renderStakePool(pool)
            : this.renderStakePoolId(pool.id),
      },
      {
        title: intl.formatMessage(messages.columnAmount),
        id: 'amount',
        type: 'bigNumber',
        render: (rewardAmount: BigNumber) => rewardAmount.toFormat(6),
      },
    ];

    if (isFetchingRewardsHistory) {
      return (
        <div className={styles.loadingSpinner}>
          <LoadingSpinner big />
        </div>
      );
    }

    if (!rewardsHistory.length) {
      return <div className={styles.noData}>Failed to fetch data</div>;
    }

    return (
      <Table
        columns={tableColumns}
        rows={rewardsHistory}
        className={styles.table}
        maxHeight={265}
        isCompact
        initialSortDirection="asc"
      />
    );
  };

  render() {
    const { intl } = this.context;
    const {
      isFetchingRewardsHistory,
      onClose,
      onExportCSV,
      reward,
      rewardsHistory,
    } = this.props;
    const { itemCopied } = this.state;
    const { walletName, rewardsAddress } = reward || {};
    const icon = itemCopied ? copyCheckmarkIcon : copyIcon;
    const copyIconWrapperStyles = classnames([
      styles.copyIconWrapper,
      itemCopied ? styles.visible : null,
      itemCopied ? styles.itemCopied : null,
    ]);
    const actions = [
      {
        label: intl.formatMessage(globalMessages.close),
        onClick: onClose,
      },
      {
        label: intl.formatMessage(messages.exportCsvLabel),
        primary: true,
        onClick: () => onExportCSV({ rewardsAddress, walletName }),
        disabled: isFetchingRewardsHistory || !rewardsHistory.length,
      },
    ];

    const componentStyles = classnames([
      styles.component,
      'StakingRewardsHistoryDialog',
    ]);

    const copyMessage = itemCopied
      ? globalMessages.copied
      : globalMessages.copy;

    return (
      <Dialog
        className={componentStyles}
        title={intl.formatMessage(messages.title)}
        subtitle={walletName}
        actions={actions}
        onClose={onClose}
        closeButton={<DialogCloseButton />}
      >
        <div className={styles.label}>
          {intl.formatMessage(messages.rewardsAddress)}
        </div>

        <CopyToClipboard text={rewardsAddress} onCopy={this.handleCopy}>
          <p className={styles.rewardsAddress}>
            {rewardsAddress}
            <span className={copyIconWrapperStyles}>
              <PopOver
                content={intl.formatMessage(copyMessage)}
                className={styles.copyPopOver}
                appendTo="parent"
                visible
              >
                <SVGInline svg={icon} className={styles.copyIcon} />
              </PopOver>
            </span>
          </p>
        </CopyToClipboard>

        {this.renderContent()}
      </Dialog>
    );
  }
}
