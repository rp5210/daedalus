// @flow
// TODO: Remove once the new wallet creation process is ready
import React from 'react';
import classnames from 'classnames';
import {
  FormattedHTMLMessage,
  FormattedMessage,
  injectIntl,
  intlShape,
} from 'react-intl';
import SVGInline from 'react-svg-inline';
import { Link } from 'react-polymorph/lib/components/Link';
import { LinkSkin } from 'react-polymorph/lib/skins/simple/LinkSkin';
import trezorIcon from '../../assets/images/hardware-wallet/trezor.inline.svg';
import DialogCloseButton from '../widgets/DialogCloseButton';
import LocalizableError from '../../i18n/LocalizableError';
import Dialog from '../widgets/Dialog';
import styles from './WalletConnectDialog.scss';
import LoadingSpinner from '../widgets/LoadingSpinner';
import HardwareWalletStatus from '../hardware-wallet/HardwareWalletStatus';
import { isTrezorEnabled } from '../../config/hardwareWalletsConfig';
import type { HwDeviceStatus } from '../../domains/Wallet';
import getWalletConnectDialogMessages from './WalletConnectDialog.messages';

const messages = getWalletConnectDialogMessages();

type Props = {
  error: ?LocalizableError,
  hwDeviceStatus: HwDeviceStatus,
  intl: intlShape.isRequired,
  isSubmitting: boolean,
  onClose: Function,
  onExternalLinkClick: Function,
};

const TrezorConnectDialog = ({
  error,
  hwDeviceStatus,
  intl,
  isSubmitting,
  onClose,
  onExternalLinkClick,
}: Props) => {
  const dialogClasses = classnames([styles.component, 'WalletConnectDialog']);

  const buttonLabel = !isSubmitting ? (
    intl.formatMessage(messages.cancelButton)
  ) : (
    <LoadingSpinner />
  );

  const actions = [
    {
      disabled: isSubmitting,
      label: buttonLabel,
      primary: false,
      onClick: onClose,
    },
  ];

  const supportLink = (
    <Link
      className={styles.externalLink}
      onClick={() =>
        onExternalLinkClick(
          intl.formatMessage(messages.connectingIssueSupportLinkUrl)
        )
      }
      label={intl.formatMessage(messages.connectingIssueSupportLink)}
      skin={LinkSkin}
    />
  );

  return (
    <Dialog
      className={dialogClasses}
      title={intl.formatMessage(messages.dialogTitle)}
      actions={actions}
      closeOnOverlayClick={false}
      onClose={!isSubmitting ? onClose : () => {}}
      closeButton={<DialogCloseButton />}
    >
      <div className={styles.hardwareWalletWrapper}>
        {isTrezorEnabled && (
          <div className={styles.hardwareWalletTrezor}>
            <SVGInline svg={trezorIcon} className={styles.trezorIcon} />
          </div>
        )}
        {error ? (
          <p className={styles.error}>{intl.formatMessage(error)}</p>
        ) : (
          <div>
            <p className={styles.hardwareWalletMessage}>
              <FormattedHTMLMessage {...messages.instructionsTrezorOnly} />
            </p>
            <div className={styles.hardwareWalletStatusWrapper}>
              <HardwareWalletStatus
                hwDeviceStatus={hwDeviceStatus}
                onExternalLinkClick={onExternalLinkClick}
                isTransactionStatus={false}
                isTrezor
              />
            </div>
            <div className={styles.hardwareWalletIssueArticleWrapper}>
              <p>
                <FormattedMessage
                  {...messages.connectingIssueSupportLabel}
                  values={{ supportLink }}
                />
              </p>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default injectIntl(TrezorConnectDialog);
