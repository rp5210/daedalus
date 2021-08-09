// @flow
import { utils } from '@cardano-foundation/ledgerjs-hw-app-cardano';
import { BrowserWindow } from 'electron';
import TrezorConnect, {
  DEVICE_EVENT,
  TRANSPORT_EVENT,
  TRANSPORT,
  UI_EVENT,
  UI,
  DEVICE,
  // $FlowFixMe
} from 'trezor-connect';
import { get } from 'lodash';
import { derivePublic as deriveChildXpub } from 'cardano-crypto.js';
import { MainIpcChannel } from './lib/MainIpcChannel';
import {
  GET_HARDWARE_WALLET_TRANSPORT_CHANNEL,
  GET_EXTENDED_PUBLIC_KEY_CHANNEL,
  GET_HARDWARE_WALLET_CONNECTION_CHANNEL,
  SIGN_TRANSACTION_LEDGER_CHANNEL,
  SIGN_TRANSACTION_TREZOR_CHANNEL,
  GET_INIT_TREZOR_CONNECT_CHANNEL,
  DERIVE_XPUB_CHANNEL,
  RESET_ACTION_TREZOR_CHANNEL,
  DERIVE_ADDRESS_CHANNEL,
  SHOW_ADDRESS_CHANNEL,
} from '../../common/ipc/api';

import { logger } from '../utils/logging';

import type {
  getHardwareWalletTransportRendererRequest,
  getHardwareWalletTransportMainResponse,
  getExtendedPublicKeyRendererRequest,
  getExtendedPublicKeyMainResponse,
  getHardwareWalletConnectiontMainRequest,
  getHardwareWalletConnectiontRendererResponse,
  signTransactionLedgerRendererRequest,
  signTransactionLedgerMainResponse,
  signTransactionTrezorRendererRequest,
  signTransactionTrezorMainResponse,
  handleInitTrezorConnectRendererRequest,
  handleInitTrezorConnectMainResponse,
  resetTrezorActionRendererRequest,
  resetTrezorActionMainResponse,
  deriveXpubRendererRequest,
  deriveXpubMainResponse,
  deriveAddressRendererRequest,
  deriveAddressMainResponse,
  showAddressRendererRequest,
  showAddressMainResponse,
} from '../../common/ipc/api';
import type { HardwareWalletTransportDeviceRequest } from '../../common/types/hardware-wallets.types';

const getTrezorWalletTransportChannel: MainIpcChannel<
  getHardwareWalletTransportRendererRequest,
  getHardwareWalletTransportMainResponse
> = new MainIpcChannel(GET_HARDWARE_WALLET_TRANSPORT_CHANNEL);

const getExtendedPublicKeyChannel: MainIpcChannel<
  getExtendedPublicKeyRendererRequest,
  getExtendedPublicKeyMainResponse
> = new MainIpcChannel(GET_EXTENDED_PUBLIC_KEY_CHANNEL);

const getHardwareWalletConnectionChannel: MainIpcChannel<
  getHardwareWalletConnectiontMainRequest,
  getHardwareWalletConnectiontRendererResponse
> = new MainIpcChannel(GET_HARDWARE_WALLET_CONNECTION_CHANNEL);

const signTransactionLedgerChannel: MainIpcChannel<
  signTransactionLedgerRendererRequest,
  signTransactionLedgerMainResponse
> = new MainIpcChannel(SIGN_TRANSACTION_LEDGER_CHANNEL);

const signTransactionTrezorChannel: MainIpcChannel<
  signTransactionTrezorRendererRequest,
  signTransactionTrezorMainResponse
> = new MainIpcChannel(SIGN_TRANSACTION_TREZOR_CHANNEL);

const resetTrezorActionChannel: MainIpcChannel<
  resetTrezorActionRendererRequest,
  resetTrezorActionMainResponse
> = new MainIpcChannel(RESET_ACTION_TREZOR_CHANNEL);

const handleInitTrezorConnectChannel: MainIpcChannel<
  handleInitTrezorConnectRendererRequest,
  handleInitTrezorConnectMainResponse
