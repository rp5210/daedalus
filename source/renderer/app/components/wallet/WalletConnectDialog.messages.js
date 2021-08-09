// @flow
// TODO: Remove once the new wallet creation process is ready
import { defineMessages } from 'react-intl';

const getWalletConnectDialogMessages = () =>
  defineMessages({
    dialogTitle: {
      id: 'wallet.connect.dialog.title',
      defaultMessage: '!!!Pair a hardware wallet device',
      description:
        'Title "Connect a hardware wallet device" in the connect wallet dialog.',
    },
    cancelButton: {
      id: 'wallet.connect.dialog.button.cancel',
      defaultMessage: '!!!Cancel',
      description: 'Label for the "Cancel" button in the connect wallet dialog',
    },
    instructions: {
      id: 'wallet.connect.dialog.instructions',
      defaultMessage:
        '!!!<p>Daedalus currently supports Ledger Nano S, Ledger Nano X, and Trezor Model T hardware wallet devices.</p><p>If you are <b>pairing your device with Daedalus for the first time</b>, please follow the instructions below.</p><p>If you have <b>already paired your device with Daedalus</b>, you don’t need to repeat this step. Just connect your device when you need to confirm a transaction.</p>',
      description: 'Follow instructions label',
    },
    instructionsTrezorOnly: {
      id: 'wallet.connect.dialog.instructionsTrezorOnly',
      defaultMessage:
        '!!!<p><b>Daedalus currently supports only Trezor Model T hardware wallet devices.</b></p><p>If you are <b>pairing your device with Daedalus for the first time</b>, please follow the instructions below.</p><p>If you have <b>already paired your device with Daedalus</b>, you don’t need to repeat this step. Just connect your device when you need to confirm a transaction.</p>',
      description: 'Follow instructions label',
    },
    connectingIssueSupportLabel: {
      id: 'wallet.connect.dialog.connectingIssueSupportLabel',
      defaultMessage:
        '!!!If you are experiencing issues pairing your hardware wallet device, please {supportLink}',
      description: 'Connecting issue support description',
    },
    connectingIssueSupportLink: {
      id: 'wallet.connect.dialog.connectingIssueSupportLink',
      defaultMessage: '!!!read the instructions.',
      description: 'Connecting issue support link',
    },
    connectingIssueSupportLinkUrl: {
      id: 'wallet.connect.dialog.connectingIssueSupportLinkUrl',
      defaultMessage:
        'https://support.ledger.com/hc/en-us/articles/115005165269',
      description: 'Link to support article',
    },
  });

export default getWalletConnectDialogMessages;
