// @flow
import React, { useState } from 'react';
import { defineMessages, intlShape, injectIntl } from 'react-intl';
import { Button } from 'react-polymorph/lib/components/Button';
import { Checkbox } from 'react-polymorph/lib/components/Checkbox';
import { VOTING_REGISTRATION_END_DATE } from '../../../config/votingConfig';
import { formattedDateTime } from '../../../utils/formatters';
import type { Locale } from '../../../../../common/types/locales.types';
import styles from './RegisterToVote.scss';

const messages = defineMessages({
  name: {
    id: 'voting.registerToVote.name',
    defaultMessage: '!!!Fund7',
    description: 'Regiter to fund name',
  },
  dateLabel: {
    id: 'voting.registerToVote.dateLabel',
    defaultMessage: '!!!Snapshot date:',
    description: 'Voting info snapshot date label',
  },
  stepsTitle: {
    id: 'voting.registerToVote.stepsTitle',
    defaultMessage: '!!!Follow these steps below in order to vote',
    description: 'Steps to follow title',
  },
  step1CheckBoxLabel: {
    id: 'voting.registerToVote.step1CheckBoxLabel',
    defaultMessage:
      '!!!Download the Catalyst Voting app on your Android or iOS smartphone.',
    description: 'First step to follow in order to vote',
  },
  step2CheckBoxLabel: {
    id: 'voting.registerToVote.step2CheckBoxLabel',
    defaultMessage:
      '!!!Make sure to register and have enough ada at the time of the snapshot.',
    description: 'Second step to follow in order to vote',
  },
  buttonLabel: {
    id: 'voting.registerToVote.registerToVoteButtonLabel',
    defaultMessage: '!!!Register to vote',
    description: 'Button Label for voting registration steps',
  },
});

type Props = {
  currentLocale: Locale,
  currentDateFormat: string,
  currentTimeFormat: string,
  intl: intlShape.isRequired,
  onRegisterToVoteClick: Function,
};

function RegisterToVote({
  currentLocale,
  currentDateFormat,
  currentTimeFormat,
  intl,
  onRegisterToVoteClick,
}: Props) {
  const [step1, setStep1] = useState(false);
  const [step2, setStep2] = useState(false);
  const castEndDate = formattedDateTime(VOTING_REGISTRATION_END_DATE, {
    currentLocale,
    currentDateFormat,
    currentTimeFormat,
  });

  return (
    <div className={styles.root}>
      <span className={styles.title}> {intl.formatMessage(messages.name)}</span>
      <span className={styles.dateLabel}>
        {intl.formatMessage(messages.dateLabel)}
      </span>
      <span className={styles.date}>{castEndDate}</span>
      <div className={styles.separator} />
      <span className={styles.stepsTitle}>
        {intl.formatMessage(messages.stepsTitle)}
      </span>
      <div className={styles.step}>
        <Checkbox
          className={styles.checkbox}
          checked={step1}
          onChange={setStep1}
        />
        <span>{intl.formatMessage(messages.step1CheckBoxLabel)}</span>
      </div>
      <div className={styles.step}>
        <Checkbox
          className={styles.checkbox}
          checked={step2}
          onChange={setStep2}
        />
        <span>{intl.formatMessage(messages.step2CheckBoxLabel)}</span>
      </div>
      <Button
        className={styles.button}
        onClick={onRegisterToVoteClick}
        label={intl.formatMessage(messages.buttonLabel)}
        disabled={!(step1 && step2)}
      />
    </div>
  );
}

export default injectIntl(RegisterToVote);