> = new MainIpcChannel(GET_INIT_TREZOR_CONNECT_CHANNEL);

const deriveXpubChannel: MainIpcChannel<
  deriveXpubRendererRequest,
  deriveXpubMainResponse
> = new MainIpcChannel(DERIVE_XPUB_CHANNEL);

const deriveAddressChannel: MainIpcChannel<
  deriveAddressRendererRequest,
  deriveAddressMainResponse
> = new MainIpcChannel(DERIVE_ADDRESS_CHANNEL);

const showAddressChannel: MainIpcChannel<
  showAddressRendererRequest,
  showAddressMainResponse
> = new MainIpcChannel(SHOW_ADDRESS_CHANNEL);

const devicesMemo = {};

export const handleHardwareWalletRequests = async (
  mainWindow: BrowserWindow
) => {
  let deviceConnection = null;
  const resetTrezorListeners = () => {
    // Remove all listeners if exist - e.g. on app refresh
    TrezorConnect.removeAllListeners();
    // Initialize new device listeners
    TrezorConnect.on(UI_EVENT, (event) => {
      if (event.type === UI.REQUEST_PASSPHRASE) {
        // ui-request_passphrase
        if (event.payload && event.payload.device) {
          TrezorConnect.uiResponse({
            type: UI.RECEIVE_PASSPHRASE,
            payload: { value: '', passphraseOnDevice: true },
          });
        }
      }
    });
    TrezorConnect.on(TRANSPORT_EVENT, (event) => {
      if (event.type === TRANSPORT.ERROR) {
        // Send Transport error to Renderer
        getHardwareWalletConnectionChannel.send(
          {
            error: {
              payload: event.payload,
            },
          },
          // $FlowFixMe
          mainWindow
        );
      }
    });
    TrezorConnect.on(DEVICE_EVENT, (event) => {
      const connectionChanged =
        event.type === DEVICE.CONNECT ||
        event.type === DEVICE.DISCONNECT ||
        event.type === DEVICE.CHANGED;
      const isAcquired = get(event, ['payload', 'type'], '') === 'acquired';
      const deviceError = get(event, ['payload', 'error']);

      if (deviceError) {
        throw new Error(deviceError);
      }

      if (connectionChanged && isAcquired) {
        getHardwareWalletConnectionChannel.send(
          {
            disconnected: event.type === DEVICE.DISCONNECT,
            deviceType: 'trezor',
            deviceId: event.payload.id, // 123456ABCDEF
            deviceModel: event.payload.features.model, // e.g. T
            deviceName: event.payload.label, // e.g. Test Name
            path: event.payload.path,
            eventType: event.type,
          },
          // $FlowFixMe
          mainWindow
        );
      }
    });
  };

  getTrezorWalletTransportChannel.onRequest(
    async (request: HardwareWalletTransportDeviceRequest) => {
      const { devicePath } = request;
      logger.info('[HW-DEBUG] getHardwareWalletTransportChannel', devicePath);
      // Connected Trezor device info
      let deviceFeatures;
      logger.info('[HW-DEBUG] getHardwareWalletTransportChannel::TREZOR ');
      try {
        deviceFeatures = await TrezorConnect.getFeatures({
          device: { path: devicePath },
        });
        logger.info('[HW-DEBUG] Trezor connect success');
        if (deviceFeatures && deviceFeatures.success) {
          const {
            major_version: majorVersion,
            minor_version: minorVersion,
            patch_version: patchVersion,
            device_id: deviceId,
            model,
            label,
          } = deviceFeatures.payload;
          const firmwareVersion = `${majorVersion}.${minorVersion}.${patchVersion}`;
          return Promise.resolve({
            deviceId,
            deviceType: 'trezor',
            deviceModel: model, // e.g. "1" or "T"
            deviceName: label,
            path: devicePath,
            firmwareVersion,
          });
        }
        throw deviceFeatures.payload; // Error is in payload
      } catch (e) {
        logger.info('[HW-DEBUG] Trezor connect error');
        throw e;
      }
    }
  );

  handleInitTrezorConnectChannel.onRequest(async () => {
    logger.info('[HW-DEBUG] INIT TREZOR');
    resetTrezorListeners();
    TrezorConnect.manifest({
      email: 'email@developer.com',
      appUrl: 'http://your.application.com',
    });
    TrezorConnect.init({
      popup: false, // render your own UI
      webusb: false, // webusb is not supported in electron
      debug: true, // see what's going on inside connect
      // lazyLoad: true, // set to "false" (default) if you want to start communication with bridge on application start (and detect connected device right away)
      // set it to "true", then trezor-connect will not be initialized until you call some TrezorConnect.method()
      // this is useful when you don't know if you are dealing with Trezor user
      manifest: {
        email: 'email@developer.com', // @TODO
        appUrl: 'http://your.application.com', // @TODO
      },
    })
      .then(() => {})
      .catch((error) => {
        throw error;
      });
  });

  // handleInitLedgerConnectChannel.onRequest(async () => {
  //   logger.info('[HW-DEBUG] INIT LEDGER');
  //   observer = new EventObserver(mainWindow);
  //   try {
  //     logger.info('[HW-DEBUG] OBSERVER INIT');
  //     TransportNodeHid.setListenDevicesDebounce(1000); // Defaults to 500ms
  //     await TransportNodeHid.listen(observer);
  //     logger.info('[HW-DEBUG] OBSERVER INIT - listener started');
  //   } catch (e) {
  //     logger.info('[HW-DEBUG] OBSERVER INIT FAILED');
  //   }
  // });

  deriveXpubChannel.onRequest(async (params) => {
    const { parentXpubHex, lastIndex, derivationScheme } = params;
    const parentXpub = utils.hex_to_buf(parentXpubHex);
    try {
      const xpub = deriveChildXpub(parentXpub, lastIndex, derivationScheme);
      return utils.buf_to_hex(xpub);
    } catch (e) {
      throw e;
    }
  });

  deriveAddressChannel.onRequest(async (params) => {
    const {
      addressType,
      spendingPathStr,
      stakingPathStr,
      devicePath,
      isTrezor,
      networkId,
      protocolMagic,
    } = params;
    const spendingPath = utils.str_to_path(spendingPathStr);
    const stakingPath = stakingPathStr
      ? utils.str_to_path(stakingPathStr)
      : null;

    try {
      deviceConnection = get(devicesMemo, [devicePath, 'AdaConnection']);
      logger.info('[HW-DEBUG] DERIVE ADDRESS');
      if (isTrezor) {
        const result = await TrezorConnect.cardanoGetAddress({
          device: {
            path: devicePath,
            showOnTrezor: true,
          },
          addressParameters: {
            addressType,
            path: `m/${spendingPathStr}`,
            stakingPath: stakingPathStr ? `m/${stakingPathStr}` : null,
          },
          protocolMagic,
          networkId,
        });
        return result.payload.address;
      }

      // Check if Ledger instantiated
      if (!deviceConnection) {
        throw new Error('Ledger device not connected');
      }

      const { addressHex } = await deviceConnection.deriveAddress({
        network: {
          networkId,
          protocolMagic,
        },
        address: {
          type: addressType,
          params: {
            spendingPath,
            stakingPath,
          },
        },
      });

      const encodedAddress = utils.bech32_encodeAddress(
        utils.hex_to_buf(addressHex)
      );
      return encodedAddress;
    } catch (e) {
      throw e;
    }
  });

  showAddressChannel.onRequest(async (params) => {
    const {
      addressType,
      spendingPathStr,
      stakingPathStr,
      devicePath,
      isTrezor,
      networkId,
      protocolMagic,
    } = params;
    const spendingPath = utils.str_to_path(spendingPathStr);
    const stakingPath = stakingPathStr
      ? utils.str_to_path(stakingPathStr)
      : null;

    try {
      deviceConnection = get(devicesMemo, [devicePath, 'AdaConnection']);
      logger.info('[HW-DEBUG] SHOW ADDRESS');

      if (isTrezor) {
        throw new Error('Address verification not supported on Trezor devices');
      }

      // Check if Ledger instantiated
      if (!deviceConnection) {
        throw new Error('Ledger device not connected');
      }

      await deviceConnection.showAddress({
        network: {
          networkId,
          protocolMagic,
        },
        address: {
          type: addressType,
          params: {
            spendingPath,
            stakingPath,
          },
        },
      });
      return;
    } catch (e) {
      throw e;
    }
  });

  getExtendedPublicKeyChannel.onRequest(async (params) => {
    // Params example:
    // { path: "1852'/1815'/0'", isTrezor: false, devicePath: null }
    logger.info('[HW-DEBUG] getExtendedPublicKeyChannel');
    const { path, isTrezor, devicePath } = params;
    try {
      if (isTrezor) {
        // Check if Trezor instantiated
        const deviceFeatures = await TrezorConnect.getFeatures({
          device: { path: devicePath },
        });
        if (deviceFeatures.success) {
          const extendedPublicKeyResponse = await TrezorConnect.cardanoGetPublicKey(
            {
              path: `m/${path}`,
              showOnTrezor: true,
            }
          );
          if (!extendedPublicKeyResponse.success) {
            throw extendedPublicKeyResponse.payload;
          }
          const extendedPublicKey = get(
            extendedPublicKeyResponse,
            ['payload', 'node'],
            {}
          );
          return Promise.resolve({
            publicKeyHex: extendedPublicKey.public_key,
            chainCodeHex: extendedPublicKey.chain_code,
          });
        }
        throw new Error('Trezor device not connected');
      }

      deviceConnection = get(devicesMemo, [devicePath, 'AdaConnection']);
      logger.info('[HW-DEBUG] EXPORT KEY');

      // Check if Ledger instantiated
      if (!deviceConnection) {
        throw new Error('Ledger device not connected');
      }

      const extendedPublicKey = await deviceConnection.getExtendedPublicKey({
        path: utils.str_to_path(path),
      });
      const deviceSerial = await deviceConnection.getSerial();
      return Promise.resolve({
        publicKeyHex: extendedPublicKey.publicKeyHex,
        chainCodeHex: extendedPublicKey.chainCodeHex,
        deviceId: deviceSerial.serial,
      });
    } catch (error) {
      throw error;
    }
  });

  // @TODO - validityIntervalStart is not working with Cardano App 2.1.0
  signTransactionLedgerChannel.onRequest(async (params) => {
    const {
      inputs,
      outputs,
      protocolMagic,
      fee,
      ttl,
      networkId,
      certificates,
      withdrawals,
      auxiliaryData,
      devicePath,
      signingMode,
    } = params;
    logger.info('[HW-DEBUG] SIGN Ledger transaction');
    deviceConnection = devicePath
      ? devicesMemo[devicePath].AdaConnection
      : null;

    try {
      if (!deviceConnection) {
        throw new Error('Device not connected!');
      }
      const signedTransaction = await deviceConnection.signTransaction({
        signingMode,
        tx: {
          network: {
            networkId,
            protocolMagic,
          },
          inputs,
          outputs,
          fee,
          ttl,
          certificates,
          withdrawals,
          auxiliaryData,
        },
      });
      return Promise.resolve(signedTransaction);
    } catch (e) {
      throw e;
    }
  });

  signTransactionTrezorChannel.onRequest(async (params) => {
    const {
      inputs,
      outputs,
      protocolMagic,
      fee,
      ttl,
      networkId,
      certificates,
      devicePath,
      validityIntervalStartStr,
      withdrawals,
      auxiliaryData,
    } = params;

    if (!TrezorConnect) {
      throw new Error('Device not connected!');
    }

    try {
      const dataToSign = {
        inputs,
        outputs,
        fee,
        ttl,
        protocolMagic,
        networkId,
        certificates,
        withdrawals,
        validityIntervalStartStr,
        auxiliaryData,
      };
      const signedTransaction = await TrezorConnect.cardanoSignTransaction({
        device: { path: devicePath },
        ...dataToSign,
      });
      return Promise.resolve(signedTransaction);
    } catch (e) {
      throw e;
    }
  });

  resetTrezorActionChannel.onRequest(async () => {
    TrezorConnect.cancel('Method_Cancel');
  });
};
