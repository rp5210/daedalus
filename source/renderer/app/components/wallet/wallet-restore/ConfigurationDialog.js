// @flow
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';
import { Input } from 'react-polymorph/lib/components/Input';
import { InputSkin } from 'react-polymorph/lib/skins/simple/InputSkin';
import { defineMessages, intlShape, FormattedHTMLMessage } from 'react-intl';
import WalletRestoreDialog from './widgets/WalletRestoreDialog';
import styles from './ConfigurationDialog.scss';
import ReactToolboxMobxForm, {
  handleFormErrors,
} from '../../../utils/ReactToolboxMobxForm';
import {
  isValidWalletName,
  isValidSpendingPassword,
  isValidRepeatPassword,
} from '../../../utils/validations';
import { submitOnEnter } from '../../../utils/form';
import globalMessages from '../../../i18n/global-messages';
import LocalizableError from '../../../i18n/LocalizableError';
import { FORM_VALIDATION_DEBOUNCE_WAIT } from '../../../config/timingConfig';

const messages = defineMessages({
  description1: {
    id: 'wallet.restore.dialog.step.configuration.description1',
    defaultMessage:
      '!!!Name your restored wallet and set a spending password to keep your wallet secure.',
    description: 'Description1 for Configuration Step',
  },
  description2: {
    id: 'wallet.restore.dialog.step.configuration.description2',
    defaultMessage:
      '!!!Wallet names and spending passwords are only stored locally and are not stored on the blockchain. You can give your restored wallet a new name and set a new spending password, you don’t need to match the wallet name and spending password you were using before. <b>Only the recovery phrase from your original wallet is needed to restore a wallet.</b>',
    description: 'Description2 for Configuration Step',
  },
  walletNameLabel: {
    id: 'wallet.restore.dialog.step.configuration.input.walletName.label',
    defaultMessage: '!!!Wallet name',
    description: 'Label for Wallet Name Input',
  },
  walletNamePlaceholder: {
    id: 'wallet.restore.dialog.step.configuration.input.walletName.placeholder',
    defaultMessage: '!!!Name the wallet you are restoring',
    description: 'Placeholder for Wallet Name Input',
  },
  spendingPasswordLabel: {
    id: 'wallet.restore.dialog.step.configuration.input.spendingPassword.label',
    defaultMessage: '!!!Enter password',
    description:
      'Label for the "Wallet password" input in the wallet restore dialog.',
  },
  repeatPasswordLabel: {
    id: 'wallet.restore.dialog.step.configuration.input.repeatPassword.label',
    defaultMessage: '!!!Repeat password',
    description:
      'Label for the "Repeat password" input in the wallet restore dialog.',
  },
  passwordFieldsPlaceholder: {
    id:
      'wallet.restore.dialog.step.configuration.input.passwordFields.placeholder',
    defaultMessage: '!!!Password',
    description:
      'Placeholder for the "Password" inputs in the wallet restore dialog.',
  },
  continueButtonLabel: {
    id: 'wallet.restore.dialog.step.configuration.continueButtonLabel',
    defaultMessage: '!!!Continue',
    description: 'Placeholder for the dialog "Continue" button',
  },
});

type Props = {
  onContinue: Function,
  onClose: Function,
  onBack: Function,
  error?: ?LocalizableError,
};

@observer
export default class ConfigurationDialog extends Component<Props> {
  static contextTypes = {
    intl: intlShape.isRequired,
  };

  static defaultProps = {
    error: null,
  };

  componentWillReceiveProps(newProps: Props) {
    if (newProps.error) {
      handleFormErrors('.WalletRestoreDialog_error');
    }
  }

  form = new ReactToolboxMobxForm(
    {
      fields: {
        walletName: {
          label: this.context.intl.formatMessage(messages.walletNameLabel),
          placeholder: this.context.intl.formatMessage(
            messages.walletNamePlaceholder
          ),
          value: '',
          validators: [
            ({ field }) => [
              isValidWalletName(field.value),
              this.context.intl.formatMessage(globalMessages.invalidWalletName),
            ],
          ],
        },
        spendingPassword: {
          type: 'password',
          label: this.context.intl.formatMessage(
            messages.spendingPasswordLabel
          ),
          placeholder: this.context.intl.formatMessage(
            messages.passwordFieldsPlaceholder
          ),
          value: '',
          validators: [
            ({ field, form }) => {
              const repeatPasswordField = form.$('repeatPassword');
              if (repeatPasswordField.value.length > 0) {
                repeatPasswordField.validate({ showErrors: true });
              }
              return [
                isValidSpendingPassword(field.value),
                this.context.intl.formatMessage(
                  globalMessages.invalidSpendingPassword
                ),
              ];
            },
          ],
        },
        repeatPassword: {
          type: 'password',
          label: this.context.intl.formatMessage(messages.repeatPasswordLabel),
          placeholder: this.context.intl.formatMessage(
            messages.passwordFieldsPlaceholder
          ),
          value: '',
          validators: [
            ({ field, form }) => {
              const spendingPassword = form.$('spendingPassword').value;
              if (spendingPassword.length === 0) return [true];
              return [
                isValidRepeatPassword(spendingPassword, field.value),
                this.context.intl.formatMessage(
                  globalMessages.invalidRepeatPassword
                ),
              ];
            },
          ],
        },
      },
    },
    {
      options: {
        validateOnChange: true,
        validationDebounceWait: FORM_VALIDATION_DEBOUNCE_WAIT,
      },
    }
  );

  submit = () => {
    this.form.submit({
      onSuccess: form => {
        const { onContinue } = this.props;
        const { walletName, spendingPassword } = form.values();
        onContinue(walletName, spendingPassword);
      },
      onError: () =>
        handleFormErrors('.SimpleFormField_error', { focusElement: true }),
    });
  };

  handleSubmitOnEnter = submitOnEnter.bind(this, this.submit);

  resetForm = () => {
    const { form } = this;
    // Cancel all debounced field validations
    form.each(field => {
      field.debouncedValidation.cancel();
    });
    form.reset();
    form.showErrors(false);
  };

  render() {
    const { intl } = this.context;
    const { onClose, onBack, error } = this.props;
    const { form } = this;

    const walletNameField = form.$('walletName');
    const spendingPasswordField = form.$('spendingPassword');
    const repeatedPasswordField = form.$('repeatPassword');

    const walletNameFieldClasses = classnames([styles.input, 'walletName']);
    const spendingPasswordFieldClasses = classnames([
      styles.input,
      styles.spendingPasswordField,
      'spendingPassword',
    ]);
    const repeatedPasswordFieldClasses = classnames([
      styles.input,
      styles.spendingPasswordField,
      'repeatedPassword',
    ]);

    return (
      <WalletRestoreDialog
        stepNumber={2}
        actions={[
          {
            primary: true,
            label: intl.formatMessage(messages.continueButtonLabel),
            onClick: this.submit,
          },
        ]}
        onClose={onClose}
        onBack={onBack}
      >
        <div className={styles.component}>
          <p>{intl.formatMessage(messages.description1)}</p>
          <p>
            <FormattedHTMLMessage {...messages.description2} />
          </p>
          <Input
            className={walletNameFieldClasses}
            onKeyPress={this.handleSubmitOnEnter}
            {...walletNameField.bind()}
            error={walletNameField.error}
            skin={InputSkin}
          />

          <div className={styles.spendingPasswordWrapper}>
            <div className={styles.spendingPasswordFields}>
              <Input
                className={spendingPasswordFieldClasses}
                onKeyPress={this.handleSubmitOnEnter}
                {...spendingPasswordField.bind()}
                error={spendingPasswordField.error}
                skin={InputSkin}
              />
              <Input
                className={repeatedPasswordFieldClasses}
                onKeyPress={this.handleSubmitOnEnter}
                {...repeatedPasswordField.bind()}
                error={repeatedPasswordField.error}
                skin={InputSkin}
              />
              <p className={styles.passwordInstructions}>
                <FormattedHTMLMessage
                  {...globalMessages.passwordInstructions}
                />
              </p>
            </div>
          </div>

          {error && <p className={styles.error}>{intl.formatMessage(error)}</p>}
        </div>
      </WalletRestoreDialog>
    );
  }
}
